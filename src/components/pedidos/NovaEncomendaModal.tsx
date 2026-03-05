import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ImagePlus, Lock, CalendarIcon, CheckCircle2, Clock, Package, AlertCircle, X, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { formatarMoeda } from "@/lib/precificacao-calculator";
import { useAuth } from "@/contexts/AuthContext";

interface NovaEncomendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (encomenda: EncomendaData) => void;
  encomenda?: EncomendaData & { id?: string };
}

export interface EncomendaItem {
  produto: string;
  quantidade: number;
  preco: number;
}

export interface EncomendaData {
  nomeCliente: string;
  telefone: string;
  itens: EncomendaItem[];
  dataEntrega: Date | undefined;
  estado: "pendente" | "em_producao" | "pronto" | "entregue";
  imagemInspiracao?: File | string | null;
  notas?: string;
  // Fallbacks for legacy/quick data
  produto?: string;
  quantidade?: number;
  preco?: number;
}

const estadoOptions = [
  { value: "pendente", label: "Pendente", color: "text-lucro bg-lucro-bg", icon: AlertCircle },
  { value: "em_producao", label: "Em produção", color: "text-lucro bg-lucro-bg", icon: Clock },
  { value: "pronto", label: "Pronto", color: "text-receita bg-receita-bg", icon: CheckCircle2 },
  { value: "entregue", label: "Entregue", color: "text-muted-foreground bg-muted", icon: Package },
];

