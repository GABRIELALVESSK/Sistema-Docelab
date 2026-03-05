import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers, Plus, Trash2, ChefHat, DollarSign, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/precificacao-calculator";
import { AdicionarComponenteModal } from "./AdicionarComponenteModal";
import { useAuth } from "@/contexts/AuthContext";

const PAPEIS = ["Casca", "Recheio", "Finalização", "Embalagem", "Decoração", "Outro"];

interface Receita {
    id: string;
    nome: string;
    custo_unitario?: number;
    cmv_unitario?: number;
    preco_venda?: number;
    rendimento_unidades?: number;
    unidade_rendimento?: string;
    tipo: 'receita';
}

interface Produto {
    id: string;
    nome: string;
    preco_medio: number;
    unidade: string;
    tipo: 'produto';
}

interface ItemKit {
    id: string;
    receitaId?: string;
    produtoId?: string;
    nome: string;
    papel: string;
    quantidade: number;
    unidade: string;
    custo_unitario: number;
}

interface NovoKitModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (kit: any) => void;
    kitParaEditar?: any;
}

export function NovoKitModal({ open, onOpenChange, onSubmit, kitParaEditar }: NovoKitModalProps) {
    const { user } = useAuth();
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [precoVenda, setPrecoVenda] = useState("");
    const [itensKit, setItensKit] = useState<ItemKit[]>([]);
    const [receitas, setReceitas] = useState<Receita[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [allKits, setAllKits] = useState<any[]>([]);
    const [itemSelecionado, setItemSelecionado] = useState("");
    const [papelSelecionado, setPapelSelecionado] = useState("Casca");
    const [qtdItem, setQtdItem] = useState(1);
    const [unidadeSelecionada, setUnidadeSelecionada] = useState("un");
    const [rendimentoUnidades, setRendimentoUnidades] = useState(1);
    const [unidadeRendimento, setUnidadeRendimento] = useState("un");
    const [loading, setLoading] = useState(false);
    const [showSelector, setShowSelector] = useState(false);

    const fetchData = async () => {
        if (!user?.id) return;
        const [receitasRes, produtosRes, kitsRes] = await Promise.all([
            supabase.from("receitas")
                .select("id, nome, preco_venda, rendimento_unidades, unidade_rendimento, custo_unitario, cmv_unitario")
                .eq("user_id", user.id)
                .order("nome", { ascending: true }),
            supabase.from("produtos")
                .select("id, nome, preco_medio, unidade")
                .eq("user_id", user.id)
                .order("nome", { ascending: true }),
            supabase.from("kits_receitas")
                .select("id, nome, preco_venda, rendimento_unidades, unidade_rendimento")
                .or(`user_id.eq.${user.id},user_id.is.null`)
                .order("nome", { ascending: true })
        ]);

        const fetchedReceitas = receitasRes.data?.map(r => ({ ...r, tipo: 'receita' as const })) || [];
        const fetchedProdutos = produtosRes.data?.map(p => ({ ...p, tipo: 'produto' as const })) || [];
        const fetchedKits = kitsRes.data?.map(k => ({ ...k, tipo: 'kit' as const })) || [];

        setReceitas(fetchedReceitas);
        setProdutos(fetchedProdutos);
        setAllKits(fetchedKits);

        if (kitParaEditar && kitParaEditar.itens) {
            setNome(kitParaEditar.nome || "");
            setDescricao(kitParaEditar.descricao || "");
            setPrecoVenda(kitParaEditar.preco_venda?.toString() || "");
            setRendimentoUnidades(kitParaEditar.rendimento_unidades || 1);
            setUnidadeRendimento(kitParaEditar.unidade_rendimento || "un");

            setItensKit(kitParaEditar.itens.map((i: any) => {
                let custo = 0;
                if (i.receita_id) {
                    const r = fetchedReceitas.find(rec => rec.id === i.receita_id);
                    if (r) custo = r.cmv_unitario || (r.custo_unitario ? r.custo_unitario / (r.rendimento_unidades || 1) : 0);
                } else if (i.produto_id) {
                    const p = fetchedProdutos.find(prod => prod.id === i.produto_id);
                    if (p) custo = p.preco_medio || 0;
                }
                return {
                    id: Math.random().toString(),
                    receitaId: i.receita_id,
                    produtoId: i.produto_id,
                    nome: i.nome || (i.receitas?.nome) || (i.produtos?.nome),
                    papel: i.papel,
                    quantidade: i.quantidade,
                    unidade: i.unidade,
                    custo_unitario: custo
                };
            }));
        } else {
            resetFormStates();
        }
    };

    useEffect(() => {
        if (open && user?.id) {
            fetchData();
        }
    }, [open, kitParaEditar, user?.id]);

    const resetFormStates = () => {
        setNome("");
        setDescricao("");
        setPrecoVenda("");
        setItensKit([]);
        setItemSelecionado("");
        setPapelSelecionado("Casca");
        setQtdItem(1);
        setUnidadeSelecionada("un");
        setRendimentoUnidades(1);
        setUnidadeRendimento("un");
    };

    const resetForm = () => {
        resetFormStates();
        onOpenChange(false);
    };

    const opcoesItens = [
        ...receitas.map(r => ({ id: `r:${r.id}`, nome: r.nome, tipo: 'receita' as const, original: r })),
        ...produtos.map(p => ({ id: `p:${p.id}`, nome: p.nome, tipo: 'produto' as const, original: p }))
    ].sort((a, b) => a.nome.localeCompare(b.nome));

    const calcularCustoProporcional = (receita: Receita, qtdKit: number, unidadeKit: string) => {
        const unidadeReceita = receita.unidade_rendimento || "un";
        const custoBase = receita.cmv_unitario || (receita.custo_unitario ? receita.custo_unitario / (receita.rendimento_unidades || 1) : 0);

        if (unidadeReceita === unidadeKit) return custoBase * qtdKit;
        if (unidadeReceita === "kg" && unidadeKit === "g") return (custoBase / 1000) * qtdKit;
        if (unidadeReceita === "g" && unidadeKit === "kg") return (custoBase * 1000) * qtdKit;
        if (unidadeReceita === "L" && unidadeKit === "ml") return (custoBase / 1000) * qtdKit;
        if (unidadeReceita === "ml" && unidadeKit === "L") return (custoBase * 1000) * qtdKit;
        return custoBase * qtdKit;
    };

    const handleSelectComponente = (item: any) => {
        setItemSelecionado(item.id);
        setShowSelector(false);
        if (item.tipo === 'ingrediente') {
            setUnidadeSelecionada(item.original.unidade || "un");
        } else {
            setUnidadeSelecionada(item.original.unidade_rendimento || "un");
        }
    };

    const handleAddItem = () => {
        if (!itemSelecionado) return;

        const [tipo, id] = itemSelecionado.split(':');
        let nomeItem = "";
        let custoItem = 0;
        let receitaId: string | undefined;
        let produtoId: string | undefined;

        if (tipo === 'r') {
            const r = receitas.find(rec => rec.id === id);
            if (!r) return;
            nomeItem = r.nome;
            receitaId = r.id;
            custoItem = calcularCustoProporcional(r, qtdItem, unidadeSelecionada);
        } else {
            const p = produtos.find(prod => prod.id === id);
            if (!p) return;
            nomeItem = p.nome;
            produtoId = p.id;
            const custoBase = p.preco_medio || 0;
            const unidadeBase = p.unidade || "un";

            if (unidadeBase === unidadeSelecionada) custoItem = custoBase * qtdItem;
            else if (unidadeBase === "kg" && unidadeSelecionada === "g") custoItem = (custoBase / 1000) * qtdItem;
            else if (unidadeBase === "g" && unidadeSelecionada === "kg") custoItem = (custoBase * 1000) * qtdItem;
            else if (unidadeBase === "L" && unidadeSelecionada === "ml") custoItem = (custoBase / 1000) * qtdItem;
            else if (unidadeBase === "ml" && unidadeSelecionada === "L") custoItem = (custoBase * 1000) * qtdItem;
            else custoItem = custoBase * qtdItem;
        }

        const novoItem: ItemKit = {
            id: Math.random().toString(),
            receitaId,
            produtoId,
            nome: nomeItem,
            papel: papelSelecionado,
            quantidade: qtdItem,
            unidade: unidadeSelecionada,
            custo_unitario: custoItem / qtdItem
        };

        setItensKit([...itensKit, novoItem]);
        setItemSelecionado("");
        setQtdItem(1);
    };

    const handleRemoveItem = (id: string) => {
        setItensKit(itensKit.filter(item => item.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome || itensKit.length === 0) return;

        setLoading(true);
        await onSubmit({
            id: kitParaEditar?.id,
            nome,
            descricao,
            preco_venda: parseFloat(precoVenda.replace(',', '.')) || precoSugerido,
            custo_total: custoTotal,
            rendimento_unidades: rendimentoUnidades,
            unidade_rendimento: unidadeRendimento,
            itens: itensKit.map(i => ({
                receita_id: i.receitaId,
                produto_id: i.produtoId,
                papel: i.papel,
                quantidade: i.quantidade,
                unidade: i.unidade
            }))
        });
        setLoading(false);
        resetForm();
    };

    const custoTotal = itensKit.reduce((acc, item) => acc + item.custo_unitario * item.quantidade, 0);
    const precoSugerido = custoTotal;

    const PAPEL_COLORS: Record<string, string> = {
        "Casca": "bg-amber-100 text-amber-700",
        "Recheio": "bg-pink-100 text-pink-700",
        "Finalização": "bg-purple-100 text-purple-700",
        "Embalagem": "bg-blue-100 text-blue-700",
        "Decoração": "bg-green-100 text-green-700",
        "Outro": "bg-gray-100 text-gray-600",
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden rounded-[32px] border-none shadow-[var(--shadow-modal)]">
                    <div className="p-10 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <DialogHeader className="mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[20px] bg-[#EFB6BF]/10 flex items-center justify-center text-[#EFB6BF] shadow-sm">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight text-gray-800">
                                        {kitParaEditar ? "Editar Kit de Receitas" : "Novo Kit de Receitas"}
                                    </DialogTitle>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                        {kitParaEditar ? "Atualize as informações do seu produto composto" : "Monte um produto composto por múltiplas receitas"}
                                    </p>
                                </div>
                            </div>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="premium-label">Nome do Kit *</Label>
                                    <Input
                                        placeholder="Ex: Ovo de Colher 200g"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="h-12 bg-[#FDFCFB] text-sm font-black text-gray-700 px-5"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="premium-label">Descrição (opcional)</Label>
                                    <Input
                                        placeholder="Breve descrição..."
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        className="h-12 bg-[#FDFCFB] text-sm font-semibold text-gray-700 px-5"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="premium-label">Rendimento Total do Kit *</Label>
                                    <div className="flex gap-3">
                                        <Input
                                            type="number"
                                            value={rendimentoUnidades}
                                            onChange={(e) => setRendimentoUnidades(parseFloat(e.target.value) || 1)}
                                            className="h-12 w-1/2 bg-[#FDFCFB] text-sm font-black text-center text-gray-700 px-5"
                                            required
                                        />
                                        <Select value={unidadeRendimento} onValueChange={setUnidadeRendimento}>
                                            <SelectTrigger className="h-12 w-1/2 bg-[#FDFCFB] border-gray-100 rounded-[14px] text-xs font-bold text-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                                {['un', 'g', 'kg', 'ml', 'L'].map(u => (
                                                    <SelectItem key={u} value={u} className="text-xs font-bold">{u}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 p-8 rounded-[32px] bg-[#FDFCFB] border border-gray-100/50">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                            <ChefHat className="w-4 h-4 text-[#EFB6BF]" />
                                        </div>
                                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Composição</h3>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddItem}
                                        disabled={!itemSelecionado}
                                        className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white h-9 rounded-full font-black text-[12px] uppercase tracking-widest px-6 shadow-sm disabled:opacity-30"
                                    >
                                        Adicionar
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label className="premium-label">Item Selecionado</Label>
                                        <button
                                            type="button"
                                            onClick={() => setShowSelector(true)}
                                            className={cn(
                                                "w-full h-11 bg-white border border-gray-100 rounded-[14px] text-xs flex items-center justify-between font-bold px-4 transition-all hover:border-[#EFB6BF]/30",
                                                !itemSelecionado ? "text-gray-500" : "text-gray-700"
                                            )}
                                        >
                                            <span className="truncate">
                                                {itemSelecionado ? opcoesItens.find(o => o.id === itemSelecionado)?.nome : "Buscar no estoque..."}
                                            </span>
                                            <Search className="w-4 h-4 opacity-20" />
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="premium-label">Papel</Label>
                                        <Select value={papelSelecionado} onValueChange={setPapelSelecionado}>
                                            <SelectTrigger className="h-11 bg-white border-gray-100 rounded-[14px] text-xs font-bold text-gray-700">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-xl">
                                                {PAPEIS.map(p => (
                                                    <SelectItem key={p} value={p} className="text-xs font-bold">{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="premium-label">Quantidade</Label>
                                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-[14px] px-4 h-11">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            value={qtdItem}
                                            onChange={(e) => setQtdItem(parseFloat(e.target.value) || 0)}
                                            className="flex-1 border-none bg-transparent p-0 text-sm font-black h-auto focus-visible:ring-0 text-gray-700"
                                        />
                                        <div className="h-4 w-[1px] bg-gray-100 mx-2" />
                                        <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
                                            <SelectTrigger className="border-none bg-transparent h-auto p-0 w-12 shadow-none focus:ring-0 font-black text-[#EFB6BF] text-[13px] uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-none shadow-xl">
                                                {["un", "g", "kg", "ml", "L"].map(u => (
                                                    <SelectItem key={u} value={u} className="text-[13px] font-black uppercase">{u}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Items List List */}
                                <div className="space-y-2 pt-4 border-t border-gray-50">
                                    {itensKit.length === 0 ? (
                                        <div className="text-center py-10 opacity-20">
                                            <p className="text-[13px] font-black uppercase tracking-widest">Aguardando componentes...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2.5">
                                            {itensKit.map(item => (
                                                <div key={item.id} className="bg-white border border-gray-50 rounded-[20px] p-4 shadow-sm group hover:border-[#EFB6BF]/30 transition-all flex items-center justify-between">
                                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                                        <div className={cn("w-2 h-10 rounded-full", PAPEL_COLORS[item.papel]?.split(' ')[0] || "bg-gray-100")} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-[13px] font-black text-gray-700 truncate">{item.nome}</h4>
                                                                <span className="text-[13px] font-black uppercase text-gray-500">| {item.papel}</span>
                                                            </div>
                                                            <p className="text-[13px] font-bold text-gray-500 mt-0.5">
                                                                {item.quantidade} {item.unidade} <span className="mx-1.5 opacity-30">•</span> {formatarMoeda(item.custo_unitario * item.quantidade)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-gray-500 hover:text-rose-400 transition-all">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="premium-label">Preço Final Recheado</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EFB6BF]/40" />
                                        <Input
                                            placeholder="0,00"
                                            value={precoVenda}
                                            onChange={(e) => setPrecoVenda(e.target.value)}
                                            className="h-14 bg-[#FDFCFB] border-none text-lg font-black text-gray-800 pl-11 pr-5"
                                        />
                                    </div>
                                </div>
                                <div className="bg-[#EFB6BF]/5 rounded-[24px] p-6 border border-[#EFB6BF]/10 flex flex-col justify-center">
                                    <p className="text-[12px] font-black uppercase text-[#EFB6BF] tracking-widest mb-1">Custo Total Produção</p>
                                    <p className="text-[32px] font-black text-[#EFB6BF] tracking-tighter leading-none">{formatarMoeda(custoTotal)}</p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading || !nome || itensKit.length === 0}
                                className="w-full py-8 bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white font-black text-xl rounded-[24px] shadow-lg shadow-[#EFB6BF]/20 transition-all active:scale-[0.98] mt-4"
                            >
                                {loading ? "Salvando..." : (kitParaEditar ? "Salvar Alterações" : "Finalizar Novo Kit")}
                            </Button>
                        </form>
                    </div>
                </DialogContent>
            </Dialog>

            <AdicionarComponenteModal
                open={showSelector}
                onOpenChange={setShowSelector}
                onSelect={handleSelectComponente}
                ingredientes={produtos}
                receitas={receitas}
                kits={allKits.filter(k => k.id !== kitParaEditar?.id)}
            />
        </>
    );
}
