import { useState, useEffect } from "react";
import {
    PiggyBank,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    Smartphone,
    Banknote,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    ChevronRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface Transacao {
    id: string;
    tipo: "receita" | "despesa";
    valor: number;
    metodo: string;
    descricao: string;
    data: string;
}

interface MetodoDetalhado {
    metodo: string;
    saldo: number;
    entradas: number;
    saidas: number;
    icon: any;
    transacoes: Transacao[];
}

export default function Caixa() {
    const { toast } = useToast();
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"entradas" | "saidas">("entradas");

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
            if (data) setTransacoes(data);
        } catch (error: any) {
            console.error('Erro ao carregar caixa:', error);
            if (!error.message?.includes('does not exist')) {
                toast({
                    title: "Erro ao carregar dados do caixa",
                    description: error.message,
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const totalEntradas = transacoes
        .filter(t => t.tipo === "receita")
        .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

    const totalSaidas = transacoes
        .filter(t => t.tipo === "despesa")
        .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);

    const saldoTotal = totalEntradas - totalSaidas;

    const dadosPorMetodo = transacoes.reduce((acc, t) => {
        const metodoKey = t.metodo || "Outros";
        if (!acc[metodoKey]) {
            acc[metodoKey] = {
                metodo: metodoKey,
                saldo: 0,
                entradas: 0,
                saidas: 0,
                transacoes: []
            };
        }

        const valor = Number(t.valor) || 0;
        if (t.tipo === "receita") {
            acc[metodoKey].entradas += valor;
            acc[metodoKey].saldo += valor;
        } else {
            acc[metodoKey].saidas += valor;
            acc[metodoKey].saldo -= valor;
        }
        acc[metodoKey].transacoes.push(t);
        return acc;
    }, {} as Record<string, { metodo: string, saldo: number, entradas: number, saidas: number, transacoes: Transacao[] }>);

    const getMetodoIcon = (metodo: string) => {
        const m = (metodo || "").toLowerCase();
        if (m.includes("pix")) return <Smartphone className="w-4 h-4 text-white" />;
        if (m.includes("cartão") || m.includes("cartao") || m.includes("débito") || m.includes("crédito")) return <CreditCard className="w-4 h-4 text-white" />;
        if (m.includes("dinheiro")) return <Banknote className="w-4 h-4 text-white" />;
        return <Wallet className="w-4 h-4 text-white" />;
    };

    const getMetodoColorBg = (metodo: string) => {
        const m = (metodo || "").toLowerCase();
        if (m.includes("pix")) return "bg-[#4CAF50]";
        if (m.includes("cartão") || m.includes("cartao")) return "bg-[#9575CD]";
        if (m.includes("dinheiro")) return "bg-[#00C853]";
        if (m.includes("transferência") || m.includes("transferencia") || m.includes("bancária") || m.includes("bancaria")) return "bg-[#5C6BC0]";
        return "bg-gray-400";
    };

    const metodosList: MetodoDetalhado[] = Object.values(dadosPorMetodo).map(d => ({
        ...d,
        icon: getMetodoIcon(d.metodo)
    })).sort((a, b) => b.saldo - a.saldo);

    const resumoMetodos = metodosList.filter(m => activeTab === "entradas" ? m.entradas > 0 : m.saidas > 0);

    return (
        <>
            <div className="p-8 max-w-[1280px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="w-5 h-5 text-[#EFB6BF]" />
                    <h1 className="text-xl font-bold text-foreground">Gestão de Caixa</h1>
                </div>

                {/* Top Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#FEF7F8] rounded-3xl p-6 border border-[#EFB6BF]/10 shadow-sm">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs font-semibold">
                            <PiggyBank className="w-3.5 h-3.5 text-[#EFB6BF]/60" /> Saldo Total
                        </div>
                        <div className="text-2xl font-black text-[#EFB6BF]">
                            R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-border/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs font-semibold">
                            <TrendingUp className="w-3.5 h-3.5 text-receita/60" /> Total de Entradas
                        </div>
                        <div className="text-2xl font-bold text-receita">
                            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-border/40 shadow-sm">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground text-xs font-semibold">
                            <TrendingDown className="w-3.5 h-3.5 text-despesa/60" /> Total de Saídas
                        </div>
                        <div className="text-2xl font-bold text-despesa">
                            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[380px,1fr] gap-8 items-start">
                    {/* Resumo por Método Sidebar */}
                    <div className="bg-white rounded-[2rem] border border-border/40 p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <Wallet className="w-4 h-4 text-muted-foreground/60" />
                            <h2 className="text-md font-bold text-foreground">Resumo por Método</h2>
                        </div>

                        <div className="flex p-1 bg-[#F2EDE4] rounded-xl mb-6">
                            <button
                                onClick={() => setActiveTab("entradas")}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                                    activeTab === "entradas" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <TrendingUp className="w-3 h-3" /> Entradas
                            </button>
                            <button
                                onClick={() => setActiveTab("saidas")}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all",
                                    activeTab === "saidas" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                                )}
                            >
                                <TrendingDown className="w-3 h-3" /> Saídas
                            </button>
                        </div>

                        <div className="space-y-2">
                            {resumoMetodos.length === 0 ? (
                                <p className="text-xs text-center text-muted-foreground py-4 italic">Nenhum dado para exibir</p>
                            ) : resumoMetodos.map((item) => (
                                <div key={item.metodo} className={cn(
                                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                                    activeTab === "entradas" ? "bg-[#F8FDF9] border-receita/10" : "bg-[#FEF7F8] border-despesa/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-sm", getMetodoColorBg(item.metodo))}>
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-foreground text-xs">{item.metodo}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("font-bold text-xs", activeTab === "entradas" ? "text-receita" : "text-despesa")}>
                                            R$ {(activeTab === "entradas" ? item.entradas : item.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Cards Section */}
                    <div className="bg-white rounded-[2rem] border border-border/40 p-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-8">
                            <PiggyBank className="w-4 h-4 text-muted-foreground/40" />
                            <h2 className="text-lg font-bold text-foreground">Saldo por Método de Pagamento</h2>
                        </div>

                        <div className="space-y-6">
                            {metodosList.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <PiggyBank className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-sm font-medium">As transações aparecerão aqui agrupadas por método.</p>
                                </div>
                            ) : metodosList.map((item) => (
                                <div key={item.metodo} className="bg-[#FDFCFB]/50 rounded-[2rem] border border-border/20 overflow-hidden">
                                    {/* Card Header */}
                                    <div className="p-6 flex items-start justify-between bg-white/40 border-b border-border/10">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg", getMetodoColorBg(item.metodo))}>
                                                {item.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-md font-bold text-foreground">{item.metodo}</h3>
                                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight opacity-70">
                                                    {item.transacoes.length} transação{item.transacoes.length !== 1 ? 'ões' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("text-xl font-bold", item.saldo >= 0 ? "text-receita" : "text-despesa")}>
                                                R$ {item.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Saldo atual</p>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-4 mb-6 border-b border-border/10 pb-6">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Entradas</p>
                                                <div className="flex items-center gap-2 text-receita font-bold text-md">
                                                    <TrendingUp className="w-4 h-4 text-receita/40" />
                                                    R$ {item.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                            <div className="text-right space-y-0.5">
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Saídas</p>
                                                <div className="flex items-center gap-2 text-despesa font-bold text-md justify-end">
                                                    <TrendingDown className="w-4 h-4 text-despesa/40" />
                                                    R$ {item.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nested Recent List */}
                                        <div className="space-y-3">
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 mb-2">Transações recentes</p>
                                            {item.transacoes.slice(0, 3).map((t) => (
                                                <div key={t.id} className="flex items-center justify-between text-xs group">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded-full flex items-center justify-center shadow-sm",
                                                            t.tipo === "receita" ? "bg-receita-light" : "bg-despesa-light"
                                                        )}>
                                                            {t.tipo === "receita" ? <Plus className="w-3 h-3 text-receita" /> : <Plus className="w-3 h-3 text-despesa rotate-45" />}
                                                        </div>
                                                        <span className="font-semibold text-foreground/80">{t.descricao || 'Venda'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className={cn("font-bold", t.tipo === "receita" ? "text-receita" : "text-despesa")}>
                                                            {t.tipo === "receita" ? "+" : "-"} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground/40 w-10 text-right">
                                                            {t.data ? format(parseISO(t.data), "dd/MM") : ""}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
