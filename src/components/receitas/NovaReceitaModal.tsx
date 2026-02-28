import { useState, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, Trash2, ShoppingBag, Check, X, Calculator, Clock, DollarSign, FileText, ChefHat, Search, Info, Box, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    calcularPrecificacao,
    formatarMoeda,
    Insumo,
    ReceitaIngrediente
} from "@/lib/precificacao-calculator";

import { AdicionarComponenteModal } from "@/components/estoque/AdicionarComponenteModal";

interface NovaReceitaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (receita: any) => void;
    receitaParaEditar?: any | null;
}

interface StockItem {
    id: string;
    nome: string;
    quantidade: number;
    unidade: string;
    categoria: string;
}

interface IngredienteVinculado {
    produtoId?: string;
    receitaComponenteId?: string;
    kitComponenteId?: string;
    nome: string;
    quantidade: number;
    unidade: string;
    modo_custo: 'proporcional' | 'compra_minima' | 'amortizado' | 'inteiro';
    usos_amortizacao?: number;
    tipo: 'ingrediente' | 'receita' | 'kit';
    custo_unitario?: number;
}

const CATEGORIAS_PADRAO = [
    "Bolos",
    "Doces",
    "Salgados",
    "Recheios",
    "Coberturas",
    "Massas",
    "Outros"
];

const STEPS = [
    { number: 1, title: 'Detalhes', icon: FileText, desc: 'Infos Básicas' },
    { number: 2, title: 'Composição', icon: ChefHat, desc: 'Itens & Preparo' },
    { number: 3, title: 'Financeiro', icon: DollarSign, desc: 'Precificação' },
];

