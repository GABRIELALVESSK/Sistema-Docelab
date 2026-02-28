import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, BookOpen, Clock, ChefHat, Pencil, Trash2, Box, DollarSign, TrendingUp, Eye } from "lucide-react";
import { NovaReceitaModal } from "@/components/receitas/NovaReceitaModal";
import { DetalhesReceitaModal } from "@/components/receitas/DetalhesReceitaModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { formatarMoeda } from "@/lib/precificacao-calculator";
import { cn } from "@/lib/utils";

export default function Receitas() {
    const { toast } = useToast();
    const [showNovaReceita, setShowNovaReceita] = useState(false);
    const [showDetalhes, setShowDetalhes] = useState(false);
    const [selectedReceita, setSelectedReceita] = useState<any>(null);
    const [receitaParaEditar, setReceitaParaEditar] = useState<any>(null);
    const [receitas, setReceitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchReceitas();
    }, []);

    const fetchReceitas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('receitas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setReceitas(data);
        } catch (error: any) {
            if (!error.message?.includes('does not exist')) {
                toast({ title: "Erro ao carregar receitas", variant: "destructive" });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateReceita = async (receita: any) => {
        try {
            if (receitaParaEditar) {
                const payload: any = {
                    nome: receita.nome,
                    categoria: receita.categoria,
                    tempo_preparo: receita.tempoPreparo,
                    ingredientes_texto: receita.ingredientesTexto,
                    modo_preparo: receita.modoPreparo,
                    foto_url: receita.fotoUrl,
                    rendimento_unidades: receita.rendimento_unidades,
                    unidade_rendimento: receita.unidade_rendimento,
                    custo_unitario: receita.custo_unitario,
                    cmv_unitario: receita.cmv_unitario,
                    preco_venda: receita.preco_venda,
                    tempo_producao_minutos: receita.tempo_producao_minutos,
                    margem_lucro_alvo: receita.margem_lucro_alvo
                };

                const { data: recipeData, error: recipeError } = await supabase
                    .from('receitas')
                    .update(payload)
                    .eq('id', receitaParaEditar.id)
                    .select()
                    .single();

                if (recipeError) throw recipeError;

                await supabase.from('receita_ingredientes').delete().eq('receita_id', receitaParaEditar.id);
                if (receita.ingredientesVinculados.length > 0) {
                    const ingredientsToInsert = receita.ingredientesVinculados.map((i: any) => ({
                        receita_id: receitaParaEditar.id,
                        produto_id: i.produto_id || i.produtoId || null,
                        receita_componente_id: i.receita_componente_id || i.receitaComponenteId || null,
                        kit_componente_id: i.kit_componente_id || i.kitComponenteId || null,
                        quantidade: i.quantidade,
                        modo_custo: i.modo_custo,
                        usos_amortizacao: i.usos_amortizacao
                    }));
                    const { error: ingError } = await supabase.from('receita_ingredientes').insert(ingredientsToInsert);
                    if (ingError) throw ingError;
                }

                setReceitas(receitas.map(r => r.id === receitaParaEditar.id ? recipeData : r));
                toast({ title: "Receita atualizada com sucesso!" });
                setReceitaParaEditar(null);
            } else {
                const payload: any = {
                    nome: receita.nome,
                    categoria: receita.categoria,
                    tempo_preparo: receita.tempoPreparo,
                    ingredientes_texto: receita.ingredientesTexto,
                    modo_preparo: receita.modoPreparo,
                    foto_url: receita.fotoUrl,
                    rendimento_unidades: receita.rendimento_unidades,
                    unidade_rendimento: receita.unidade_rendimento,
                    custo_unitario: receita.custo_unitario,
                    cmv_unitario: receita.cmv_unitario,
                    preco_venda: receita.preco_venda,
                    tempo_producao_minutos: receita.tempo_producao_minutos,
                    margem_lucro_alvo: receita.margem_lucro_alvo
                };

                const { data: recipeData, error: recipeError } = await supabase
                    .from('receitas')
                    .insert([payload])
                    .select()
                    .single();

                if (recipeError) throw recipeError;

                if (receita.ingredientesVinculados.length > 0) {
                    const ingredientsToInsert = receita.ingredientesVinculados.map((i: any) => ({
                        receita_id: recipeData.id,
                        produto_id: i.produto_id || i.produtoId || null,
                        receita_componente_id: i.receita_componente_id || i.receitaComponenteId || null,
                        kit_componente_id: i.kit_componente_id || i.kitComponenteId || null,
                        quantidade: i.quantidade,
                        modo_custo: i.modo_custo,
                        usos_amortizacao: i.usos_amortizacao
                    }));
                    const { error: ingError } = await supabase.from('receita_ingredientes').insert(ingredientsToInsert);
                    if (ingError) throw ingError;
                }

                setReceitas([recipeData, ...receitas]);
                toast({ title: "Receita criada com sucesso!" });
            }
            setShowNovaReceita(false);
        } catch (error: any) {
            toast({ title: "Erro ao salvar receita", description: error.message, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase.from('receitas').delete().eq('id', id);
            if (error) throw error;
            setReceitas(receitas.filter(r => r.id !== id));
            toast({ title: "Receita removida" });
        } catch (error: any) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    const filteredReceitas = receitas.filter(r =>
        r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calcMargemLucro = (custo: number, preco: number) => {
        if (!custo || !preco || preco <= 0) return 0;
        return ((preco - custo) / preco) * 100;
    };

    return (
        <>
            <div className="p-6 max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <h1 className="text-2xl font-black tracking-tight text-gray-800">Minhas <span className="text-[#EFB6BF]">Receitas</span></h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Caderno de delícias · {receitas.length} receita{receitas.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Button
                        onClick={() => { setReceitaParaEditar(null); setShowNovaReceita(true); }}
                        className="h-9 px-6 rounded-full bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white font-black text-xs gap-2 shadow-lg shadow-[#EFB6BF]/20 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" /> Nova Receita
                    </Button>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                        <Input
                            placeholder="Buscar pelo nome da receita..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border-none h-10 pl-11 rounded-xl text-sm font-semibold text-gray-700 placeholder:text-gray-300 shadow-sm focus:shadow-md transition-all"
                        />
                    </div>
                    <Button variant="outline" className="h-10 px-6 rounded-xl border-gray-100 text-gray-400 font-bold text-[10px] uppercase tracking-widest gap-2 bg-white shadow-sm">
                        <Filter className="w-3.5 h-3.5" /> Categorias
                    </Button>
                </div>

                {loading ? (
                    <div className="py-16 text-center flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EFB6BF] mb-3"></div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Buscando caderno de receitas...</p>
                    </div>
                ) : filteredReceitas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                            <BookOpen className="w-7 h-7 text-gray-200" />
                        </div>
                        <h3 className="text-sm font-black text-gray-700 tracking-tight">Nenhuma receita encontrada</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Comece criando sua primeira delícia</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredReceitas.map((receita) => {
                            const custoUnit = receita.custo_unitario || 0;
                            const cmvUnit = receita.cmv_unitario || 0;
                            const precoVenda = receita.preco_venda || 0;
                            const margem = calcMargemLucro(custoUnit, precoVenda);
                            const margemAlvo = receita.margem_lucro_alvo || 0;
                            const rendimento = receita.rendimento_unidades || 1;
                            const unidadeRend = receita.unidade_rendimento || 'un';

                            return (
                                <div
                                    key={receita.id}
                                    className="bg-white rounded-[28px] border border-gray-200/70 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.10)] transition-all flex flex-col"
                                >
                                    {/* Image / Header */}
                                    {receita.foto_url ? (
                                        <div className="relative h-48 overflow-hidden">
                                            <img src={receita.foto_url} alt={receita.nome} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-6 right-6">
                                                <span className="inline-block text-[9px] font-black uppercase text-white/80 tracking-[0.2em] bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-2">
                                                    {receita.categoria || 'Sem categoria'}
                                                </span>
                                                <h3 className="text-xl font-black text-white tracking-tight line-clamp-2 drop-shadow-md">{receita.nome}</h3>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 pb-4 flex items-start justify-between">
                                            <div className="space-y-2">
                                                <span className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                                    {receita.categoria || 'Sem categoria'}
                                                </span>
                                                <h3 className="text-xl font-black text-gray-800 tracking-tight group-hover:text-[#EFB6BF] transition-colors line-clamp-2">{receita.nome}</h3>
                                            </div>
                                            <div className="w-14 h-14 rounded-[18px] bg-[#EFB6BF]/10 flex items-center justify-center shrink-0">
                                                <ChefHat className="w-7 h-7 text-[#EFB6BF]" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-8 pb-6 space-y-5 flex-1 flex flex-col">
                                        {/* Info Badges: Time, Yield */}
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {receita.tempo_preparo && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                                                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{receita.tempo_preparo}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                                                <Box className="w-3.5 h-3.5 text-gray-300" />
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rend: {rendimento} {unidadeRend}</span>
                                            </div>
                                            {margemAlvo > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
                                                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Margem alvo: {margemAlvo}%</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Cost Details Grid */}
                                        <div className="bg-gray-50/80 rounded-[20px] p-5 space-y-4 border border-gray-100/50 mt-auto">
                                            {/* Row 1: CMV + Custo Unitário */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.15em]">CMV Unitário</p>
                                                    <p className="text-sm font-black text-gray-600 tracking-tight">{formatarMoeda(cmvUnit)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.15em]">Custo Total/Un</p>
                                                    <p className="text-sm font-black text-gray-600 tracking-tight">{formatarMoeda(custoUnit)}</p>
                                                </div>
                                            </div>

                                            {/* Divider */}
                                            <div className="border-t border-gray-200/50" />

                                            {/* Row 2: Preço Venda + Margem Lucro */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-[#EFB6BF] tracking-[0.15em]">Preço de Venda</p>
                                                    <p className="text-lg font-black text-[#EFB6BF] tracking-tighter">{formatarMoeda(precoVenda)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.15em]">Margem de Lucro</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn(
                                                            "text-lg font-black tracking-tighter",
                                                            margem >= 50 ? "text-green-500" : margem >= 30 ? "text-yellow-500" : "text-rose-500"
                                                        )}>
                                                            {margem.toFixed(1)}%
                                                        </p>
                                                        <TrendingUp className={cn(
                                                            "w-4 h-4",
                                                            margem >= 50 ? "text-green-400" : margem >= 30 ? "text-yellow-400" : "text-rose-400"
                                                        )} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 3: Custo por Lote */}
                                            {rendimento > 1 && (
                                                <>
                                                    <div className="border-t border-gray-200/50" />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.15em]">Custo Lote ({rendimento} {unidadeRend})</p>
                                                            <p className="text-sm font-black text-gray-600 tracking-tight">{formatarMoeda(custoUnit * rendimento)}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-[0.15em]">Receita Lote</p>
                                                            <p className="text-sm font-black text-green-500 tracking-tight">{formatarMoeda(precoVenda * rendimento)}</p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                onClick={() => { setSelectedReceita(receita); setShowDetalhes(true); }}
                                                className="flex-1 h-11 bg-[#EFB6BF]/10 hover:bg-[#EFB6BF]/20 text-[#EFB6BF] font-black text-xs uppercase tracking-widest rounded-2xl transition-all border border-[#EFB6BF]/20 gap-2"
                                            >
                                                <Eye className="w-4 h-4" /> Ver Detalhes
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => { setReceitaParaEditar(receita); setShowNovaReceita(true); }}
                                                className="w-11 h-11 p-0 rounded-2xl text-gray-300 hover:text-[#EFB6BF] hover:bg-[#EFB6BF]/10 transition-all border border-transparent hover:border-[#EFB6BF]/20"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => handleDelete(receita.id)}
                                                className="w-11 h-11 p-0 rounded-2xl text-gray-300 hover:text-rose-400 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <NovaReceitaModal
                open={showNovaReceita}
                onOpenChange={setShowNovaReceita}
                onSubmit={handleCreateReceita}
                receitaParaEditar={receitaParaEditar}
            />

            <DetalhesReceitaModal
                open={showDetalhes}
                onOpenChange={setShowDetalhes}
                receita={selectedReceita}
            />
        </>
    );
}
