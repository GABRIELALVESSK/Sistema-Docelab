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
      <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in-fade">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFB6BF]/20 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                <Wallet className="w-6 h-6" />
                <div className="absolute inset-0 bg-white/10" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  Cofre <span className="text-primary">Financeiro</span>
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Controle total das suas entradas e saídas
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-12 px-6 rounded-2xl border-gray-100/50 text-gray-400 font-bold text-xs uppercase tracking-widest gap-2 bg-white/50 hover:bg-white transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" /> Relatórios
            </Button>
            <Button
              onClick={() => setShowNovaTransacao(true)}
              className="h-12 px-8 rounded-full bg-gray-900 hover:bg-black text-white font-black text-sm gap-2 shadow-lg shadow-gray-200 transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> Nova Transação
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Receitas Totais */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100/60 shadow-sm flex flex-col justify-between h-44 group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50/50 rounded-full blur-2xl group-hover:bg-green-100/50 transition-colors" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Receitas Totais</span>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-green-500 tracking-tighter">
                {totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          {/* Despesas Totais */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100/60 shadow-sm flex flex-col justify-between h-44 group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl group-hover:bg-rose-100/50 transition-colors" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-rose-400" />
              </div>
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Despesas Totais</span>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-rose-400 tracking-tighter">
                {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>

          {/* Lucro Líquido */}
          <div className="bg-white rounded-[32px] p-8 border border-gray-100/60 shadow-sm flex flex-col justify-between h-44 group hover:shadow-md transition-all relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50/50 rounded-full blur-2xl group-hover:bg-amber-100/50 transition-colors" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Coins className="w-6 h-6 text-amber-500" />
              </div>
              <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Lucro Líquido</span>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black text-primary tracking-tighter">
                {lucro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-[32px] border border-gray-100/60 shadow-sm overflow-hidden p-8 min-h-[500px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            {/* Filter Tabs */}
            <div className="bg-gray-50/80 p-1 rounded-2xl flex flex-wrap gap-1 border border-gray-100/30">
              {[
                { value: "todas", label: "Tudo" },
                { value: "receitas", label: "Entradas" },
                { value: "despesas", label: "Saídas" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as FilterTipo)}
                  className={cn(
                    "px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    filter === f.value
                      ? "bg-white text-gray-900 shadow-sm border border-gray-100 ring-1 ring-black/5"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input
                placeholder="Filtrar lançamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50/50 border-none h-11 pl-12 rounded-2xl text-[14px] font-semibold text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-primary/20 transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-10">
            {loading ? (
              <div className="py-32 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Buscando transações...</p>
              </div>
            ) : Object.keys(groupedTransacoes).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                <div className="w-20 h-20 rounded-[32px] bg-gray-50 flex items-center justify-center mb-6">
                  <Wallet className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-black text-gray-700 tracking-tight">Sem movimentos por aqui</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Clique em Nova Transação para começar</p>
              </div>
            ) : (
              Object.entries(groupedTransacoes).map(([categoria, transacoes]) => (
                <div key={categoria} className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-gray-400" />
                      </div>
                      <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest">{categoria}</h3>
                      <span className="text-[10px] bg-gray-50 text-gray-400 font-bold px-2 py-0.5 rounded-lg border border-gray-100">
                        {transacoes.length}
                      </span>
                    </div>
                    <div className="h-px flex-1 bg-gray-50 mx-6" />
                    <span className="text-[15px] font-black text-gray-900 tracking-tight">
                      {transacoes.reduce((sum, t) => sum + t.valor, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {transacoes.map((t) => (
                      <div
                        key={t.id}
                        className="group flex items-center justify-between p-5 rounded-[28px] bg-gray-50/40 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-5">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden",
                            t.tipo === "receita" ? "bg-green-50 text-green-500" : "bg-rose-50 text-rose-400"
                          )}>
                            {t.tipo === "receita" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            <div className="absolute inset-0 bg-white/20" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 tracking-tight text-[15px]">{t.descricao}</h4>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-300" />
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.data}</span>
                              </div>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-lg">
                                <span className="text-[10px] font-black text-primary uppercase tracking-wider">{t.metodo}</span>
                              </div>
                              {t.cliente && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-gray-200" />
                                  <div className="flex items-center gap-1.5">
                                    <Search className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{t.cliente}</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className={cn(
                              "text-xl font-black tracking-tight",
                              t.tipo === "receita" ? "text-green-500" : "text-rose-400"
                            )}>
                              {t.tipo === "receita" ? "+" : "-"}{t.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(t.id)}
                              className="h-10 w-10 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </div>
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
