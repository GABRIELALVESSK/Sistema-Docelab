import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, ChefHat, BookOpen, ShoppingBag, Box, Calculator, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/precificacao-calculator";

interface DetalhesReceitaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receita: any | null;
}

export function DetalhesReceitaModal({ open, onOpenChange, receita }: DetalhesReceitaModalProps) {
    const [ingredientes, setIngredientes] = useState<any[]>([]);
    const [loadingIngredientes, setLoadingIngredientes] = useState(false);

    useEffect(() => {
        if (open && receita?.id) {
            fetchIngredientes();
        }
    }, [open, receita]);

    const fetchIngredientes = async () => {
        try {
            setLoadingIngredientes(true);
            const { data, error } = await supabase
                .from('receita_ingredientes')
                .select(`
                    id,
                    quantidade,
                    produtos (
                        nome,
                        unidade
                    )
                `)
                .eq('receita_id', receita.id);

            if (error) throw error;
            if (data) setIngredientes(data);
        } catch (error) {
            console.error("Erro ao buscar ingredientes:", error);
        } finally {
            setLoadingIngredientes(false);
        }
    };

    if (!receita) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <div className="p-8 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <DialogHeader className="mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black text-foreground">{receita.nome}</DialogTitle>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="bg-[#EFB6BF]/20 text-foreground text-xs font-bold px-3 py-1 rounded-full border border-[#EFB6BF]/10">
                                        {receita.categoria || "Geral"}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-sm text-[#EFB6BF] font-bold bg-[#EFB6BF]/5 px-3 py-1 rounded-full border border-[#EFB6BF]/10">
                                        <Box className="w-4 h-4" />
                                        Rendimento: {receita.rendimento_unidades || 1} {receita.unidade_rendimento || "un"}
                                    </div>
                                    {receita.preco_venda > 0 && (
                                        <div className="flex items-center gap-1.5 text-sm text-receita font-bold bg-receita/5 px-3 py-1 rounded-full border border-receita/10">
                                            <Calculator className="w-4 h-4" />
                                            Preço UN: {formatarMoeda(receita.preco_venda)}
                                        </div>
                                    )}
                                    {receita.preco_venda > 0 && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-bold bg-gray-50 px-3 py-1 rounded-full border border-border/10">
                                            <DollarSign className="w-4 h-4" />
                                            Lote: {formatarMoeda(receita.preco_venda * (receita.rendimento_unidades || 1))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {receita.foto_url && (
                        <div className="mb-8 rounded-[2rem] overflow-hidden border border-border/20 shadow-sm h-64">
                            <img
                                src={receita.foto_url}
                                alt={receita.nome}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Ingredients Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ShoppingBag className="w-5 h-5 text-[#EFB6BF]" />
                                <h3 className="font-bold text-lg text-foreground">Ingredientes</h3>
                            </div>

                            {/* Stock Ingredients */}
                            {(ingredientes.length > 0 || loadingIngredientes) && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">Do Stock</p>
                                    {loadingIngredientes ? (
                                        <div className="animate-pulse space-y-2">
                                            <div className="h-10 bg-gray-100 rounded-xl" />
                                            <div className="h-10 bg-gray-100 rounded-xl" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {ingredientes.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-3 bg-[#FDFCFB] rounded-xl border border-border/10">
                                                    <span className="text-sm font-semibold text-foreground">{item.produtos?.nome}</span>
                                                    <span className="text-sm font-black text-[#EFB6BF]">
                                                        {item.quantidade} {item.produtos?.unidade}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Text Ingredients */}
                            {receita.ingredientes_texto && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider opacity-60">Observações / Outros</p>
                                    <div className="p-4 bg-[#F2EDE4]/30 rounded-2xl text-sm text-foreground/80 leading-relaxed italic whitespace-pre-wrap">
                                        {receita.ingredientes_texto}
                                    </div>
                                </div>
                            )}

                            {!receita.ingredientes_texto && ingredientes.length === 0 && (
                                <p className="text-sm text-muted-foreground italic">Nenhum ingrediente listado.</p>
                            )}
                        </div>

                        {/* Modos de Preparo Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ChefHat className="w-5 h-5 text-[#EFB6BF]" />
                                <h3 className="font-bold text-lg text-foreground">Modo de Preparo</h3>
                            </div>

                            {receita.modo_preparo ? (
                                <div className="p-6 bg-[#FDFCFB] rounded-[2rem] border border-border/10">
                                    <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                        {receita.modo_preparo}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 border border-dashed border-border/40 rounded-[2rem] flex flex-col items-center justify-center text-center opacity-40">
                                    <BookOpen className="w-8 h-8 mb-2" />
                                    <p className="text-xs font-medium">Nenhum modo de preparo descrito.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}
