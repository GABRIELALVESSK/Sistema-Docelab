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
  Search,
  CheckCircle,
  Clock
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

      const { data: currentStock, error: stockError } = await supabase
        .from('produtos')
        .select('*');

      if (stockError) throw stockError;

      for (const item of comprados) {
        const existingProduct = currentStock?.find(p =>
          p.nome.toLowerCase() === item.nome.toLowerCase()
        );

        if (existingProduct) {
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
          const category = item.tipo_estoque === "acabado" ? "Produtos Acabados" : "Ingredientes";
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
    <div className="p-4 h-full overflow-hidden animate-in-fade">
      <div className="bg-white dark:bg-card-dark w-full h-full rounded-[2.5rem] shadow-soft overflow-y-auto p-8 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Lista de Compras</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleFinalizarCompra}
              className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar Compra
            </Button>
            <Button
              onClick={() => setShowNovoItem(true)}
              className="bg-[#FF8A96] hover:bg-red-400 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md shadow-red-200 dark:shadow-none flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Adicionar Item
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              A Comprar
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats.aComprar}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#2ECC71] uppercase tracking-wide">
              <Check className="w-4 h-4" /> Comprados
            </div>
            <div className="text-3xl font-bold text-[#2ECC71]">{stats.comprados}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-[#FF5C5C] uppercase tracking-wide">
              <Receipt className="w-4 h-4" /> Total Pendente
            </div>
            <div className="text-3xl font-bold text-[#FF5C5C]">
              R$ {stats.totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
              <FileText className="w-4 h-4" /> Total Geral
            </div>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">
              R$ {stats.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm min-h-[450px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <div className="w-10 h-10 border-4 border-[#FF8A96] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-bold text-sm text-gray-400 uppercase tracking-widest">Sincronizando lista...</p>
            </div>
          ) : filteredItens.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl h-[400px] flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-2xl shadow-sm flex items-center justify-center mb-6">
                <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Lista de compras vazia.</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                Adicione os itens que você precisa comprar para sua produção.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItens.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-center justify-between p-5 rounded-2xl border transition-all",
                    item.comprado
                      ? "bg-gray-50/50 border-gray-100 opacity-60"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleToggleComprado(item.id, item.comprado)}
                      className={cn(
                        "w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all shadow-sm",
                        item.comprado
                          ? "bg-[#2ECC71] border-[#2ECC71]"
                          : "border-gray-200 hover:border-[#FF8A96]"
                      )}
                    >
                      {item.comprado && <Check className="w-4 h-4 text-white" />}
                    </button>
                    <div>
                      <h4 className={cn(
                        "font-bold text-gray-800 dark:text-white text-base tracking-tight",
                        item.comprado && "line-through opacity-50"
                      )}>
                        {item.nome}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-medium text-gray-400">
                          {item.quantidade} un • R$ {item.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        {item.fornecedor && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="text-xs font-medium text-gray-400">{item.fornecedor}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black tracking-tight",
                        item.comprado ? "text-gray-400" : "text-gray-900 dark:text-white"
                      )}>
                        R$ {Number(item.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-lg",
                        item.prioridade === "alta" ? "bg-red-50 text-red-400" :
                          item.prioridade === "media" ? "bg-orange-50 text-orange-400" :
                            "bg-green-50 text-green-400"
                      )}>
                        {item.prioridade}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-10 w-10 rounded-xl text-gray-300 hover:text-[#FF5C5C] hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
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
    </div>
  );
}
