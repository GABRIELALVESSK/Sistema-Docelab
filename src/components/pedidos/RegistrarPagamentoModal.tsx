import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard } from "lucide-react";
import { format } from "date-fns";

interface RegistrarPagamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtoNome?: string;
  onSubmit?: (pagamento: PagamentoData) => void;
}

interface PagamentoData {
  recebido: boolean;
  valor: number;
  formaPagamento: string;
  dataPagamento: string;
}

const formasPagamento = [
  "PIX",
  "Dinheiro",
  "Cartão de Crédito",
  "Cartão de Débito",
  "Transferência",
  "MBWay",
  "Multibanco",
];

export function RegistrarPagamentoModal({ open, onOpenChange, produtoNome, onSubmit }: RegistrarPagamentoModalProps) {
  const [recebido, setRecebido] = useState(false);
  const [valor, setValor] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataPagamento, setDataPagamento] = useState(format(new Date(), "yyyy-MM-dd"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      recebido,
      valor,
      formaPagamento,
      dataPagamento,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Registrar Pagamento
          </DialogTitle>
          {produtoNome && (
            <p className="text-sm text-muted-foreground">
              Registrar Pagamento - "{produtoNome}"
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pagamento Recebido */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recebido"
              checked={recebido}
              onCheckedChange={(checked) => setRecebido(checked as boolean)}
            />
            <Label
              htmlFor="recebido"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pagamento recebido
            </Label>
          </div>

          {recebido && (
            <>
              {/* Valor Recebido */}
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Recebido (R$) *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={valor || ""}
                  onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-2">
                <Label>Forma de Pagamento *</Label>
                <Select value={formaPagamento} onValueChange={setFormaPagamento} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {formasPagamento.map((forma) => (
                      <SelectItem key={forma} value={forma}>
                        {forma}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data do Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="dataPagamento">Data do Pagamento</Label>
                <Input
                  id="dataPagamento"
                  type="date"
                  value={dataPagamento}
                  onChange={(e) => setDataPagamento(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full bg-primary-light hover:bg-primary-light/90 text-foreground">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
