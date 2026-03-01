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
                    mode: 'no-cors',
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
        <div className="w-full p-8 lg:p-10 flex flex-col h-full overflow-hidden animate-in-fade bg-[#F5F1EB] dark:bg-background-dark relative">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10 flex-shrink-0 relative z-10">
                <div>
                    <h2 className="text-[28px] font-extrabold text-[#1E1E2F] dark:text-white leading-tight tracking-tight mb-1">Orçamentos Profissionais</h2>
                    <p className="text-[#5A5A69] dark:text-gray-400 text-[14px] font-medium">Crie propostas encantadoras e envie direto pelo WhatsApp</p>
                </div>
                <Button
                    onClick={() => setShowCriarOrcamento(true)}
                    className="bg-[#F4C7C7] hover:bg-[#F87171] text-[#1E1E2F] hover:text-white px-8 h-14 rounded-2xl font-bold text-[14px] tracking-wide transition shadow-sm flex items-center gap-2 border-none"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Novo Orçamento
                </Button>
            </header>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-[#3B82F6]">
                            <span className="material-symbols-outlined text-xl">description</span>
                        </div>
                        <div>
                            <h3 className="text-[18px] font-bold text-[#1E1E2F] dark:text-white">Histórico de Orçamentos</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ENVIADOS E PENDENTES</p>
                        </div>
                    </div>

                    {orcamentos.length === 0 && !loading ? (
                        <div className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 p-16 text-center shadow-soft">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-4xl">description</span>
                            </div>
                            <h3 className="text-[20px] font-bold text-[#1E1E2F] dark:text-white">Nenhum orçamento ainda</h3>
                            <p className="text-[#5A5A69] dark:text-gray-400 text-[14px] mt-2 mb-10 max-w-md mx-auto italic">Comece a profissionalizar seu atendimento criando orçamentos detalhados com fotos para seus clientes.</p>
                            <Button
                                onClick={() => setShowCriarOrcamento(true)}
                                className="bg-[#F4C7C7] hover:bg-[#F87171] text-[#1E1E2F] hover:text-white px-10 h-14 rounded-2xl font-bold shadow-lg transition-all"
                            >
                                Criar meu primeiro orçamento
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orcamentos.map((orc) => (
                                <div key={orc.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-soft border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow group">
                                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wider uppercase",
                                                orc.status === 'aprovado' ? "bg-emerald-50 text-emerald-600" :
                                                    orc.status === 'cancelado' ? "bg-red-50 text-red-500" :
                                                        "bg-amber-50 text-amber-500"
                                            )}>
                                                {orc.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-300">
                                                #{orc.id.slice(0, 5)} • {format(new Date(orc.created_at), "dd MMM yyyy", { locale: ptBR })}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="text-[16px] font-bold text-[#1E1E2F] dark:text-white mb-1 truncate">{orc.cliente_nome}</h4>
                                            <div className="flex items-center gap-4 text-gray-400">
                                                {orc.cliente_telefone && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">chat</span>
                                                        <span className="text-[12px] font-semibold">{orc.cliente_telefone}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                                                    <span className="text-[12px] font-semibold">{orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">VALOR TOTAL</p>
                                            <p className="text-[20px] font-extrabold text-[#1E1E2F] dark:text-white">{formatarMoeda(orc.valor_total)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => sendWhatsApp(orc)}
                                                className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:scale-105 transition shadow-sm"
                                                title="Enviar WhatsApp"
                                            >
                                                <span className="material-symbols-outlined text-[20px] fill-1">chat</span>
                                            </button>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                                        <span className="material-symbols-outlined">more_vert</span>
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 border-gray-100 dark:border-gray-700 shadow-xl dark:bg-gray-800">
                                                    <DropdownMenuItem
                                                        onClick={() => handleAprovarOrcamento(orc)}
                                                        className="rounded-xl gap-2 font-bold text-emerald-600 focus:text-emerald-700 cursor-pointer"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" /> Aprovar e Gerar Pedido
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusUpdate(orc.id, 'cancelado')}
                                                        className="rounded-xl gap-2 font-bold text-red-500 focus:text-red-600 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> Cancelar
                                                    </DropdownMenuItem>
                                                    <div className="h-px bg-gray-50 dark:bg-gray-700 my-1" />
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteOrcamento(orc.id)}
                                                        className="rounded-xl gap-2 font-bold text-gray-400 hover:text-red-500 cursor-pointer"
                                                    >
                                                        Excluir Definitivamente
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && [1, 2].map(i => <div key={i} className="animate-pulse bg-white dark:bg-gray-800 h-28 rounded-3xl shadow-soft" />)}
                        </div>
                    )}
                </section>
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
        </div>
    );
}