export function NovaReceitaModal({ open, onOpenChange, onSubmit, receitaParaEditar }: NovaReceitaModalProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    // Form States
    const [nome, setNome] = useState("");
    const [categoria, setCategoria] = useState("");
    const [tempoPreparo, setTempoPreparo] = useState("");
    const [ingredientesTexto, setIngredientesTexto] = useState("");
    const [modoPreparo, setModoPreparo] = useState("");
    const [rendimentoUnidades, setRendimentoUnidades] = useState(1);
    const [unidadeRendimento, setUnidadeRendimento] = useState("un");
    const [precoVenda, setPrecoVenda] = useState(0);
    const [tempoProducaoMinutos, setTempoProducaoMinutos] = useState(0);
    const [margemLucroAlvo, setMargemLucroAlvo] = useState(100);
    const [usarBlocoUtensilios, setUsarBlocoUtensilios] = useState(false);
    const [usarBlocoMaoObra, setUsarBlocoMaoObra] = useState(false);
    const [foto, setFoto] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);

    // Configs & Data
    const [pricingSettings, setPricingSettings] = useState<any>(null);
    const [totalCustosFixos, setTotalCustosFixos] = useState(0);
    const [availableCategories, setAvailableCategories] = useState<string[]>(CATEGORIAS_PADRAO);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stock Integration
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [allKits, setAllKits] = useState<any[]>([]);
    const [allReceitas, setAllReceitas] = useState<any[]>([]);
    const [ingredientesVinculados, setIngredientesVinculados] = useState<IngredienteVinculado[]>([]);
    const [showSelector, setShowSelector] = useState(false);

    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (open) {
            const isDifferentRecipe = receitaParaEditar?.id && receitaParaEditar.id !== isInitializedRef.current;

            if (!isInitializedRef.current || isDifferentRecipe) {
                setStep(1);
                fetchStockItems();
                fetchPricingSettings();
                fetchCustosFixosTotal();
                fetchReceitaCategories();

                if (receitaParaEditar && receitaParaEditar.id) {
                    setNome(receitaParaEditar.nome || "");
                    setCategoria(receitaParaEditar.categoria || "");
                    setTempoPreparo(receitaParaEditar.tempo_preparo || "");
                    setRendimentoUnidades(receitaParaEditar.rendimento_unidades || 1);
                    setUnidadeRendimento(receitaParaEditar.unidade_rendimento || "un");
                    setPrecoVenda(receitaParaEditar.preco_venda || 0);
                    setIngredientesTexto(receitaParaEditar.ingredientes_texto || "");
                    setModoPreparo(receitaParaEditar.modo_preparo || "");
                    setFotoPreview(receitaParaEditar.foto_url || null);
                    setTempoProducaoMinutos(receitaParaEditar.tempo_producao_minutos || 0);
                    setMargemLucroAlvo(receitaParaEditar.margem_lucro_alvo || 100);
                    setUsarBlocoUtensilios(!!receitaParaEditar.usar_bloco_utensilios);
                    setUsarBlocoMaoObra(!!receitaParaEditar.usar_bloco_mao_obra);
                    fetchReceitaIngredientes(receitaParaEditar.id);
                } else {
                    resetForm();
                }
                isInitializedRef.current = receitaParaEditar?.id || true;
            }
        } else {
            isInitializedRef.current = false;
        }
    }, [open, receitaParaEditar?.id]);

    const fetchCustosFixosTotal = async () => {
        try {
            const { data, error } = await supabase.from('custos_fixos').select('valor_mensal, ativo');
            if (error) throw error;
            const total = (data || []).filter((item: any) => item.ativo).reduce((acc: number, item: any) => acc + Number(item.valor_mensal), 0);
            setTotalCustosFixos(total);
        } catch (error) {
            console.error("Erro ao calcular custos fixos:", error);
        }
    };

    const fetchPricingSettings = async () => {
        try {
            const { data, error } = await supabase.from("configuracoes_precificacao").select("*").limit(1).single();
            if (error) throw error;
            setPricingSettings(data);
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
            setPricingSettings({
                preco_botijao_gas: 120,
                duracao_botijao_horas: 50,
                custo_hora_mao_obra: 20,
                percentual_seguranca: 20,
                multiplicador_fixos_mao_obra: 2,
                margens_lucro: [30, 50, 70]
            });
        }
    };

    const fetchReceitaIngredientes = async (receitaId: string) => {
        try {
            const { data, error } = await supabase
                .from('receita_ingredientes')
                .select(`
                    produto_id, 
                    receita_componente_id,
                    kit_componente_id,
                    quantidade, 
                    modo_custo, 
                    usos_amortizacao, 
                    produtos(nome, unidade, preco_medio),
                    receitas!receita_componente_id(id, nome, unidade_rendimento, cmv_unitario, custo_unitario, preco_venda),
                    kits:kit_componente_id(id, nome, preco_venda)
                `)
                .eq('receita_id', receitaId);

            if (error) throw error;

            if (data) {
                const uniqueItems = new Map<string, IngredienteVinculado>();

                data.forEach((i: any) => {
                    const id = i.produto_id || i.receita_componente_id || i.kit_componente_id;
                    if (!id) return;

                    // Se já existe no mapa, ignoramos (previne duplicados da DB)
                    if (uniqueItems.has(id)) return;

                    if (i.produto_id) {
                        uniqueItems.set(id, {
                            produtoId: i.produto_id,
                            nome: i.produtos?.nome || "Insumo desconhecido",
                            quantidade: i.quantidade,
                            unidade: i.produtos?.unidade || "un",
                            modo_custo: i.modo_custo || 'proporcional',
                            usos_amortizacao: i.usos_amortizacao || 1,
                            tipo: 'ingrediente'
                        });
                    } else if (i.receita_componente_id) {
                        uniqueItems.set(id, {
                            receitaComponenteId: i.receita_componente_id,
                            nome: i.receitas?.nome || "Receita desconhecida",
                            quantidade: i.quantidade,
                            unidade: i.receitas?.unidade_rendimento || "un",
                            modo_custo: 'proporcional',
                            usos_amortizacao: 1,
                            tipo: 'receita',
                            custo_unitario: i.receitas?.cmv_unitario || i.receitas?.custo_unitario || i.receitas?.preco_venda || 0
                        });
                    } else if (i.kit_componente_id) {
                        uniqueItems.set(id, {
                            kitComponenteId: i.kit_componente_id,
                            nome: i.kits?.nome || "Kit desconhecido",
                            quantidade: i.quantidade,
                            unidade: "un",
                            modo_custo: 'proporcional',
                            usos_amortizacao: 1,
                            tipo: 'kit',
                            custo_unitario: i.kits?.preco_venda || 0
                        });
                    }
                });
                setIngredientesVinculados(Array.from(uniqueItems.values()));
            }
        } catch (error: any) {
            console.error("Erro ao buscar ingredientes:", error);
        }
    };

    const fetchStockItems = async () => {
        const [produtosRes, receitasRes, kitsRes] = await Promise.all([
            supabase.from('produtos').select('*'),
            supabase.from('receitas').select('*'),
            supabase.from('kits_receitas').select('*')
        ]);
        if (produtosRes.data) setStockItems(produtosRes.data);
        if (receitasRes.data) setAllReceitas(receitasRes.data.filter(r => r.id !== receitaParaEditar?.id));
        if (kitsRes.data) setAllKits(kitsRes.data);
    };

    const fetchReceitaCategories = async () => {
        try {
            const { data, error } = await supabase.from('receitas').select('categoria').not('categoria', 'is', null);
            if (error) throw error;
            if (data) {
                const uniqueCats = Array.from(new Set([...CATEGORIAS_PADRAO, ...data.map((r: any) => r.categoria).filter(Boolean)])).sort();
                setAvailableCategories(uniqueCats);
            }
        } catch (error) {
            console.error("Erro ao buscar categorias:", error);
        }
    };

    const handleSaveNewCategory = () => {
        if (!newCategoryName.trim()) return;
        const normalized = newCategoryName.trim();
        setAvailableCategories(prev => Array.from(new Set([...prev, normalized])).sort());
        setCategoria(normalized);
        setIsCreatingCategory(false);
        setNewCategoryName("");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setFotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSelectComponente = (item: any) => {
        const id = item.id.split(':')[1];
        const tipo = item.tipo as 'ingrediente' | 'receita' | 'kit';

        // Verifica se o item já foi adicionado
        const jaExiste = ingredientesVinculados.some(i => {
            if (tipo === 'ingrediente') return i.produtoId === id;
            if (tipo === 'receita') return i.receitaComponenteId === id;
            if (tipo === 'kit') return i.kitComponenteId === id;
            return false;
        });

        if (jaExiste) {
            toast({ title: "Item já adicionado", variant: "destructive" });
            return;
        }
        const novo: IngredienteVinculado = {
            nome: item.nome,
            quantidade: 1,
            unidade: item.rendimento.split(' ')[1] || item.rendimento || "un",
            modo_custo: 'proporcional',
            usos_amortizacao: 1,
            tipo: tipo,
            custo_unitario: item.custo
        };
        if (tipo === 'ingrediente') novo.produtoId = id;
        else if (tipo === 'receita') novo.receitaComponenteId = id;
        else novo.kitComponenteId = id;
        setIngredientesVinculados([...ingredientesVinculados, novo]);
        setShowSelector(false);
    };

    const handleRemoveStockItem = (id: string, tipo: string) => {
        setIngredientesVinculados(ingredientesVinculados.filter(i => {
            if (tipo === 'ingrediente') return i.produtoId !== id;
            if (tipo === 'receita') return i.receitaComponenteId !== id;
            return i.kitComponenteId !== id;
        }));
    };

    const updateStockItemQuantity = (id: string, tipo: string, qtd: number) => {
        setIngredientesVinculados(ingredientesVinculados.map(i => {
            const isMatch = (tipo === 'ingrediente' && i.produtoId === id) || (tipo === 'receita' && i.receitaComponenteId === id) || (tipo === 'kit' && i.kitComponenteId === id);
            return isMatch ? { ...i, quantidade: qtd } : i;
        }));
    };

    const updateStockItemModo = (id: string, tipo: string, modo: any) => {
        setIngredientesVinculados(ingredientesVinculados.map(i => {
            const isMatch = (tipo === 'ingrediente' && i.produtoId === id) || (tipo === 'receita' && i.receitaComponenteId === id) || (tipo === 'kit' && i.kitComponenteId === id);
            if (isMatch) return { ...i, modo_custo: modo };
            return i;
        }));
    };

    const validateStep1 = () => {
        if (!nome) {
            toast({ title: "Nome obrigatório", variant: "destructive" });
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        setStep(Math.min(3, step + 1));
    };

    const handleBack = () => {
        setStep(Math.max(1, step - 1));
    };

    const handleSubmitInternal = async () => {
        try {
            let fotoUrl = fotoPreview || "";
            if (foto) {
                const fileExt = foto.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('receitas-fotos').upload(fileName, foto);
                if (uploadError) throw uploadError;
                const { data: publicUrlData } = supabase.storage.from('receitas-fotos').getPublicUrl(fileName);
                fotoUrl = publicUrlData.publicUrl;
            }
            await onSubmit({
                nome,
                categoria,
                tempoPreparo,
                rendimento_unidades: rendimentoUnidades,
                unidade_rendimento: unidadeRendimento,
                custo_unitario: calculo?.custo_unidade_final || 0,
                cmv_unitario: (calculo?.cmv_total || 0) / (rendimentoUnidades || 1),
                ingredientesTexto,
                modoPreparo,
                preco_venda: precoVenda,
                fotoUrl,
                ingredientesVinculados: ingredientesVinculados.map(i => ({
                    produto_id: i.produtoId,
                    receita_componente_id: i.receitaComponenteId,
                    kit_componente_id: i.kitComponenteId,
                    quantidade: i.quantidade,
                    modo_custo: i.modo_custo,
                    usos_amortizacao: i.usos_amortizacao
                })),
                tempo_producao_minutos: tempoProducaoMinutos,
                margem_lucro_alvo: margemLucroAlvo,
                usar_bloco_utensilios: usarBlocoUtensilios,
                usar_bloco_mao_obra: usarBlocoMaoObra
            });
            onOpenChange(false);
            setTimeout(() => resetForm(), 300);
        } catch (error: any) {
            toast({ title: "Erro ao salvar receita", description: error.message, variant: "destructive" });
        }
    };

    const resetForm = () => {
        setNome(""); setCategoria(""); setTempoPreparo(""); setIngredientesTexto(""); setModoPreparo(""); setRendimentoUnidades(1); setUnidadeRendimento("un"); setPrecoVenda(0); setFoto(null); setFotoPreview(null); setIngredientesVinculados([]); setTempoProducaoMinutos(0); setMargemLucroAlvo(100); setUsarBlocoUtensilios(false); setUsarBlocoMaoObra(false); setStep(1);
    };

    const calculo = useMemo(() => {
        if (!pricingSettings) return null;
        try {
            const yieldVal = Number(rendimentoUnidades) || 1;
            const virtualInsumos: Insumo[] = [];
            const ingredientesParaCalculo: ReceitaIngrediente[] = ingredientesVinculados.map((i, idx) => {
                const componentId = i.produtoId || i.receitaComponenteId || i.kitComponenteId || `virtual-${idx}`;
                if (i.tipo !== 'ingrediente') {
                    virtualInsumos.push({
                        id: componentId,
                        nome: i.nome,
                        categoria: i.tipo === 'receita' ? 'Receitas' : 'Kits',
                        unidade_compra: i.unidade as any || 'un',
                        quantidade_por_embalagem: 1,
                        preco_embalagem: i.custo_unitario || 0,
                        perdas_percentual: 0,
                        ativo: true
                    });
                }
                return {
                    produto_id: componentId,
                    quantidade_usada: i.quantidade,
                    unidade_usada: i.unidade as any,
                    modo_custo: i.modo_custo === 'inteiro' ? 'compra_minima' : i.modo_custo,
                    usos_amortizacao: i.usos_amortizacao
                };
            });
            const insumosMap: Insumo[] = [...stockItems.map(i => ({
                id: i.id,
                nome: i.nome,
                categoria: i.categoria,
                unidade_compra: (i as any).unidade_compra || (i.unidade === 'g' || i.unidade === 'kg' ? 'kg' : i.unidade),
                quantidade_por_embalagem: (i as any).quantidade_por_embalagem || 1000,
                preco_embalagem: (i as any).preco_embalagem || (i as any).preco_medio || 0,
                perdas_percentual: (i as any).perdas_percentual || 0,
                ativo: true
            })), ...virtualInsumos];
            const result = calcularPrecificacao({
                ingredientes: ingredientesParaCalculo,
                insumos: insumosMap,
                rendimento_unidades: yieldVal,
                parametros: {
                    percentual_seguranca: pricingSettings.percentual_seguranca || 20,
                    percentual_utensilios: usarBlocoUtensilios ? 3 : 0,
                    percentual_mao_obra_fixo: usarBlocoMaoObra ? 40 : 0,
                    multiplicador_fixos_mao_obra: 1,
                    margens_lucro: pricingSettings.margens_lucro || [30, 50, 70],
                    custo_fixo_total_mensal: totalCustosFixos,
                    horas_trabalho_mensal: pricingSettings.horas_trabalho_mensal || 220,
                    tempo_producao_minutos: tempoProducaoMinutos
                }
            });
            if (!result) return null;
            const precoGas = pricingSettings.preco_botijao_gas || 120;
            const duracaoGas = pricingSettings.duracao_botijao_horas || 50;
            const custoHoraMO = pricingSettings.custo_hora_mao_obra || 20;
            const custoGasCalculado = (precoGas / (duracaoGas * 60)) * tempoProducaoMinutos;
            const custoMaoObraCalculada = (custoHoraMO / 60) * tempoProducaoMinutos;
            let custoBaseUnitarioFinal = result.custo_base_unitario;
            if (!usarBlocoMaoObra) custoBaseUnitarioFinal += (custoGasCalculado + custoMaoObraCalculada) / yieldVal;
            const precosSugeridos = [...(pricingSettings.margens_lucro || [30, 50, 70]), 100].map((m: number) => ({ margem: m, valor: custoBaseUnitarioFinal * (1 + m / 100) }));
            const custoOperacionalTotal = result.cmv_total + custoGasCalculado + custoMaoObraCalculada;
            return {
                ...result,
                custo_gas: custoGasCalculado,
                custo_mao_obra: custoMaoObraCalculada,
                custo_unidade_final: custoBaseUnitarioFinal,
                precos_sugeridos: precosSugeridos,
                custo_operacional_total: custoOperacionalTotal
            };
        } catch (e) { return null; }
    }, [ingredientesVinculados, stockItems, rendimentoUnidades, pricingSettings, tempoProducaoMinutos, totalCustosFixos, usarBlocoUtensilios, usarBlocoMaoObra]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden rounded-[2rem] border-none shadow-[var(--shadow-modal)] bg-white max-h-[95vh] flex flex-col">
                {/* Header Section */}
                <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-50 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#EFB6BF]/10 flex items-center justify-center">
                                <ChefHat className="w-4.5 h-4.5 text-[#EFB6BF]" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black tracking-tight text-gray-800">
                                    {receitaParaEditar ? "Editar Receita" : "Nova Receita"}
                                </DialogTitle>
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Caderno de Delícias</p>
                            </div>
                        </div>
                        <div className="flex bg-gray-50/80 p-1 rounded-xl border border-gray-100/50">
                            {STEPS.map((s) => {
                                const Icon = s.icon;
                                const isCurrent = step === s.number;
                                const isPassed = step > s.number;
                                return (
                                    <div
                                        key={s.number}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer",
                                            isCurrent ? "bg-white text-gray-800 shadow-sm border border-gray-100" : (isPassed ? "text-gray-400" : "text-gray-300")
                                        )}
                                        onClick={() => (s.number < step || validateStep1()) && setStep(s.number)}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-lg flex items-center justify-center transition-colors shadow-inner",
                                            isCurrent ? "bg-[#EFB6BF]/10 text-[#EFB6BF]" : (isPassed ? "bg-gray-100 text-[#EFB6BF]" : "bg-transparent text-gray-300")
                                        )}>
                                            {isPassed ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{s.title}</span>
                                            {isCurrent && <span className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{s.desc}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Body Area */}
                <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar bg-white/50">
                    <div className="max-w-[650px] mx-auto">
                        {step === 1 && (
                            <div className="space-y-6 animate-in-fade">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="premium-label">Nome da Receita</Label>
                                        <Input
                                            placeholder="Ex: Brownie de Nutella"
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                            className="h-10 rounded-xl border-none bg-gray-50/50 px-5 text-sm font-black text-gray-800 shadow-sm transition-all focus:bg-white focus:shadow-md"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="premium-label">Categoria</Label>
                                        <div className="relative">
                                            {isCreatingCategory ? (
                                                <div className="flex gap-2">
                                                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="h-10 rounded-xl" placeholder="Nova..." />
                                                    <Button onClick={handleSaveNewCategory} className="h-10 w-10 rounded-xl bg-green-500 hover:bg-green-600"><Check className="w-4 h-4" /></Button>
                                                </div>
                                            ) : (
                                                <Select value={categoria} onValueChange={(v) => v === "new" ? setIsCreatingCategory(true) : setCategoria(v)}>
                                                    <SelectTrigger className="h-10 rounded-xl border-none bg-gray-50/50 px-4 font-bold text-sm text-gray-700">
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        {availableCategories.map(c => <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>)}
                                                        <SelectItem value="new" className="text-[#EFB6BF] font-black">+ Nova Categoria</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="premium-label">Tempo de Preparo</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                                            <Input
                                                placeholder="Ex: 45 min"
                                                value={tempoPreparo}
                                                onChange={(e) => setTempoPreparo(e.target.value)}
                                                className="h-10 rounded-xl border-none bg-gray-50/50 pl-10 font-bold text-sm text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="premium-label">Rendimento do Lote</Label>
                                        <div className="flex gap-2 bg-gray-50/50 p-1 rounded-xl">
                                            <Input
                                                type="number"
                                                value={rendimentoUnidades}
                                                onChange={(e) => setRendimentoUnidades(parseFloat(e.target.value) || 1)}
                                                className="h-9 flex-1 rounded-lg border-none bg-white font-black text-center text-sm shadow-sm"
                                            />
                                            <Select value={unidadeRendimento} onValueChange={setUnidadeRendimento}>
                                                <SelectTrigger className="h-9 w-20 rounded-lg border-none bg-white font-black text-[#EFB6BF] text-xs shadow-sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    {['un', 'g', 'kg', 'ml', 'L'].map(u => <SelectItem key={u} value={u} className="rounded-lg">{u}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="premium-label">Foto da Receita</Label>
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-[50px] rounded-xl bg-gray-50/50 border-2 border-dashed border-gray-100 flex items-center justify-center cursor-pointer hover:border-[#EFB6BF]/40 group transition-all"
                                        >
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                            {fotoPreview ? <div className="flex items-center gap-2 text-green-500 font-black text-[10px] uppercase"><Check className="w-4 h-4" /> Foto Pronta</div> : <div className="flex items-center gap-3 text-gray-300 group-hover:text-gray-400 font-black"><Upload className="w-5 h-5" /> <span className="text-[10px] uppercase tracking-widest">Clique para Upload</span></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-10 animate-in-fade">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between px-2">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-black text-gray-800 tracking-tight">Composição Técnica</h3>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vincule itens do estoque para o cálculo de CMV</p>
                                        </div>
                                        <Button
                                            onClick={() => setShowSelector(true)}
                                            className="h-12 px-6 rounded-full bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white font-black text-xs gap-2 shadow-lg shadow-[#EFB6BF]/20"
                                        >
                                            <Plus className="w-4 h-4" /> Adicionar Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3 min-h-[300px]">
                                        {ingredientesVinculados.length === 0 ? (
                                            <div className="h-60 flex flex-col items-center justify-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-50 p-10 text-center opacity-40">
                                                <Box className="w-12 h-12 mb-4 text-gray-300" />
                                                <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Nenhum ingrediente vinculado ainda</p>
                                            </div>
                                        ) : (
                                            ingredientesVinculados.map((item, idx) => {
                                                const itemId = item.produtoId || item.receitaComponenteId || item.kitComponenteId || `idx-${idx}`;
                                                return (
                                                    <div key={itemId} className="bg-white rounded-[28px] p-2 border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                                        <div className="flex items-center gap-4 flex-1 pr-4">
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-[20px] flex items-center justify-center shadow-inner",
                                                                item.tipo === 'ingrediente' ? "bg-[#EFB6BF]/10 text-[#EFB6BF]" : "bg-gray-800/5 text-gray-800"
                                                            )}>
                                                                {item.tipo === 'ingrediente' ? <ShoppingBag className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-black text-gray-700 truncate">{item.nome}</h4>
                                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.tipo}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-[20px]">
                                                            <div className="bg-white rounded-[16px] flex items-center px-4 h-10 shadow-sm border border-gray-50">
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantidade}
                                                                    onChange={(e) => updateStockItemQuantity(itemId, item.tipo, parseFloat(e.target.value) || 0)}
                                                                    className="w-16 h-full border-none bg-transparent p-0 text-center font-black text-gray-800"
                                                                />
                                                                <span className="text-[10px] font-black text-gray-400 uppercase border-l pl-3 ml-3">{item.unidade}</span>
                                                            </div>
                                                            <Select value={item.modo_custo} onValueChange={(v) => updateStockItemModo(itemId, item.tipo, v)}>
                                                                <SelectTrigger className="h-10 w-32 rounded-[16px] border-none bg-transparent font-black text-[9px] uppercase tracking-wider text-gray-500">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-[20px]">
                                                                    <SelectItem value="proporcional" className="text-[10px] font-black uppercase">Proporcional</SelectItem>
                                                                    {item.tipo === 'ingrediente' && <SelectItem value="inteiro" className="text-[10px] font-black uppercase">Emb. Inteira</SelectItem>}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveStockItem(itemId, item.tipo)}
                                                            className="w-10 h-10 rounded-[18px] flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all ml-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="premium-label">Ingredientes Extras</Label>
                                        <Textarea
                                            placeholder="Outros itens não pesáveis..."
                                            value={ingredientesTexto}
                                            onChange={(e) => setIngredientesTexto(e.target.value)}
                                            className="min-h-[140px] rounded-[28px] border-none bg-gray-50/50 p-6 text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="premium-label">Modo de Preparo</Label>
                                        <Textarea
                                            placeholder="Passo a passo da receita..."
                                            value={modoPreparo}
                                            onChange={(e) => setModoPreparo(e.target.value)}
                                            className="min-h-[140px] rounded-[28px] border-none bg-gray-50/50 p-6 text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-10 animate-in-fade">
                                <div className="bg-[#EFB6BF]/5 rounded-[40px] p-8 border border-[#EFB6BF]/10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-[22px] bg-[#EFB6BF] flex items-center justify-center shadow-lg shadow-[#EFB6BF]/30">
                                            <Calculator className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-800 tracking-tight">Precificação Inteligente</h3>
                                            <p className="text-[10px] font-bold text-[#EFB6BF] uppercase tracking-[0.2em]">Sua Margem de Lucro Real</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        {[
                                            { label: 'Custos Fixos', val: '40% Fixo', active: usarBlocoMaoObra, toggle: () => setUsarBlocoMaoObra(!usarBlocoMaoObra) },
                                            { label: 'Utensílios', val: '3% Reparos', active: usarBlocoUtensilios, toggle: () => setUsarBlocoUtensilios(!usarBlocoUtensilios) },
                                            { label: 'Imprevistos', val: '20% Segur.', active: true, persistent: true }
                                        ].map((tool, i) => (
                                            <button
                                                key={i}
                                                onClick={tool.toggle}
                                                disabled={tool.persistent}
                                                className={cn(
                                                    "p-5 rounded-[28px] border flex flex-col items-center gap-3 transition-all",
                                                    tool.active ? "bg-white border-[#EFB6BF]/30 shadow-sm" : "bg-gray-50/50 border-gray-100 opacity-60 grayscale"
                                                )}
                                            >
                                                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-colors", tool.active ? "bg-[#EFB6BF] text-white" : "bg-gray-200 text-gray-400")}>
                                                    <Check className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black uppercase text-gray-700 leading-none mb-1">{tool.label}</p>
                                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{tool.val}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                                            <Label className="premium-label !text-amber-500 flex items-center gap-1.5 mb-4">
                                                <Clock className="w-3 h-3" /> Tempo de Produção
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="number"
                                                    value={tempoProducaoMinutos}
                                                    onChange={(e) => setTempoProducaoMinutos(parseInt(e.target.value) || 0)}
                                                    className="h-14 flex-1 rounded-[20px] bg-gray-50/80 border-none font-black text-2xl text-center text-gray-700"
                                                />
                                                <span className="text-sm font-black text-gray-400 uppercase">Minutos</span>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                                            <Label className="premium-label !text-[#EFB6BF] flex items-center gap-1.5 mb-4">
                                                <DollarSign className="w-3 h-3" /> Preço de Venda (Unitário)
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <div className="absolute left-6 text-xl font-bold text-[#EFB6BF]/50">R$</div>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={precoVenda}
                                                    onChange={(e) => setPrecoVenda(parseFloat(e.target.value) || 0)}
                                                    className="h-14 flex-1 rounded-[20px] bg-[#EFB6BF]/5 border-none font-black text-2xl text-center text-[#EFB6BF] pl-10"
                                                />
                                            </div>
                                            {precoVenda > 0 && rendimentoUnidades > 0 && (
                                                <div className="mt-3 p-3 bg-green-50/80 rounded-xl border border-green-100/50">
                                                    <p className="text-[8px] font-black text-green-600 uppercase tracking-widest mb-0.5">💰 Venda Total do Lote ({rendimentoUnidades} {unidadeRendimento})</p>
                                                    <p className="text-lg font-black text-green-600 tracking-tighter">{formatarMoeda(precoVenda * rendimentoUnidades)}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resumo Detalhado de Custos */}
                                    <div className="mt-8 pt-8 border-t border-[#EFB6BF]/10 space-y-6 px-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-[12px] bg-gray-100 flex items-center justify-center">
                                                <Info className="w-4 h-4 text-gray-500" />
                                            </div>
                                            <p className="text-sm font-black text-gray-800 tracking-tight">Detalhamento Completo</p>
                                        </div>

                                        {/* Custos Detalhados Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {/* CMV */}
                                            <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">CMV Total (Lote)</p>
                                                <p className="text-lg font-black text-gray-800 tracking-tighter">{formatarMoeda(calculo?.cmv_total || 0)}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    Unitário: {formatarMoeda(calculo?.cmv_unitario || 0)}
                                                </p>
                                            </div>

                                            {/* Gás */}
                                            <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">⛽ Custo Gás</p>
                                                <p className="text-lg font-black text-gray-800 tracking-tighter">{formatarMoeda(calculo?.custo_gas || 0)}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    Botijão R${pricingSettings?.preco_botijao_gas || 120} / {pricingSettings?.duracao_botijao_horas || 50}h
                                                </p>
                                            </div>

                                            {/* Mão de Obra */}
                                            <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">👷 Mão de Obra</p>
                                                <p className="text-lg font-black text-gray-800 tracking-tighter">{formatarMoeda(calculo?.custo_mao_obra || 0)}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    R${pricingSettings?.custo_hora_mao_obra || 20}/hora × {tempoProducaoMinutos}min
                                                </p>
                                            </div>

                                            {/* Custos Fixos Rateio */}
                                            <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                                <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-1">🏠 Custos Fixos (Rateio)</p>
                                                <p className="text-lg font-black text-gray-800 tracking-tighter">{formatarMoeda(calculo?.custo_fixo_rateio || 0)}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    {formatarMoeda(calculo?.custo_por_minuto || 0)}/min × {tempoProducaoMinutos}min
                                                </p>
                                            </div>

                                            {/* Custo com Segurança */}
                                            <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                                <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest mb-1">🛡️ CMV + Segurança</p>
                                                <p className="text-lg font-black text-gray-800 tracking-tighter">{formatarMoeda(calculo?.cmv_com_seguranca || 0)}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    +{pricingSettings?.percentual_seguranca || 20}% imprevistos
                                                </p>
                                            </div>

                                            {/* Custo Operacional Total */}
                                            <div className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">📊 Custo Operacional</p>
                                                <p className="text-lg font-black text-gray-800 tracking-tighter">{formatarMoeda(calculo?.custo_operacional_total || 0)}</p>
                                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1">
                                                    CMV + Gás + MO
                                                </p>
                                            </div>
                                        </div>

                                        {/* Custo Unitário Final (destaque) */}
                                        <div className="p-5 bg-[#EFB6BF]/10 rounded-[24px] border border-[#EFB6BF]/20 flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-black text-[#EFB6BF] uppercase tracking-[0.2em] mb-1">Custo Unitário Final</p>
                                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                                    Custo Base / {rendimentoUnidades} {unidadeRendimento}
                                                </p>
                                            </div>
                                            <p className="text-3xl font-black text-[#EFB6BF] tracking-tighter">{formatarMoeda(calculo?.custo_unidade_final || 0)}</p>
                                        </div>

                                        {/* VALOR TOTAL DE VENDA DO LOTE (destaque verde) */}
                                        {precoVenda > 0 && rendimentoUnidades > 0 && (
                                            <div className="p-5 bg-green-50 rounded-[24px] border border-green-200/40 flex items-center justify-between">
                                                <div>
                                                    <p className="text-[9px] font-black text-green-600 uppercase tracking-[0.2em] mb-1">💰 Faturamento Total do Lote</p>
                                                    <p className="text-[8px] font-bold text-green-500/70 uppercase tracking-widest">
                                                        {formatarMoeda(precoVenda)} × {rendimentoUnidades} {unidadeRendimento}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-green-600 tracking-tighter">{formatarMoeda(precoVenda * rendimentoUnidades)}</p>
                                                    {calculo && (
                                                        <p className="text-[8px] font-black text-green-500/70 uppercase tracking-widest mt-0.5">
                                                            Lucro: {formatarMoeda((precoVenda * rendimentoUnidades) - (calculo.custo_operacional_total || 0))}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Detalhamento por Ingrediente */}
                                        {calculo?.detalhamento_custos && calculo.detalhamento_custos.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Custo por Ingrediente</p>
                                                <div className="space-y-2">
                                                    {calculo.detalhamento_custos.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-[16px] border border-gray-50">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full bg-[#EFB6BF]" />
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-700">{item.insumo_nome}</p>
                                                                    <p className="text-[9px] text-gray-400">
                                                                        {item.quantidade_usada} {item.unidade_usada} · {item.modo_custo}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-black text-gray-700 tracking-tight">{formatarMoeda(item.custo_total)}</p>
                                                                <p className="text-[9px] font-bold text-[#EFB6BF]">{item.percentual_do_cmv?.toFixed(1)}%</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sugestões de Preço por Margem de Lucro */}
                                    {calculo?.precos_sugeridos && calculo.precos_sugeridos.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-[#EFB6BF]/10 px-4">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-[14px] bg-green-50 flex items-center justify-center">
                                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-800 tracking-tight">Sugestões de Preço</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Clique para definir o preço de venda</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {calculo.precos_sugeridos.map((s: any, idx: number) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setPrecoVenda(parseFloat(s.valor.toFixed(2)))}
                                                        className={cn(
                                                            "p-5 rounded-[20px] border-2 text-center transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col items-center gap-2",
                                                            precoVenda === parseFloat(s.valor.toFixed(2))
                                                                ? "border-[#EFB6BF] bg-[#EFB6BF]/10 shadow-md"
                                                                : "border-gray-100 bg-white hover:border-[#EFB6BF]/40 hover:shadow-sm"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            precoVenda === parseFloat(s.valor.toFixed(2)) ? "text-[#EFB6BF]" : "text-gray-400"
                                                        )}>
                                                            Lucro {s.margem}%
                                                        </span>
                                                        <span className={cn(
                                                            "text-xl font-black tracking-tighter",
                                                            precoVenda === parseFloat(s.valor.toFixed(2)) ? "text-[#EFB6BF]" : "text-gray-700"
                                                        )}>
                                                            {formatarMoeda(s.valor)}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Lote: {formatarMoeda(s.valor * rendimentoUnidades)}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="px-6 py-4 border-t border-gray-50 bg-white flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={step === 1 ? () => onOpenChange(false) : handleBack}
                        className="h-10 px-6 rounded-xl text-gray-400 font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                        {step === 1 ? "Cancelar" : "Voltar"}
                    </Button>
                    <Button
                        onClick={step === 3 ? handleSubmitInternal : handleNext}
                        className="h-10 px-8 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] gap-2 shadow-xl transition-all"
                    >
                        {step === 3 ? "Finalizar Receita" : "Próximo Passo"}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>

                <AdicionarComponenteModal
                    open={showSelector}
                    onOpenChange={setShowSelector}
                    onSelect={handleSelectComponente}
                    ingredientes={stockItems}
                    receitas={allReceitas}
                    kits={allKits}
                />
            </DialogContent>
        </Dialog>
    );
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
