import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/StatCard";
import { NovoClienteModal, ClienteData } from "@/components/clientes/NovoClienteModal";
import { DetalhesClienteModal } from "@/components/clientes/DetalhesClienteModal";
import {
    Users,
    ShoppingBag,
    DollarSign,
    Cake,
    Plus,
    Search,
    UserCircle,
    Phone,
    Mail,
    Edit2,
    Trash2,
    MessageCircle,
    Eye
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

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
}

export default function Clientes() {
    const { toast } = useToast();
    const [showNovoCliente, setShowNovoCliente] = useState(false);
    const [showDetalhesCliente, setShowDetalhesCliente] = useState(false);
    const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
    const [clienteParaVisualizar, setClienteParaVisualizar] = useState<Cliente | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            setLoading(true);

            // Fetch clients, orders, and transactions in parallel
            const [
                { data: clientsData, error: clientsError },
                { data: ordersData, error: ordersError },
                { data: transactionsData, error: transactionsError }
            ] = await Promise.all([
                supabase.from('clientes').select('*').order('nome', { ascending: true }),
                supabase.from('pedidos').select('cliente'),
                supabase.from('transacoes').select('cliente, valor').eq('tipo', 'receita')
            ]);

            if (clientsError) throw clientsError;
            // Ignore order/transaction errors if tables strictly don't exist yet, but they should.
            // Logging them is enough to not break client list
            if (ordersError) console.error("Error fetching orders:", ordersError);
            if (transactionsError) console.error("Error fetching transactions:", transactionsError);

            if (clientsData) {
                const clientsWithStats = clientsData.map(client => {
                    // Match by name since that's how we're linking data currently
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
        try {
            if (clienteParaEditar) {
                // Update
                const { data, error } = await supabase
                    .from('clientes')
                    .update({
                        nome: clienteData.nome,
                        telefone: clienteData.telefone,
                        email: clienteData.email || "",
                        cpf_cnpj: clienteData.cpfCnpj || "",
                        endereco: clienteData.endereco,
                        notas: clienteData.notas
                    })
                    .eq('id', clienteParaEditar.id)
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
                // Insert
                const { data, error } = await supabase
                    .from('clientes')
                    .insert([{
                        nome: clienteData.nome,
                        telefone: clienteData.telefone,
                        email: clienteData.email || "",
                        cpf_cnpj: clienteData.cpfCnpj || "",
                        endereco: clienteData.endereco,
                        notas: clienteData.notas
                    }])
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
        } catch (error: any) {
            toast({
                title: "Erro ao salvar cliente",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteCliente = async (id: string, nome: string) => {
        try {
            const { error } = await supabase
                .from('clientes')
                .delete()
                .eq('id', id);

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

    return (
        <>
            <div className="space-y-4 animate-in-fade">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="space-y-0.5">
                        <h1 className="text-[28px] font-bold tracking-tighter text-gray-900">Clientes</h1>
                        <p className="text-[15px] font-normal text-gray-500">Gerencie sua base de clientes</p>
                    </div>
                    <Button
                        onClick={() => setShowNovoCliente(true)}
                        className="rounded-2xl bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black px-6 shadow-md shadow-[#EFB6BF]/20 h-11 border-none"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Novo Cliente
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="dashboard-card p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center mb-2">
                            <Users className="w-5 h-5 text-pink-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">Total de Clientes</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{clientes.length}</p>
                    </div>
                    <div className="dashboard-card p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center mb-2">
                            <ShoppingBag className="w-5 h-5 text-rose-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">Total de Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                    <div className="dashboard-card p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
                            <DollarSign className="w-5 h-5 text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">Receita Total</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">R$ 0,00</p>
                    </div>
                    <div className="dashboard-card p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                            <Cake className="w-5 h-5 text-amber-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400">Aniversários</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="dashboard-card p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Pesquisar por nome ou telefone..."
                            className="pl-10 h-10 border-gray-200 text-[13px] font-normal"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Clientes List */}
                <div className="dashboard-card p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-600" /> Lista de Clientes ({filteredClientes.length})
                    </h2>

                    {loading ? (
                        <div className="flex justify-center py-16">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredClientes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <UserCircle className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium text-foreground">Nenhum cliente cadastrado</h3>
                            <p className="text-sm text-muted-foreground mt-1 text-center">
                                Adicione seu primeiro cliente!<br />
                                Clique no botão "Novo Cliente" no topo da página.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[12px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                                        <th className="pb-4">Nome</th>
                                        <th className="pb-4">Telefone / WhatsApp</th>
                                        <th className="pb-4">Pedidos</th>
                                        <th className="pb-4">Total Gasto</th>
                                        <th className="pb-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredClientes.map((cliente) => (
                                        <tr key={cliente.id} className="group transition-colors hover:bg-gray-50/50">
                                            <td className="py-5 font-medium text-[15px] text-gray-800">{cliente.nome}</td>
                                            <td className="py-5">
                                                <div className="flex items-center gap-2 text-sm font-normal text-gray-500">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {cliente.telefone}
                                                </div>
                                            </td>
                                            <td className="py-5">
                                                <span className="inline-flex items-center bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-full">
                                                    {cliente.totalPedidos || 0}
                                                </span>
                                            </td>
                                            <td className="py-5 text-[15px] font-bold text-gray-800">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.totalGasto || 0)}
                                            </td>
                                            <td className="py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-lg transition-colors"
                                                        onClick={() => window.open(`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`, '_blank')}
                                                    >
                                                        <MessageCircle className="w-4 h-4 fill-current" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                        onClick={() => {
                                                            setClienteParaVisualizar(cliente);
                                                            setShowDetalhesCliente(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all"
                                                        onClick={() => {
                                                            setClienteParaEditar(cliente);
                                                            setShowNovoCliente(true);
                                                        }}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                        onClick={() => handleDeleteCliente(cliente.id, cliente.nome)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
        </>
    );
}
