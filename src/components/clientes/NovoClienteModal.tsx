import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NovoClienteModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (cliente: ClienteData) => void;
    cliente?: ClienteData & { id?: string };
}

export interface ClienteData {
    nome: string;
    telefone: string;
    email?: string;
    cpfCnpj?: string;
    endereco: string;
    notas: string;
}

export function NovoClienteModal({ open, onOpenChange, onSubmit, cliente }: NovoClienteModalProps) {
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [email, setEmail] = useState("");
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [endereco, setEndereco] = useState("");
    const [notas, setNotas] = useState("");

    const isEditing = !!cliente;

    useEffect(() => {
        if (open) {
            if (cliente) {
                setNome(cliente.nome || "");
                setTelefone(cliente.telefone || "");
                setEmail(cliente.email || "");
                setCpfCnpj(cliente.cpfCnpj || "");
                setEndereco(cliente.endereco || "");
                setNotas(cliente.notas || "");
            } else {
                setNome("");
                setTelefone("");
                setEmail("");
                setCpfCnpj("");
                setEndereco("");
                setNotas("");
            }
        }
    }, [open, cliente]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.({
            nome,
            telefone,
            // email,
            // cpfCnpj,
            endereco,
            notas,
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                    <p className="text-sm text-muted-foreground">Cadastre um novo cliente</p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome */}
                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome *</Label>
                        <Input
                            id="nome"
                            placeholder="Ex Maria Silva"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        {/* Telefone / WhatsApp */}
                        <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                            <Input
                                id="telefone"
                                placeholder="Ex 5511999999999"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                            />
                        </div>
                    </div>


                    {/* Endereço */}
                    <div className="space-y-2">
                        <Label htmlFor="endereco">Endereço</Label>
                        <Textarea
                            id="endereco"
                            placeholder="Endereço completo"
                            value={endereco}
                            onChange={(e) => setEndereco(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            placeholder="Preferências, alergias, etc."
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground font-medium">
                        {isEditing ? "Salvar Alterações" : "Adicionar Cliente"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
