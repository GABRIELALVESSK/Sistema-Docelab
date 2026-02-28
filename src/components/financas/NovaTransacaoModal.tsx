import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TransacaoData {
  tipo: "receita" | "despesa";
  valor: number;
  categoria: string;
  data: string;
  metodo: string;
  cliente: string;
  descricao: string;
}

interface NovaTransacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (transacao: TransacaoData) => void;
  tipo?: "receita" | "despesa";
}

const categorias = {
  receita: ["Doces", "Vendas de bolo", "Salgados", "Bebidas", "Outros"],
  despesa: ["Matéria-prima", "Embalagens", "Gás", "Luz", "Entregas", "Publicidade", "Equipamentos", "Apps/Software", "Outros"],
};

const metodos = ["PIX", "Dinheiro", "Cartão de Crédito", "Cartão de Débito", "Transferência"];

export function NovaTransacaoModal({ open, onOpenChange, onSubmit, tipo: tipoInicial = "receita" }: NovaTransacaoModalProps) {
  const [tipo, setTipo] = useState<"receita" | "despesa">(tipoInicial);
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");
  const [customCategorias, setCustomCategorias] = useState(categorias);
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"));
  const [metodo, setMetodo] = useState("");
  const [cliente, setCliente] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      tipo,
      valor: parseFloat(valor),
      categoria,
      data,
      metodo,
      cliente,
      descricao,
    });
    setValor("");
    setCategoria("");
    setCliente("");
    setDescricao("");
    setIsCreatingCategory(false);
    setNovaCategoriaNome("");
    onOpenChange(false);
  };

  const handleCreateCategory = () => {
    if (novaCategoriaNome.trim()) {
      const updated = { ...customCategorias };
      updated[tipo] = [...updated[tipo], novaCategoriaNome.trim()];
      setCustomCategorias(updated);
      setCategoria(novaCategoriaNome.trim());
      setIsCreatingCategory(false);
      setNovaCategoriaNome("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo Toggle */}
          {/* Tipo Toggle */}
          <div className="flex gap-2 p-1.5 bg-[#F2EDE4] rounded-xl">
            <button
              type="button"
              onClick={() => { setTipo("receita"); setCategoria(""); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                tipo === "receita"
                  ? "bg-[#EFB6BF] text-foreground shadow-sm"
                  : "bg-white text-muted-foreground hover:bg-white/80"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              Receita
            </button>
            <button
              type="button"
              onClick={() => { setTipo("despesa"); setCategoria(""); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all",
                tipo === "despesa"
                  ? "bg-[#EFB6BF] text-foreground shadow-sm"
                  : "bg-white text-muted-foreground hover:bg-white/80"
              )}
            >
              <TrendingDown className="w-4 h-4" />
              Despesa
            </button>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
              className="bg-white"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria *</Label>
            {isCreatingCategory ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da nova categoria"
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  className="bg-white"
                  autoFocus
                />
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground w-12 h-10 p-0"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNovaCategoriaNome("");
                  }}
                  className="bg-white border-border"
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Select
                value={categoria}
                onValueChange={(val) => {
                  if (val === "NEW") {
                    setIsCreatingCategory(true);
                  } else {
                    setCategoria(val);
                  }
                }}
                required
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {customCategorias[tipo].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <div className="border-t my-1" />
                  <SelectItem value="NEW" className="text-primary font-medium focus:text-primary">
                    + Criar nova categoria...
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label htmlFor="data">Data</Label>
            <div className="relative">
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="bg-white"
              />
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <Label>Método de pagamento</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Selecionar método" />
              </SelectTrigger>
              <SelectContent>
                {metodos.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente (opcional)</Label>
            <Input
              id="cliente"
              placeholder="Nome do cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              className="bg-white"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Detalhes da transação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="bg-white min-h-[80px]"
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button type="submit" className="w-full bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground font-semibold py-6 text-base">
              Salvar Transação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
