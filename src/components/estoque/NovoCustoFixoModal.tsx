import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Lightbulb, Droplets, Zap, DollarSign } from "lucide-react";

export interface CustoFixoData {
    nome: string;
    valor_mensal: number;
    categoria: string;
    ativo: boolean;
}

interface NovoCustoFixoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (custo: CustoFixoData) => void;
    custoEdit?: any;
}

const CATEGORIAS = [
    { value: "Administrativo", label: "Administrativo (Aluguel, Internet)", icon: Building2 },
    { value: "Operacional", label: "Operacional (Gás, Água, Luz)", icon: Zap },
    { value: "Equipamentos", label: "Investimento em Equipamentos", icon: DollarSign },
    { value: "Outros", label: "Outros Custos Fixos", icon: DollarSign },
];

export function NovoCustoFixoModal({ open, onOpenChange, onSubmit, custoEdit }: NovoCustoFixoModalProps) {
    const [nome, setNome] = useState("");
    const [valorMensal, setValorMensal] = useState("");
    const [categoria, setCategoria] = useState("Operacional");

    useEffect(() => {
        if (open) {
            if (custoEdit) {
                setNome(custoEdit.nome);
                setValorMensal(formatarParaExibicao(custoEdit.valor_mensal));
                setCategoria(custoEdit.categoria);
            } else {
                limparForm();
            }
        }
    }, [open, custoEdit]);

    const limparForm = () => {
        setNome("");
        setValorMensal("");
        setCategoria("Operacional");
    };

    const formatarParaExibicao = (valor: number): string => {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const converterParaNumero = (valorFormatado: string): number => {
        // Remove tudo exceto dígitos, vírgula e ponto
        // Substitui vírgula por ponto e remove pontos de milhares
        const valorLimpo = valorFormatado
            .replace(/[^\d,\.]/g, '') // Remove caracteres não numéricos exceto vírgula e ponto
            .replace(/\./g, '') // Remove pontos (separadores de milhares)
            .replace(',', '.'); // Substitui vírgula por ponto (decimal)

        return parseFloat(valorLimpo) || 0;
    };

    const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        // Permite apenas números, vírgula, ponto e espaço
        const valorLimpo = input.replace(/[^\d,\.]/g, '');
        setValorMensal(valorLimpo);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nome,
            valor_mensal: converterParaNumero(valorMensal),
            categoria,
            ativo: true
        });
        limparForm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-[#FDFCFB]">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold text-foreground">
                            {custoEdit ? "Editar Custo Fixo" : "Novo Custo Fixo"}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-bold">Descrição do Custo *</Label>
                            <Input
                                placeholder="Ex: Aluguel da Loja"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                required
                                className="bg-white border-border/10 h-12 rounded-2xl shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold text-despesa">Valor Mensal (R$) *</Label>
                            <Input
                                type="text"
                                placeholder="1.230,00"
                                value={valorMensal}
                                onChange={handleValorChange}
                                required
                                className="bg-white border-despesa/20 h-12 rounded-2xl text-lg font-bold shadow-sm text-despesa placeholder:text-despesa/30"
                            />
                            <p className="text-xs text-muted-foreground">Use vírgula para centavos (ex: 1.230,00)</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-bold">Categoria</Label>
                            <Select value={categoria} onValueChange={setCategoria}>
                                <SelectTrigger className="bg-white border-border/10 h-12 rounded-2xl shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIAS.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            <div className="flex items-center gap-2">
                                                <cat.icon className="w-4 h-4 text-muted-foreground" />
                                                {cat.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full h-12 bg-despesa hover:bg-despesa-hover text-white font-bold rounded-2xl shadow-lg shadow-despesa/20">
                            {custoEdit ? "Atualizar Custo" : "Adicionar Custo Mensal"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
