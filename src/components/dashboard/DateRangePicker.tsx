import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isWithinInterval, addMonths, subMonths, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DateRangePickerProps {
  onRangeChange?: (start: Date | null, end: Date | null) => void;
  rangeStats?: { receita: number; despesa: number };
}

export function DateRangePicker({ onRangeChange, rangeStats = { receita: 0, despesa: 0 } }: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const handleDayClick = (day: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
      onRangeChange?.(day, null);
    } else {
      if (day < startDate) {
        setEndDate(startDate);
        setStartDate(day);
        onRangeChange?.(day, startDate);
      } else {
        setEndDate(day);
        onRangeChange?.(startDate, day);
      }
    }
  };

  const isInRange = (day: Date) => {
    if (!startDate || !endDate) return false;
    return isWithinInterval(day, { start: startDate, end: endDate });
  };

  const isStart = (day: Date) => startDate && isSameDay(day, startDate);
  const isEnd = (day: Date) => endDate && isSameDay(day, endDate);

  const weekDays = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

  const getDaysDiff = () => {
    if (!startDate || !endDate) return null;
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  return (
    <div className="flex flex-col md:flex-row gap-12">
      {/* Calendar Section */}
      <div className="w-full md:w-auto">
        <div className="flex items-center justify-between mb-8 px-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-xl transition-all active:scale-90"
          >
            <ChevronLeft className="w-4 h-4 text-secondary/60" />
          </button>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80 min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-9 h-9 flex items-center justify-center hover:bg-muted rounded-xl transition-all active:scale-90"
          >
            <ChevronRight className="w-4 h-4 text-secondary/60" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-4">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-secondary/30 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map((day) => {
            const isSelectedStart = isStart(day);
            const isSelectedEnd = isEnd(day);
            const isSelectedRange = isInRange(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs font-bold rounded-xl transition-all relative",
                  !isCurrentMonth && "opacity-20",
                  (isSelectedStart || isSelectedEnd) && "bg-primary text-white shadow-lg shadow-primary/20 scale-110 z-10",
                  isSelectedRange && !isSelectedStart && !isSelectedEnd && "bg-primary/10 text-primary rounded-none first:rounded-l-xl last:rounded-r-xl",
                  !isSelectedStart && !isSelectedEnd && !isSelectedRange && "hover:bg-muted text-foreground/70"
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details Section */}
      <div className="flex-1 border-t md:border-t-0 md:border-l border-border/40 pt-8 md:pt-0 md:pl-12 flex flex-col justify-between min-h-[340px]">
        {!startDate ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-[28px] border border-dashed border-border/50">
            <div className="w-16 h-16 mb-6 rounded-2xl bg-white flex items-center justify-center shadow-sm">
              <Calendar className="w-7 h-7 text-primary/40" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest text-foreground/80 mb-2">
              Filtragem Temporal
            </h4>
            <p className="text-[13px] font-medium text-secondary/60 max-w-[200px] leading-relaxed">
              Arraste ou clique para definir o intervalo de análise.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full animate-in-fade">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary/40">Intervalo Ativo</p>
              </div>
              <h3 className="text-lg font-black text-foreground tracking-tight">
                {format(startDate, "d 'de' MMM", { locale: ptBR })}
                {endDate && (
                  <>
                    <span className="mx-2 text-primary/30">→</span>
                    {format(endDate, "d 'de' MMM, yyyy", { locale: ptBR })}
                  </>
                )}
              </h3>
            </div>

            <div className="space-y-3 mb-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-5 rounded-2xl bg-success/5 border border-success/10 flex flex-col">
                  <span className="text-[10px] font-black text-success uppercase tracking-widest mb-1 opacity-60">Faturamento</span>
                  <span className="text-lg font-black text-success tracking-tighter">
                    {rangeStats.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10 flex flex-col">
                  <span className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1 opacity-60">Gastos</span>
                  <span className="text-lg font-black text-destructive tracking-tighter">
                    {rangeStats.despesa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 opacity-60">Saldo Projetado</span>
                <span className="text-2xl font-black text-amber-900 tracking-tighter">
                  {(rangeStats.receita - rangeStats.despesa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="flex justify-center mt-auto">
              <button
                onClick={() => {
                  setStartDate(null);
                  setEndDate(null);
                  onRangeChange?.(null, null);
                }}
                className="text-[11px] font-black uppercase tracking-[0.2em] text-secondary/40 hover:text-primary transition-colors py-2 px-4 rounded-xl hover:bg-primary/5 active:scale-95"
              >
                Limpar intervalo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
