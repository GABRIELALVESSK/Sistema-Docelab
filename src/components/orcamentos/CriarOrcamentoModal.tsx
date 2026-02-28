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
} from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/precificacao-calculator";
import { useToast } from "@/hooks/use-toast";

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
        const [recRes, cliRes] = await Promise.all([
            supabase.from('receitas').select('id, nome, preco_venda, foto_url').order('nome'),
            supabase.from('clientes').select('nome, telefone, email, endereco').order('nome')
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

    // Preview step
    if (step === "preview") {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl max-h-[95vh] flex flex-col">
                    <div className="p-8 bg-white overflow-y-auto custom-scrollbar">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-5 h-5 text-[#EFB6BF]" />
                                <DialogTitle className="text-xl font-black text-gray-900">
                                    Pré-visualização do Orçamento
                                </DialogTitle>
                            </div>
                        </DialogHeader>

                        {/* Client info */}
                        <div className="p-5 rounded-2xl bg-[#FDFCFB] border border-border/30 mb-6 space-y-1">
                            {clienteNome && <p className="text-sm font-bold text-gray-800">👤 {clienteNome}</p>}
                            {clienteEndereco && <p className="text-xs text-gray-500">📍 {clienteEndereco}</p>}
                            {clienteTelefone && <p className="text-xs text-gray-500">📱 {clienteTelefone}</p>}
                            {clienteEmail && <p className="text-xs text-gray-500">✉️ {clienteEmail}</p>}
                            <p className="text-[10px] text-gray-400 pt-1">
                                Válido até: {validade ? format(new Date(validade + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                            </p>
                        </div>

                        {/* Items */}
                        <div className="space-y-3 mb-6">
                            {itens.map((item, index) => (
                                <div key={index} className="flex gap-4 p-4 rounded-2xl border border-border/30 bg-white">
                                    {item.fotoUrl ? (
                                        <img src={item.fotoUrl} alt={item.nome} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <ImageIcon className="w-6 h-6 text-gray-300" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-black text-gray-900 truncate">{item.nome}</h4>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {item.quantidade}x {formatarMoeda(item.precoUnitario)}
                                        </p>
                                        {item.observacao && (
                                            <p className="text-[10px] text-amber-600 mt-1 italic">📝 {item.observacao}</p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-black text-[#EFB6BF]">
                                            {formatarMoeda(item.precoUnitario * item.quantidade)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals Preview */}
                        <div className="p-5 rounded-2xl bg-[#FDFCFB] border border-border/30 mb-6 space-y-2">
                            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                                <span>Subtotal dos itens</span>
                                <span>{formatarMoeda(valorItens)}</span>
                            </div>
                            {frete > 0 && (
                                <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                                    <span>Entrega / Frete</span>
                                    <span>+ {formatarMoeda(frete)}</span>
                                </div>
                            )}
                            <div className="h-px bg-gray-100 my-1" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-700">Total Final</span>
                                <span className="text-2xl font-black text-[#EFB6BF]">{formatarMoeda(valorTotal)}</span>
                            </div>
                        </div>

                        {notas && (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 mb-6">
                                <p className="text-xs font-bold text-amber-700 mb-1">Observações</p>
                                <p className="text-xs text-amber-600">{notas}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            {clienteTelefone && (
                                <Button
                                    type="button"
                                    onClick={handleSendWhatsApp}
                                    className="w-full h-12 rounded-[20px] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-lg shadow-emerald-500/20 border-none transition-all active:scale-[0.98] gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {isSaving ? "Salvando..." : "Enviar via WhatsApp"}
                                </Button>
                            )}

                            <Button
                                type="button"
                                onClick={handleConfirmAndSave}
                                disabled={isSaving}
                                className="w-full h-12 rounded-[20px] bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black text-sm shadow-lg shadow-[#EFB6BF]/20 border-none transition-all active:scale-[0.98] gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {isSaving ? "Salvando..." : "Salvar Orçamento"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep("form")}
                                className="w-full h-10 rounded-[20px] text-sm font-bold"
                            >
                                ← Voltar e Editar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    // Form step
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl max-h-[95vh] flex flex-col">
                <div className="p-8 bg-white overflow-y-auto custom-scrollbar">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <FileEdit className="w-5 h-5 text-muted-foreground" />
                            <DialogTitle className="text-xl font-bold text-foreground">
                                Criar Orçamento
                            </DialogTitle>
                        </div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client Info Card */}
                        <div className="p-6 rounded-2xl border border-border/30 bg-[#FDFCFB] space-y-4">
                            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                <User className="w-4 h-4 text-[#EFB6BF]" /> Dados do Cliente
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Nome do Cliente</Label>
                                    <div className="relative">
                                        <Input
                                            placeholder="Ex: Maria Silva"
                                            value={clienteNome}
                                            onChange={(e) => handleClienteChange(e.target.value)}
                                            onFocus={() => setShowClienteDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowClienteDropdown(false), 200)}
                                            autoComplete="off"
                                            className="bg-white h-11"
                                        />
                                        {showClienteDropdown && clienteNome.length > 0 && (() => {
                                            const filtered = clientes.filter(c =>
                                                c.nome.toLowerCase().includes(clienteNome.toLowerCase())
                                            );
                                            if (filtered.length === 0 || (filtered.length === 1 && filtered[0].nome.toLowerCase() === clienteNome.toLowerCase())) return null;
                                            return (
                                                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden max-h-[150px] overflow-y-auto">
                                                    {filtered.map((c, idx) => (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setClienteNome(c.nome);
                                                                setClienteTelefone(c.telefone || "");
                                                                setClienteEmail(c.email || "");
                                                                setClienteEndereco(c.endereco || "");
                                                                setShowClienteDropdown(false);
                                                            }}
                                                        >
                                                            <div className="w-7 h-7 rounded-full bg-[#EFB6BF]/10 flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-[#EFB6BF]">{c.nome.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-800">{c.nome}</p>
                                                                <p className="text-[10px] text-gray-400">{c.telefone}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 text-gray-400" /> Endereço
                                    </Label>
                                    <Input
                                        placeholder="Rua, número, bairro..."
                                        value={clienteEndereco}
                                        onChange={(e) => setClienteEndereco(e.target.value)}
                                        className="bg-white h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        <Phone className="w-3 h-3 text-gray-400" /> Telefone / WhatsApp
                                    </Label>
                                    <Input
                                        placeholder="(21) 99999-0000"
                                        value={clienteTelefone}
                                        onChange={(e) => setClienteTelefone(e.target.value)}
                                        className="bg-white h-11"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1.5">
                                        <Mail className="w-3 h-3 text-gray-400" /> E-mail (opcional)
                                    </Label>
                                    <Input
                                        placeholder="email@exemplo.com"
                                        value={clienteEmail}
                                        onChange={(e) => setClienteEmail(e.target.value)}
                                        className="bg-white h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Validade do Orçamento</Label>
                                <Input
                                    type="date"
                                    value={validade}
                                    onChange={(e) => setValidade(e.target.value)}
                                    className="bg-white h-11 w-auto"
                                />
                            </div>
                        </div>

                        {/* Items Card */}
                        <div className="p-6 rounded-2xl border border-border/30 bg-white space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                                    <ShoppingBag className="w-4 h-4 text-[#EFB6BF]" /> Itens do Orçamento
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="text-[10px] h-7 gap-1 border-[#EFB6BF]/20 hover:bg-[#EFB6BF]/5 text-[#EFB6BF] font-black"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar Receita
                                </Button>
                            </div>

                            {itens.length === 0 ? (
                                <div className="py-10 text-center">
                                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                                        <ShoppingBag className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 mb-1">Nenhum item adicionado</p>
                                    <p className="text-xs text-gray-300 mb-4">Selecione as receitas desejadas para o orçamento</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addItem}
                                        className="gap-2 text-xs h-9 rounded-xl border-[#EFB6BF]/30 text-[#EFB6BF] hover:bg-[#EFB6BF]/5"
                                    >
                                        <Plus className="w-3 h-3" /> Adicionar primeiro item
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {itens.map((item, index) => (
                                        <div key={index} className="p-4 rounded-2xl bg-[#FDFCFB] border border-border/30 relative">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            <div className="flex gap-4">
                                                {/* Photo preview */}
                                                {item.fotoUrl ? (
                                                    <img src={item.fotoUrl} alt={item.nome} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                        <ImageIcon className="w-8 h-8 text-gray-200" />
                                                    </div>
                                                )}

                                                <div className="flex-1 space-y-3 min-w-0">
                                                    {/* Recipe selector */}
                                                    <Select
                                                        value={item.receitaId}
                                                        onValueChange={(val) => handleReceitaSelect(index, val)}
                                                    >
                                                        <SelectTrigger className="bg-white h-9 text-sm">
                                                            <SelectValue placeholder="Selecione uma receita..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {receitas.map((r) => (
                                                                <SelectItem key={r.id} value={r.id}>
                                                                    <div className="flex items-center gap-2">
                                                                        {r.foto_url && (
                                                                            <img src={r.foto_url} className="w-5 h-5 rounded object-cover" alt="" />
                                                                        )}
                                                                        <span>{r.nome}</span>
                                                                        {r.preco_venda ? (
                                                                            <span className="text-[10px] text-gray-400 ml-1">{formatarMoeda(r.preco_venda)}</span>
                                                                        ) : null}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Quantidade</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantidade}
                                                                onChange={(e) => updateItem(index, "quantidade", parseInt(e.target.value) || 1)}
                                                                className="bg-white h-8 text-sm"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-[10px] uppercase font-bold text-gray-400">Valor Unit.</Label>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={item.precoUnitario || ""}
                                                                onChange={(e) => updateItem(index, "precoUnitario", parseFloat(e.target.value) || 0)}
                                                                className="bg-white h-8 text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    <Input
                                                        placeholder="Observações do cliente (ex: sem lactose, cor azul...)"
                                                        value={item.observacao}
                                                        onChange={(e) => updateItem(index, "observacao", e.target.value)}
                                                        className="bg-white h-8 text-xs"
                                                    />
                                                </div>
                                            </div>

                                            {/* Subtotal */}
                                            <div className="text-right mt-2">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Subtotal:</span>
                                                <span className="text-sm font-black text-[#EFB6BF]">
                                                    {formatarMoeda(item.precoUnitario * item.quantidade)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Grand Total */}
                            {itens.length > 0 && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                step="0.01"
                                                placeholder="Valor do Frete"
                                                value={frete || ""}
                                                onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                                                className="w-32 h-10 bg-gray-50 border-gray-200"
                                            />
                                            <span className="text-xs font-bold text-gray-400 uppercase">Taxa de Entrega</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-bold text-gray-400 uppercase block">Subtotal Itens</span>
                                            <span className="text-sm font-black text-gray-900">{formatarMoeda(valorItens)}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-gradient-to-r from-[#EFB6BF]/10 to-[#EFB6BF]/5 border border-[#EFB6BF]/20 flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-600">Total do Orçamento</span>
                                        <span className="text-2xl font-black text-[#EFB6BF]">{formatarMoeda(valorTotal)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>Observações gerais (opcional)</Label>
                            <Textarea
                                placeholder="Informações adicionais, condições de pagamento..."
                                value={notas}
                                onChange={(e) => setNotas(e.target.value)}
                                className="bg-[#FDFCFB] border-border/30 rounded-2xl min-h-[80px]"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 h-12 rounded-[20px] font-bold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-12 rounded-[20px] bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black shadow-lg shadow-[#EFB6BF]/20 border-none transition-all active:scale-[0.98] gap-2"
                            >
                                <Sparkles className="w-4 h-4" />
                                Pré-visualizar
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
