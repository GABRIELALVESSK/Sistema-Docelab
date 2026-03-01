import { useState, useEffect } from "react";
import { NovaEncomendaModal, EncomendaData } from "@/components/pedidos/NovaEncomendaModal";
import { DetalhesEncomendaModal } from "@/components/pedidos/DetalhesEncomendaModal";
import { RegistrarPagamentoModal } from "@/components/pedidos/RegistrarPagamentoModal";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import { Button } from "@/components/ui/button";
import { Search, Plus, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Package, CheckCircle, Clock, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameDay,
  isToday,
  isThisWeek,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";


type ViewMode = "lista" | "calendario";

interface Pedido {
  id: string;
  cliente: string;
  telefone?: string;
  produto: string;
  quantidade: number;
  preco: number;
  itens?: { produto: string; quantidade: number; preco: number }[];
  data: Date;
  status: "pendente" | "em_producao" | "pronto" | "entregue";
  imagem_inspiracao?: string | null;
  notas?: string;
  criadoEm?: Date;
}

export default function Pedidos() {
  const { toast } = useToast();
  const [showNovaEncomenda, setShowNovaEncomenda] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [showPagamento, setShowPagamento] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // January 2026

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pendentes" | "entregues" | "cancelados">("pendentes");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPedidos();
  }, []);

  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('data', { ascending: true });

      if (error) throw error;

      if (data) {
        setPedidos(data.map(p => ({
          ...p,
          data: new Date(p.data),
          criadoEm: p.criado_em ? new Date(p.criado_em) : undefined
        })));
      }
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      if (!error.message?.includes('does not exist')) {
        toast({
          title: "Erro ao carregar pedidos",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const emptyDays = Array(startDayOfWeek).fill(null);

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getPedidosForDay = (day: Date) => {
    return pedidos.filter((p) => isSameDay(p.data, day));
  };

  // Filter & Search
  const filteredPedidos = pedidos.filter(p => {
    const matchesSearch = p.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.produto.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "pendentes") return p.status !== "entregue";
    if (activeTab === "entregues") return p.status === "entregue";
    return false; // For cancelados if implemented later
  });

  // Group pedidos by date for list view
  const pedidosGroupedByDate = filteredPedidos.reduce((acc, pedido) => {
    if (!pedido.data || isNaN(pedido.data.getTime())) return acc;

    const dateKey = format(pedido.data, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(pedido);
    return acc;
  }, {} as Record<string, Pedido[]>);

  const sortedDates = Object.keys(pedidosGroupedByDate).sort((a, b) =>
    new Date(a).getTime() - new Date(b).getTime()
  );

  const handleNovaEncomenda = async (encomenda: EncomendaData) => {
    try {
      let imageUrl = null;
      if (encomenda.imagemInspiracao instanceof File) {
        const file = encomenda.imagemInspiracao;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('pedido-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('pedido-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      } else if (typeof encomenda.imagemInspiracao === 'string') {
        imageUrl = encomenda.imagemInspiracao;
      }

      let data, error;
      const pedidoPayload = {
        cliente: encomenda.nomeCliente,
        telefone: encomenda.telefone,
        produto: encomenda.itens[0].produto,
        quantidade: encomenda.itens[0].quantidade,
        preco: encomenda.itens[0].preco,
        itens: encomenda.itens,
        data: encomenda.dataEntrega?.toISOString(),
        status: encomenda.estado,
        notas: encomenda.notas,
        imagem_inspiracao: imageUrl,
      };

      if (selectedPedido) {
        ({ data, error } = await supabase
          .from('pedidos')
          .update(pedidoPayload)
          .eq('id', selectedPedido.id)
          .select());
      } else {
        ({ data, error } = await supabase
          .from('pedidos')
          .insert([pedidoPayload])
          .select());
      }

      if (error) throw error;

      if (data) {
        const savedPedido: Pedido = {
          ...data[0],
          data: new Date(data[0].data),
          criadoEm: data[0].criado_em ? new Date(data[0].criado_em) : undefined
        };

        if (selectedPedido) {
          setPedidos(pedidos.map(p => p.id === savedPedido.id ? savedPedido : p));
          toast({ title: "Encomenda atualizada!" });
        } else {
          setPedidos([...pedidos, savedPedido]);
          toast({ title: "Encomenda registrada!" });
        }
      }
      setShowNovaEncomenda(false);
      setSelectedPedido(null);
    } catch (error: any) {
      toast({ title: "Erro ao salvar encomenda", description: error.message, variant: "destructive" });
    }
  };

  const handleViewDetails = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowDetalhes(true);
  };

  const handlePayment = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowPagamento(true);
  };

  const handleEdit = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    setShowDetalhes(false);
    setShowNovaEncomenda(true);
  };

  const handleDelete = async (pedido: Pedido) => {
    try {
      const { error } = await supabase.from('pedidos').delete().eq('id', pedido.id);
      if (error) throw error;
      setPedidos(pedidos.filter((p) => p.id !== pedido.id));
      toast({ title: "Pedido excluído" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir pedido", variant: "destructive" });
    }
  };

  const handleStatusChange = async (pedidoId: string, newStatus: Pedido["status"]) => {
    try {
      const { error } = await supabase.from('pedidos').update({ status: newStatus }).eq('id', pedidoId);
      if (error) throw error;
      setPedidos(pedidos.map((p) => p.id === pedidoId ? { ...p, status: newStatus } : p));
    } catch (error: any) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const handleRegistrarPagamento = async (pagamento: any) => {
    if (!selectedPedido) return;
    try {
      const { error } = await supabase.from('transacoes').insert([{
        tipo: 'receita',
        categoria: 'Vendas',
        descricao: `Pagamento pedido - ${selectedPedido.cliente}`,
        valor: pagamento.valor,
        data: new Date().toISOString(),
        cliente: selectedPedido.cliente,
        metodo: pagamento.formaPagamento
      }]);
      if (error) throw error;
      toast({ title: "Pagamento registrado!" });
      setShowPagamento(false);
    } catch (error: any) {
      toast({ title: "Erro ao registrar pagamento", variant: "destructive" });
    }
  };

  const pendentesCount = pedidos.filter(p => p.status !== "entregue").length;
  const entreguesCount = pedidos.filter(p => p.status === "entregue").length;

  return (
    <div className="w-full flex-1 h-full overflow-hidden flex flex-col font-sans">
      {/* Dynamic Background Panel */}
      <div className="absolute inset-y-0 right-0 w-[40%] bg-[#FDFBF7] dark:bg-[#1E1E2E] z-0 hidden lg:block"></div>

      {/* Premium Header */}
      <header className="relative z-10 w-full p-8 lg:px-10 lg:py-8 border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-card-dark/90 backdrop-blur-md sticky top-0 flex-shrink-0">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-8 w-full xl:w-auto">
            <h2 className="text-[28px] font-bold text-[#1E1E2F] dark:text-white tracking-tight">Pedidos</h2>
            <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1 gap-1 shadow-inner-soft">
              <button
                onClick={() => setViewMode("lista")}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all",
                  viewMode === "lista" ? "bg-white dark:bg-gray-700 shadow-sm text-secondary dark:text-white" : "text-gray-400 hover:text-secondary dark:hover:text-white"
                )}
              >
                <span className="material-icons-round text-sm">list</span>
                Lista
              </button>
              <button
                onClick={() => setViewMode("calendario")}
                className={cn(
                  "px-4 py-2 rounded-lg text-[12px] font-bold flex items-center gap-2 transition-all",
                  viewMode === "calendario" ? "bg-white dark:bg-gray-700 shadow-sm text-secondary dark:text-white" : "text-gray-400 hover:text-secondary dark:hover:text-white"
                )}
              >
                <span className="material-icons-round text-sm">calendar_month</span>
                Calendário
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-80">
              <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-lg">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3.5 pl-11 pr-5 text-xs font-semibold text-secondary dark:text-white placeholder-gray-300 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                placeholder="Buscar pedido, cliente..."
                type="text"
              />
            </div>
            <button
              onClick={() => { setSelectedPedido(null); setShowNovaEncomenda(true); }}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-2xl font-bold text-[10px] tracking-widest shadow-xl shadow-primary/20 flex items-center gap-2 transition-all active:scale-95 flex-shrink-0 uppercase"
            >
              <span className="material-icons-round text-lg">add</span>
              Nova Encomenda
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-6 mt-8">
          <button
            onClick={() => setActiveTab("pendentes")}
            className={cn(
              "flex items-center gap-2.5 text-xs font-bold transition-all pb-3 border-b-2",
              activeTab === "pendentes" ? "text-secondary dark:text-white border-primary" : "text-gray-300 border-transparent hover:text-gray-400"
            )}
          >
            <span className="material-icons-round text-base">schedule</span>
            Pendentes
            {pendentesCount > 0 && <span className="bg-gray-50 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[9px] ml-1">{pendentesCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab("entregues")}
            className={cn(
              "flex items-center gap-2.5 text-xs font-bold transition-all pb-3 border-b-2",
              activeTab === "entregues" ? "text-secondary dark:text-white border-primary" : "text-gray-300 border-transparent hover:text-gray-400"
            )}
          >
            <span className={cn("material-icons-round text-base", activeTab === "entregues" ? "text-green-500" : "text-gray-300")}>check_circle</span>
            Entregues
            {entreguesCount > 0 && <span className="bg-gray-50 dark:bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-[9px] ml-1">{entreguesCount}</span>}
          </button>
          <button
            className="flex items-center gap-2.5 text-xs font-bold text-gray-200 cursor-not-allowed pb-3 border-b-2 border-transparent"
          >
            <span className="material-icons-round text-base">cancel</span>
            Cancelados
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 w-full flex-1 overflow-y-auto bg-[#FDFBF7] dark:bg-[#1E1E2E] p-8 lg:p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {viewMode === "lista" ? (
            <>
              {Object.keys(pedidosGroupedByDate).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-white dark:bg-card-dark rounded-3xl flex items-center justify-center mb-6 shadow-soft border border-gray-50">
                    <span className="material-icons-round text-3xl text-gray-200">inventory_2</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">Nenhum pedido encontrado</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Personalize sua busca ou cadastre uma nova venda</p>
                </div>
              ) : (
                sortedDates.map((dateKey) => {
                  const date = parseISO(dateKey);
                  const pedidosDodia = pedidosGroupedByDate[dateKey];
                  const isCurrentWeek = isThisWeek(date, { weekStartsOn: 0 });

                  return (
                    <div key={dateKey} className="mb-12 last:mb-0">
                      <div className="flex items-center justify-between mb-6 sticky top-0 py-3 z-20 backdrop-blur-sm bg-[#FDFBF7]/90 dark:bg-[#1E1E2E]/90 -mx-4 px-4 rounded-xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-card-dark flex items-center justify-center text-primary shadow-soft border border-gray-50 dark:border-gray-800">
                            <span className="material-icons-round text-2xl">event</span>
                          </div>
                          <div>
                            <h3 className="text-base font-black text-secondary dark:text-white tracking-tight">
                              {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mt-0.5">
                              {isCurrentWeek ? "Esta semana" : format(date, "MMMM yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <span className="bg-white dark:bg-card-dark text-gray-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm uppercase tracking-widest">
                          {pedidosDodia.length} pedido{pedidosDodia.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {pedidosDodia.map((pedido) => (
                          <PedidoCard
                            key={pedido.id}
                            pedido={pedido}
                            onView={() => handleViewDetails(pedido)}
                            onPayment={() => handlePayment(pedido)}
                            onEdit={() => handleEdit(pedido)}
                            onDelete={() => handleDelete(pedido)}
                            onStatusChange={(status) => handleStatusChange(pedido.id, status)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-card-dark rounded-[2.5rem] p-8 shadow-soft border border-gray-50 dark:border-gray-800">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-[#1E1E2F] dark:text-white capitalize tracking-tighter">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <span className="material-icons-round text-gray-400">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <span className="material-icons-round text-gray-400">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-[10px] font-black text-gray-200 uppercase tracking-[0.2em] py-4 border-b border-gray-50 dark:border-gray-800">
                    {day}
                  </div>
                ))}
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[140px] p-2" />
                ))}
                {days.map((day) => {
                  const pedidosDoDia = getPedidosForDay(day);
                  const hasPedidos = pedidosDoDia.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[140px] p-3 border-b border-r border-gray-50/50 dark:border-gray-800/50 transition-colors cursor-pointer group hover:bg-gray-50 dark:hover:bg-gray-800/20",
                        hasPedidos && "bg-white dark:bg-card-dark"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-black transition-all w-8 h-8 flex items-center justify-center rounded-xl",
                        isToday(day)
                          ? "bg-primary text-white shadow-lg scale-110"
                          : "text-gray-300 group-hover:text-gray-500"
                      )}>
                        {format(day, "d")}
                      </span>
                      <div className="mt-3 space-y-1.5">
                        {pedidosDoDia.map((pedido) => (
                          <div
                            key={pedido.id}
                            onClick={(e) => { e.stopPropagation(); handleViewDetails(pedido); }}
                            className="text-[10px] bg-rose-50 dark:bg-rose-900/20 text-primary p-2 rounded-lg font-black truncate hover:shadow-sm transition-all border border-rose-100/50 dark:border-rose-900/30"
                          >
                            {pedido.cliente}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <NovaEncomendaModal
        open={showNovaEncomenda}
        onOpenChange={(open) => {
          setShowNovaEncomenda(open);
          if (!open) setSelectedPedido(null);
        }}
        onSubmit={handleNovaEncomenda}
        encomenda={selectedPedido ? {
          nomeCliente: selectedPedido.cliente,
          telefone: selectedPedido.telefone || "",
          produto: selectedPedido.produto,
          quantidade: selectedPedido.quantidade,
          preco: selectedPedido.preco,
          itens: selectedPedido.itens || [],
          dataEntrega: selectedPedido.data,
          estado: selectedPedido.status,
          notas: selectedPedido.notas,
          imagemInspiracao: selectedPedido.imagem_inspiracao
        } : undefined}
      />

      <DetalhesEncomendaModal
        open={showDetalhes}
        onOpenChange={setShowDetalhes}
        pedido={selectedPedido}
        onEdit={() => selectedPedido && handleEdit(selectedPedido)}
      />

      <RegistrarPagamentoModal
        open={showPagamento}
        onOpenChange={setShowPagamento}
        produtoNome={selectedPedido?.produto}
        onSubmit={handleRegistrarPagamento}
      />
    </div>
  );
}
