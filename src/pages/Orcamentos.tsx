import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Package, FileText, Send, Trash2, MessageCircle, Clock, CheckCircle2, MoreVertical } from "lucide-react";
import { NovoOrcamentoProntoModal } from "@/components/orcamentos/NovoOrcamentoProntoModal";
import { CriarOrcamentoModal, OrcamentoData } from "@/components/orcamentos/CriarOrcamentoModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatarMoeda } from "@/lib/precificacao-calculator";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Orcamentos() {
    const { toast } = useToast();
    const [showNovoTemplate, setShowNovoTemplate] = useState(false);
    const [showCriarOrcamento, setShowCriarOrcamento] = useState(false);

    const [orcamentos, setOrcamentos] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [orcRes, tempRes] = await Promise.all([
                supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
                supabase.from('templates_orcamento').select('*').order('created_at', { ascending: false })
            ]);

            if (orcRes.data) setOrcamentos(orcRes.data);
            if (tempRes.data) setTemplates(tempRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async (data: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('templates_orcamento').insert([{
                user_id: user?.id,
                nome_template: data.nomeTemplate,
                descricao: data.descricao,
                tipo_encomenda: data.tipoEncomenda,
                descricao_kit: data.descricaoKit,
                tema: data.tema,
                porcoes: data.porcoes,
                sabor: data.sabor,
                recheio: data.recheio,
                cobertura: data.cobertura,
                custo_total: data.custoTotal,
                tipo_lucro: data.tipoLucro,
                lucro_valor: data.lucroValor,
                tipo_desconto: data.tipoDesconto,
                desconto_valor: data.descontoValor,
                preco_final: data.precoFinal,
                observacoes: data.observacoes
            }]);

            if (error) throw error;

            toast({ title: "Template criado com sucesso!" });
            fetchData();
        } catch (error: any) {
            console.error("Error creating template:", error);
            toast({ title: "Erro ao criar template", description: error.message, variant: "destructive" });
        } finally {
            setShowNovoTemplate(false);
        }
    };

    const handleCreateOrcamento = async (data: OrcamentoData) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('orcamentos').insert([{
                user_id: user?.id,
                cliente_nome: data.clienteNome,
                cliente_endereco: data.clienteEndereco,
                cliente_telefone: data.clienteTelefone,
                cliente_email: data.clienteEmail,
                validade: data.validade,
                itens: data.itens,
                notas: data.notas,
                valor_total: data.valorTotal,
                frete_valor: data.frete,
                status: 'pendente'
            }]);

            if (error) throw error;

            toast({ title: "Orçamento criado com sucesso!" });
            fetchData();
        } catch (error: any) {
            console.error("Error creating budget:", error);
            toast({ title: "Erro ao criar orçamento", description: error.message, variant: "destructive" });
        } finally {
            setShowCriarOrcamento(false);
        }
    };

    const handleDeleteOrcamento = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este orçamento?")) return;
        try {
            const { error } = await supabase.from('orcamentos').delete().eq('id', id);
            if (error) throw error;
            toast({ title: "Orçamento excluído" });
            fetchData();
        } catch (error: any) {
            toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const { error } = await supabase.from('orcamentos').update({ status }).eq('id', id);
            if (error) throw error;
            toast({ title: `Status atualizado para ${status}` });
            fetchData();
        } catch (error: any) {
            toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
        }
    };

    const handleAprovarOrcamento = async (orc: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // 1. Create the order in 'pedidos' table
            // We map 'itens' from budget to 'itens' in orders
            // pedals table uses 'cliente', 'telefone', 'produto', 'quantidade', 'preco', 'itens'
            const firstItem = orc.itens[0] || { nome: "Personalizado", quantidade: 1, precoUnitario: orc.valor_total };
            const fotoBudget = orc.itens?.find((it: any) => it.fotoUrl)?.fotoUrl || null;

            const { error: pedidoError } = await supabase.from('pedidos').insert([{
                cliente: orc.cliente_nome,
                telefone: orc.cliente_telefone,
                produto: firstItem.nome,
                quantidade: firstItem.quantidade,
                preco: firstItem.precoUnitario,
                imagem_inspiracao: fotoBudget,
                itens: orc.itens.map((it: any) => ({
                    produto: it.nome,
                    quantidade: it.quantidade,
                    preco: it.precoUnitario
                })),
                data: orc.validade || new Date().toISOString(),
                status: 'pendente',
                notas: orc.notas
            }]);

            if (pedidoError) throw pedidoError;

            // 2. Update budget status
            const { error: orcError } = await supabase
                .from('orcamentos')
                .update({ status: 'aprovado' })
                .eq('id', orc.id);

            if (orcError) throw orcError;

            toast({
                title: "Orçamento Aprovado! 🥳",
                description: "O orçamento foi transformado em um pedido na aba de Pedidos."
            });
            fetchData();
        } catch (error: any) {
            console.error("Erro ao aprovar orçamento:", error);
            toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
        }
    };

    const sendWhatsApp = async (orc: any) => {
        let msg = `🍰 ORÇAMENTO DOCELAB\n\n`;
        msg += `👤 Cliente: ${orc.cliente_nome}\n`;
        if (orc.cliente_endereco) msg += `📍 Endereço: ${orc.cliente_endereco}\n`;
        msg += `📅 Data: ${format(new Date(orc.created_at), "dd/MM/yyyy")}\n`;
        msg += `⏳ Válido até: ${orc.validade ? format(new Date(orc.validade + 'T12:00:00'), "dd/MM/yyyy") : "N/A"}\n\n`;

        msg += `🧁 ITENS DO ORÇAMENTO\n`;

        orc.itens.forEach((item: any, i: number) => {
            msg += `${i + 1}) ${item.nome}\n`;
            msg += `   Qtd: ${item.quantidade} | Unit: ${formatarMoeda(item.precoUnitario)} | Sub: ${formatarMoeda(item.precoUnitario * item.quantidade)}\n`;
            if (item.observacao) msg += `   📝 Observação: ${item.observacao}\n`;
        });

        if (orc.frete_valor > 0) {
            msg += `🚚 Frete: ${formatarMoeda(orc.frete_valor)}\n`;
        }

        msg += `\n💰 TOTAL: ${formatarMoeda(orc.valor_total)}`;

        if (orc.notas) {
            msg += `\n\n📋 Observações:\n${orc.notas}`;
        }

        const webhookUrl = import.meta.env.VITE_WEBHOOK_WHATSAPP_URL;

        if (webhookUrl && webhookUrl.startsWith('http')) {
            try {
                await fetch(webhookUrl, {
                    method: 'POST',
                    mode: 'no-cors', // Bypassa bloqueios de CORS
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify({
                        message: msg,
                        phone: orc.cliente_telefone.replace(/\D/g, ''),
                        client: orc.cliente_nome,
                        total: orc.valor_total,
                        image: orc.itens?.find((it: any) => it.fotoUrl)?.fotoUrl || null,
                        items: orc.itens || []
                    })
                });

                // Em modo no-cors, consideramos sucesso se não houve erro de rede imediato
                toast({ title: "Enviando...", description: "O orçamento está sendo processado." });
            } catch (error: any) {
                console.error("Erro ao enviar webhook:", error);
                toast({
                    title: "Erro no Webhook",
                    description: `Erro: ${error.message}. Verifique a configuração de CORS no n8n.`,
                    variant: "destructive"
                });
            }
        } else {
            const phone = orc.cliente_telefone.replace(/\D/g, '');
            const url = `https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}?text=${encodeURIComponent(msg)}`;
            window.open(url, '_blank');
        }
    };

    return (
        <>
            <div className="p-8 pb-20 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Orçamentos Profissionais</h1>
                        <p className="text-gray-500 font-medium">Crie propostas encantadoras e envie direto pelo WhatsApp</p>
                    </div>
                    <Button
                        onClick={() => setShowCriarOrcamento(true)}
                        className="gap-2 bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black px-8 h-14 rounded-2xl shadow-lg shadow-[#EFB6BF]/20 border-none transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Novo Orçamento
                    </Button>
                </div>

                {/* Section: Orçamentos Prontos */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#EFB6BF]/10 flex items-center justify-center">
                                <Package className="w-5 h-5 text-[#EFB6BF]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-800 tracking-tight">Meus Templates</h2>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Orçamentos Rápidos</p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            variant="outline"
                            className="gap-2 border-[#EFB6BF]/20 text-[#EFB6BF] hover:bg-[#EFB6BF]/5 font-bold rounded-xl"
                            onClick={() => setShowNovoTemplate(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Novo Template
                        </Button>
                    </div>

                    {templates.length === 0 && !loading ? (
                        <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-12 text-center">
                            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <h3 className="font-bold text-gray-400 text-sm">Nenhum template criado</h3>
                            <p className="text-xs text-gray-300 mt-1 max-w-[200px] mx-auto">Salve configurações frequentes para criar orçamentos em segundos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <div key={template.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#EFB6BF]/20" />
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-black text-gray-900 leading-tight">{template.nome_template}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{template.tipo_encomenda}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-[#EFB6BF]">{formatarMoeda(template.preco_final)}</p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{template.descricao || "Sem descrição"}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                                        <Clock className="w-3 h-3" />
                                        Criado em {format(new Date(template.created_at), "dd/MM/yyyy")}
                                    </div>
                                </div>
                            ))}
                            {loading && <div className="animate-pulse bg-gray-50 h-32 rounded-[2rem]" />}
                        </div>
                    )}
                </div>

                {/* Main List Section */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-800 tracking-tight">Histórico de Orçamentos</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Enviados e Pendentes</p>
                        </div>
                    </div>

                    {orcamentos.length === 0 && !loading ? (
                        <div className="bg-white rounded-[2rem] border border-gray-100 p-16 text-center shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900">Nenhum orçamento ainda</h3>
                            <p className="text-gray-500 mt-2 mb-10 max-w-md mx-auto"> Comece a profissionalizar seu atendimento criando orçamentos detalhados com fotos para seus clientes.</p>
                            <Button
                                onClick={() => setShowCriarOrcamento(true)}
                                className="bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black px-10 h-14 rounded-2xl shadow-lg shadow-[#EFB6BF]/20 border-none transition-all hover:scale-105"
                            >
                                Criar meu primeiro orçamento
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orcamentos.map((orc) => (
                                <div key={orc.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={cn(
                                                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter",
                                                orc.status === 'aprovado' ? "bg-emerald-100 text-emerald-600" :
                                                    orc.status === 'cancelado' ? "bg-red-100 text-red-600" :
                                                        "bg-amber-100 text-amber-600"
                                            )}>
                                                {orc.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">
                                                #{orc.id.slice(0, 5)} • {format(new Date(orc.created_at), "dd MMM yyyy", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 truncate">{orc.cliente_nome}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                            {orc.cliente_telefone && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                                                    {orc.cliente_telefone}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                                <Package className="w-3.5 h-3.5 text-gray-400" />
                                                {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 md:border-l md:pl-6 border-gray-50">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Valor Total</p>
                                            <p className="text-xl font-black text-[#EFB6BF] leading-none">
                                                {formatarMoeda(orc.valor_total)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => sendWhatsApp(orc)}
                                                className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all"
                                                title="Reenviar pelo WhatsApp"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </Button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="icon" variant="ghost" className="w-11 h-11 rounded-2xl">
                                                        <MoreVertical className="w-5 h-5 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-gray-100 shadow-xl">
                                                    <DropdownMenuItem
                                                        onClick={() => handleAprovarOrcamento(orc)}
                                                        className="rounded-xl gap-2 font-bold text-emerald-600 focus:text-emerald-700"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Aprovar e Gerar Pedido
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(orc.id, 'cancelado')}
                                                        className="rounded-xl gap-2 font-bold text-red-400 focus:text-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Cancelar
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-gray-50 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteOrcamento(orc.id)}
                                                        className="rounded-xl gap-2 font-bold text-gray-400 focus:text-red-500"
                                                    >
                                                        Excluir Definitivamente
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white h-24 rounded-[2.5rem] border border-gray-100" />)}
                        </div>
                    )}
                </div>
            </div>

            <NovoOrcamentoProntoModal
                open={showNovoTemplate}
                onOpenChange={setShowNovoTemplate}
                onSubmit={handleCreateTemplate}
            />

            <CriarOrcamentoModal
                open={showCriarOrcamento}
                onOpenChange={setShowCriarOrcamento}
                onSubmit={handleCreateOrcamento}
            />
        </>
    );
}
