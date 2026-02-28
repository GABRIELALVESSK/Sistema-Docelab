import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  User,
  Phone,
  Package,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Printer,
  Share2,
  Bell,
  MessageCircle,
  DollarSign,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  endereco?: string;
  hora_entrega?: string;
}

interface DetalhesEncomendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: Pedido | null;
  onEdit?: () => void;
}

const statusLabels = {
  pendente: "Pendente",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
};

const statusColors = {
  pendente: "bg-amber-100 text-amber-600 border-amber-200",
  em_producao: "bg-blue-100 text-blue-600 border-blue-200",
  pronto: "bg-emerald-100 text-emerald-600 border-emerald-200",
  entregue: "bg-gray-100 text-gray-500 border-gray-200",
};

export function DetalhesEncomendaModal({ open, onOpenChange, pedido }: DetalhesEncomendaModalProps) {
  const { toast } = useToast();
  if (!pedido) return null;

  const valorTotal = pedido.itens ? pedido.itens.reduce((acc, i) => acc + (i.quantidade * i.preco), 0) : (pedido.quantidade * pedido.preco);
  const itemsList = pedido.itens && pedido.itens.length > 0 ? pedido.itens : [{ produto: pedido.produto, quantidade: pedido.quantidade, preco: pedido.preco }];

  const formatWhatsAppLink = (msg: string) => {
    const phone = pedido.telefone?.replace(/\D/g, "") || "";
    return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleSendReminder = () => {
    const dataFormatada = format(pedido.data, "dd/MM 'às' HH:mm", { locale: ptBR });
    const msg = `Olá ${pedido.cliente}! Passando para confirmar seu pedido de ${pedido.produto} para o dia ${dataFormatada}. Está tudo certo por aqui! 🎂`;
    window.open(formatWhatsAppLink(msg), "_blank");
    toast({ title: "Lembrete enviado!", description: "O WhatsApp foi aberto com a mensagem de confirmação." });
  };

  const handleShareDetails = () => {
    const msg = `*Detalhes do Pedido - Confeitaria Pro*\n\n*Cliente:* ${pedido.cliente}\n*Entrega:* ${format(pedido.data, "dd/MM/yyyy")}\n*Produtos:* \n${itemsList.map(i => `- ${i.quantidade}x ${i.produto}`).join("\n")}\n\n*Total:* R$ ${valorTotal.toFixed(2)}`;
    window.open(formatWhatsAppLink(msg), "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[2rem] border-none shadow-[var(--shadow-modal)] bg-[#FDFCFB] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 tracking-tight">Detalhes da Encomenda</h2>
                <p className="text-[10px] font-medium text-gray-400">Informações completas do pedido</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-gray-100 hover:bg-gray-50" title="Gerar PDF">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
              </Button>
              <Button variant="outline" size="icon" className="w-8 h-8 rounded-lg border-gray-100 hover:bg-gray-50" title="Imprimir Via Térmica">
                <Printer className="w-3.5 h-3.5 text-gray-400" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-lg border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10"
                onClick={handleShareDetails}
                title="Compartilhar via WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366] fill-[#25D366]/10" />
              </Button>
            </div>
          </div>

          {/* Reminder Button */}
          <button
            onClick={handleSendReminder}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 bg-white border border-[#EFB6BF]/20 rounded-xl shadow-sm hover:border-[#EFB6BF]/40 hover:bg-pink-50/30 transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bell className="w-3.5 h-3.5 text-[#EFB6BF]" />
            </div>
            <span className="text-xs font-black text-gray-700">Ativar lembrete desta entrega</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
          {/* Status Row */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</span>
            <span className={cn(
              "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border",
              statusColors[pedido.status]
            )}>
              {statusLabels[pedido.status]}
            </span>
          </div>

          {/* Client Card */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{pedido.cliente}</p>
                <p className="text-[10px] font-bold text-gray-400">{pedido.telefone || "Sem telefone"}</p>
              </div>
            </div>
            {pedido.telefone && (
              <button
                onClick={() => window.open(formatWhatsAppLink("Olá! Tudo bem?"), "_blank")}
                className="flex items-center gap-1.5 text-[#25D366] font-bold text-[10px] hover:bg-[#25D366]/5 p-2 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                WhatsApp
              </button>
            )}
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Produtos</span>
            </div>
            <div className="space-y-1.5">
              {itemsList.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-50 shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EFB6BF]/10 flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#EFB6BF]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-800">{item.produto}</p>
                      <p className="text-[10px] font-bold text-gray-400">{item.quantidade} un. × R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                  <p className="text-xs font-black text-gray-900">
                    R$ {(item.quantidade * item.preco).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-gray-50 shadow-sm space-y-0.5">
              <div className="flex items-center gap-1.5 text-[#EFB6BF]">
                <Calendar className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Data</span>
              </div>
              <p className="text-xs font-black text-gray-800">
                {format(pedido.data, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-gray-50 shadow-sm space-y-0.5">
              <div className="flex items-center gap-1.5 text-blue-400">
                <Clock className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-widest">Horário</span>
              </div>
              <p className="text-xs font-black text-gray-800">
                {pedido.hora_entrega || "Não definido"}
              </p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="p-4 bg-gradient-to-br from-[#EFB6BF] to-[#e8a0ab] rounded-2xl shadow-md shadow-[#EFB6BF]/20 flex justify-between items-center text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">Total da Encomenda</p>
              <p className="text-xl font-black tracking-tight">
                R$ {valorTotal.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Notas */}
          {pedido.notas && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/50">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Observações</p>
              <p className="text-xs text-amber-900/70 font-medium italic leading-relaxed">"{pedido.notas}"</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-50 bg-gray-50/30">
          <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>#{pedido.id.slice(0, 8)}</span>
            <span>{pedido.criadoEm ? format(pedido.criadoEm, "dd/MM/yyyy 'às' HH:mm") : '...'}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
