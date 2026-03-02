import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    FileEdit,
    Plus,
    Trash2,
    Send,
    User,
    MapPin,
    Phone,
    Mail,
    ShoppingBag,
    ImageIcon,
    MessageCircle,
    X,
    ChevronDown,
    Sparkles,
    Calendar,
    Clock,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/precificacao-calculator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface OrcamentoItemData {
    receitaId: string;
    nome: string;
    fotoUrl: string | null;
    precoUnitario: number;
    quantidade: number;
    observacao: string;
}

export interface OrcamentoData {
    clienteNome: string;
    clienteEndereco: string;
    clienteTelefone: string;
    clienteEmail: string;
    validade: string;
    itens: OrcamentoItemData[];
    notas: string;
    valorTotal: number;
    frete: number;
}

interface CriarOrcamentoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: OrcamentoData) => Promise<void> | void;
}

export function CriarOrcamentoModal({ open, onOpenChange, onSubmit }: CriarOrcamentoModalProps) {
    const { toast } = useToast();
    const { user } = useAuth();

    // Client data
    const [clienteNome, setClienteNome] = useState("");
    const [clienteEndereco, setClienteEndereco] = useState("");
    const [clienteTelefone, setClienteTelefone] = useState("");
    const [clienteEmail, setClienteEmail] = useState("");
    const [validade, setValidade] = useState(format(addDays(new Date(), 7), "yyyy-MM-dd"));
    const [notas, setNotas] = useState("");
    const [frete, setFrete] = useState(0);

    // Items
    const [itens, setItens] = useState<OrcamentoItemData[]>([]);

    // Data from DB
    const [receitas, setReceitas] = useState<{ id: string; nome: string; preco_venda?: number; foto_url?: string | null }[]>([]);
    const [clientes, setClientes] = useState<{ nome: string; telefone: string; email?: string; endereco?: string }[]>([]);
    const [showClienteDropdown, setShowClienteDropdown] = useState(false);

    // Step: 'form' or 'preview'
    const [step, setStep] = useState<"form" | "preview">("form");

    useEffect(() => {
        if (open) {
            fetchData();
            // Reset form
            setClienteNome("");
            setClienteEndereco("");
            setClienteTelefone("");
            setClienteEmail("");
            setValidade(format(addDays(new Date(), 7), "yyyy-MM-dd"));
            setNotas("");
            setFrete(0);
            setItens([]);
            setStep("form");
        }
    }, [open]);

    const fetchData = async () => {
        if (!user?.id) return;
        const [recRes, cliRes] = await Promise.all([
            supabase.from('receitas').select('id, nome, preco_venda, foto_url').eq('user_id', user.id).order('nome'),
            supabase.from('clientes').select('nome, telefone, email, endereco').eq('user_id', user.id).order('nome')
        ]);
        if (recRes.data) setReceitas(recRes.data);
        if (cliRes.data) setClientes(cliRes.data);
    };

    const handleClienteChange = (nome: string) => {
        setClienteNome(nome);
        const match = clientes.find(c => c.nome.trim().toLowerCase() === nome.trim().toLowerCase());
        if (match) {
            setClienteTelefone(match.telefone || "");
            setClienteEmail(match.email || "");
            setClienteEndereco(match.endereco || "");
        }
    };

    const addItem = () => {
        setItens([...itens, {
            receitaId: "",
            nome: "",
            fotoUrl: null,
            precoUnitario: 0,
            quantidade: 1,
            observacao: "",
        }]);
    };

    const removeItem = (index: number) => {
        setItens(itens.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof OrcamentoItemData, value: any) => {
        const newItens = [...itens];
        (newItens[index] as any)[field] = value;
        setItens(newItens);
    };

    const handleReceitaSelect = (index: number, receitaId: string) => {
        const receita = receitas.find(r => r.id === receitaId);
        if (receita) {
            const newItens = [...itens];
            newItens[index] = {
                ...newItens[index],
                receitaId: receita.id,
                nome: receita.nome,
                fotoUrl: receita.foto_url || null,
                precoUnitario: receita.preco_venda || 0,
            };
            setItens(newItens);
        }
    };

    const valorItens = itens.reduce((acc, item) => acc + (item.precoUnitario * item.quantidade), 0);
    const valorTotal = valorItens + frete;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (itens.length === 0) {
            toast({ title: "Adicione pelo menos um item", variant: "destructive" });
            return;
        }
        setStep("preview");
    };

    const handleConfirmAndSave = async () => {
        const data: OrcamentoData = {
            clienteNome,
            clienteEndereco,
            clienteTelefone,
            clienteEmail,
            validade,
            itens,
            notas,
            valorTotal,
            frete,
        };
        await onSubmit(data); // Ensures it's saved before closing or redirecting
        onOpenChange(false);
    };

    const generateWhatsAppMessage = () => {
        let msg = `🍰 ORÇAMENTO DOCELAB\n\n`;
        if (clienteNome) msg += `👤 Cliente: ${clienteNome}\n`;
        if (clienteEndereco) msg += `📍 Endereço: ${clienteEndereco}\n`;
        msg += `📅 Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}\n`;
        msg += `⏳ Válido até: ${validade ? format(new Date(validade + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}\n\n`;

        msg += `🧁 ITENS DO ORÇAMENTO\n`;

        itens.forEach((item, i) => {
            msg += `${i + 1}) ${item.nome}\n`;
            msg += `   Qtd: ${item.quantidade} | Unit: ${formatarMoeda(item.precoUnitario)} | Sub: ${formatarMoeda(item.precoUnitario * item.quantidade)}\n`;
            if (item.observacao) msg += `   📝 Observação: ${item.observacao}\n`;
        });

        if (frete > 0) {
            msg += `🚚 Frete: ${formatarMoeda(frete)}\n`;
        }

        msg += `\n💰 TOTAL: ${formatarMoeda(valorTotal)}`;

        if (notas) {
            msg += `\n\n📋 Observações:\n${notas}`;
        }

        return msg;
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSendWhatsApp = async () => {
        setIsSaving(true);
        try {
            // First save the budget
            const data: OrcamentoData = {
                clienteNome,
                clienteEndereco,
                clienteTelefone,
                clienteEmail,
                validade,
                itens,
                notas,
                valorTotal,
                frete,
            };
            await onSubmit(data);

            const msg = generateWhatsAppMessage();
            const webhookUrl = import.meta.env.VITE_WEBHOOK_WHATSAPP_URL;

            if (webhookUrl && webhookUrl.startsWith('http')) {
                try {
                    await fetch(webhookUrl, {
                        method: 'POST',
                        mode: 'no-cors', // Bypassa completamente o bloqueio de CORS
                        headers: {
                            'Content-Type': 'text/plain',
                        },
                        body: JSON.stringify({
                            message: msg,
                            phone: clienteTelefone.replace(/\D/g, ''),
                            client: clienteNome,
                            total: valorTotal,
                            image: itens.find(it => it.fotoUrl)?.fotoUrl || null,
                            items: itens
                        })
                    });

                    // Em modo no-cors o navegador não deixa ler a resposta, mas o envio é feito!
                    toast({ title: "Notificação enviada!", description: "O orçamento foi enviado para o n8n." });
                } catch (error: any) {
                    console.error("Erro no webhook:", error);
                    toast({
                        title: "Erro no Webhook",
                        description: `Erro: ${error.message}. Verifique o CORS no n8n.`,
                        variant: "destructive"
                    });
                }
            } else {
                const phone = clienteTelefone.replace(/\D/g, '');
                const url = `https://wa.me/${phone.startsWith('55') ? phone : '55' + phone}?text=${encodeURIComponent(msg)}`;
                window.open(url, '_blank');
            }

            onOpenChange(false);
        } catch (error: any) {
            console.error("Erro geral:", error);
            toast({
                title: "Erro ao processar",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Render logic
    if (step === "preview") {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-3xl border-none shadow-modal max-h-[90vh] flex flex-col bg-white dark:bg-card-dark">
                    <div className="px-8 pt-8 pb-4 flex items-start justify-between flex-shrink-0">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="material-symbols-outlined text-secondary dark:text-white text-2xl">description</span>
                                <DialogTitle className="text-2xl font-extrabold text-secondary dark:text-white tracking-tight">
                                    Pré-visualização do Orçamento
                                </DialogTitle>
                            </div>
                            <p className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
                                {format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR })}
                            </p>
                        </div>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-secondary dark:hover:text-white transition-colors p-1"
                        >
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar space-y-6 mt-4">
                        {/* Client info card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-primary text-xl">person</span>
                                <h3 className="text-lg font-bold text-secondary dark:text-white">Dados do Cliente</h3>
                            </div>
                            <div className="space-y-2">
                                {clienteNome && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{clienteNome}</span>
                                    </div>
                                )}
                                {clienteEndereco && (
                                    <div className="flex items-center gap-2 opacity-70">
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{clienteEndereco}</span>
                                    </div>
                                )}
                                {clienteTelefone && (
                                    <div className="flex items-center gap-2 opacity-70">
                                        <span className="material-symbols-outlined text-sm">call</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{clienteTelefone}</span>
                                    </div>
                                )}
                                {clienteEmail && (
                                    <div className="flex items-center gap-2 opacity-70">
                                        <span className="material-symbols-outlined text-sm">mail</span>
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{clienteEmail}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 pt-2 opacity-50">
                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        Válido até: {validateDate(validade)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Items Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary text-xl">shopping_bag</span>
                                <h3 className="text-lg font-bold text-secondary dark:text-white">Itens do Orçamento</h3>
                            </div>
                            <div className="space-y-4">
                                {itens.map((item, index) => (
                                    <div key={index} className="flex gap-4 p-4 rounded-2xl border border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30">
                                        {item.fotoUrl ? (
                                            <img src={item.fotoUrl} alt={item.nome} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-white dark:bg-gray-600 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-600">
                                                <span className="material-symbols-outlined text-gray-300 dark:text-gray-500">image</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-extrabold text-secondary dark:text-white truncate">{item.nome}</h4>
                                            <p className="text-xs font-bold text-gray-400 mt-0.5">
                                                {item.quantidade}x {formatarMoeda(item.precoUnitario)}
                                            </p>
                                            {item.observacao && (
                                                <p className="text-[10px] font-bold text-primary mt-2 flex items-center gap-1 uppercase tracking-wide">
                                                    <span className="material-symbols-outlined text-xs">notes</span>
                                                    {item.observacao}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0 flex flex-col justify-center">
                                            <p className="text-sm font-black text-primary">
                                                {formatarMoeda(item.precoUnitario * item.quantidade)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Preview */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                                <span>Subtotal dos itens</span>
                                <span className="text-secondary dark:text-white">{formatarMoeda(valorItens)}</span>
                            </div>
                            {frete > 0 && (
                                <div className="flex justify-between items-center text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">local_shipping</span>
                                        <span>Entrega / Frete</span>
                                    </div>
                                    <span>+ {formatarMoeda(frete)}</span>
                                </div>
                            )}
                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-extrabold text-secondary dark:text-white uppercase tracking-tight">Total Final</span>
                                <span className="text-2xl font-black text-primary tracking-tighter">{formatarMoeda(valorTotal)}</span>
                            </div>
                        </div>

                        {notas && (
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-[10px] font-extrabold text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">event_note</span>
                                    Observações do Orçamento
                                </p>
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400/80 leading-relaxed">{notas}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            {clienteTelefone && (
                                <Button
                                    type="button"
                                    onClick={handleSendWhatsApp}
                                    className="h-14 rounded-2xl bg-[#25D366] hover:bg-[#1fb355] text-white font-black text-sm shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined fill-1">chat</span>
                                    {isSaving ? "SALVANDO..." : "ENVIAR VIA WHATSAPP"}
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={handleConfirmAndSave}
                                disabled={isSaving}
                                className="h-14 rounded-2xl bg-secondary dark:bg-white dark:text-secondary text-white font-black text-sm shadow-lg border-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">save</span>
                                {isSaving ? "SALVANDO..." : "SALVAR ORÇAMENTO"}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setStep("form")}
                                className="md:col-span-2 h-10 rounded-xl text-xs font-bold text-gray-400 hover:text-secondary transition-colors"
                            >
                                ← VOLTAR E EDITAR CAMPOS
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden rounded-3xl border-none shadow-modal max-h-[90vh] flex flex-col bg-white dark:bg-card-dark [&>button]:hidden">
                <div className="px-8 pt-8 pb-4 flex items-start justify-between flex-shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="material-symbols-outlined text-secondary dark:text-white text-2xl">description</span>
                            <DialogTitle className="text-2xl font-extrabold text-secondary dark:text-white tracking-tight">
                                Criar Orçamento
                            </DialogTitle>
                        </div>
                        <p className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
                            {format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="text-gray-400 hover:text-secondary dark:hover:text-white transition-colors p-1"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar space-y-6 mt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client Info Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary text-xl">person</span>
                                <h3 className="text-lg font-bold text-secondary dark:text-white">Dados do Cliente</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-secondary dark:text-gray-300">Nome do Cliente</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Ex: Maria Silva"
                                            value={clienteNome}
                                            onChange={(e) => handleClienteChange(e.target.value)}
                                            onFocus={() => setShowClienteDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                                            autoComplete="off"
                                            className="w-full rounded-2xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-secondary dark:text-white px-4 py-3 focus:ring-primary focus:border-primary placeholder-gray-400 text-sm h-12"
                                        />
                                        {showClienteDropdown && clienteNome.length > 0 && (() => {
                                            const filtered = clientes.filter(c =>
                                                c.nome.toLowerCase().includes(clienteNome.toLowerCase())
                                            );
                                            if (filtered.length === 0 || (filtered.length === 1 && filtered[0].nome.toLowerCase() === clienteNome.toLowerCase())) return null;
                                            return (
                                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    {filtered.map((c, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-50 dark:border-gray-700 last:border-0 transition-colors"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setClienteNome(c.nome);
                                                                setClienteTelefone(c.telefone || "");
                                                                setClienteEmail(c.email || "");
                                                                setClienteEndereco(c.endereco || "");
                                                                setShowClienteDropdown(false);
                                                            }}
                                                        >
                                                            <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
                                                                <span className="text-xs font-black text-primary">{c.nome.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800 dark:text-white">{c.nome}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{c.telefone}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="material-symbols-outlined text-gray-400 text-sm">location_on</span>
                                        <Label className="text-sm font-bold text-secondary dark:text-gray-300">Endereço</Label>
                                    </div>
                                    <Input
                                        placeholder="Rua, número, bairro..."
                                        value={clienteEndereco}
                                        onChange={(e) => setClienteEndereco(e.target.value)}
                                        className="w-full rounded-2xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-secondary dark:text-white px-4 py-3 focus:ring-primary focus:border-primary placeholder-gray-400 text-sm h-12"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="material-symbols-outlined text-gray-400 text-sm">call</span>
                                            <Label className="text-sm font-bold text-secondary dark:text-gray-300">Telefone / WhatsApp</Label>
                                        </div>
                                        <Input
                                            placeholder="(21) 99999-0000"
                                            value={clienteTelefone}
                                            onChange={(e) => setClienteTelefone(e.target.value)}
                                            className="w-full rounded-2xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-secondary dark:text-white px-4 py-3 focus:ring-primary focus:border-primary placeholder-gray-400 text-sm h-12"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-1 mb-1">
                                            <span className="material-symbols-outlined text-gray-400 text-sm">mail</span>
                                            <Label className="text-sm font-bold text-secondary dark:text-gray-300">E-mail (opcional)</Label>
                                        </div>
                                        <Input
                                            placeholder="email@exemplo.com"
                                            value={clienteEmail}
                                            onChange={(e) => setClienteEmail(e.target.value)}
                                            className="w-full rounded-2xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-secondary dark:text-white px-4 py-3 focus:ring-primary focus:border-primary placeholder-gray-400 text-sm h-12"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-secondary dark:text-gray-300 mb-2 block">Validade do Orçamento</Label>
                                    <div className="relative w-full sm:w-1/2">
                                        <Input
                                            type="date"
                                            value={validade}
                                            onChange={(e) => setValidade(e.target.value)}
                                            className="w-full rounded-2xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-secondary dark:text-white px-4 py-3 focus:ring-primary focus:border-primary text-sm font-medium h-12 pl-10"
                                        />
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg">calendar_today</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm min-h-[300px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-xl">shopping_bag</span>
                                    <h3 className="text-lg font-bold text-secondary dark:text-white">Itens do Orçamento</h3>
                                </div>
                                <Button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-2 bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/40 text-primary px-4 py-2 rounded-xl text-xs font-black transition-colors border-none"
                                >
                                    <span className="material-symbols-outlined text-base">add</span>
                                    ADICIONAR RECEITA
                                </Button>
                            </div>

                            {itens.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center mb-4">
                                        <span className="material-symbols-outlined text-gray-300 dark:text-gray-500 text-4xl">shopping_bag</span>
                                    </div>
                                    <h4 className="text-base font-bold text-gray-400 dark:text-gray-500 mb-1">Nenhum item adicionado</h4>
                                    <p className="text-xs font-bold text-gray-300 dark:text-gray-600 mb-6 uppercase tracking-wider">Selecione as receitas desejadas</p>
                                    <Button
                                        type="button"
                                        onClick={addItem}
                                        className="bg-primary hover:bg-primary/90 text-white px-6 py-4 h-auto rounded-2xl font-black text-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-xl">add</span>
                                        ADICIONAR PRIMEIRO ITEM
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {itens.map((item, index) => (
                                        <div key={index} className="p-5 rounded-3xl bg-gray-50/50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 relative group">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>

                                            <div className="flex flex-col sm:flex-row gap-5">
                                                {/* Photo/Avatar */}
                                                {item.fotoUrl ? (
                                                    <img src={item.fotoUrl} alt={item.nome} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 shadow-sm" />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-2xl bg-white dark:bg-gray-700 flex items-center justify-center flex-shrink-0 border border-gray-100 dark:border-gray-600">
                                                        <span className="material-symbols-outlined text-gray-200 dark:text-gray-500 text-3xl">image</span>
                                                    </div>
                                                )}

                                                <div className="flex-1 space-y-4">
                                                    {/* Recipe select */}
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Produto / Receita</Label>
                                                        <Select
                                                            value={item.receitaId}
                                                            onValueChange={(val) => handleReceitaSelect(index, val)}
                                                        >
                                                            <SelectTrigger className="w-full rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 h-11 text-sm font-bold">
                                                                <SelectValue placeholder="Selecione..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl shadow-xl border-gray-100 dark:border-gray-700">
                                                                {receitas.map((r) => (
                                                                    <SelectItem key={r.id} value={r.id} className="py-3 focus:bg-pink-50 dark:focus:bg-pink-900/20 cursor-pointer">
                                                                        <div className="flex items-center gap-3">
                                                                            {r.foto_url ? (
                                                                                <img src={r.foto_url} className="w-6 h-6 rounded-lg object-cover" />
                                                                            ) : (
                                                                                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center"><span className="material-symbols-outlined text-xs">image</span></div>
                                                                            )}
                                                                            <span className="font-bold">{r.nome}</span>
                                                                            {r.preco_venda && <span className="text-[10px] font-black text-primary ml-auto">{formatarMoeda(r.preco_venda)}</span>}
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantidade</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantidade}
                                                                onChange={(e) => updateItem(index, "quantidade", parseInt(e.target.value) || 1)}
                                                                className="rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 text-sm font-bold text-center"
                                                            />
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço Sugerido</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.precoUnitario || ""}
                                                                onChange={(e) => updateItem(index, "precoUnitario", parseFloat(e.target.value) || 0)}
                                                                className="rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 h-10 text-sm font-bold text-center text-primary"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Variação / Observação</Label>
                                                        <Input
                                                            placeholder="Ex: Sem lactose, Tag personalizada..."
                                                            value={item.observacao}
                                                            onChange={(e) => updateItem(index, "observacao", e.target.value)}
                                                            className="rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 h-9 text-xs italic"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-end items-center gap-2">
                                                <span className="text-[10px] font-black text-gray-400 uppercase">SUBTOTAL DO ITEM:</span>
                                                <span className="text-lg font-black text-primary tracking-tighter">{formatarMoeda(item.precoUnitario * item.quantidade)}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Footer Totals */}
                                    <div className="space-y-4 pt-4 mt-6">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-700 shadow-soft">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0,00"
                                                        value={frete || ""}
                                                        onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                                                        className="w-28 pl-8 h-12 rounded-2xl border-gray-100 dark:border-gray-700 font-bold text-emerald-600"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 text-base">local_shipping</span>
                                                </div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taxa de Entrega</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">TOTAL DO CLIENTE</span>
                                                <span className="text-3xl font-black text-primary tracking-tighter">{formatarMoeda(valorTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-gray-400 text-xl">event_note</span>
                                <h3 className="text-base font-bold text-secondary dark:text-white">Observações Gerais</h3>
                            </div>
                            <Textarea
                                placeholder="Condições de pagamento, prazos de retirada..."
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className="w-full rounded-2xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-secondary dark:text-white px-4 py-3 focus:ring-primary focus:border-primary placeholder-gray-400 text-sm min-h-[100px]"
                            />
                        </div>

                        {/* Form Submit */}
                        <div className="flex gap-4 pt-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 h-14 rounded-2xl font-bold text-gray-400 hover:text-red-500 transition-colors"
                            >
                                CANCELAR
                            </Button>
                            <Button
                                type="submit"
                                className="flex-[2] h-14 rounded-2xl bg-secondary dark:bg-white dark:text-secondary text-white font-black text-sm shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border-none"
                            >
                                <span className="material-symbols-outlined">visibility</span>
                                PRÉ-VISUALIZAR PROPOSTA
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Complementary validation for dates
function validateDate(dateStr: string) {
    try {
        return format(new Date(dateStr + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR });
    } catch (e) {
        return "DATA INVÁLIDA";
    }
}
