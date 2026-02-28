import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ShoppingCart,
  Check,
  FileText,
  Receipt,
  Trash2,
  ChevronRight,
  Search
} from "lucide-react";
import { NovoItemCompraModal, ItemCompraData } from "@/components/lista-compras/NovoItemCompraModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ItemCompra {
  id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  fornecedor: string;
  categoria: string;
  prioridade: "baixa" | "media" | "alta";
  comprado: boolean;
  tipo_estoque: "ingrediente" | "acabado";
}

export default function ListaCompras() {
  const { toast } = useToast();
  const [showNovoItem, setShowNovoItem] = useState(false);
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchItens();
  }, []);

  const fetchItens = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lista_compras')
        .select('*')
        .order('comprado', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setItens(data);
    } catch (error: any) {
      console.error('Erro ao carregar lista:', error);
      if (!error.message?.includes('does not exist')) {
        toast({
          title: "Erro ao carregar lista",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNovoItem = async (item: ItemCompraData) => {
    try {
      const { data, error } = await supabase
        .from('lista_compras')
        .insert([{
          nome: item.nome,
          quantidade: item.quantidade,
          valor_unitario: item.valorUnitario,
          valor_total: item.valorTotal,
          fornecedor: item.fornecedor,
          categoria: item.categoria,
          prioridade: item.prioridade,
          tipo_estoque: item.tipoProduto,
        }])
        .select();

      if (error) throw error;
      if (data) {
        setItens([data[0], ...itens]);
        toast({ title: "Item adicionado" });
      }
    } catch (error: any) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    }
  };

  const handleToggleComprado = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('lista_compras')
        .update({ comprado: !currentState })
        .eq('id', id);

      if (error) throw error;
      setItens(itens.map(i => i.id === id ? { ...i, comprado: !currentState } : i));
    } catch (error: any) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('lista_compras').delete().eq('id', id);
      if (error) throw error;
      setItens(itens.filter(i => i.id !== id));
      toast({ title: "Item removido" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  const handleFinalizarCompra = async () => {
    const comprados = itens.filter(i => i.comprado);
    if (comprados.length === 0) {
      toast({ title: "Nenhum item comprado para finalizar", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch current stock to see what we need to update
      const { data: currentStock, error: stockError } = await supabase
        .from('produtos')
        .select('*');

      if (stockError) throw stockError;

      for (const item of comprados) {
        const existingProduct = currentStock?.find(p =>
          p.nome.toLowerCase() === item.nome.toLowerCase()
        );

        if (existingProduct) {
          // Se for ingrediente (unidade g ou ml), e o valor unitário da lista parece um preço de EMBALAGEM (kg/L),
          // tentamos manter o valor mas o ideal é que o preco_medio seja o preço por unidade básica (g/ml).

          const { error: updateError } = await supabase
            .from('produtos')
            .update({
              quantidade: Number(existingProduct.quantidade) + Number(item.quantidade),
              preco_medio: item.valor_unitario > 0 ? item.valor_unitario : existingProduct.preco_medio,
              fornecedor: item.fornecedor || existingProduct.fornecedor
            })
            .eq('id', existingProduct.id);

          if (updateError) throw updateError;
        } else {
          // Create new product
          const category = item.tipo_estoque === "acabado" ? "Produtos Acabados" : "Ingredientes";
          // Se for ingrediente, melhor assumir Unidade (un) e o usuário ajusta no estoque para gramas/litros
          const unit = item.tipo_estoque === "acabado" ? "un" : "un";

          const { error: insertError } = await supabase
            .from('produtos')
            .insert([{
              nome: item.nome,
              categoria: category,
              quantidade: item.quantidade,
              unidade: unit,
              preco_medio: item.valor_unitario,
              fornecedor: item.fornecedor,
              minimo: 1,
              ativo: true
            }]);

          if (insertError) throw insertError;
        }

        // Delete from shopping list
        await supabase.from('lista_compras').delete().eq('id', item.id);
      }

      setItens(itens.filter(i => !i.comprado));
      toast({
        title: "Compra finalizada!",
        description: `${comprados.length} itens foram movidos para o estoque.`
      });
    } catch (error: any) {
      console.error('Erro ao finalizar compra:', error);
      toast({
        title: "Erro ao finalizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const aComprar = itens.filter(i => !i.comprado).length;
    const comprados = itens.filter(i => i.comprado).length;
    const totalPendente = itens.filter(i => !i.comprado).reduce((acc, i) => acc + (Number(i.valor_total) || 0), 0);
    const totalGeral = itens.reduce((acc, i) => acc + (Number(i.valor_total) || 0), 0);
    return { aComprar, comprados, totalPendente, totalGeral };
  }, [itens]);

  const filteredItens = useMemo(() => {
    return itens.filter(i => i.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [itens, searchTerm]);

  return (
    <>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight">Lista de Compras</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleFinalizarCompra}
              className="bg-[#F2EDE4]/60 border-none hover:bg-[#EAE4D8] text-foreground font-bold rounded-xl h-9 px-5 text-xs transition-all flex items-center gap-2 opacity-50"
            >
              <Receipt className="w-4 h-4" />
              Finalizar Compra
            </Button>
            <Button
              onClick={() => setShowNovoItem(true)}
              className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground font-bold rounded-xl h-9 px-5 text-xs shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar item
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-between min-h-[100px]">
            <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider opacity-60">A Comprar</div>
            <div className="text-2xl font-black text-foreground">{stats.aComprar}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center gap-2 text-[#4ADE80] text-[10px] font-bold uppercase tracking-wider opacity-80">
              <Check className="w-3.5 h-3.5" /> Comprados
            </div>
            <div className="text-2xl font-black text-[#4ADE80]">{stats.comprados}</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center gap-2 text-despesa text-[10px] font-bold uppercase tracking-wider opacity-70">
              <FileText className="w-3.5 h-3.5" /> Total Pendente
            </div>
            <div className="text-xl font-black text-despesa">
              R$ {stats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border/40 shadow-sm flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-wider opacity-60">
              <FileText className="w-3.5 h-3.5" /> Total Geral
            </div>
            <div className="text-xl font-black text-foreground">
              R$ {stats.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-2xl border border-border/40 p-6 shadow-sm min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-30">
              <div className="w-8 h-8 border-3 border-[#EFB6BF] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-bold text-xs">Sincronizando lista...</p>
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#FDFCFB] flex items-center justify-center mb-4 border border-border/10 shadow-sm">
                <ShoppingCart className="w-7 h-7 text-muted-foreground/60" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-1">Lista de compras vazia.</h3>
              <p className="text-xs text-muted-foreground font-medium opacity-60">Adicione os itens que você precisa comprar para sua produção.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-xl border transition-all",
                    item.comprado
                      ? "bg-gray-50/50 border-gray-100 opacity-60"
                      : "bg-[#FDFCFB]/50 border-border/20 hover:bg-white hover:shadow-md hover:scale-[1.005]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {/* Custom Checkbox */}
                    <button
                      onClick={() => handleToggleComprado(item.id, item.comprado)}
                      className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                        item.comprado
                          ? "bg-[#4ADE80] border-[#4ADE80]"
                          : "border-border/60 hover:border-[#EFB6BF]"
                      )}
                    >
                      {item.comprado && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>

                    <div>
                      <h3 className={cn(
                        "text-sm font-bold",
                        item.comprado ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {item.nome}
                      </h3>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        {item.quantidade} unidade(s) • R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {item.fornecedor && ` • ${item.fornecedor}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div className={cn(
                        "text-base font-black mb-0.5",
                        item.comprado ? "text-muted-foreground" : "text-foreground"
                      )}>
                        R$ {Number(item.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full",
                          item.prioridade === "alta"
                            ? "bg-[#FEF2F2] text-despesa"
                            : item.prioridade === "media"
                              ? "bg-[#FDF2F2]/10 text-orange-400"
                              : "bg-gray-100 text-gray-400"
                        )}>
                          Prioridade {item.prioridade}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg hover:bg-despesa-light hover:text-despesa transition-colors"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NovoItemCompraModal
        open={showNovoItem}
        onOpenChange={setShowNovoItem}
        onSubmit={handleNovoItem}
      />
    </>
  );
}
