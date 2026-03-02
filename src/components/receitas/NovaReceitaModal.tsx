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

import { useAuth } from "@/contexts/AuthContext";
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
    const { user } = useAuth();
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
        if (open && user?.id) {
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
    }, [open, receitaParaEditar?.id, user?.id]);

    const fetchCustosFixosTotal = async () => {
        try {
            if (!user?.id) return;
            const { data, error } = await supabase.from('custos_fixos').select('valor_mensal, ativo').eq('user_id', user.id);
            if (error) throw error;
            const total = (data || []).filter((item: any) => item.ativo).reduce((acc: number, item: any) => acc + Number(item.valor_mensal), 0);
            setTotalCustosFixos(total);
        } catch (error) {
            console.error("Erro ao calcular custos fixos:", error);
        }
    };

    const fetchPricingSettings = async () => {
        try {
            if (!user?.id) return;
            const { data, error } = await supabase.from("configuracoes_precificacao").select("*").eq("user_id", user.id).limit(1).maybeSingle();
            if (error) throw error;
            if (data) {
                setPricingSettings(data);
            } else {
                // If user doesn't have settings, set defaults
                setPricingSettings({
                    preco_botijao_gas: 120,
                    duracao_botijao_horas: 50,
                    custo_hora_mao_obra: 20,
                    percentual_seguranca: 20,
                    multiplicador_fixos_mao_obra: 2,
                    margens_lucro: [30, 50, 70]
                });
            }
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
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
        if (!user?.id) return;
        const [produtosRes, receitasRes, kitsRes] = await Promise.all([
            supabase.from('produtos').select('*').eq('user_id', user.id),
            supabase.from('receitas').select('*').eq('user_id', user.id),
            supabase.from('kits_receitas').select('*').eq('user_id', user.id)
        ]);
        if (produtosRes.data) setStockItems(produtosRes.data);
        if (receitasRes.data) setAllReceitas(receitasRes.data.filter(r => r.id !== receitaParaEditar?.id));
        if (kitsRes.data) setAllKits(kitsRes.data);
    };

    const fetchReceitaCategories = async () => {
        try {
            if (!user?.id) return;
            const { data, error } = await supabase.from('receitas').select('categoria').eq('user_id', user.id).not('categoria', 'is', null);
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
            <DialogContent className="sm:max-w-5xl h-[85vh] p-0 overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-white flex flex-col animate-in-fade transition-all duration-300">
                {/* Header Section */}
                <div className="px-8 py-4 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white z-10">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-accent-pink/40 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
                        </div>
                        <div className="flex flex-col justify-center">
                            <DialogTitle className="text-base font-black text-gray-900 leading-[1.2] mb-0.5">
                                {receitaParaEditar ? "Editar Receita" : "Nova Receita"}
                            </DialogTitle>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold leading-none mt-1">Caderno de Delícias</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center flex-[2]">
                        <div className="flex bg-gray-50 p-1 rounded-[14px] border border-gray-100/50">
                            {STEPS.map((s) => {
                                const canProceed = !!nome;
                                const isCurrent = step === s.number;
                                const isPassed = step > s.number;

                                const handleTabClick = () => {
                                    if (s.number > step && !canProceed) {
                                        toast({ title: "Nome obrigatório", variant: "destructive" });
                                        return;
                                    }
                                    setStep(s.number);
                                };

                                return (
                                    <button
                                        key={s.number}
                                        type="button"
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all min-w-max",
                                            isCurrent
                                                ? "bg-white text-gray-900 shadow-[0_2px_8px_rgb(0,0,0,0.04)] ring-1 ring-gray-100/50"
                                                : (isPassed ? "text-gray-500 hover:text-gray-900" : "text-gray-400 hover:text-gray-600"),
                                        )}
                                        onClick={handleTabClick}
                                    >
                                        <span className={cn(
                                            "material-symbols-outlined text-[16px]",
                                            isCurrent ? "text-primary" : (isPassed ? "text-gray-400" : "text-gray-300")
                                        )}>
                                            {s.number === 1 ? 'description' : s.number === 2 ? 'inventory_2' : 'attach_money'}
                                        </span>
                                        {s.title}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 flex justify-end">
                        <button onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-50">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body Area */}
                <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar bg-white dark:bg-surface-dark">
                    <div className="max-w-4xl mx-auto">
                        {step === 1 && (
                            <div className="space-y-6 animate-in-fade pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-2 space-y-6">
                                        <div className="space-y-2">
                                            <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nome da Receita</Label>
                                            <Input
                                                placeholder="Ex: Brownie de Nutella"
                                                value={nome}
                                                onChange={(e) => setNome(e.target.value)}
                                                className="w-full h-12 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium shadow-[0_2px_8px_rgb(0,0,0,0.02)]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Categoria</Label>
                                                <div className="relative">
                                                    {isCreatingCategory ? (
                                                        <div className="flex gap-2">
                                                            <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="h-12 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-primary/20 transition-all shadow-[0_2px_8px_rgb(0,0,0,0.02)]" placeholder="Nova..." />
                                                            <Button onClick={handleSaveNewCategory} className="h-12 w-12 rounded-2xl bg-accent-green text-accent-textGreen hover:bg-green-100 transition shadow-sm"><span className="material-symbols-outlined text-base">check</span></Button>
                                                        </div>
                                                    ) : (
                                                        <Select value={categoria} onValueChange={(v) => v === "new" ? setIsCreatingCategory(true) : setCategoria(v)}>
                                                            <SelectTrigger className="w-full h-12 bg-white border border-gray-100 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-600 focus:ring-2 focus:ring-primary/20 transition-all shadow-[0_2px_8px_rgb(0,0,0,0.02)]">
                                                                <SelectValue placeholder="Selecione..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border border-gray-100 shadow-xl">
                                                                {availableCategories.map(c => <SelectItem key={c} value={c} className="rounded-lg font-medium cursor-pointer">{c}</SelectItem>)}
                                                                <div className="p-1">
                                                                    <SelectItem value="new" className="text-primary font-bold cursor-pointer rounded-lg bg-primary/5 mt-1 hover:bg-primary/10">
                                                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">add</span> Nova Categoria</span>
                                                                    </SelectItem>
                                                                </div>
                                                            </SelectContent>
                                                        </Select>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Tempo de Preparo</Label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">schedule</span>
                                                    <Input
                                                        placeholder="Ex: 45 min"
                                                        value={tempoPreparo}
                                                        onChange={(e) => setTempoPreparo(e.target.value)}
                                                        className="w-full h-12 bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 shadow-[0_2px_8px_rgb(0,0,0,0.02)]"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Rendimento do Lote</Label>
                                                <div className="flex gap-3">
                                                    <Input
                                                        type="number"
                                                        value={rendimentoUnidades}
                                                        onChange={(e) => setRendimentoUnidades(parseFloat(e.target.value) || 1)}
                                                        className="h-12 w-1/2 rounded-2xl border border-gray-100 bg-white font-bold text-center text-sm shadow-[0_2px_8px_rgb(0,0,0,0.02)] focus:ring-2 focus:ring-primary/20"
                                                    />
                                                    <Select value={unidadeRendimento} onValueChange={setUnidadeRendimento}>
                                                        <SelectTrigger className="h-12 w-1/2 rounded-2xl border border-gray-100 bg-white font-bold text-gray-600 text-xs shadow-[0_2px_8px_rgb(0,0,0,0.02)] focus:ring-2 focus:ring-primary/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border border-gray-100 shadow-xl min-w-[100px]">
                                                            {['un', 'g', 'kg', 'ml', 'L'].map(u => <SelectItem key={u} value={u} className="rounded-lg font-medium">{u}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Foto da Receita</Label>
                                                <div
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="h-12 rounded-2xl bg-white border-[1.5px] border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary/40 group transition-all shadow-[0_2px_8px_rgb(0,0,0,0.02)]"
                                                >
                                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                                    {fotoPreview ? (
                                                        <div className="flex items-center gap-2 text-accent-textGreen font-bold text-[10px] uppercase tracking-widest"><span className="material-symbols-outlined text-sm">check_circle</span> Imagem Carregada</div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-gray-500 group-hover:text-primary font-bold transition-colors"><span className="material-symbols-outlined text-sm">cloud_upload</span> <span className="text-[10px] uppercase tracking-widest">Clique para Upload</span></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-1">
                                        <div className="h-full w-full bg-white border border-gray-100/50 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center gap-6">
                                            {fotoPreview ? (
                                                <img src={fotoPreview} alt="Preview" className="w-[120px] h-[120px] rounded-full object-cover shadow-sm border-4 border-white" />
                                            ) : (
                                                <div className="w-[120px] h-[120px] rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                                                    <span className="material-symbols-outlined text-5xl">landscape</span>
                                                </div>
                                            )}
                                            <p className="text-xs font-medium text-gray-400 max-w-[180px] leading-relaxed">
                                                {fotoPreview ? "Clique no botão ao lado para alterar a sua foto." : "Adicione uma foto para deixar sua receita mais atraente."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-8 animate-in-fade">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-gray-400 text-sm">inventory_2</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Composição Técnica</h4>
                                                <p className="text-[10px] text-gray-400 font-semibold tracking-wide">VINCULE ITENS PARA CÁLCULO DE CMV</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setShowSelector(true)}
                                            className="h-10 px-5 rounded-xl bg-accent-pink hover:bg-primary text-gray-900 hover:text-white font-bold text-xs gap-2 shadow-sm transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span> Adicionar Item
                                        </Button>
                                    </div>

                                    <div className="space-y-3 min-h-[300px]">
                                        {ingredientesVinculados.length === 0 ? (
                                            <div className="h-48 flex flex-col items-center justify-center bg-gray-50/50 rounded-[28px] border-2 border-dashed border-gray-100 p-8 text-center">
                                                <span className="material-symbols-outlined w-10 h-10 text-gray-300 text-4xl mb-3">category</span>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum ingrediente vinculado</p>
                                            </div>
                                        ) : (
                                            ingredientesVinculados.map((item, idx) => {
                                                const itemId = item.produtoId || item.receitaComponenteId || item.kitComponenteId || `idx-${idx}`;
                                                return (
                                                    <div key={itemId} className="bg-white rounded-[24px] p-2 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between group gap-4">
                                                        <div className="flex items-center gap-4 flex-1 px-2">
                                                            <div className={cn(
                                                                "w-10 h-10 rounded-[14px] flex items-center justify-center shadow-inner",
                                                                item.tipo === 'ingrediente' ? "bg-accent-pink text-primary" : "bg-gray-100 text-gray-700"
                                                            )}>
                                                                <span className="material-symbols-outlined text-base">{item.tipo === 'ingrediente' ? 'shopping_bag' : 'restaurant'}</span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-bold text-gray-900 truncate">{item.nome}</h4>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.tipo}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto bg-gray-50 p-1.5 rounded-[18px]">
                                                            <div className="bg-white rounded-[14px] flex items-center justify-between px-3 h-10 shadow-sm border border-gray-100 flex-1 sm:w-28">
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantidade}
                                                                    onChange={(e) => updateStockItemQuantity(itemId, item.tipo, parseFloat(e.target.value) || 0)}
                                                                    className="w-12 h-full border-none bg-transparent p-0 text-center font-bold text-gray-900 focus:ring-0"
                                                                />
                                                                <span className="text-[10px] font-bold text-gray-400 uppercase border-l pl-2 ml-1">{item.unidade}</span>
                                                            </div>
                                                            <Select value={item.modo_custo} onValueChange={(v) => updateStockItemModo(itemId, item.tipo, v)}>
                                                                <SelectTrigger className="h-10 w-[110px] sm:w-[130px] rounded-[14px] border border-gray-100 bg-white font-bold text-[10px] uppercase tracking-wider text-gray-600 focus:ring-0">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="rounded-[16px] border-none shadow-lg">
                                                                    <SelectItem value="proporcional" className="text-[10px] font-bold uppercase">Proporcional</SelectItem>
                                                                    {item.tipo === 'ingrediente' && <SelectItem value="inteiro" className="text-[10px] font-bold uppercase">Emb. Inteira</SelectItem>}
                                                                </SelectContent>
                                                            </Select>

                                                            <button
                                                                onClick={() => handleRemoveStockItem(itemId, item.tipo)}
                                                                className="w-10 h-10 rounded-[14px] flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Ingredientes Extras</Label>
                                        <Textarea
                                            placeholder="Outros itens não pesáveis..."
                                            value={ingredientesTexto}
                                            onChange={(e) => setIngredientesTexto(e.target.value)}
                                            className="min-h-[140px] rounded-[24px] border-none bg-gray-50 p-6 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Modo de Preparo</Label>
                                        <Textarea
                                            placeholder="Passo a passo da receita..."
                                            value={modoPreparo}
                                            onChange={(e) => setModoPreparo(e.target.value)}
                                            className="min-h-[140px] rounded-[24px] border-none bg-gray-50 p-6 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-8 animate-in-fade">
                                <div className="bg-white dark:bg-gray-800 rounded-[28px] p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[18px] bg-accent-pink flex items-center justify-center text-primary shadow-sm">
                                                <span className="material-symbols-outlined text-2xl">calculate</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">Precificação Inteligente</h3>
                                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">SUA MARGEM DE LUCRO REAL</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                        {[
                                            { label: 'Custos Fixos', val: '40% Fixo', active: usarBlocoMaoObra, toggle: () => setUsarBlocoMaoObra(!usarBlocoMaoObra), icon: 'home' },
                                            { label: 'Utensílios', val: '3% Reparos', active: usarBlocoUtensilios, toggle: () => setUsarBlocoUtensilios(!usarBlocoUtensilios), icon: 'kitchen' },
                                            { label: 'Imprevistos', val: '20% Segur.', active: true, persistent: true, icon: 'shield' }
                                        ].map((tool, i) => (
                                            <button
                                                key={i}
                                                onClick={tool.toggle}
                                                disabled={tool.persistent}
                                                className={cn(
                                                    "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
                                                    tool.active ? "bg-white border-primary/20 shadow-sm ring-1 ring-primary/10" : "bg-gray-50 border-gray-100 opacity-60 grayscale"
                                                )}
                                            >
                                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors mb-1", tool.active ? "bg-accent-pink text-primary" : "bg-gray-200 text-gray-500")}>
                                                    <span className="material-symbols-outlined text-sm">{tool.active ? 'check' : tool.icon}</span>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-gray-800 leading-none mb-1">{tool.label}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{tool.val}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-5 border border-gray-100 dark:border-gray-700">
                                            <Label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                                <span className="material-symbols-outlined text-orange-400 text-sm">schedule</span> Tempo de Produção
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <Input
                                                    type="number"
                                                    value={tempoProducaoMinutos}
                                                    onChange={(e) => setTempoProducaoMinutos(parseInt(e.target.value) || 0)}
                                                    className="h-12 flex-1 rounded-xl bg-white border-gray-100 font-bold text-xl text-center text-gray-900 shadow-sm focus:ring-2 focus:ring-primary/20"
                                                />
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Minutos</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-5 border border-gray-100 dark:border-gray-700">
                                            <Label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                                                <span className="material-symbols-outlined text-primary text-sm">payments</span> Preço de Venda (Unitário)
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-primary/40">R$</span>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={precoVenda}
                                                    onChange={(e) => setPrecoVenda(parseFloat(e.target.value) || 0)}
                                                    className="w-full h-12 bg-white border-gray-100 rounded-xl pl-10 px-4 text-xl font-bold text-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {precoVenda > 0 && rendimentoUnidades > 0 && (
                                        <div className="mt-4 p-4 bg-accent-green/30 rounded-2xl border border-accent-green flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-accent-textGreen uppercase tracking-widest mb-0.5">💰 Faturamento Total do Lote</p>
                                                <p className="text-[9px] font-bold text-green-600/70 uppercase tracking-widest">
                                                    {formatarMoeda(precoVenda)} × {rendimentoUnidades} {unidadeRendimento}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-accent-textGreen tracking-tight">{formatarMoeda(precoVenda * rendimentoUnidades)}</p>
                                                {calculo && (
                                                    <p className="text-[9px] font-bold text-green-600/70 uppercase tracking-widest mt-0.5">
                                                        Lucro Bruto: {formatarMoeda((precoVenda * rendimentoUnidades) - (calculo.custo_operacional_total || 0))}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Resumo Detalhado de Custos */}
                                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-sm text-gray-400">analytics</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-900 tracking-tight uppercase tracking-wider">Detalhamento Completo</p>
                                        </div>

                                        {/* Custos Detalhados Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-sm text-blue-400">engineering</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">CMV Total (Lote)</span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{formatarMoeda(calculo?.cmv_total || 0)}</div>
                                                <div className="text-[10px] text-gray-400">Unitário: {formatarMoeda(calculo?.cmv_unitario || 0)}</div>
                                            </div>

                                            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-sm text-orange-400">local_fire_department</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Gás</span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{formatarMoeda(calculo?.custo_gas || 0)}</div>
                                                <div className="text-[10px] text-gray-400">Botijão R${pricingSettings?.preco_botijao_gas || 120} / {pricingSettings?.duracao_botijao_horas || 50}h</div>
                                            </div>

                                            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-sm text-yellow-400">bolt</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Mão de Obra</span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{formatarMoeda(calculo?.custo_mao_obra || 0)}</div>
                                                <div className="text-[10px] text-gray-400">R${pricingSettings?.custo_hora_mao_obra || 20}/h x {tempoProducaoMinutos} min</div>
                                            </div>

                                            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-sm text-purple-400">storefront</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Custos Fixos (Rateio)</span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{formatarMoeda(calculo?.custo_fixo_rateio || 0)}</div>
                                                <div className="text-[10px] text-gray-400">R${(calculo?.custo_por_minuto || 0).toFixed(2)}/min x {tempoProducaoMinutos} min</div>
                                            </div>

                                            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-sm text-blue-500">shield</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">CMV + Segurança</span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{formatarMoeda(calculo?.cmv_com_seguranca || 0)}</div>
                                                <div className="text-[10px] text-gray-400">+{pricingSettings?.percentual_seguranca || 20}% Imprevistos</div>
                                            </div>

                                            <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <span className="material-symbols-outlined text-sm text-green-500">account_balance_wallet</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wide">Custo Operacional</span>
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{formatarMoeda(calculo?.custo_operacional_total || 0)}</div>
                                                <div className="text-[10px] text-gray-400">CMV + Gás + MO</div>
                                            </div>
                                        </div>

                                        {/* Custo Unitário Final (destaque) */}
                                        <div className="bg-accent-pink/30 border border-primary/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
                                            <div>
                                                <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Custo Unitário Final</h3>
                                                <p className="text-[10px] font-semibold text-primary/70 uppercase">Custo Base / {rendimentoUnidades} {unidadeRendimento}</p>
                                            </div>
                                            <div className="text-4xl font-black text-primary tracking-tight">
                                                {formatarMoeda(calculo?.custo_unidade_final || 0)}
                                            </div>
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
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mt-6">Custo Por Ingrediente</h3>
                                                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-1 divide-y divide-gray-50 dark:divide-gray-700/50">
                                                    {calculo.detalhamento_custos.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                                <div>
                                                                    <div className="font-bold text-gray-900 text-sm">{item.insumo_nome}</div>
                                                                    <div className="text-xs text-gray-400">
                                                                        {item.quantidade_usada} {item.unidade_usada} · {item.modo_custo}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-gray-900 text-sm">{formatarMoeda(item.custo_total)}</div>
                                                                <div className="text-[10px] font-medium text-primary">{item.percentual_do_cmv?.toFixed(1)}%</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sugestões de Preço por Margem de Lucro */}
                                    {calculo?.precos_sugeridos && calculo.precos_sugeridos.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-lg">trending_up</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Sugestões de Preço</h3>
                                                        <p className="text-[10px] text-gray-500 font-medium uppercase">Clique para definir o preço de venda</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {calculo.precos_sugeridos.map((s: any, idx: number) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setPrecoVenda(parseFloat(s.valor.toFixed(2)))}
                                                            className={cn(
                                                                "bg-white dark:bg-gray-800 border rounded-xl p-4 text-center hover:shadow-md transition-all group",
                                                                precoVenda === parseFloat(s.valor.toFixed(2))
                                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                                    : "border-gray-100 dark:border-gray-700 hover:border-primary/50"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "text-[10px] font-bold uppercase mb-2 transition-colors",
                                                                precoVenda === parseFloat(s.valor.toFixed(2)) ? "text-primary" : "text-gray-400 group-hover:text-primary/70"
                                                            )}>
                                                                Lucro {s.margem}%
                                                            </div>
                                                            <div className="text-xl font-bold text-gray-900 mb-1">
                                                                {formatarMoeda(s.valor)}
                                                            </div>
                                                            <div className="text-[10px] text-gray-400">
                                                                Lote: {formatarMoeda(s.valor * rendimentoUnidades)}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface-dark shrink-0 flex items-center justify-between rounded-b-[32px]">
                    <button
                        onClick={step === 1 ? () => onOpenChange(false) : handleBack}
                        className="text-xs font-bold text-gray-400 hover:text-gray-700 uppercase tracking-widest px-4 py-2 transition-colors"
                    >
                        {step === 1 ? "Cancelar" : "Voltar"}
                    </button>
                    <button
                        onClick={step === 3 ? handleSubmitInternal : handleNext}
                        className={cn(
                            "bg-gray-900 dark:bg-primary hover:bg-black dark:hover:bg-primary/90 text-white rounded-xl px-6 py-3 flex items-center gap-2 shadow-sm transition-all transform hover:-translate-y-0.5",
                            step === 3 ? "bg-accent-pink text-primary hover:bg-accent-pink/90" : ""
                        )}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">{step === 3 ? "Finalizar Receita" : "Próximo Passo"}</span>
                        <span className="material-symbols-outlined text-sm">{step === 3 ? 'check_circle' : 'arrow_forward'}</span>
                    </button>
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
