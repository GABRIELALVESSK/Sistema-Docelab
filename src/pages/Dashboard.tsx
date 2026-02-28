import { useState, useEffect } from "react";
import { ConfigurarMetaModal } from "@/components/dashboard/ConfigurarMetaModal";
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subMonths, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hideValues, setHideValues] = useState(false);
  const [stats, setStats] = useState({ receita: 0, despesa: 0, lucro: 0 });
  const [showMetaModal, setShowMetaModal] = useState(false);
  const [metaFaturamento, setMetaFaturamento] = useState(0);

  useEffect(() => {
    fetchStats();
    loadMeta();
  }, [currentDate]);

  const fetchStats = async () => {
    try {
      const { data: transacoes, error } = await supabase
        .from('transacoes')
        .select('valor, tipo');

      if (error) throw error;

      if (transacoes) {
        const r = transacoes.filter(t => t.tipo === 'receita').reduce((s, t) => s + (t.valor || 0), 0);
        const d = transacoes.filter(t => t.tipo === 'despesa').reduce((s, t) => s + (t.valor || 0), 0);
        setStats({ receita: r, despesa: d, lucro: r - d });
      }
    } catch (e) {
      setStats({ receita: 0, despesa: 0, lucro: 0 });
    }
  };

  const loadMeta = async () => {
    try {
      const mesRef = currentDate.toISOString().slice(0, 7);
      const { data, error } = await supabase
        .from('metas')
        .select('meta_faturamento')
        .eq('mes_referencia', mesRef)
        .limit(1)
        .single();
      if (data && !error) {
        setMetaFaturamento(data.meta_faturamento || 0);
      } else {
        setMetaFaturamento(0);
      }
    } catch {
      setMetaFaturamento(0);
    }
  };

  const StatCard = ({ title, value, icon, colorClass, iconColorClass }: any) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-soft flex items-center gap-4 border border-gray-50 group hover:shadow-md transition-all duration-300">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", colorClass)}>
        <span className={cn("material-icons-round text-2xl", iconColorClass)}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{title}</p>
        <p className="text-xl font-extrabold text-[#1E1E2F] tracking-tight">
          {hideValues ? "R$ ••••" : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full flex h-full overflow-hidden">
      {/* Left Content Area (65%) */}
      <div className="flex-1 p-8 lg:p-10 z-10 overflow-y-auto custom-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-gray-300 mb-6 group cursor-pointer">
              <span className="material-icons-round text-lg">search</span>
              <span className="text-xs font-medium tracking-wide group-hover:text-gray-400 transition">Search anything...</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-[#1E1E2F] leading-tight tracking-tight mb-4">
              Bom dia,<br />Ana Paula! 👋
            </h2>
            <p className="text-[#5A5A69] text-sm font-medium max-w-md leading-relaxed opacity-70">
              Aqui está o resumo financeiro da sua doceria este mês.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setHideValues(!hideValues)}
              className="rounded-xl border-gray-100 text-[10px] font-bold h-11 px-6 hover:bg-white hover:shadow-sm"
            >
              {hideValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {hideValues ? "MOSTRAR" : "ESCONDER"}
            </Button>
            <button className="bg-[#1E1E2F] text-white px-8 py-3.5 rounded-2xl font-bold text-[10px] tracking-wider hover:bg-opacity-90 transition shadow-xl uppercase">
              Ver Sugestões
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Receitas" value={stats.receita} icon="trending_up" colorClass="bg-emerald-50" iconColorClass="text-emerald-500" />
          <StatCard title="Despesas" value={stats.despesa} icon="trending_down" colorClass="bg-rose-50" iconColorClass="text-rose-400" />
          <StatCard title="Lucro" value={stats.lucro} icon="account_balance_wallet" colorClass="bg-amber-50" iconColorClass="text-amber-500" />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-[#1E1E2F] tracking-tight">Ações Rápidas</h3>
            <MoreHorizontal className="text-gray-300 cursor-pointer hover:text-gray-500 transition w-6 h-6" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <button onClick={() => navigate('/financas')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-soft hover:shadow-md transition group border border-gray-50">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-icons-round text-2xl">add</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#5A5A69] tracking-widest uppercase">Nova Receita</span>
            </button>
            <button onClick={() => navigate('/financas')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-soft hover:shadow-md transition group border border-gray-50">
              <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-icons-round text-2xl">remove</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#5A5A69] tracking-widest uppercase">Nova Despesa</span>
            </button>
            <button onClick={() => navigate('/receitas')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-soft hover:shadow-md transition group border border-gray-50">
              <div className="w-14 h-14 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-icons-round text-2xl">inventory_2</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#5A5A69] tracking-widest uppercase">Novo Produto</span>
            </button>
            <button onClick={() => navigate('/pedidos')} className="flex flex-col items-center justify-center p-8 bg-white rounded-[2.5rem] shadow-soft hover:shadow-md transition group border border-gray-50">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-icons-round text-2xl">shopping_bag</span>
              </div>
              <span className="text-[10px] font-extrabold text-[#5A5A69] tracking-widest uppercase">Novo Pedido</span>
            </button>
          </div>
        </div>

        {/* Dynamic Billing Chart */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-extrabold text-[#1E1E2F] tracking-tight">Faturamento Dinâmico</h3>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[9px] font-extrabold uppercase tracking-widest text-gray-400 border border-gray-100 cursor-pointer hover:border-gray-200 transition">
              <span>Fevereiro 2026</span>
              <span className="material-icons-round text-xs">keyboard_arrow_down</span>
            </div>
          </div>
          <div className="flex items-end justify-between h-48 gap-4 pt-4">
            {[
              { day: 'SEG', val: 40, active: 20 },
              { day: 'TER', val: 60, active: 30 },
              { day: 'QUA', val: 30, active: 10 },
              { day: 'QUI', val: 80, active: 45 },
              { day: 'SEX', val: 50, active: 25 },
              { day: 'SAB', val: 20, active: 10, color: 'skillex-primary' }
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group w-full">
                <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl relative h-36 flex items-end justify-center overflow-hidden">
                  <div className={cn("w-2/3 opacity-20 rounded-xl", d.color ? "bg-[#F87171]" : "bg-[#A3D9A5]")} style={{ height: `${d.val}%` }}></div>
                  <div className={cn("absolute bottom-0 w-2/3 rounded-xl", d.color ? "bg-[#F87171]" : "bg-[#A3D9A5]")} style={{ height: `${d.active}%` }}></div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 group-hover:text-gray-500 transition">{d.day}</span>
              </div>
            ))}
            <div className="flex flex-col items-center justify-center ml-8 shrink-0">
              <span className="text-4xl font-extrabold text-[#1E1E2F] mb-1 tracking-tighter">R$ 52</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Média Diária</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-3 shadow-glow"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar (35%) */}
      <div className="hidden lg:flex w-[400px] p-10 flex-col border-l border-gray-100 bg-white z-10 overflow-y-auto custom-scrollbar">
        <div className="flex justify-end gap-6 mb-12">
          <button className="text-gray-300 hover:text-gray-600 transition"><span className="material-icons-round">notifications</span></button>
          <button className="text-gray-300 hover:text-gray-600 transition"><span className="material-icons-round">calendar_today</span></button>
          <div className="flex -space-x-3">
            <img alt="User 1" className="w-9 h-9 rounded-full border-2 border-white shadow-soft" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDk-WyGZs7MoaS8bkIfhN0HnQzOgtQMPpSjiWlhyO6bskAkXc5TbK-lUolRZq9zYxZtkx2F3d1pl5PuefP67O6a8JBuEWsE7Cs607xJ23VIwIS79f7IJqp2KH-nlITCOOqRCo3zaOVPb_jftd2uCjHRK8qHMSeBf7LfaMiGFTACwUsHWbjuYJuqy_b1gPNFQxUjQX9x-K6KJkfLVIjivHkjf1iPLwGoxrrB1LA_XjhIzo2jDbTeByuYm_Zij4KGw-YV97vBryJJnBE" />
            <img alt="User 2" className="w-9 h-9 rounded-full border-2 border-white shadow-soft" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmu795b7-yVImedjbkmN3F_nOHFbSTTvjA7bn4GC3O8bFg09F-g8BJ1U7KUWOndfM5sgSiovG_UTXXjH3Y5fI1MBI5IxEsBklLnTf1HysqeF5oMOv1jJ4sCEl5_q8y7KbcmWJBv_VwmvcYK0PtTiZlhP13pVF349Qn1TtHpskoQmxmi76k2t9ZP2XV7ALlWG3OLOeTwCBOuUvHFmsPahhARCeTrtWhtLctYB-AJeriGldTwpsa5nNNa9QTDnQJZus0agTwdXTPIhnl" />
            <div className="w-9 h-9 rounded-full bg-[#F87171] text-white text-[10px] flex items-center justify-center font-bold border-2 border-white shadow-soft ring-1 ring-[#F87171]/20">+3</div>
          </div>
        </div>

        {/* Meta Monthly Card */}
        <div className="bg-white p-8 rounded-[3rem] shadow-soft border border-gray-50 mb-12 relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-50/50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition duration-700"></div>

          <div className="flex justify-between items-start mb-10 relative z-10">
            <div>
              <h3 className="text-lg font-extrabold text-[#1E1E2F] tracking-tight">Meta Mensal</h3>
              <p className="text-[10px] font-bold text-gray-300 mt-1 uppercase tracking-widest">Progresso de vendas</p>
            </div>
            <button onClick={() => setShowMetaModal(true)}>
              <MoreVertical className="text-gray-200 w-6 h-6 hover:text-gray-400 transition" />
            </button>
          </div>

          <div className="flex items-center gap-8 relative z-10">
            <div className="relative w-28 h-28 shrink-0">
              {(() => {
                const progresso = metaFaturamento > 0 ? Math.min((stats.receita / metaFaturamento) * 100, 100) : 0;
                const offset = 264 - (progresso * 2.64);
                return (
                  <>
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="44" fill="transparent" stroke="#f8fafc" strokeWidth="10"></circle>
                      <circle cx="56" cy="56" r="44" fill="transparent" stroke="#F87171" strokeDasharray="276" strokeDashoffset={276 - (progresso * 2.76)} strokeLinecap="round" strokeWidth="10" className="transition-all duration-1000 ease-out"></circle>
                      <circle cx="56" cy="56" r="3" fill="#F87171" className="animate-pulse shadow-glow transform" style={{ transformOrigin: '56px 56px', transform: `rotate(${(progresso * 3.6)}deg) translate(44px)` }}></circle>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#1E1E2F] tracking-tighter">{progresso.toFixed(0)}%</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="flex-1">
              <div className="mb-6">
                <p className="text-[9px] text-gray-300 uppercase font-extrabold tracking-widest mb-1.5">Faturado</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold text-[#1E1E2F]">R$</span>
                  <p className="text-2xl font-black text-[#1E1E2F] tracking-tighter leading-none">
                    {hideValues ? "••••" : stats.receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Falta para a meta</p>
                <p className="text-xs font-black text-amber-600 tracking-tight">
                  {hideValues ? "R$ ••••" : (metaFaturamento - stats.receita > 0 ? metaFaturamento - stats.receita : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Large Widget */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-extrabold text-[#1E1E2F] tracking-tight">{format(currentDate, "MMMM yyyy", { locale: ptBR })}</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-300 hover:text-gray-600" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-gray-300 hover:text-gray-600" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center gap-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => <span key={d} className="text-[10px] font-black uppercase tracking-widest text-gray-200 py-2">{d}</span>)}
            {/* Simple calendar grid mockup */}
            {Array.from({ length: 14 }, (_, i) => {
              const day = i + 25;
              const isToday = day === 3; // Mocking today is 3rd Feb
              return (
                <div key={i} className="py-2.5 relative group cursor-pointer">
                  <span className={cn(
                    "text-xs font-bold transition-all w-8 h-8 flex items-center justify-center mx-auto rounded-xl",
                    day === 3 ? "bg-[#1E1E2F] text-white shadow-lg scale-110" : "text-gray-400 group-hover:bg-gray-50 group-hover:text-gray-600"
                  )}>
                    {day > 31 ? day - 31 : day}
                  </span>
                  {day === 3 && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-400 shadow-glow"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Filtering */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-extrabold text-[#1E1E2F] tracking-tight">Filtragem Temporal</h3>
            <a className="text-[10px] font-extrabold text-gray-300 hover:text-[#F87171] transition uppercase tracking-widest" href="#">Ver tudo</a>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-12 h-12 rounded-[1.2rem] bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-xl">calendar_today</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-[#1E1E2F] group-hover:text-[#F87171] transition tracking-tight">Intervalo Personalizado</h4>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Arraste para definir</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="material-icons-round text-gray-200 text-sm">schedule</span>
                <span className="text-[9px] font-black text-gray-400 uppercase">Now</span>
              </div>
            </div>
            <div className="flex items-center gap-5 group cursor-pointer">
              <div className="w-12 h-12 rounded-[1.2rem] bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-sm">
                <span className="material-icons-round text-xl">history</span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-[#1E1E2F] group-hover:text-[#F87171] transition tracking-tight">Últimos 30 Dias</h4>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Relatório automático</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="material-icons-round text-gray-200 text-sm">schedule</span>
                <span className="text-[9px] font-black text-gray-400 uppercase">1h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfigurarMetaModal
        open={showMetaModal}
        onOpenChange={setShowMetaModal}
        onSaved={(val) => { setMetaFaturamento(val); }}
      />
    </div>
  );
}
