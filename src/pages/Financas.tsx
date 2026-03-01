import { useState, useEffect } from "react";
import { NovaTransacaoModal, TransacaoData } from "@/components/financas/NovaTransacaoModal";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Coins, Plus, Trash2, FileText, Wallet, Search } from "lucide-react";
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
      <div className="p-8 max-w-[1400px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-[28px] font-bold tracking-tighter text-gray-800">Cofre <span className="text-[#EFB6BF]">Financeiro</span></h1>
            <p className="text-[13px] font-normal text-gray-400 uppercase tracking-widest">Controle total das suas entradas e saídas</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-12 px-6 rounded-full border-gray-100 text-gray-400 font-bold text-xs uppercase tracking-widest gap-2 bg-white/50 hover:bg-white transition-all">
              <FileText className="w-4 h-4" /> Relatórios
            </Button>
            <Button
              onClick={() => setShowNovaTransacao(true)}
              className="h-12 px-8 rounded-full bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white font-black text-sm gap-2 shadow-lg shadow-[#EFB6BF]/20 transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> Nova Transação
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-[32px] p-10 border border-gray-100/50 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-green-50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Receitas Totais</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-500 tracking-tighter">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-white rounded-[32px] p-10 border border-gray-100/50 shadow-sm flex flex-col justify-between group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[18px] bg-rose-50 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-rose-400" />
                </div>
                <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Despesas Totais</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-rose-400 tracking-tighter">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>

          <div className="bg-[#EFB6BF]/5 rounded-[32px] p-10 border border-[#EFB6BF]/10 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-[18px] bg-[#EFB6BF]/10 flex items-center justify-center">
                <Coins className="w-6 h-6 text-[#EFB6BF]" />
              </div>
              <span className="text-[11px] font-black uppercase text-[#EFB6BF] tracking-widest">Lucro Líquido</span>
            </div>
            <p className="text-2xl font-bold text-[#EFB6BF] tracking-tighter">R$ {lucro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[32px] border border-gray-100/50 shadow-sm overflow-hidden p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            {/* Filter Tabs */}
            <div className="bg-gray-100/50 p-1.5 rounded-full flex gap-1">
              {[
                { value: "todas", label: "Tudo" },
                { value: "receitas", label: "Entradas" },
                { value: "despesas", label: "Saídas" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as FilterTipo)}
                  className={cn(
                    "px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all",
                    filter === f.value
                      ? "bg-white text-gray-800 shadow-sm border border-gray-100/50"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <Input
                placeholder="Filtrar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-gray-50/50 border-none rounded-full text-sm font-semibold text-gray-700 placeholder:text-gray-300 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="space-y-12">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EFB6BF] mb-4"></div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Buscando transações...</p>
              </div>
            ) : Object.keys(groupedTransacoes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-[24px] bg-gray-50 flex items-center justify-center mb-6">
                  <Wallet className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-lg font-black text-gray-700 tracking-tight">Sem movimentos por aqui</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Clique em Nova Transação para começar</p>
              </div>
            ) : (
              Object.entries(groupedTransacoes).map(([categoria, transacoes]) => (
                <div key={categoria} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">{categoria}</h3>
                      <span className="text-[10px] bg-gray-50 text-gray-400 font-bold px-2 py-0.5 rounded-full border border-gray-100">
                        {transacoes.length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gray-50 mx-6" />
                    <span className="text-sm font-black text-gray-700 tracking-tight">
                      {transacoes.reduce((sum, t) => sum + t.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {transacoes.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-5 p-5 bg-[#FDFCFB] border border-gray-50 rounded-[24px] group hover:border-[#EFB6BF]/30 transition-all hover:bg-white hover:shadow-sm"
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-[18px] flex items-center justify-center shadow-sm",
                          t.tipo === "receita" ? "bg-green-50 text-green-500" : "bg-rose-50 text-rose-400"
                        )}>
                          {t.tipo === "receita" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-black text-gray-700 truncate tracking-tight">{t.descricao}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{t.data}</span>
                            <span className="text-gray-200">•</span>
                            <span className="text-[10px] font-bold text-[#EFB6BF] uppercase tracking-widest">{t.metodo}</span>
                            {t.cliente && (
                              <>
                                <span className="text-gray-200">•</span>
                                <span className="text-[10px] font-bold text-gray-400 truncate">{t.cliente}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right mr-2">
                          <p className={cn(
                            "text-lg font-black tracking-tighter leading-none",
                            t.tipo === "receita" ? "text-green-500" : "text-rose-400"
                          )}>
                            {t.tipo === "receita" ? "+" : "-"}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>

                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-3 text-gray-200 hover:text-rose-400 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
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
