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
import { useAuth } from "@/contexts/AuthContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ptBR } from "date-fns/locale";

export default function Receitas() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [showNovaReceita, setShowNovaReceita] = useState(false);
    const [showDetalhes, setShowDetalhes] = useState(false);
    const [selectedReceita, setSelectedReceita] = useState<any>(null);
    const [receitaParaEditar, setReceitaParaEditar] = useState<any>(null);
    const [receitas, setReceitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchReceitas();
        }
    }, [user?.id]);

    const fetchReceitas = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('receitas')
                .select('*')
                .eq('user_id', user.id)
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
        if (!user?.id) return;
        try {
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
                margem_lucro_alvo: receita.margem_lucro_alvo,
                user_id: user.id
            };

            if (receitaParaEditar) {
                const { data: recipeData, error: recipeError } = await supabase
                    .from('receitas')
                    .update(payload)
                    .eq('id', receitaParaEditar.id)
                    .eq('user_id', user.id)
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
        if (!user?.id) return;
        try {
            const { error } = await supabase
                .from('receitas')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;
            setReceitas(receitas.filter(r => r.id !== id));
            toast({ title: "Receita removida" });
        } catch (error: any) {
            toast({ title: "Erro ao remover", variant: "destructive" });
        }
    };

    const filteredReceitas = receitas.filter(r => {
        const matchesSearch = r.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || r.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = Array.from(new Set(receitas.map(r => r.categoria).filter(Boolean)));

    const calcMargemLucro = (custo: number, preco: number) => {
        if (!custo || !preco || preco <= 0) return 0;
        return ((preco - custo) / preco) * 100;
    };

    return (
        <div className="w-full p-8 lg:p-10 flex flex-col h-full overflow-hidden animate-in-fade bg-[#F5F1EB] dark:bg-background-dark relative font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 flex-shrink-0 relative z-10">
                <div>
                    <h2 className="text-[28px] md:text-3xl font-extrabold text-[#1E1E2F] dark:text-white leading-tight tracking-tight mb-1">
                        Minhas <span className="text-primary">Receitas</span>
                    </h2>
                    <p className="text-gray-500 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
                        CADERNO DE DELÍCIAS · {receitas.length} RECEITA{receitas.length !== 1 ? 'S' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => { setReceitaParaEditar(null); setShowNovaReceita(true); }}
                    className="bg-[#F4C7C7] hover:bg-[#F87171] text-[#1E1E2F] hover:text-white px-6 h-12 rounded-2xl font-bold text-[14px] tracking-wide transition shadow-sm flex items-center gap-2 border-none active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Nova Receita
                </Button>
            </header>

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 flex-shrink-0 relative z-10">
                <div className="flex-1 relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">search</span>
                    <Input
                        placeholder="Buscar pelo nome da receita..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 h-12 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm text-sm font-bold focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 text-[#1E1E2F] dark:text-white transition-all outline-none"
                    />
                </div>
                {/* Categorias btn */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className={cn(
                            "bg-white dark:bg-gray-800 px-6 h-12 rounded-2xl font-bold text-xs uppercase tracking-wide border shadow-sm flex items-center gap-2 transition hover:bg-gray-50 dark:hover:bg-gray-700",
                            selectedCategory ? "text-primary border-primary" : "text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700"
                        )}>
                            <span className="material-symbols-outlined text-lg">filter_list</span>
                            {selectedCategory || "Categorias"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl p-2 border-gray-100 dark:border-gray-700 shadow-xl dark:bg-gray-800 min-w-[200px]">
                        <DropdownMenuItem
                            onClick={() => setSelectedCategory(null)}
                            className="rounded-xl gap-2 font-bold cursor-pointer"
                        >
                            Todas as Categorias
                        </DropdownMenuItem>
                        {categories.map((cat: any) => (
                            <DropdownMenuItem
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className="rounded-xl gap-2 font-bold cursor-pointer"
                            >
                                {cat}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F4C7C7] border-t-primary mb-4"></div>
                        <p className="text-[13px] font-bold text-gray-500 uppercase tracking-widest">Buscando caderno de receitas...</p>
                    </div>
                ) : filteredReceitas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-gray-500">menu_book</span>
                        </div>
                        <h3 className="text-[16px] font-black text-[#1E1E2F] dark:text-white uppercase tracking-wide">Nenhuma receita encontrada</h3>
                        <p className="text-[13px] font-bold text-gray-500 mt-2 max-w-[250px] mx-auto">
                            Tente ajustar sua busca ou comece criando sua primeira delícia.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-6">
                        {filteredReceitas.map((receita) => {
                            const custoUnit = receita.custo_unitario || 0;
                            const cmvUnit = receita.cmv_unitario || 0;
                            const precoVenda = receita.preco_venda || 0;
                            const margem = calcMargemLucro(custoUnit, precoVenda);
                            const margemAlvo = receita.margem_lucro_alvo || 0;
                            const rendimento = receita.rendimento_unidades || 1;
                            const unidadeRend = receita.unidade_rendimento || 'un';

                            return (
                                <article
                                    key={receita.id}
                                    className="bg-white dark:bg-gray-800 rounded-[2rem] p-3 shadow-card hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700/50 flex flex-col gap-3 overflow-hidden relative group"
                                >
                                    {!receita.foto_url && (
                                        <div className="absolute -top-6 -right-6 w-32 h-32 bg-pink-50 dark:bg-pink-900/10 rounded-full flex items-center justify-center pointer-events-none"></div>
                                    )}

                                    {receita.foto_url ? (
                                        <div className="relative h-56 w-full rounded-2xl overflow-hidden group/image z-10">
                                            <img src={receita.foto_url} alt={receita.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" />
                                            {/* Stronger gradient for legibility */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                                            <div className="absolute top-3 left-3">
                                                <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md text-white text-[13px] font-extrabold rounded-lg tracking-wider border border-white/20 uppercase shadow-lg">
                                                    {receita.categoria || 'Sem categoria'}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-3 left-3 right-3">
                                                <h3 className="text-xl font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2 uppercase tracking-tight">
                                                    {receita.nome}
                                                </h3>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start relative z-10 px-2 pt-1">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12px] font-extrabold text-gray-500 uppercase tracking-widest mb-0.5">{receita.categoria || 'Sem categoria'}</p>
                                                <h3 className="text-lg font-bold text-[#1E1E2F] dark:text-white leading-tight line-clamp-2 break-words">
                                                    {receita.nome}
                                                </h3>
                                            </div>
                                            <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center text-primary shadow-sm flex-shrink-0 ml-3">
                                                <span className="material-symbols-outlined text-xl">cookie</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-gray-500 relative z-10 px-1 -mt-1">
                                        {receita.tempo_preparo && (
                                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-1 rounded-lg border border-gray-100 dark:border-gray-600">
                                                <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                <span className="font-bold">{receita.tempo_preparo.toUpperCase()}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-1.5 py-1 rounded-lg border border-gray-100 dark:border-gray-600">
                                            <span className="material-symbols-outlined text-[14px]">package_2</span>
                                            <span className="font-bold">REND: {rendimento} {unidadeRend?.toUpperCase() || 'UN'}</span>
                                        </div>
                                        {margemAlvo > 0 && (
                                            <div className="flex items-center gap-1 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-1.5 py-1 rounded-lg border border-green-100 dark:border-green-800">
                                                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                                                <span className="font-bold">META: {margemAlvo}%</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-3 grid grid-cols-2 gap-y-0 gap-x-2 relative z-10">
                                        <div className="mb-2">
                                            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">CMV UNITÁRIO</p>
                                            <p className="text-xs font-bold text-[#1E1E2F] dark:text-white">{formatarMoeda(cmvUnit)}</p>
                                        </div>
                                        <div className="mb-2">
                                            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">CUSTO TOTAL/UN</p>
                                            <p className="text-xs font-bold text-[#1E1E2F] dark:text-white">{formatarMoeda(custoUnit)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-primary/70 uppercase tracking-widest">PREÇO DE VENDA</p>
                                            <p className="text-base font-extrabold text-primary">{formatarMoeda(precoVenda)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">MARGEM DE LUCRO</p>
                                            <div className="flex items-center gap-0.5">
                                                <p className={cn("text-base font-bold tracking-tight", margem >= 50 ? "text-green-500" : margem >= 30 ? "text-yellow-500" : "text-red-500")}>
                                                    {margem.toFixed(1)}%
                                                </p>
                                                <span className={cn("material-symbols-outlined text-xs font-bold", margem >= 50 ? "text-green-500" : margem >= 30 ? "text-yellow-500" : "text-red-500")}>
                                                    trending_up
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spacer to push content to top and keep it compact */}
                                    <div className="flex-1"></div>

                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 relative z-10 px-1">
                                        <button
                                            onClick={() => { setSelectedReceita(receita); setShowDetalhes(true); }}
                                            className="flex-1 flex items-center justify-center gap-2 bg-[#FCE7E7] hover:bg-pink-100 dark:bg-pink-900/20 text-primary dark:text-pink-300 py-2.5 rounded-xl font-bold text-[13px] tracking-wider transition"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            VER DETALHES
                                        </button>
                                        <button
                                            onClick={() => { setReceitaParaEditar(receita); setShowNovaReceita(true); }}
                                            className="p-2 text-gray-500 hover:text-primary transition rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(receita.id)}
                                            className="p-2 text-gray-500 hover:text-red-500 transition rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </article>
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
        </div>
    );
}
