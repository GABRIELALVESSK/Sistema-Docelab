import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Info, Plus, Check, X, ShoppingBag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export interface InsumoData {
    nome: string;
    categoria: string;
    unidade_compra: string;
    quantidade_por_embalagem: number;
    preco_embalagem: number;
    perdas_percentual: number;
    quantidade?: number;  // Quantidade em estoque
    fornecedor?: string;
    minimo?: number;
}

interface NovoInsumoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (insumo: InsumoData) => Promise<void>;
    insumo?: InsumoData & { id?: string };
}

const UNIDADES_COMPRA = [
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'g', label: 'Gramas (g)' },
    { value: 'L', label: 'Litros (L)' },
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'un', label: 'Unidade (un)' },
    { value: 'pacote', label: 'Pacote' },
    { value: 'rolo', label: 'Rolo' },
    { value: 'frasco', label: 'Frasco' },
    { value: 'lata', label: 'Lata' },
    { value: 'cx', label: 'Caixa' },
    { value: 'pct', label: 'Pacote (pct)' },
];

const CATEGORIAS_PADRAO = ["Ingredientes", "Embalagem", "Decoração", "Descartáveis", "Outros"];

export function NovoInsumoModal({ open, onOpenChange, onSubmit, insumo }: NovoInsumoModalProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state
    const [nome, setNome] = useState("");
    const [categoria, setCategoria] = useState("Ingredientes");
    const [unidadeCompra, setUnidadeCompra] = useState("kg");
    const [quantidadePorEmbalagem, setQuantidadePorEmbalagem] = useState(1000);
    const [precoEmbalagem, setPrecoEmbalagem] = useState(0);
    const [perdasPercentual, setPerdasPercentual] = useState(0);
    const [quantidade, setQuantidade] = useState(0);
    const [estoqueEmbalagens, setEstoqueEmbalagens] = useState(0);
    const [fornecedor, setFornecedor] = useState("");
    const [minimo, setMinimo] = useState(0);

    const [availableCategories, setAvailableCategories] = useState<string[]>(CATEGORIAS_PADRAO);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        if (open && user?.id) {
            fetchInsumoCategories();
        }
        if (insumo && open) {
            setNome(insumo.nome || "");
            setCategoria(insumo.categoria || "Ingredientes");
            setUnidadeCompra(insumo.unidade_compra || "kg");
            setQuantidadePorEmbalagem(insumo.quantidade_por_embalagem || 1000);
            setPrecoEmbalagem(insumo.preco_embalagem || 0);
            setPerdasPercentual(insumo.perdas_percentual || 0);

            const qtdTotal = insumo.quantidade || 0;
            const qtdPorEmb = insumo.quantidade_por_embalagem || 1000;
            const unit = insumo.unidade_compra || 'kg';
            const multiplier = (unit === 'kg' || unit === 'L') ? 1000 : 1;

            setQuantidade(qtdTotal);
            setEstoqueEmbalagens(qtdTotal / (qtdPorEmb * multiplier > 0 ? qtdPorEmb * multiplier : 1));

            setFornecedor(insumo.fornecedor || "");
            setMinimo(insumo.minimo || 0);
        } else if (!insumo && open) {
            setNome("");
            setCategoria("Ingredientes");
            setUnidadeCompra("kg");
            setQuantidadePorEmbalagem(1000);
            setPrecoEmbalagem(0);
            setPerdasPercentual(0);
            setQuantidade(0);
            setEstoqueEmbalagens(0);
            setFornecedor("");
            setMinimo(0);
        }
    }, [insumo, open]);

    const fetchInsumoCategories = async () => {
        if (!user?.id) return;
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('categoria')
                .eq('user_id', user.id)
                .not('categoria', 'is', null);

            if (error) throw error;

            if (data) {
                const uniqueCats = Array.from(new Set([
                    ...CATEGORIAS_PADRAO,
                    ...data.map((p: any) => p.categoria).filter(Boolean)
                ])).sort();
                setAvailableCategories(uniqueCats);
            }
        } catch (error) {
            console.error("Erro ao buscar categorias de insumos:", error);
        }
    };

    const handleSaveNewCategory = () => {
        if (!newCategoryName.trim()) {
            setIsCreatingCategory(false);
            return;
        }

        if (availableCategories.includes(newCategoryName.trim())) {
            setCategoria(newCategoryName.trim());
            setIsCreatingCategory(false);
            setNewCategoryName("");
            return;
        }

        setAvailableCategories([...availableCategories, newCategoryName.trim()]);
        setCategoria(newCategoryName.trim());
        setIsCreatingCategory(false);
        setNewCategoryName("");
    };

    const obterUnidadeBasica = (unidade: string): string => {
        if (unidade === 'kg' || unidade === 'g') return 'g';
        if (unidade === 'L' || unidade === 'ml') return 'ml';
        return 'un';
    };

    const obterMultiplicador = (unidade: string): number => {
        if (unidade === 'kg' || unidade === 'L') return 1000;
        return 1;
    };

    const calcularPrecoUnitario = (): number => {
        if (quantidadePorEmbalagem <= 0) return 0;
        const totalUnidadesBase = quantidadePorEmbalagem * obterMultiplicador(unidadeCompra);
        return precoEmbalagem / totalUnidadesBase;
    };

    useEffect(() => {
        const totalUnidadesBase = quantidadePorEmbalagem * obterMultiplicador(unidadeCompra);
        setQuantidade(estoqueEmbalagens * totalUnidadesBase);
    }, [estoqueEmbalagens, quantidadePorEmbalagem, unidadeCompra]);

    const unidadeBasica = obterUnidadeBasica(unidadeCompra);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome.trim()) return;

        try {
            setLoading(true);
            await onSubmit({
                nome,
                categoria,
                unidade_compra: unidadeCompra,
                quantidade_por_embalagem: quantidadePorEmbalagem,
                preco_embalagem: precoEmbalagem,
                perdas_percentual: perdasPercentual,
                quantidade,
                fornecedor,
                minimo,
            });
            onOpenChange(false);
        } catch (error: any) {
            console.error('Erro ao salvar insumo:', error);
        } finally {
            setLoading(false);
        }
    };

    const precoUnitario = calcularPrecoUnitario();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[32px] border-none shadow-[var(--shadow-modal)]">
                <div className="p-10 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[20px] bg-[#EFB6BF]/10 flex items-center justify-center text-[#EFB6BF] shadow-sm">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-gray-800">
                                    {insumo ? "Editar Insumo" : "Novo Insumo"}
                                </DialogTitle>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                                    {insumo ? "Atualize as informações do seu ingrediente" : "Cadastre itens de estoque para suas receitas"}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Informações Básicas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="premium-label">Nome do Insumo *</Label>
                                <Input
                                    placeholder="Ex: Chocolate em Pó"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="h-12 bg-[#FDFCFB] text-sm font-black text-gray-700 px-5"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="premium-label">Categoria</Label>
                                {isCreatingCategory ? (
                                    <div className="flex gap-2 animate-in-fade">
                                        <Input
                                            placeholder="Nova categoria..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            className="h-12 bg-[#FDFCFB] text-sm font-black text-gray-700 px-5 flex-1"
                                            autoFocus
                                        />
                                        <Button onClick={handleSaveNewCategory} type="button" className="h-12 w-12 rounded-[14px] bg-green-500 hover:bg-green-600 text-white shadow-sm shrink-0">
                                            <Check className="w-5 h-5" />
                                        </Button>
                                        <Button onClick={() => setIsCreatingCategory(false)} type="button" variant="ghost" className="h-12 w-12 rounded-[14px] text-gray-500">
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Select value={categoria} onValueChange={(v) => v === "NEW" ? setIsCreatingCategory(true) : setCategoria(v)}>
                                        <SelectTrigger className="h-12 bg-[#FDFCFB] text-sm font-black text-gray-700 px-5 rounded-[18px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                            {availableCategories.map((cat) => (
                                                <SelectItem key={cat} value={cat} className="text-xs font-bold">{cat}</SelectItem>
                                            ))}
                                            <div className="h-px bg-gray-50 my-1" />
                                            <SelectItem value="NEW" className="font-black text-[#EFB6BF] text-xs">
                                                <Plus className="w-3 h-3 mr-2 inline" /> NOVA CATEGORIA
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Compra & Precificação */}
                        <div className="space-y-6 p-8 rounded-[32px] bg-[#FDFCFB] border border-gray-100/50">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                    <Calculator className="w-4 h-4 text-[#EFB6BF]" />
                                </div>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-tight">Compra & Precificação</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="premium-label">Unidade de Compra</Label>
                                    <Select value={unidadeCompra} onValueChange={setUnidadeCompra}>
                                        <SelectTrigger className="h-12 bg-white border-gray-100 rounded-[18px] text-sm font-black text-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-xl">
                                            {UNIDADES_COMPRA.map((u) => (
                                                <SelectItem key={u.value} value={u.value} className="text-xs font-bold">{u.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="premium-label">Preço da Embalagem (R$)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={precoEmbalagem}
                                        onChange={(e) => setPrecoEmbalagem(parseFloat(e.target.value) || 0)}
                                        className="h-12 bg-white border-gray-100 text-sm font-black text-gray-700 px-5"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="premium-label">Tamanho da Embalagem</Label>
                                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-[18px] px-4 h-12">
                                        <Input
                                            type="number"
                                            value={quantidadePorEmbalagem}
                                            onChange={(e) => setQuantidadePorEmbalagem(parseFloat(e.target.value) || 0)}
                                            className="flex-1 border-none bg-transparent p-0 text-sm font-black h-auto focus-visible:ring-0 text-gray-700"
                                        />
                                        <span className="text-[13px] font-black text-[#EFB6BF] uppercase">{unidadeCompra}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="premium-label">Perdas Estimadas (%)</Label>
                                    <Input
                                        type="number"
                                        value={perdasPercentual}
                                        onChange={(e) => setPerdasPercentual(parseFloat(e.target.value) || 0)}
                                        className="h-12 bg-white border-gray-100 text-sm font-black text-gray-700 px-5"
                                    />
                                </div>
                            </div>

                            {/* Custo Unitário Result */}
                            <div className="bg-[#EFB6BF]/5 rounded-[24px] p-6 border border-[#EFB6BF]/10 flex items-center justify-between">
                                <div>
                                    <p className="text-[12px] font-black uppercase text-gray-500 tracking-widest mb-1">Custo por {unidadeBasica}</p>
                                    <p className="text-3xl font-black text-gray-800 tracking-tighter">
                                        {precoUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end opacity-40">
                                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center mb-1">
                                        <Info className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <p className="text-[12px] font-black uppercase max-w-[120px]">Base para precificação das receitas</p>
                                </div>
                            </div>
                        </div>

                        {/* Estoque e Fornecedor */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="premium-label">Qtd. em Estoque (Embalagens)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={estoqueEmbalagens}
                                        onChange={(e) => setEstoqueEmbalagens(parseFloat(e.target.value) || 0)}
                                        className="h-12 bg-[#FDFCFB] border-none text-sm font-black text-gray-700 px-5"
                                    />
                                    <p className="text-[13px] font-bold text-gray-500 ml-1">Total: <span className="text-[#EFB6BF]">{quantidade} {unidadeBasica}</span></p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="premium-label">Estoque Mínimo ({unidadeBasica})</Label>
                                    <Input
                                        type="number"
                                        value={minimo}
                                        onChange={(e) => setMinimo(parseFloat(e.target.value) || 0)}
                                        className="h-12 bg-[#FDFCFB] border-none text-sm font-black text-gray-700 px-5"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="premium-label">Fornecedor Preferencial</Label>
                                    <Input
                                        placeholder="Ex: Macro Atacado"
                                        value={fornecedor}
                                        onChange={(e) => setFornecedor(e.target.value)}
                                        className="h-12 bg-[#FDFCFB] border-none text-sm font-black text-gray-700 px-5"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading || !nome}
                            className="w-full py-8 bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white font-black text-xl rounded-[24px] shadow-lg shadow-[#EFB6BF]/20 transition-all active:scale-[0.98] mt-4"
                        >
                            {loading ? "Salvando..." : (insumo ? "Salvar Alterações" : "Cadastrar no Estoque")}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