export function NovaEncomendaModal({ open, onOpenChange, onSubmit, encomenda }: NovaEncomendaModalProps) {
  const { user } = useAuth();
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [itens, setItens] = useState<EncomendaItem[]>([{ produto: "", quantidade: 1, preco: 0 }]);
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(undefined);
  const [estado, setEstado] = useState<"pendente" | "em_producao" | "pronto" | "entregue">("pendente");
  const [notas, setNotas] = useState("");
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receitas, setReceitas] = useState<{ id: string; nome: string; preco_venda?: number; foto_url?: string | null }[]>([]);
  const [clientes, setClientes] = useState<{ nome: string; telefone: string }[]>([]);

  const isEditing = !!encomenda;

  const fetchData = async () => {
    if (!user?.id) return;
    console.log("[NovaEncomendaModal] Buscando receitas e clientes...");
    const [recRes, cliRes] = await Promise.all([
      supabase.from('receitas').select('id, nome, preco_venda, foto_url').eq('user_id', user.id).order('nome'),
      supabase.from('clientes').select('nome, telefone').eq('user_id', user.id).order('nome')
    ]);

    if (recRes.error) console.error("[NovaEncomendaModal] Erro ao buscar receitas:", recRes.error);
    if (cliRes.error) console.error("[NovaEncomendaModal] Erro ao buscar clientes:", cliRes.error);

    if (recRes.data) setReceitas(recRes.data);
    if (cliRes.data) setClientes(cliRes.data);
  };

  // Carrega dados iniciais e ao abrir
  useEffect(() => {
    if (open && user?.id) {
      fetchData();
    }
  }, [open, user?.id]);

  // Sincroniza estado com a encomenda ao editar
  useEffect(() => {
    if (open) {
      if (encomenda) {
        setNomeCliente(encomenda.nomeCliente || "");
        setTelefone(encomenda.telefone || "");

        // Handle conversion from old schema if necessary
        if (encomenda.itens && encomenda.itens.length > 0) {
          setItens(encomenda.itens);
        } else if (encomenda.produto) {
          setItens([{
            produto: encomenda.produto,
            quantidade: encomenda.quantidade || 1,
            preco: encomenda.preco || 0
          }]);
        } else {
          setItens([{ produto: "", quantidade: 1, preco: 0 }]);
        }

        setDataEntrega(encomenda.dataEntrega ? new Date(encomenda.dataEntrega) : undefined);
        setEstado(encomenda.estado || "pendente");
        setNotas(encomenda.notas || "");
        setImagemFile(null);

        // Priority for image preview
        if (typeof encomenda.imagemInspiracao === "string" && encomenda.imagemInspiracao) {
          setImagemPreview(encomenda.imagemInspiracao);
        } else {
          // If editing an item with only one product, try fallback from recipe
          const firstProduct = encomenda.itens?.[0]?.produto || encomenda.produto;
          const recipeMatch = receitas.find(r => r.nome === firstProduct);
          if (recipeMatch?.foto_url) {
            setImagemPreview(recipeMatch.foto_url);
          } else {
            setImagemPreview(null);
          }
        }
      } else if (!isEditing) {
        setNomeCliente("");
        setTelefone("");
        setItens([{ produto: "", quantidade: 1, preco: 0 }]);
        setDataEntrega(undefined);
        setEstado("pendente");
        setNotas("");
        setImagemFile(null);
        setImagemPreview(null);
      }
    }
  }, [open, encomenda, isEditing, receitas]);

  const handleAddItem = () => {
    setItens([...itens, { produto: "", quantidade: 1, preco: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof EncomendaItem, value: any) => {
    const newItens = [...itens];
    (newItens[index] as any)[field] = value;

    // Se mudar o produto, tentar buscar o preço e a foto (apenas no primeiro item para foto)
    if (field === "produto") {
      const receitaSelecionada = receitas.find(r => r.nome === value);
      if (receitaSelecionada) {
        if (receitaSelecionada.preco_venda) {
          newItens[index].preco = receitaSelecionada.preco_venda;
        }
        if (index === 0 && receitaSelecionada.foto_url && !imagemPreview) {
          setImagemPreview(receitaSelecionada.foto_url);
        }
      }
    }
    setItens(newItens);
  };

  const handleClienteChange = (nome: string) => {
    setNomeCliente(nome);
    const nomeLimpo = nome.trim().toLowerCase();
    const clienteExistente = clientes.find(c =>
      c.nome.trim().toLowerCase() === nomeLimpo
    );
    if (clienteExistente) {
      setTelefone(clienteExistente.telefone);
    }
  };

  const handleClienteBlur = () => {
    // Reforça a busca ao sair do campo, caso o datalist não tenha disparado corretamente o match
    const clienteExistente = clientes.find(c =>
      c.nome.trim().toLowerCase() === nomeCliente.trim().toLowerCase()
    );
    if (clienteExistente && !telefone) {
      setTelefone(clienteExistente.telefone);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagemPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagemFile(null);
    setImagemPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const valorTotal = itens.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      nomeCliente,
      telefone,
      itens,
      dataEntrega,
      estado,
      notas,
      imagemInspiracao: imagemFile || imagemPreview,
      // Pass legacy fields for compatibility
      produto: itens[0].produto,
      quantidade: itens[0].quantidade,
      preco: itens[0].preco
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Encomenda" : "Nova Encomenda"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Registe os detalhes e adicione um ou mais produtos.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dados do Cliente */}
          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <Label htmlFor="nomeCliente" className="flex items-center gap-2">
                Nome do Cliente * <Lock className="w-3 h-3 text-lucro" />
              </Label>
              <div className="relative">
                <Input
                  id="nomeCliente"
                  placeholder="Nome do cliente"
                  value={nomeCliente}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => setShowClienteDropdown(false), 200);
                    handleClienteBlur();
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  autoComplete="off"
                  required
                />
                {/* Custom Dropdown for Clients */}
                {showClienteDropdown && nomeCliente.length > 0 && (
                  (() => {
                    const filtered = clientes.filter(c =>
                      c.nome.toLowerCase().includes(nomeCliente.toLowerCase())
                    );
                    if (filtered.length === 0 || (filtered.length === 1 && filtered[0].nome.toLowerCase() === nomeCliente.toLowerCase())) return null;
                    return (
                      <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden animate-in-fade max-h-[180px] overflow-y-auto custom-scrollbar">
                        {filtered.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNomeCliente(c.nome);
                              setTelefone(c.telefone);
                              setShowClienteDropdown(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-[#EFB6BF]/10 flex items-center justify-center shrink-0">
                              <span className="text-xs font-black text-[#EFB6BF]">{c.nome.charAt(0).toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-800">{c.nome}</p>
                              <p className="text-[12px] font-medium text-gray-500">{c.telefone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    );
                  })()
                )}
                {clientes.length > 0 && !nomeCliente && (
                  <p className="text-[12px] text-gray-500 font-medium mt-1">
                    💡 Digite para buscar clientes cadastrados...
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-2">
                Telefone <Lock className="w-3 h-3 text-lucro" />
              </Label>
              <Input
                id="telefone"
                placeholder="Ex: 912 345 678"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-bold">Produtos da Encomenda</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-[12px] h-7 gap-1 border-primary/20 hover:bg-primary/5"
              >
                <Plus className="w-3 h-3" /> Adicionar item
              </Button>
            </div>

            <div className="space-y-3">
              {itens.map((item, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-xl border border-border/50 relative space-y-2">
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-despesa transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[12px] uppercase font-bold text-muted-foreground">Produto {index + 1}</Label>
                    <Select
                      value={item.produto}
                      onValueChange={(val) => handleItemChange(index, "produto", val)}
                      required
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {receitas.map((receita) => (
                          <SelectItem key={receita.id} value={receita.nome}>
                            {receita.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[12px] uppercase font-bold text-muted-foreground">Qtd</Label>
                      <Input
                        type="number"
                        min="1"
                        className="h-9"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, "quantidade", parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[12px] uppercase font-bold text-muted-foreground">Preço Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="h-9"
                        value={item.preco || ""}
                        onChange={(e) => handleItemChange(index, "preco", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Valor Total da Encomenda */}
          <div className="bg-[#EFB6BF]/10 p-3 rounded-xl border border-[#EFB6BF]/20 flex justify-between items-center shadow-sm">
            <div>
              <p className="text-[12px] font-black text-[#EFB6BF] uppercase tracking-wider">Valor Total da Encomenda</p>
              <p className="text-lg font-black text-foreground">{formatarMoeda(valorTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-black text-muted-foreground/40 uppercase tracking-wider">Total de Itens</p>
              <p className="text-xs font-bold text-muted-foreground/60">{itens.reduce((acc, i) => acc + i.quantidade, 0)} un.</p>
            </div>
          </div>

          {/* Imagem de Inspiração */}
          <div className="space-y-2">
            <Label>Imagem de Inspiração</Label>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {!imagemPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                Adicionar foto
              </button>
            ) : (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border">
                <img src={imagemPreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Data de Entrega */}
            <div className="space-y-2">
              <Label>Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataEntrega && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataEntrega ? format(dataEntrega, "dd/MM/yyyy", { locale: ptBR }) : <span>dd/mm/aaaa</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataEntrega} onSelect={setDataEntrega} initialFocus locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={estado} onValueChange={(val) => setEstado(val as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {estadoOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full",
                          opt.value === "pendente" || opt.value === "em_producao" ? "bg-lucro" :
                            opt.value === "pronto" ? "bg-receita" : "bg-muted-foreground"
                        )} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Observações especiais..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 rounded-[20px] bg-[#EFB6BF] hover:bg-[#e8a0ab] text-white font-black text-sm shadow-lg shadow-[#EFB6BF]/20 border-none mt-4 transition-all active:scale-[0.98]"
          >
            {isEditing ? "Salvar Alterações" : `Finalizar Encomenda`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
