import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { FileEdit, Package, Cake, Ruler, UtensilsCrossed, Info, Plus } from "lucide-react";

interface NovoOrcamentoProntoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
}

export function NovoOrcamentoProntoModal({ open, onOpenChange, onSubmit }: NovoOrcamentoProntoModalProps) {
    const [nomeTemplate, setNomeTemplate] = useState("");
    const [descricao, setDescricao] = useState("");
    const [tipoEncomenda, setTipoEncomenda] = useState<"bolo" | "kit">("bolo");
    const [descricaoKit, setDescricaoKit] = useState("");
    const [tema, setTema] = useState("");
    const [porcoes, setPorcoes] = useState("");
    const [sabor, setSabor] = useState("");
    const [recheio, setRecheio] = useState("");
    const [cobertura, setCobertura] = useState("");

    // Custom Options States
    const [isCreatingSabor, setIsCreatingSabor] = useState(false);
    const [novaSabor, setNovaSabor] = useState("");
    const [opcoesSabor, setOpcoesSabor] = useState(["Chocolate", "Baunilha", "Red Velvet", "Limão", "Cenoura"]);

    const [isCreatingRecheio, setIsCreatingRecheio] = useState(false);
    const [novaRecheio, setNovaRecheio] = useState("");
    const [opcoesRecheio, setOpcoesRecheio] = useState(["Brigadeiro", "Leite Ninho", "Doce de Leite", "Nozes", "Frutas Vermelhas"]);

    const [isCreatingCobertura, setIsCreatingCobertura] = useState(false);
    const [novaCobertura, setNovaCobertura] = useState("");
    const [opcoesCobertura, setOpcoesCobertura] = useState(["Chantininho", "Ganache", "Buttercream", "Pasta Americana"]);

    const [custoTotal, setCustoTotal] = useState("0");
    const [tipoLucro, setTipoLucro] = useState("fixo");
    const [lucroValor, setLucroValor] = useState("0");
    const [tipoDesconto, setTipoDesconto] = useState("fixo");
    const [descontoValor, setDescontoValor] = useState("0");
    const [observacoes, setObservacoes] = useState("");

    const calcularPrecoFinal = () => {
        const custo = parseFloat(custoTotal) || 0;
        let lucro = parseFloat(lucroValor) || 0;
        let desconto = parseFloat(descontoValor) || 0;

        if (tipoLucro === "porcentagem") {
            lucro = (custo * lucro) / 100;
        }

        if (tipoDesconto === "porcentagem") {
            const subtotal = custo + lucro;
            desconto = (subtotal * desconto) / 100;
        }

        return Math.max(0, custo + lucro - desconto);
    };

    const precoFinal = calcularPrecoFinal();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            nomeTemplate,
            descricao,
            tipoEncomenda,
            descricaoKit: tipoEncomenda === "kit" ? descricaoKit : "",
            tema,
            porcoes,
            sabor,
            recheio,
            cobertura,
            custoTotal: parseFloat(custoTotal),
            tipoLucro,
            lucroValor: parseFloat(lucroValor),
            tipoDesconto,
            descontoValor: parseFloat(descontoValor),
            precoFinal,
            observacoes
        });
        // Reset form
        setNomeTemplate("");
        setDescricao("");
        setDescricaoKit(""); // Reset new state
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-8 bg-white overflow-y-auto custom-scrollbar">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <FileEdit className="w-5 h-5 text-muted-foreground" />
                            <DialogTitle className="text-xl font-bold text-foreground">
                                Criar Orçamento Pronto
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Template Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome do Template *</Label>
                                <Input
                                    id="nome"
                                    placeholder="Ex: Bolo 20 cm, Kit Festa Premium..."
                                    value={nomeTemplate}
                                    onChange={(e) => setNomeTemplate(e.target.value)}
                                    required
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição (opcional)</Label>
                                <Textarea
                                    id="descricao"
                                    placeholder="Descrição breve do que está incluído..."
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    className="bg-white min-h-[80px]"
                                />
                            </div>
                        </div>

                        {/* Order Details Card */}
                        <div className="p-6 rounded-3xl border border-border/40 bg-[#FDFCFB] space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-foreground font-bold text-sm">
                                <Cake className="w-4 h-4" /> Detalhes da Encomenda
                            </div>

                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-muted-foreground uppercase">Tipo de Encomenda</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            tipoEncomenda === "bolo" ? "border-[#EFB6BF]" : "border-border group-hover:border-[#EFB6BF]/50"
                                        )}>
                                            {tipoEncomenda === "bolo" && <div className="w-2.5 h-2.5 rounded-full bg-[#EFB6BF]" />}
                                        </div>
                                        <input type="radio" className="hidden" checked={tipoEncomenda === "bolo"} onChange={() => setTipoEncomenda("bolo")} />
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                            <Cake className="w-4 h-4 text-muted-foreground" /> Só bolo
                                        </span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            tipoEncomenda === "kit" ? "border-[#EFB6BF]" : "border-border group-hover:border-[#EFB6BF]/50"
                                        )}>
                                            {tipoEncomenda === "kit" && <div className="w-2.5 h-2.5 rounded-full bg-[#EFB6BF]" />}
                                        </div>
                                        <input type="radio" className="hidden" checked={tipoEncomenda === "kit"} onChange={() => setTipoEncomenda("kit")} />
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                            <Package className="w-4 h-4 text-muted-foreground" /> Kit festa
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {tipoEncomenda === "kit" && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <Label htmlFor="descricaoKit">Descrição do Kit</Label>
                                    <Textarea
                                        id="descricaoKit"
                                        placeholder="Ex: Bolo + 12 cupcakes + 20 cakepops + 30 bolachinhas"
                                        value={descricaoKit}
                                        onChange={(e) => setDescricaoKit(e.target.value)}
                                        className="bg-white min-h-[80px]"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="tema">Tema / Design</Label>
                                <Input
                                    id="tema"
                                    placeholder="Ex: Patrulha Pata, Elegante com flores"
                                    value={tema}
                                    onChange={(e) => setTema(e.target.value)}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="porcoes">Nº de Porções / Tamanho</Label>
                                <Input
                                    id="porcoes"
                                    placeholder="Ex: 20 pessoas, Bolo 20 cm, 2 andares"
                                    value={porcoes}
                                    onChange={(e) => setPorcoes(e.target.value)}
                                    className="bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {/* Sabor / Massa */}
                                <div className="space-y-2">
                                    <Label>Sabor / Massa</Label>
                                    {isCreatingSabor ? (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <Input
                                                placeholder="Nome do sabor"
                                                value={novaSabor}
                                                onChange={(e) => setNovaSabor(e.target.value)}
                                                className="bg-white"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (novaSabor.trim()) {
                                                        setOpcoesSabor([...opcoesSabor, novaSabor.trim()]);
                                                        setSabor(novaSabor.trim());
                                                        setIsCreatingSabor(false);
                                                        setNovaSabor("");
                                                    }
                                                }}
                                                className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground w-12 h-10 p-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreatingSabor(false)}
                                                className="bg-white border-border h-10"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select value={sabor} onValueChange={(val) => val === "NEW" ? setIsCreatingSabor(true) : setSabor(val)}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Selecione ou escreva abaixo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {opcoesSabor.map((s) => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                                <div className="border-t my-1" />
                                                <SelectItem value="NEW" className="text-primary font-medium">+ Criar novo...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* Recheio */}
                                <div className="space-y-2">
                                    <Label>Recheio</Label>
                                    {isCreatingRecheio ? (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <Input
                                                placeholder="Nome do recheio"
                                                value={novaRecheio}
                                                onChange={(e) => setNovaRecheio(e.target.value)}
                                                className="bg-white"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (novaRecheio.trim()) {
                                                        setOpcoesRecheio([...opcoesRecheio, novaRecheio.trim()]);
                                                        setRecheio(novaRecheio.trim());
                                                        setIsCreatingRecheio(false);
                                                        setNovaRecheio("");
                                                    }
                                                }}
                                                className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground w-12 h-10 p-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreatingRecheio(false)}
                                                className="bg-white border-border h-10"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select value={recheio} onValueChange={(val) => val === "NEW" ? setIsCreatingRecheio(true) : setRecheio(val)}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Selecione ou escreva abaixo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {opcoesRecheio.map((r) => (
                                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                                ))}
                                                <div className="border-t my-1" />
                                                <SelectItem value="NEW" className="text-primary font-medium">+ Criar novo...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* Cobertura */}
                                <div className="space-y-2">
                                    <Label>Cobertura</Label>
                                    {isCreatingCobertura ? (
                                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <Input
                                                placeholder="Nome da cobertura"
                                                value={novaCobertura}
                                                onChange={(e) => setNovaCobertura(e.target.value)}
                                                className="bg-white"
                                                autoFocus
                                            />
                                            <Button
                                                type="button"
                                                onClick={() => {
                                                    if (novaCobertura.trim()) {
                                                        setOpcoesCobertura([...opcoesCobertura, novaCobertura.trim()]);
                                                        setCobertura(novaCobertura.trim());
                                                        setIsCreatingCobertura(false);
                                                        setNovaCobertura("");
                                                    }
                                                }}
                                                className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground w-12 h-10 p-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreatingCobertura(false)}
                                                className="bg-white border-border h-10"
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    ) : (
                                        <Select value={cobertura} onValueChange={(val) => val === "NEW" ? setIsCreatingCobertura(true) : setCobertura(val)}>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="Selecione ou escreva abaixo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {opcoesCobertura.map((c) => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                                <div className="border-t my-1" />
                                                <SelectItem value="NEW" className="text-primary font-medium">+ Criar novo...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Values Card */}
                        <div className="p-6 rounded-3xl border border-border/40 bg-[#FDFCFB] space-y-4">
                            <div className="flex items-center gap-2 mb-2 text-foreground font-bold text-sm">
                                <span className="text-receita font-bold">R$</span> Valores
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custo">Custo Total (R$)</Label>
                                <Input
                                    id="custo"
                                    type="number"
                                    value={custoTotal}
                                    onChange={(e) => setCustoTotal(e.target.value)}
                                    className="bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Lucro</Label>
                                    <Select value={tipoLucro} onValueChange={setTipoLucro}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixo">R$ Valor Fixo</SelectItem>
                                            <SelectItem value="porcentagem">% Porcentagem</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Lucro ({tipoLucro === "fixo" ? "R$" : "%"})</Label>
                                    <Input
                                        type="number"
                                        value={lucroValor}
                                        onChange={(e) => setLucroValor(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tipo de Desconto</Label>
                                    <Select value={tipoDesconto} onValueChange={setTipoDesconto}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="fixo">R$ Valor Fixo</SelectItem>
                                            <SelectItem value="porcentagem">% Porcentagem</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Desconto ({tipoDesconto === "fixo" ? "R$" : "%"})</Label>
                                    <Input
                                        type="number"
                                        value={descontoValor}
                                        onChange={(e) => setDescontoValor(e.target.value)}
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            {/* Final Price Display */}
                            <div className="mt-4 p-6 rounded-[2rem] bg-[#FEF7F8] flex items-center justify-between border border-[#EFB6BF]/20">
                                <div className="text-sm font-medium text-muted-foreground">Preço Final</div>
                                <div className="text-3xl font-bold text-[#EFB6BF]">
                                    R$ {precoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {/* Observations */}
                        <div className="space-y-2">
                            <Label htmlFor="obs">Observações (opcional)</Label>
                            <Textarea
                                id="obs"
                                placeholder="Notas adicionais sobre este orçamento pronto..."
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                className="bg-white min-h-[100px]"
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-4 pt-4 pb-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 py-6 rounded-2xl border-border bg-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 py-6 bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-foreground font-bold rounded-2xl"
                            >
                                Criar Orçamento Pronto
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
