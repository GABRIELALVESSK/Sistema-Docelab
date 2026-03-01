import { useState, useEffect } from "react";
import { NovaTransacaoModal, TransacaoData } from "@/components/financas/NovaTransacaoModal";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Coins, Plus, Trash2, FileText, Wallet, Search, Building2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { Input } from "@/components/ui/input";

type TransacaoTipo = "receita" | "despesa";
type FilterTipo = "todas" | "receitas" | "despesas";

interface Transacao {
  id: string;
  tipo: TransacaoTipo;
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  cliente: string;
  metodo: string;
}

export default function Financas() {
  const { toast } = useToast();
  const [showNovaTransacao, setShowNovaTransacao] = useState(false);
  const [filter, setFilter] = useState<FilterTipo>("todas");
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTransacoes();
  }, []);

  const fetchTransacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransacoes(data.map(t => {
          let dateStr = t.data;
          try {
            const parsed = parseISO(t.data);
            if (!isNaN(parsed.getTime())) {
              dateStr = format(parsed, "dd/MM/yyyy");
            }
          } catch (e) { }

          return { ...t, data: dateStr };
        }));
      }
    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaTransacao = async (transacao: TransacaoData) => {
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .insert([{ ...transacao }])
        .select();

      if (error) throw error;

      if (data) {
        const newTransacao = {
          ...data[0],
          data: format(parseISO(data[0].data), "dd/MM/yyyy")
        } as Transacao;

        setTransacoes([newTransacao, ...transacoes]);
        toast({ title: "Transação registrada", description: "A transação foi salva com sucesso." });
      }
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('transacoes').delete().eq('id', id);
      if (error) throw error;
      setTransacoes(transacoes.filter(t => t.id !== id));
      toast({ title: "Transação excluída", description: "O registro foi removido." });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const filteredTransacoes = transacoes.filter((t) => {
    const matchesFilter = filter === "todas" ? true : filter === "receitas" ? t.tipo === "receita" : t.tipo === "despesa";
    const matchesSearch = t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cliente?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalReceitas = transacoes.filter((t) => t.tipo === "receita").reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoes.filter((t) => t.tipo === "despesa").reduce((sum, t) => sum + t.valor, 0);
  const lucro = totalReceitas - totalDespesas;

  const groupedTransacoes = filteredTransacoes.reduce((acc, t) => {
    if (!acc[t.categoria]) acc[t.categoria] = [];
    acc[t.categoria].push(t);
    return acc;
  }, {} as Record<string, Transacao[]>);

  return (
    <>
      <div className="p-4 h-full overflow-hidden animate-in-fade">
        <div className="bg-white w-full h-full rounded-[2.5rem] shadow-soft overflow-y-auto p-8 relative">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Cofre <span className="text-[#FDA4AF]">Financeiro</span>
              </h1>
              <p className="text-gray-400 text-[10px] font-bold tracking-widest mt-1 uppercase">
                Controle total das suas entradas e saídas
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-gray-50 transition-colors text-[11px] font-bold uppercase tracking-widest"
              >
                <FileText className="w-4 h-4" />
                RELATÓRIOS
              </Button>
              <Button
                onClick={() => setShowNovaTransacao(true)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#F87171] text-white hover:opacity-90 transition-all text-sm font-bold shadow-md shadow-pink-100"
              >
                <Plus className="w-5 h-5" />
                Nova Transação
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Receitas Card */}
            <div className="bg-gray-50/50 rounded-[2rem] p-6 flex flex-col justify-between h-40 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Receitas Totais</span>
              </div>
              <div className="text-3xl font-bold text-green-500">
                {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Despesas Card */}
            <div className="bg-gray-50/50 rounded-[2rem] p-6 flex flex-col justify-between h-40 border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-[#F87171]">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Despesas Totais</span>
              </div>
              <div className="text-3xl font-bold text-[#F87171]">
                {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Lucro Card */}
            <div className="bg-gray-50/50 rounded-[2rem] p-6 flex flex-col justify-between h-40 border border-gray-100 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-pink-100/30 rounded-full blur-xl"></div>
              <div className="flex items-start justify-between relative z-10">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-400">
                  <Coins className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lucro Líquido</span>
              </div>
              <div className="text-3xl font-bold text-[#FDA4AF] relative z-10">
                {lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 min-h-[400px]">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <div className="bg-gray-50 p-1.5 rounded-full flex gap-1">
                {[
                  { value: "todas", label: "Tudo" },
                  { value: "receitas", label: "Entradas" },
                  { value: "despesas", label: "Saídas" },
                ].map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value as FilterTipo)}
                    className={cn(
                      "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                      filter === f.value
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-400 hover:bg-gray-100"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                <Input
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-full text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#F87171]/20"
                  placeholder="Filtrar lançamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87171] mb-4"></div>
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Buscando transações...</p>
              </div>
            ) : Object.keys(groupedTransacoes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 tracking-tight">Sem movimentos</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Clique em Nova Transação</p>
              </div>
            ) : (
              Object.entries(groupedTransacoes).map(([categoria, transacoes]) => (
                <div key={categoria} className="mb-8">
                  <div className="flex justify-between items-center px-4 mb-4 text-[10px] font-bold text-gray-900 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <span>{categoria}</span>
                      <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[9px]">
                        {transacoes.length}
                      </span>
                    </div>
                    <span>
                      {transacoes.reduce((sum, t) => sum + t.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {transacoes.map((t) => (
                      <div
                        key={t.id}
                        className="group flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                            t.tipo === "receita" ? "bg-green-100 text-green-500" : "bg-red-100 text-[#F87171]"
                          )}>
                            {t.tipo === "receita" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm tracking-tight">{t.descricao}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{t.data}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-[9px] font-bold text-[#F87171] bg-[#F87171]/10 px-2 py-0.5 rounded uppercase">
                                {t.metodo}
                              </span>
                              {t.cliente && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                  <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{t.cliente}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <span className={cn(
                            "font-bold text-lg tracking-tight",
                            t.tipo === "receita" ? "text-green-500" : "text-[#F87171]"
                          )}>
                            {t.tipo === "receita" ? "+" : "-"}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(t.id)}
                            className="text-gray-300 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <NovaTransacaoModal
        open={showNovaTransacao}
        onOpenChange={setShowNovaTransacao}
        onSubmit={handleNovaTransacao}
      />
    </>
  );
}
