import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Info } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface ConfigurarMetaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved?: (meta: number) => void;
}

export function ConfigurarMetaModal({ open, onOpenChange, onSaved }: ConfigurarMetaModalProps) {
    const { toast } = useToast();
    const [gastosFixos, setGastosFixos] = useState(0);
    const [gastosVariaveis, setGastosVariaveis] = useState(0);
    const [salario, setSalario] = useState(0);
    const [outrosGastos, setOutrosGastos] = useState(0);
    const [metaFaturamento, setMetaFaturamento] = useState(0);
    const [saving, setSaving] = useState(false);

    const metaSugerida = gastosFixos + gastosVariaveis + salario + outrosGastos;

    useEffect(() => {
        if (open) {
            loadMeta();
        }
    }, [open]);

    const loadMeta = async () => {
        try {
            const { data, error } = await supabase
                .from('metas')
                .select('*')
                .order('criado_em', { ascending: false })
                .limit(1)
                .single();

            if (data && !error) {
                setGastosFixos(data.gastos_fixos || 0);
                setGastosVariaveis(data.gastos_variaveis || 0);
                setSalario(data.salario || 0);
                setOutrosGastos(data.outros_gastos || 0);
                setMetaFaturamento(data.meta_faturamento || 0);
            }
        } catch (e) {
            // First time - no meta saved yet
        }
    };

    const handleUsarSugerida = () => {
        setMetaFaturamento(metaSugerida);
    };

    const formatCurrency = (value: number) => {
        return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                gastos_fixos: gastosFixos,
                gastos_variaveis: gastosVariaveis,
                salario,
                outros_gastos: outrosGastos,
                meta_faturamento: metaFaturamento,
                mes_referencia: new Date().toISOString().slice(0, 7), // "2026-02"
            };

            // Upsert: check if there's a meta for this month
            const mesRef = payload.mes_referencia;
            const { data: existing } = await supabase
                .from('metas')
                .select('id')
                .eq('mes_referencia', mesRef)
                .limit(1)
                .single();

            if (existing) {
                await supabase.from('metas').update(payload).eq('id', existing.id);
            } else {
                await supabase.from('metas').insert([payload]);
            }

            toast({ title: "Meta salva!", description: `Meta de faturamento: ${formatCurrency(metaFaturamento)}` });
            onSaved?.(metaFaturamento);
            onOpenChange(false);
        } catch (error: any) {
            toast({ title: "Erro ao salvar meta", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const formatInputValue = (value: number) => {
        return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleCurrencyChange = (value: string, setter: (val: number) => void) => {
        const digits = value.replace(/\D/g, "");
        const amount = parseInt(digits || "0", 10) / 100;
        setter(amount);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[2rem] border-none shadow-[var(--shadow-modal)] bg-[#FDFCFB] max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100">
                            <Settings2 className="w-4 h-4 text-[#EFB6BF]" />
                        </div>
                        <h2 className="text-lg font-black text-gray-900 tracking-tight">Configurar Meta Mensal</h2>
                    </div>
                    <p className="text-xs font-medium text-gray-400 ml-[42px]">
                        Defina seus gastos para calcular sua meta mensal.
                    </p>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
                    {/* Gastos Fixos */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-700">Gastos Fixos (aluguel, luz, água...)</Label>
                        <Input
                            type="text"
                            value={formatInputValue(gastosFixos)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setGastosFixos)}
                            className="h-9 rounded-lg border-gray-200 text-gray-800 font-semibold text-sm focus:border-[#EFB6BF] focus:ring-[#EFB6BF]/20"
                        />
                    </div>

                    {/* Gastos Variáveis */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-700">Gastos Variáveis (ingredientes...)</Label>
                        <Input
                            type="text"
                            value={formatInputValue(gastosVariaveis)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setGastosVariaveis)}
                            className="h-9 rounded-lg border-gray-200 text-gray-800 font-semibold text-sm focus:border-[#EFB6BF] focus:ring-[#EFB6BF]/20"
                        />
                    </div>

                    {/* Salário */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-700">Seu Salário Desejado</Label>
                        <Input
                            type="text"
                            value={formatInputValue(salario)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setSalario)}
                            className="h-9 rounded-lg border-gray-200 text-gray-800 font-semibold text-sm focus:border-[#EFB6BF] focus:ring-[#EFB6BF]/20"
                        />
                    </div>

                    {/* Outros Gastos */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-700">Outros Gastos</Label>
                        <Input
                            type="text"
                            value={formatInputValue(outrosGastos)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setOutrosGastos)}
                            className="h-9 rounded-lg border-gray-200 text-gray-800 font-semibold text-sm focus:border-[#EFB6BF] focus:ring-[#EFB6BF]/20"
                        />
                    </div>

                    {/* Meta Sugerida */}
                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-100/50 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-medium text-gray-500">Meta sugerida (soma dos gastos):</p>
                            <p className="text-lg font-black text-[#EFB6BF] tracking-tight">{formatCurrency(metaSugerida)}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleUsarSugerida}
                            className="text-[10px] font-bold text-[#EFB6BF] hover:text-[#e8a0ab] transition-colors underline underline-offset-2"
                        >
                            Usar este valor
                        </button>
                    </div>

                    {/* Meta de Faturamento */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-gray-700">Meta de Faturamento Mensal</Label>
                        <Input
                            type="text"
                            value={formatInputValue(metaFaturamento)}
                            onChange={(e) => handleCurrencyChange(e.target.value, setMetaFaturamento)}
                            className="h-9 rounded-lg border-2 border-[#EFB6BF]/30 text-gray-800 font-black text-sm focus:border-[#EFB6BF] focus:ring-[#EFB6BF]/20 bg-white"
                        />
                    </div>

                    {/* Info Notice */}
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100/40">
                        <Info className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-[10px] font-medium text-amber-700 leading-snug">
                            O progresso é zerado automaticamente à meia-noite do primeiro dia de cada mês.
                        </p>
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full h-10 rounded-xl bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black text-sm shadow-md shadow-[#EFB6BF]/20 border-none"
                    >
                        {saving ? "Salvando..." : "Salvar Meta"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
