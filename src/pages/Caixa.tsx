import { useState, useEffect } from "react";
import {
    PiggyBank,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Wallet,
    Smartphone,
    Banknote,
    Plus,
    ChevronRight,
    QrCode,
    ArrowRight,
    Search,
    Building2,
    Clock,
    ArrowUp,
    ArrowDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface Transacao {
    id: string;
    tipo: "receita" | "despesa";
    valor: number;
    metodo: string;
    descricao: string;
    data: string;
    cliente?: string;
    id_referencia?: string;
    categoria?: string;
    user_id?: string;
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
    const { user } = useAuth();
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"entradas" | "saidas">("entradas");
    const [selectedMetodo, setSelectedMetodo] = useState<string | null>(null);

    useEffect(() => {
        if (user?.id) {
            fetchTransacoes();
        }
    }, [user?.id]);

    const fetchTransacoes = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('transacoes')
                .select('*')
                .eq('user_id', user.id)
                .order('data', { ascending: false });

            if (error) throw error;
            if (data) {
                setTransacoes(data);
                // Define o primeiro método como selecionado inicialmente
                if (data.length > 0) {
                    const firstMetodo = data[0].metodo || "Outros";
                    setSelectedMetodo(firstMetodo);
                }
            }
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

    const getMetodoIcon = (metodo: string, size = "w-4 h-4") => {
        const m = (metodo || "").toLowerCase();
        if (m.includes("pix")) return <QrCode className={size} />;
        if (m.includes("cartão") || m.includes("cartao") || m.includes("débito") || m.includes("crédito")) return <CreditCard className={size} />;
        if (m.includes("dinheiro")) return <Banknote className={size} />;
        return <Wallet className={size} />;
    };

    const getMetodoColorBg = (metodo: string) => {
        const m = (metodo || "").toLowerCase();
        if (m.includes("pix")) return "bg-[#10B981]";
        if (m.includes("cartão") || m.includes("cartao")) return "bg-[#9575CD]";
        if (m.includes("dinheiro")) return "bg-[#F59E0B]";
        return "bg-gray-400";
    };

    const metodosList: MetodoDetalhado[] = Object.values(dadosPorMetodo).map(d => ({
        ...d,
        icon: getMetodoIcon(d.metodo)
    })).sort((a, b) => b.saldo - a.saldo);

    const resumoMetodos = metodosList.filter(m => activeTab === "entradas" ? m.entradas > 0 : m.saidas > 0);
    const metodoAtivo = metodosList.find(m => m.metodo === selectedMetodo) || metodosList[0];

    return (
        <div className="p-4 h-full overflow-hidden animate-in-fade">
            <div className="bg-white w-full h-full rounded-[2.5rem] shadow-soft overflow-y-auto p-8 relative">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-pink-100/50 text-[#F87171] flex items-center justify-center shadow-sm">
                            <PiggyBank className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                            Gestão de <span className="text-[#FDA4AF] font-light">Caixa</span>
                        </h1>
                    </div>
                </header>

                {/* Top Summaries */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#FEF7F8] rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow border border-[#FDA4AF]/10">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FDA4AF]/10 rounded-full blur-2xl group-hover:bg-[#FDA4AF]/20 transition-all"></div>
                        <div className="flex items-center gap-2 mb-2 relative z-10">
                            <div className="bg-white/50 p-1 rounded-md">
                                <Wallet className="w-4 h-4 text-[#FDA4AF]" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Saldo Total</span>
                        </div>
                        <div className="text-3xl font-bold text-[#F87171] relative z-10">
                            R$ {saldoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-green-50 p-1 rounded-md">
                                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Total de Entradas</span>
                        </div>
                        <div className="text-3xl font-bold text-[#10B981]">
                            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-red-50 p-1 rounded-md">
                                <TrendingDown className="w-4 h-4 text-[#EF4444]" />
                            </div>
                            <span className="text-sm font-medium text-gray-600">Total de Saídas</span>
                        </div>
                        <div className="text-3xl font-bold text-[#EF4444]">
                            R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Resumo por Método */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft">
                            <div className="flex items-center gap-2 mb-6">
                                <Wallet className="w-5 h-5 text-gray-400" />
                                <h3 className="font-bold text-lg text-gray-900">Resumo por Método</h3>
                            </div>

                            <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
                                <button
                                    onClick={() => setActiveTab("entradas")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                                        activeTab === "entradas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <ArrowUp className="w-3 h-3 text-[#10B981]" />
                                    Entradas
                                </button>
                                <button
                                    onClick={() => setActiveTab("saidas")}
                                    className={cn(
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all",
                                        activeTab === "saidas" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <ArrowDown className="w-3 h-3 text-gray-400" />
                                    Saídas
                                </button>
                            </div>

                            <div className="space-y-3">
                                {resumoMetodos.length === 0 ? (
                                    <p className="text-xs text-center text-gray-400 py-8 italic">Nenhum dado para exibir</p>
                                ) : resumoMetodos.map((item) => (
                                    <div
                                        key={item.metodo}
                                        onClick={() => setSelectedMetodo(item.metodo)}
                                        className={cn(
                                            "group cursor-pointer flex items-center justify-between p-4 rounded-xl transition-all border",
                                            selectedMetodo === item.metodo
                                                ? "bg-green-50 border-green-100"
                                                : "bg-white border-gray-100 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg text-white flex items-center justify-center shadow-sm",
                                                getMetodoColorBg(item.metodo)
                                            )}>
                                                {getMetodoIcon(item.metodo, "w-5 h-5")}
                                            </div>
                                            <span className="font-semibold text-gray-800">{item.metodo}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "font-bold",
                                                activeTab === "entradas" ? "text-[#10B981]" : "text-[#EF4444]"
                                            )}>
                                                R$ {(activeTab === "entradas" ? item.entradas : item.saidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Detailed View */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-soft h-full">
                            {metodoAtivo ? (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 pb-8 border-b border-gray-100 gap-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <PiggyBank className="w-5 h-5 text-gray-400" />
                                                <h3 className="font-bold text-lg text-gray-900">Saldo por Método de Pagamento</h3>
                                            </div>
                                            <div className="flex items-center gap-4 mt-6">
                                                <div className={cn(
                                                    "w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg",
                                                    getMetodoColorBg(metodoAtivo.metodo)
                                                )}>
                                                    {getMetodoIcon(metodoAtivo.metodo, "w-6 h-6")}
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900">{metodoAtivo.metodo}</h2>
                                                    <p className="text-sm text-gray-500">{metodoAtivo.transacoes.length} transações</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 rounded-xl p-4 min-w-[200px] border border-gray-100">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Saldo Atual</p>
                                            <p className={cn(
                                                "text-3xl font-bold",
                                                metodoAtivo.saldo >= 0 ? "text-[#10B981]" : "text-[#EF4444]"
                                            )}>
                                                R$ {metodoAtivo.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <div className="flex items-center justify-between mt-4 text-sm">
                                                <div>
                                                    <span className="block text-xs text-gray-400 mb-1">Entradas</span>
                                                    <span className="font-semibold text-[#10B981] flex items-center">
                                                        <TrendingUp className="w-3 h-3 mr-1" />
                                                        R$ {metodoAtivo.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="h-8 w-px bg-gray-200 mx-3"></div>
                                                <div>
                                                    <span className="block text-xs text-gray-400 mb-1">Saídas</span>
                                                    <span className="font-semibold text-[#EF4444] flex items-center">
                                                        <TrendingDown className="w-3 h-3 mr-1" />
                                                        R$ {metodoAtivo.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Transações Recentes</h4>
                                        <div className="space-y-3">
                                            {metodoAtivo.transacoes.slice(0, 10).map((t) => (
                                                <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors cursor-default border border-transparent hover:border-gray-200">
                                                    <div className="flex items-center gap-4">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-gray-100",
                                                            t.tipo === "receita" ? "bg-white text-[#10B981]" : "bg-white text-[#EF4444]"
                                                        )}>
                                                            {t.tipo === "receita" ? <Plus className="w-4 h-4" /> : <Plus className="w-4 h-4 rotate-45" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{t.descricao}</p>
                                                            <p className="text-xs text-gray-400">
                                                                {t.id_referencia ? `ID #${t.id_referencia.slice(0, 4)}` : 'S/ ID'} • {t.categoria || 'Geral'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            "text-sm font-bold",
                                                            t.tipo === "receita" ? "text-[#10B981]" : "text-[#EF4444]"
                                                        )}>
                                                            {t.tipo === "receita" ? "+" : "-"} R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{format(parseISO(t.data), "dd/MM")}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="pt-4 flex justify-center">
                                                <button className="text-xs font-semibold text-gray-400 hover:text-[#F87171] transition-colors flex items-center gap-1 group">
                                                    Ver todas transações
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
                                    <Wallet className="w-16 h-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-bold text-gray-700">Sem dados detalhados</h3>
                                    <p className="text-sm text-gray-400">Selecione um método à esquerda</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
