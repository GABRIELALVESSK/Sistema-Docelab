import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NovoClienteModal, ClienteData } from "@/components/clientes/NovoClienteModal";
import { DetalhesClienteModal } from "@/components/clientes/DetalhesClienteModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface Cliente {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    data_aniversario: string;
    cpf_cnpj: string;
    endereco: string;
    notas: string;
    criado_em: string;
    totalPedidos?: number;
    totalGasto?: number;
    user_id?: string;
}

export default function Clientes() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [showNovoCliente, setShowNovoCliente] = useState(false);
    const [showDetalhesCliente, setShowDetalhesCliente] = useState(false);
    const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
    const [clienteParaVisualizar, setClienteParaVisualizar] = useState<Cliente | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (user?.id) {
            fetchClientes();
        }
    }, [user?.id]);

    const fetchClientes = async () => {
        if (!user?.id) return;
        try {
            setLoading(true);

            // Fetch clients, orders, and transactions in parallel, all filtered by user_id
            const [
                { data: clientsData, error: clientsError },
                { data: ordersData, error: ordersError },
                { data: transactionsData, error: transactionsError }
            ] = await Promise.all([
                supabase.from('clientes').select('*').eq('user_id', user.id).order('nome', { ascending: true }),
                supabase.from('pedidos').select('cliente').eq('user_id', user.id),
                supabase.from('transacoes').select('cliente, valor').eq('tipo', 'receita').eq('user_id', user.id)
            ]);

            if (clientsError) throw clientsError;
            if (ordersError) console.error("Error fetching orders:", ordersError);
            if (transactionsError) console.error("Error fetching transactions:", transactionsError);

            if (clientsData) {
                const clientsWithStats = clientsData.map(client => {
                    const clientOrders = ordersData?.filter((o: any) => o.cliente === client.nome) || [];
                    const clientTransactions = transactionsData?.filter((t: any) => t.cliente === client.nome) || [];

                    const totalPedidos = clientOrders.length;
                    const totalGasto = clientTransactions.reduce((acc: number, t: any) => acc + (Number(t.valor) || 0), 0);

                    return {
                        ...client,
                        totalPedidos,
                        totalGasto
                    };
                });
                setClientes(clientsWithStats);
            }
        } catch (error: any) {
            console.error('Erro ao carregar clientes:', error);
            if (!error.message?.includes('does not exist')) {
                toast({
                    title: "Erro ao carregar clientes",
                    description: error.message,
                    variant: "destructive",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCliente = async (clienteData: ClienteData) => {
        if (!user?.id) return;
        try {
            const payload = {
                nome: clienteData.nome,
                telefone: clienteData.telefone,
                email: clienteData.email || "",
                cpf_cnpj: clienteData.cpfCnpj || "",
                endereco: clienteData.endereco,
                notas: clienteData.notas,
                user_id: user.id
            };

            if (clienteParaEditar) {
                const { data, error } = await supabase
                    .from('clientes')
                    .update(payload)
                    .eq('id', clienteParaEditar.id)
                    .eq('user_id', user.id)
                    .select();

                if (error) throw error;

                if (data) {
                    setClientes(clientes.map(c => c.id === clienteParaEditar.id ? data[0] : c));
                    toast({
                        title: "Cliente atualizado!",
                        description: `${clienteData.nome} foi atualizado com sucesso.`,
                    });
                }
            } else {
                const { data, error } = await supabase
                    .from('clientes')
                    .insert([payload])
                    .select();

                if (error) throw error;

                if (data) {
                    setClientes([...clientes, data[0]]);
                    toast({
                        title: "Cliente cadastrado!",
                        description: `${clienteData.nome} foi adicionado à sua base.`,
                    });
                }
            }
            setClienteParaEditar(null);
            fetchClientes(); // Refresh stats
        } catch (error: any) {
            toast({
                title: "Erro ao salvar cliente",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteCliente = async (id: string, nome: string) => {
        if (!user?.id) return;
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setClientes(clientes.filter(c => c.id !== id));
            toast({
                title: "Cliente removido!",
                description: `${nome} foi excluído da sua base.`,
            });
        } catch (error: any) {
            toast({
                title: "Erro ao excluir cliente",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone.includes(searchTerm)
    );

    const totalPedidosGeral = clientes.reduce((acc, c) => acc + (c.totalPedidos || 0), 0);
    const receitaTotalGeral = clientes.reduce((acc, c) => acc + (c.totalGasto || 0), 0);

    return (
        <div className="w-full p-8 lg:p-10 flex flex-col h-full overflow-hidden animate-in-fade bg-[#F5F1EB] dark:bg-[#181824] relative font-sans">
            <header className="flex flex-col gap-8 mb-8 flex-shrink-0 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-[28px] font-extrabold text-[#1E1E2F] dark:text-white leading-tight tracking-tight mb-1">Clientes</h2>
                        <p className="text-[#5A5A69] dark:text-gray-400 text-[14px] font-medium italic">Gerencie sua base de clientes e acompanhe o engajamento</p>
                    </div>
                    <Button
                        onClick={() => setShowNovoCliente(true)}
                        className="bg-[#F4C7C7] hover:bg-primary text-[#1E1E2F] hover:text-white px-6 py-3 rounded-xl font-bold text-[14px] tracking-wide transition shadow-sm flex items-center gap-2 h-12 border-none active:scale-[0.98]"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Novo Cliente
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat Cards */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-soft border border-gray-50 dark:border-gray-700 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group hover:shadow-card transition-all">
                        <div className="mb-2 w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/20 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">group</span>
                        </div>
                        <p className="text-[12px] font-bold text-[#5A5A69] dark:text-gray-400 mb-1 uppercase tracking-wider">Total de Clientes</p>
                        <p className="text-[24px] font-black text-[#1E1E2F] dark:text-white tracking-tighter">{clientes.length}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-soft border border-gray-50 dark:border-gray-700 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group hover:shadow-card transition-all">
                        <div className="mb-2 w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">shopping_bag</span>
                        </div>
                        <p className="text-[12px] font-bold text-[#5A5A69] dark:text-gray-400 mb-1 uppercase tracking-wider">Total de Pedidos</p>
                        <p className="text-[24px] font-black text-[#1E1E2F] dark:text-white tracking-tighter">{totalPedidosGeral}</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-soft border border-gray-50 dark:border-gray-700 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group hover:shadow-card transition-all">
                        <div className="mb-2 w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">attach_money</span>
                        </div>
                        <p className="text-[12px] font-bold text-[#5A5A69] dark:text-gray-400 mb-1 uppercase tracking-wider">Receita Total</p>
                        <p className="text-[24px] font-black text-[#1E1E2F] dark:text-white tracking-tighter">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaTotalGeral)}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-soft border border-gray-50 dark:border-gray-700 flex flex-col items-center justify-center text-center h-32 relative overflow-hidden group hover:shadow-card transition-all">
                        <div className="mb-2 w-10 h-10 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">cake</span>
                        </div>
                        <p className="text-[12px] font-bold text-[#5A5A69] dark:text-gray-400 mb-1 uppercase tracking-wider">Aniversários</p>
                        <p className="text-[24px] font-black text-[#1E1E2F] dark:text-white tracking-tighter">0</p>
                    </div>
                </div>

                <div className="w-full">
                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 group-focus-within:text-primary transition-colors">
                            <span className="material-symbols-outlined">search</span>
                        </span>
                        <Input
                            className="w-full py-6 pl-12 pr-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-[14px] font-bold focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-400 shadow-sm transition-all outline-none h-14"
                            placeholder="Pesquisar por nome ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 pb-8">
                <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-card border border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-8">
                        <span className="material-symbols-outlined text-primary">group</span>
                        <h3 className="text-[20px] font-black text-[#1E1E2F] dark:text-white tracking-tight">Lista de Clientes ({filteredClientes.length})</h3>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F4C7C7] border-t-primary mb-4"></div>
                            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Carregando sua base...</p>
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-[2rem] flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-gray-300">person_add</span>
                            </div>
                            <h3 className="text-[16px] font-black text-[#1E1E2F] dark:text-white uppercase tracking-wide">Nenhum cliente encontrado</h3>
                            <p className="text-[13px] font-bold text-gray-400 mt-2 max-w-[250px] mx-auto">
                                Tente ajustar sua busca ou adicione um novo cliente para começar.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto min-w-full">
                            <div className="hidden md:grid grid-cols-12 gap-4 px-4 border-b border-gray-50 dark:border-gray-700 mb-6 pb-4">
                                <div className="col-span-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">NOME DO CLIENTE</div>
                                <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">CONTATO / WHATSAPP</div>
                                <div className="col-span-1 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">PEDIDOS</div>
                                <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">TOTAL GASTO</div>
                                <div className="col-span-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">AÇÕES</div>
                            </div>
                            <div className="space-y-4">
                                {filteredClientes.map((cliente) => (
                                    <div key={cliente.id} className="group flex flex-col md:grid md:grid-cols-12 gap-4 items-center p-5 rounded-3xl hover:bg-pink-50/30 dark:hover:bg-pink-900/5 transition-all duration-300 border border-transparent hover:border-pink-100 dark:hover:border-pink-900/20 shadow-sm hover:shadow-md">
                                        <div className="col-span-4 w-full md:w-auto">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-[#F4C7C7]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F4C7C7]/40 transition-colors">
                                                    <span className="text-[14px] font-black text-primary">{cliente.nome.charAt(0).toUpperCase()}</span>
                                                </div>
                                                <h4 className="text-[15px] font-extrabold text-[#1E1E2F] dark:text-white truncate">{cliente.nome}</h4>
                                            </div>
                                        </div>
                                        <div className="col-span-3 w-full md:w-auto flex items-center gap-2 text-[#5A5A69] dark:text-gray-400">
                                            <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">call</span>
                                                <span className="text-[13px] font-black tracking-tight">{cliente.telefone}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1 w-full md:w-auto flex md:justify-center">
                                            <span className="bg-secondary/5 dark:bg-white/10 px-3 py-1.5 rounded-xl text-[12px] font-black text-secondary dark:text-white">
                                                {cliente.totalPedidos || 0}
                                            </span>
                                        </div>
                                        <div className="col-span-2 w-full md:w-auto md:text-right">
                                            <span className="text-[15px] font-black text-primary tracking-tighter">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.totalGasto || 0)}
                                            </span>
                                        </div>
                                        <div className="col-span-2 w-full md:w-auto flex items-center justify-end gap-2">
                                            <button
                                                className="w-9 h-9 flex items-center justify-center text-emerald-500 hover:text-white rounded-full hover:bg-emerald-500 transition-all active:scale-95 shadow-soft border border-emerald-50 dark:border-emerald-900/20"
                                                title="WhatsApp"
                                                onClick={() => window.open(`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`, '_blank')}
                                            >
                                                <span className="material-symbols-outlined text-[18px] fill-1">chat</span>
                                            </button>
                                            <button
                                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-secondary dark:hover:bg-white dark:hover:text-secondary transition-all active:scale-95 shadow-soft border border-gray-50 dark:border-gray-700"
                                                title="Ver Detalhes"
                                                onClick={() => {
                                                    setClienteParaVisualizar(cliente);
                                                    setShowDetalhesCliente(true);
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </button>
                                            <button
                                                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-blue-500 transition-all active:scale-95 shadow-soft border border-gray-50 dark:border-gray-700"
                                                title="Editar"
                                                onClick={() => {
                                                    setClienteParaEditar(cliente);
                                                    setShowNovoCliente(true);
                                                }}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button
                                                className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white rounded-full hover:bg-red-500 transition-all active:scale-95"
                                                title="Excluir"
                                                onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <NovoClienteModal
                open={showNovoCliente}
                onOpenChange={(open) => {
                    setShowNovoCliente(open);
                    if (!open) setClienteParaEditar(null);
                }}
                onSubmit={handleSaveCliente}
                cliente={clienteParaEditar ? {
                    nome: clienteParaEditar.nome,
                    telefone: clienteParaEditar.telefone,
                    email: clienteParaEditar.email,
                    cpfCnpj: clienteParaEditar.cpf_cnpj,
                    endereco: clienteParaEditar.endereco,
                    notas: clienteParaEditar.notas
                } : undefined}
            />
            <DetalhesClienteModal
                open={showDetalhesCliente}
                onOpenChange={setShowDetalhesCliente}
                cliente={clienteParaVisualizar}
            />
        </div>
    );
}
