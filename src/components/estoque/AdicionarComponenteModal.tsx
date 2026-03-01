import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, ChefHat, Package, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatarMoeda } from "@/lib/precificacao-calculator";

interface Item {
    id: string;
    nome: string;
    tipo: 'ingrediente' | 'receita' | 'kit';
    categoria?: string;
    rendimento?: string;
    custo: number;
    original: any;
}

interface AdicionarComponenteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (item: Item) => void;
    ingredientes: any[];
    receitas: any[];
    kits?: any[];
}

export function AdicionarComponenteModal({ open, onOpenChange, onSelect, ingredientes, receitas, kits = [] }: AdicionarComponenteModalProps) {
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<'ingrediente' | 'receita' | 'kit'>('ingrediente');

    const filteredItems = useMemo(() => {
        const query = search.toLowerCase();

        const allItems: Item[] = [
            ...ingredientes.map(i => ({
                id: `p:${i.id}`,
                nome: i.nome,
                tipo: 'ingrediente' as const,
                categoria: i.categoria || "Ingredientes",
                rendimento: i.unidade || "un",
                custo: i.preco_medio || 0,
                original: i
            })),
            ...receitas.map(r => ({
                id: `r:${r.id}`,
                nome: r.nome,
                tipo: 'receita' as const,
                categoria: r.categoria || "Receita",
                rendimento: `${r.rendimento_unidades || 1} ${r.unidade_rendimento || "un"}`.toUpperCase(),
                custo: r.cmv_unitario || r.custo_unitario || r.preco_venda || 0,
                original: r
            })),
            ...kits.map(k => ({
                id: `k:${k.id}`,
                nome: k.nome,
                tipo: 'kit' as const,
                categoria: "Kit",
                rendimento: "1 UN",
                custo: k.preco_venda || 0,
                original: k
            }))
        ];

        return allItems.filter(item =>
            item.tipo === activeTab &&
            item.nome.toLowerCase().includes(query)
        ).sort((a, b) => a.nome.localeCompare(b.nome));
    }, [ingredientes, receitas, kits, search, activeTab]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-6 md:p-8 overflow-hidden rounded-[32px] border border-white/20 shadow-2xl bg-white flex flex-col animate-in-fade" aria-describedby={undefined}>
                <div className="flex flex-col h-full max-h-[80vh]">
                    <DialogHeader className="mb-6 flex shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-accent-pink/30 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                                <Plus className="w-5 h-5 z-10" />
                                <div className="absolute inset-0 bg-white/20" />
                            </div>
                            <div className="flex flex-col text-left">
                                <DialogTitle className="text-xl font-bold text-gray-900 leading-[1.2]">
                                    Adicionar Item
                                </DialogTitle>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                                    Composição do Produto
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Search Field */}
                    <div className="relative mb-6 shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400" />
                        <Input
                            placeholder="Pesquisar pelo nome..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-11 pr-10 h-12 bg-gray-50 border-none rounded-2xl text-[13px] font-semibold text-gray-900 placeholder:text-gray-400 transition-all focus:ring-2 focus:ring-primary/20"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-50 rounded-[18px] mb-6 shrink-0">
                        {(['ingrediente', 'receita', 'kit'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-2xl",
                                    activeTab === tab
                                        ? "bg-white text-gray-900 shadow-sm border border-gray-100/50"
                                        : "text-gray-400 hover:text-gray-700"
                                )}
                            >
                                {tab === 'ingrediente' && <ShoppingBag className={cn("w-3.5 h-3.5", activeTab === tab ? "text-primary/70" : "")} />}
                                {tab === 'receita' && <ChefHat className={cn("w-3.5 h-3.5", activeTab === tab ? "text-primary/70" : "")} />}
                                {tab === 'kit' && <Package className={cn("w-3.5 h-3.5", activeTab === tab ? "text-primary/70" : "")} />}
                                {tab === 'ingrediente' ? 'Insumos' : tab === 'receita' ? 'Receitas' : 'Kits'}
                            </button>
                        ))}
                    </div>

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                        <div className="flex flex-col gap-3 pb-8">
                            {filteredItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center animate-in-fade">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-300">
                                        <Package className="w-8 h-8" />
                                    </div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhum resultado</p>
                                </div>
                            ) : (
                                filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => onSelect(item)}
                                        className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl text-left hover:border-primary/30 hover:shadow-sm transition-all group animate-in-fade"
                                    >
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-[13px] font-bold text-gray-900 truncate">{item.nome}</h4>
                                                <span className="shrink-0 text-[8px] font-bold uppercase tracking-wider bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                                                    {item.categoria}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {item.tipo === 'receita' ? 'RENDIMENTO:' : item.tipo === 'kit' ? 'RENDIMENTO:' : 'UNIDADE:'} <span className="text-gray-500 font-bold">{item.rendimento}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 pl-4 border-l border-gray-50 ml-4 py-1">
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 text-right">Custo Base</p>
                                            <p className="text-sm font-black text-gray-900 tracking-tight">
                                                {formatarMoeda(item.custo)}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
