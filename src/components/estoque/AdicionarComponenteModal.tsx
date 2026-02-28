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
                categoria: i.categoria || "Estoque",
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
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden rounded-[40px] border-none shadow-[var(--shadow-modal)] bg-white max-h-[90vh] flex flex-col">
                <div className="p-8 pb-4">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-[20px] bg-[#EFB6BF]/10 flex items-center justify-center shadow-inner">
                                    <Plus className="w-6 h-6 text-[#EFB6BF]" />
                                </div>
                                <div className="space-y-0.5">
                                    <DialogTitle className="text-2xl font-black tracking-tighter text-gray-800">
                                        Adicionar Item
                                    </DialogTitle>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                                        Composição do Produto
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Search Field */}
                    <div className="relative mb-6">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                        <Input
                            placeholder="Pesquisar pelo nome..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-14 h-14 bg-gray-50/50 border-none rounded-[22px] text-base font-bold text-gray-700 placeholder:text-gray-300 transition-all focus:bg-white focus:shadow-md"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-gray-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1.5 bg-gray-50/80 rounded-[24px] mb-6">
                        {(['ingrediente', 'receita', 'kit'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-black uppercase tracking-widest transition-all rounded-[18px]",
                                    activeTab === tab
                                        ? "bg-white text-gray-800 shadow-sm border border-gray-100"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                {tab === 'ingrediente' && <ShoppingBag className={cn("w-4 h-4", activeTab === tab ? "text-[#EFB6BF]" : "text-gray-300")} />}
                                {tab === 'receita' && <ChefHat className={cn("w-4 h-4", activeTab === tab ? "text-[#EFB6BF]" : "text-gray-300")} />}
                                {tab === 'kit' && <Package className={cn("w-4 h-4", activeTab === tab ? "text-[#EFB6BF]" : "text-gray-300")} />}
                                {tab === 'ingrediente' ? 'Insumos' : tab === 'receita' ? 'Receitas' : 'Kits'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-hidden px-8 pb-8">
                    <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
                        {filteredItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in-fade">
                                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-gray-200" />
                                </div>
                                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nenhum resultado</p>
                            </div>
                        ) : (
                            filteredItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSelect(item)}
                                    className="w-full flex items-center justify-between p-5 bg-[#FDFCFB] border border-gray-50/50 rounded-[28px] text-left hover:border-[#EFB6BF]/40 hover:bg-[#EFB6BF]/5 transition-all group active:scale-[0.98] animate-in-fade"
                                >
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-[15px] font-black text-gray-700 truncate tracking-tight">{item.nome}</h4>
                                            <span className="shrink-0 text-[8px] font-black uppercase bg-white border border-gray-100 text-gray-400 px-2 py-0.5 rounded-full shadow-sm">
                                                {item.categoria}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                {item.tipo === 'receita' ? 'Rendimento:' : item.tipo === 'kit' ? 'Rendimento:' : 'Unidade:'} <span className="text-gray-500 font-black">{item.rendimento}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 pl-4 border-l border-gray-100 ml-4">
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1 text-right">Custo Base</p>
                                        <p className="text-[16px] font-black text-gray-800 tracking-tighter">
                                            {formatarMoeda(item.custo)}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
