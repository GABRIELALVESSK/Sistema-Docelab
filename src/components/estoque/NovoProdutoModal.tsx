import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ShoppingBag, Box, Plus, Check, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NovoProdutoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (produto: ProdutoData) => void;
  produto?: ProdutoData & { id?: string };
}

export interface ProdutoData {
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  minimo: number;
  precoMedio: number;
  precoVenda?: number;
  fornecedor: string;
  dataValidade?: Date;
}

const categoriasBase = [
  "Ingredientes",
  "Produtos Acabados",
  "Kits",
];

const unidades = [
  { value: "kg", label: "Quilogramas (kg)" },
  { value: "g", label: "Gramas (g)" },
  { value: "l", label: "Litros (L)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "m", label: "Metros (m)" },
  { value: "cm", label: "Centímetros (cm)" },
  { value: "mm", label: "Milímetros (mm)" },
  { value: "un", label: "Unidades" },
];

export function NovoProdutoModal({ open, onOpenChange, onSubmit, produto }: NovoProdutoModalProps) {
  const { user } = useAuth();
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [isCreatingCategoria, setIsCreatingCategoria] = useState(false);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [opcoesCategorias, setOpcoesCategorias] = useState(categoriasBase);

  const [quantidade, setQuantidade] = useState(0);
  const [unidade, setUnidade] = useState("");
  const [minimo, setMinimo] = useState(0);
  const [precoMedio, setPrecoMedio] = useState(0);
  const [precoVenda, setPrecoVenda] = useState(0);
  const [fornecedor, setFornecedor] = useState("");
  const [dataValidade, setDataValidade] = useState<Date | undefined>(undefined);
  const [tipoProduto, setTipoProduto] = useState<"ingrediente" | "acabado">("ingrediente");

  const isEditing = !!produto;

  useEffect(() => {
    if (produto) {
      setNome(produto.nome || "");
      setCategoria(produto.categoria || "");
      setQuantidade(produto.quantidade || 0);
      setUnidade(produto.unidade || "");
      setMinimo(produto.minimo || 0);
      setPrecoMedio(produto.precoMedio || 0);
      setPrecoVenda(produto.precoVenda || 0);
      setFornecedor(produto.fornecedor || "");
      setDataValidade(() => {
        if (!produto.dataValidade) return undefined;
        const d = new Date(produto.dataValidade);
        return isNaN(d.getTime()) ? undefined : d;
      });
      setTipoProduto(produto.categoria === "Produtos Acabados" ? "acabado" : "ingrediente");
    } else {
      setNome("");
      setCategoria("");
      setQuantidade(0);
      setUnidade("");
      setMinimo(0);
      setPrecoMedio(0);
      setPrecoVenda(0);
      setFornecedor("");
      setDataValidade(undefined);
      setTipoProduto("ingrediente");
    }

    if (open && user?.id) {
      fetchProdutoCategories();
    }
  }, [produto, open, user?.id]);

  const fetchProdutoCategories = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('categoria')
        .eq('user_id', user.id)
        .not('categoria', 'is', null);

      if (error) throw error;

      if (data) {
        const uniqueCats = Array.from(new Set([
          ...categoriasBase,
          ...data.map((p: any) => p.categoria).filter(Boolean)
        ])).sort();
        setOpcoesCategorias(uniqueCats);
      }
    } catch (error) {
      console.error("Erro ao buscar categorias de produtos:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      nome,
      categoria: categoria || (tipoProduto === "ingrediente" ? "Ingredientes" : "Produtos Acabados"),
      quantidade,
      unidade,
      minimo,
      precoMedio,
      precoVenda: tipoProduto === "acabado" ? precoVenda : undefined,
      fornecedor,
      dataValidade,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <div className="p-8 bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-foreground">
              {isEditing ? "Editar Produto" : "Adicionar Produto ao Stock"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Produto */}
            <div className="p-6 rounded-3xl bg-[#FDFCFB] border border-border/20 space-y-4">
              <Label className="text-sm font-bold text-foreground">Tipo de Produto</Label>
              <div className="flex gap-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5",
                    tipoProduto === "ingrediente" ? "border-[#EFB6BF]" : "border-border group-hover:border-[#EFB6BF]/50"
                  )}>
                    {tipoProduto === "ingrediente" && <div className="w-2.5 h-2.5 rounded-full bg-[#EFB6BF]" />}
                  </div>
                  <input type="radio" className="hidden" checked={tipoProduto === "ingrediente"} onChange={() => setTipoProduto("ingrediente")} />
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" /> Ingrediente / Insumo
                    </span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mt-0.5",
                    tipoProduto === "acabado" ? "border-[#EFB6BF]" : "border-border group-hover:border-[#EFB6BF]/50"
                  )}>
                    {tipoProduto === "acabado" && <div className="w-2.5 h-2.5 rounded-full bg-[#EFB6BF]" />}
                  </div>
                  <input type="radio" className="hidden" checked={tipoProduto === "acabado"} onChange={() => setTipoProduto("acabado")} />
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                      <Box className="w-4 h-4 text-muted-foreground" /> Produto Acabado
                    </span>
                  </div>
                </label>
              </div>
              <p className="text-[13px] text-muted-foreground font-medium italic opacity-70">
                {tipoProduto === "ingrediente"
                  ? "Ingredientes são usados em receitas e deduzidos na produção."
                  : "Produtos acabados podem ser vendidos diretamente em encomendas e orçamentos."}
              </p>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">Nome do Produto *</Label>
              <Input
                placeholder={tipoProduto === "ingrediente" ? "Ex: Farinha de trigo" : "Ex: Brigadeiro tradicional"}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="bg-[#FDFCFB] border-none h-12 rounded-2xl"
              />
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">Categoria</Label>
              {isCreatingCategoria ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-top-1">
                  <Input
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    placeholder="Nome da categoria"
                    className="bg-[#FDFCFB] border-none h-12 rounded-2xl flex-1"
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
                    className="bg-green-500 hover:bg-green-600 w-12 h-12 p-0 rounded-2xl"
                  >
                    <Check className="w-5 h-5 text-white" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingCategoria(false);
                      setNovaCategoria("");
                    }}
                    className="w-12 h-12 p-0 rounded-2xl text-red-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Select value={categoria} onValueChange={(v) => v === "NEW" ? setIsCreatingCategoria(true) : setCategoria(v)}>
                  <SelectTrigger className="bg-[#FDFCFB] border-none h-12 rounded-2xl focus:ring-[#EFB6BF]/20">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/20 shadow-xl">
                    {opcoesCategorias.map((cat) => (
                      <SelectItem key={cat} value={cat} className="rounded-xl">
                        {cat}
                      </SelectItem>
                    ))}
                    <div className="h-px bg-border/10 my-1" />
                    <SelectItem value="NEW" className="font-bold text-[#EFB6BF] rounded-xl hover:bg-[#EFB6BF]/5 cursor-pointer">
                      + Criar nova...
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Quantidade e Unidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground">Quantidade</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={quantidade || ""}
                  onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                  className="bg-[#FDFCFB] border-none h-12 rounded-2xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground">Unidade *</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="bg-[#FDFCFB] border-none h-12 rounded-2xl">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u.value} value={u.value}>
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantidade Mínima */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">Quantidade Mínima (alerta)</Label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 1"
                value={minimo || ""}
                onChange={(e) => setMinimo(parseInt(e.target.value) || 0)}
                className="bg-[#FDFCFB] border-none h-12 rounded-2xl"
              />
            </div>

            {/* Custo/Preço Médio */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">
                {tipoProduto === "ingrediente" ? "Preço Médio (R$)" : "Custo de Produção (R$)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={precoMedio || ""}
                onChange={(e) => setPrecoMedio(parseFloat(e.target.value) || 0)}
                className="bg-[#FDFCFB] border-none h-12 rounded-2xl font-bold"
              />
            </div>

            {/* Preço de Venda (Only for Acabado) */}
            {tipoProduto === "acabado" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-sm font-bold text-foreground">Preço de Venda (R$)*</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={precoVenda || ""}
                  onChange={(e) => setPrecoVenda(parseFloat(e.target.value) || 0)}
                  className="bg-[#FDFCFB] border-none h-12 rounded-2xl font-bold"
                />
                <p className="text-[12px] text-muted-foreground font-medium opacity-60">
                  Este preço será usado como sugestão em encomendas e orçamentos.
                </p>
              </div>
            )}

            {/* Fornecedor */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">Fornecedor</Label>
              <Input
                placeholder="Nome do fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                className="bg-[#FDFCFB] border-none h-12 rounded-2xl"
              />
            </div>

            {/* Data de Validade */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground">Data de Validade</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 rounded-2xl justify-start text-left font-normal bg-[#FDFCFB] border-none group hover:bg-[#F2EDE4]/30",
                      !dataValidade && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground/60" />
                    {dataValidade && !isNaN(dataValidade.getTime()) ? format(dataValidade, "dd/MM/yyyy", { locale: ptBR }) : <span>dd/mm/aaaa</span>}
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataValidade}
                    onSelect={setDataValidade}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-8 bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground font-black text-lg rounded-[1.8rem] shadow-lg hover:shadow-xl transition-all active:scale-[0.98] mt-4"
            >
              {isEditing ? "Salvar Alterações" : "Adicionar ao Stock"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
