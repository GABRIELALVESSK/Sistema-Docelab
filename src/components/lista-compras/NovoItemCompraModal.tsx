import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NovoItemCompraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (item: ItemCompraData) => void;
}

export interface ItemCompraData {
  nome: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  fornecedor: string;
  categoria: string;
  prioridade: "baixa" | "media" | "alta";
  tipoProduto: "ingrediente" | "acabado";
}

const categoriasBase = [
  "Brigadeiros",
  "Coberturas",
  "Decoração",
  "Descartáveis",
  "Embalagens",
  "Ingredientes",
  "Massas",
  "Recheios",
  "Outros",
];

const prioridades = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

export function NovoItemCompraModal({ open, onOpenChange, onSubmit }: NovoItemCompraModalProps) {
  const [nome, setNome] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [valorUnitario, setValorUnitario] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [fornecedor, setFornecedor] = useState("");
  const [categoria, setCategoria] = useState("");
  const [isCreatingCategoria, setIsCreatingCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [opcoesCategorias, setOpcoesCategorias] = useState(categoriasBase);
  const [prioridade, setPrioridade] = useState<"baixa" | "media" | "alta">("media");
  const [tipoProduto, setTipoProduto] = useState<"ingrediente" | "acabado">("ingrediente");

  // Calcula valor total automaticamente quando quantidade ou valorUnitario muda
  useEffect(() => {
    setValorTotal(quantidade * valorUnitario);
  }, [quantidade, valorUnitario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      nome,
      quantidade,
      valorUnitario,
      valorTotal,
      fornecedor,
      categoria,
      prioridade,
      tipoProduto,
    });
    // Reset form
    setNome("");
    setQuantidade(1);
    setValorUnitario(0);
    setValorTotal(0);
    setFornecedor("");
    setCategoria("");
    setPrioridade("media");
    setTipoProduto("ingrediente");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="p-5 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground mr-0.5" />
              <DialogTitle className="text-sm font-bold text-foreground">
                Adicionar à Lista de Compras
              </DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Destino no Estoque */}
            <div className="p-3 rounded-xl bg-[#FDFCFB] border border-border/20 space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Destino no Estoque</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    tipoProduto === "ingrediente" ? "border-[#EFB6BF]" : "border-border group-hover:border-[#EFB6BF]/50"
                  )}>
                    {tipoProduto === "ingrediente" && <div className="w-2 h-2 rounded-full bg-[#EFB6BF]" />}
                  </div>
                  <input type="radio" className="hidden" checked={tipoProduto === "ingrediente"} onChange={() => setTipoProduto("ingrediente")} />
                  <span className="text-xs font-bold text-foreground">Ingrediente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                    tipoProduto === "acabado" ? "border-[#EFB6BF]" : "border-border group-hover:border-[#EFB6BF]/50"
                  )}>
                    {tipoProduto === "acabado" && <div className="w-2 h-2 rounded-full bg-[#EFB6BF]" />}
                  </div>
                  <input type="radio" className="hidden" checked={tipoProduto === "acabado"} onChange={() => setTipoProduto("acabado")} />
                  <span className="text-xs font-bold text-foreground">Produto Acabado</span>
                </label>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground ml-0.5">Nome do Item *</Label>
              <Input
                placeholder="Ex: Açúcar"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="bg-[#FDFCFB] border-none h-9 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-[#EFB6BF]/30 shadow-sm"
              />
            </div>

            {/* Quantidade, Valor Unit, Valor Total */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground ml-0.5">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantidade || ""}
                  onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                  className="bg-[#FDFCFB] border-none h-9 rounded-xl text-center text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground ml-0.5">Valor Unit. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={valorUnitario || ""}
                  onChange={(e) => setValorUnitario(parseFloat(e.target.value) || 0)}
                  className="bg-[#FDFCFB] border-none h-9 rounded-xl text-center text-sm font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground ml-0.5">Valor Total (R$)</Label>
                <div className="bg-[#FDFCFB] h-9 rounded-xl flex items-center justify-center text-sm font-bold text-foreground border border-transparent shadow-sm">
                  {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Fornecedor */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground ml-0.5">Fornecedor</Label>
              <Input
                placeholder="Nome do fornecedor ou loja"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="bg-[#FDFCFB] border-none h-9 rounded-xl text-sm"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground ml-0.5">Categoria</Label>
              {isCreatingCategoria ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <Input
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    placeholder="Nome da categoria"
                    className="bg-[#FDFCFB] border-none h-9 rounded-xl text-sm flex-1"
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (novaCategoria.trim()) {
                        setOpcoesCategorias([...opcoesCategorias, novaCategoria.trim()]);
                        setCategoria(novaCategoria.trim());
                      }
                      setIsCreatingCategoria(false);
                      setNovaCategoria("");
                    }}
                    className="bg-[#EFB6BF] w-9 h-9 p-0 rounded-xl"
                  >
                    <Plus className="w-4 h-4 text-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingCategoria(false);
                      setNovaCategoria("");
                    }}
                    className="w-9 h-9 p-0 rounded-xl text-muted-foreground hover:bg-gray-100"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <Select value={categoria} onValueChange={(v) => v === "NEW" ? setIsCreatingCategoria(true) : setCategoria(v)}>
                  <SelectTrigger className="bg-[#FDFCFB] border-none h-9 rounded-xl text-sm focus:ring-[#EFB6BF]/20">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/20 shadow-xl">
                    {opcoesCategorias.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-lg">
                        {cat}
                      </SelectItem>
                    ))}
                    <div className="h-px bg-border/10 my-1" />
                    <SelectItem value="NEW" className="font-bold text-[#EFB6BF] rounded-lg hover:bg-[#EFB6BF]/5 cursor-pointer">
                      + Criar nova...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Prioridade */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground ml-0.5">Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as typeof prioridade)}>
                <SelectTrigger className="bg-[#FDFCFB] border-none h-9 rounded-xl text-sm focus:ring-[#EFB6BF]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/20 shadow-xl">
                  {prioridades.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="rounded-lg">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-4 bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground font-black text-sm rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mt-3"
            >
              Adicionar à Lista
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
