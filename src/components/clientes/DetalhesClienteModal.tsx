import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Phone, MapPin, MessageCircle, Package, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface Cliente {
    id: string;
    nome: string;
    telefone: string;
    email: string;
    endereco: string;
    notas: string;
}

interface DetalhesClienteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cliente: Cliente | null;
}

export function DetalhesClienteModal({ open, onOpenChange, cliente }: DetalhesClienteModalProps) {
    if (!cliente) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
                <div className="p-8 bg-white">
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-2xl font-bold text-foreground">
                            {cliente.nome}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1">Detalhes do cliente</p>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Contact Info Card */}
                        <div className="p-6 rounded-3xl border border-border/40 bg-white shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-foreground font-medium">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{cliente.telefone}</span>
                                </div>
                                <button
                                    className="flex items-center gap-2 text-[#25D366] font-semibold text-sm hover:underline"
                                    onClick={() => window.open(`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`, '_blank')}
                                >
                                    <MessageCircle className="w-4 h-4 fill-current" />
                                    WhatsApp
                                </button>
                            </div>
                            <div className="flex items-start gap-3 text-muted-foreground text-sm">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span className="leading-relaxed">
                                    {cliente.endereco || "Nenhum endereço cadastrado"}
                                </span>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-4 rounded-3xl border border-border/40 bg-white shadow-sm text-center">
                                <p className="text-2xl font-bold text-[#EFB6BF] mb-1">0</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Pedidos</p>
                            </div>
                            <div className="p-4 rounded-3xl border border-border/40 bg-white shadow-sm text-center">
                                <p className="text-2xl font-bold text-receita mb-1">R$ 0,00</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Total Gasto</p>
                            </div>
                            <div className="p-4 rounded-3xl border border-border/40 bg-white shadow-sm text-center flex flex-col justify-center">
                                <p className="text-xl font-bold text-foreground mb-1">-</p>
                                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Último Pedido</p>
                            </div>
                        </div>

                        {/* Order History */}
                        <div className="p-6 rounded-3xl border border-border/40 bg-white shadow-sm min-h-[120px]">
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <History className="w-4 h-4" /> Histórico de Pedidos
                            </h3>
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                                <p className="text-sm text-muted-foreground">Sem pedidos registrados</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
