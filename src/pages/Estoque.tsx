import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Package,
  AlertTriangle,
  Edit2,
  Trash2,
  Search,
  ShoppingBag,
  Box,
  Layers,
  ChevronRight,
  Beaker,
  Building2,
  DollarSign,
  Clock
} from "lucide-react";
// Imports dos Modais (Mantidos para não quebrar build, mas componentes serão comentados no JSX)
import { NovoProdutoModal, ProdutoData } from "@/components/estoque/NovoProdutoModal";
import { NovoKitModal } from "@/components/estoque/NovoKitModal";
import { NovoInsumoModal, InsumoData } from "@/components/estoque/NovoInsumoModal";
import { NovoCustoFixoModal, CustoFixoData } from "@/components/estoque/NovoCustoFixoModal";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  minimo: number;
  preco_medio: number;
  preco_venda?: number;
  fornecedor: string;
  data_validade: string;
  unidade_compra?: string;
  quantidade_por_embalagem?: number;
  preco_embalagem?: number;
  perdas_percentual?: number;
  ativo?: boolean;
}

interface CustoFixo {
  id: string;
  nome: string;
  valor_mensal: number;
  categoria: string;
  ativo: boolean;
  created_at?: string;
}

interface ItemKitFetch {
  receita_id?: string;
  produto_id?: string;
  nome: string;
  papel: string;
  quantidade: number;
  unidade: string;
}

interface KitReceita {
  id: string;
  nome: string;
  descricao?: string;
  preco_venda: number;
  created_at?: string;
  itens?: ItemKitFetch[];
}

export default function Estoque() {
  const { toast } = useToast();
  const [showNovoProduto, setShowNovoProduto] = useState(false);
  const [showNovoKit, setShowNovoKit] = useState(false);
  const [showNovoInsumo, setShowNovoInsumo] = useState(false);
  const [showNovoCustoFixo, setShowNovoCustoFixo] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);
  const [insumoParaEditar, setInsumoParaEditar] = useState<Produto | null>(null);
  const [kitParaEditar, setKitParaEditar] = useState<KitReceita | null>(null);
  const [custoFixoParaEditar, setCustoFixoParaEditar] = useState<CustoFixo | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [kits, setKits] = useState<KitReceita[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Insumos");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProdutos();
    fetchCustosFixos();
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      const { data: kitsData, error } = await supabase
        .from('kits_receitas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        if (!error.message.includes('does not exist')) throw error;
        return;
      }
      if (kitsData) {
        // Fetch items for each kit in parallel
        const kitsComItens = await Promise.all(
          kitsData.map(async (kit: KitReceita) => {
            const { data: itens, error: itensError } = await supabase
              .from('kit_receita_itens')
              .select('papel, quantidade, unidade, receita_id, produto_id, receitas(nome), produtos(nome)')
              .eq('kit_id', kit.id);

            if (itensError) console.error(`Erro ao buscar itens do kit ${kit.id}:`, itensError);

            return {
              ...kit,
              itens: (itens || []).map((i: any) => ({
                papel: i.papel,
                nome: i.receitas?.nome || i.produtos?.nome || i.nome || 'Item não encontrado',
                receita_id: i.receita_id,
                produto_id: i.produto_id,
                quantidade: i.quantidade,
                unidade: i.unidade
              }))
            };
          })
        );
        setKits(kitsComItens);
      }
    } catch (error: any) {
      console.error('Erro ao carregar kits:', error);
    }
  };

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) setProdutos(data);
    } catch (error: any) {
      console.error('Erro ao carregar estoque:', error);
      if (!error.message?.includes('does not exist')) {
        toast({
          title: "Erro ao carregar estoque",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCustosFixos = async () => {
    try {
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .order('nome', { ascending: true });

      if (error) {
        if (!error.message.includes('does not exist')) throw error;
      }
      if (data) setCustosFixos(data);
    } catch (error: any) {
      console.error('Erro ao carregar custos fixos:', error);
    }
  };

  // Funções handlers (simplificadas para evitar erros de TS, mas lógica mantida)
  const handleAddProduto = async (produto: ProdutoData) => {
    try {
      setLoading(true);
      const isEditing = !!produtoParaEditar;
      const payload = {
        nome: produto.nome,
        categoria: produto.categoria,
        quantidade: produto.quantidade,
        unidade: produto.unidade,
        minimo: produto.minimo,
        preco_medio: produto.precoMedio,
        preco_venda: produto.precoVenda,
        fornecedor: produto.fornecedor,
        data_validade: produto.dataValidade?.toISOString(),
        ativo: true
      };

      if (isEditing) {
        const { error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', produtoParaEditar.id);
        if (error) throw error;
        toast({ title: "Produto atualizado!" });
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Produto cadastrado!" });
      }
      fetchProdutos();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInsumo = async (insumo: InsumoData) => {
    try {
      setLoading(true);
      const isEditing = !!insumoParaEditar;

      // Calcular preço médio por unidade básica (g, ml, un)
      let precoMedio = insumo.preco_embalagem / (insumo.quantidade_por_embalagem || 1);
      if (insumo.unidade_compra === 'kg' || insumo.unidade_compra === 'L') {
        precoMedio = insumo.preco_embalagem / ((insumo.quantidade_por_embalagem || 1) * 1000);
      }

      const payload = {
        nome: insumo.nome,
        categoria: insumo.categoria,
        unidade_compra: insumo.unidade_compra,
        quantidade_por_embalagem: insumo.quantidade_por_embalagem,
        preco_embalagem: insumo.preco_embalagem,
        perdas_percentual: insumo.perdas_percentual,
        quantidade: insumo.quantidade,
        unidade: (insumo.unidade_compra === 'kg' || insumo.unidade_compra === 'g') ? 'g' :
          (insumo.unidade_compra === 'L' || insumo.unidade_compra === 'ml') ? 'ml' : 'un',
        preco_medio: precoMedio,
        fornecedor: insumo.fornecedor,
        minimo: insumo.minimo,
        ativo: true
      };

      if (isEditing) {
        const { error } = await supabase
          .from('produtos')
          .update(payload)
          .eq('id', insumoParaEditar.id);
        if (error) throw error;
        toast({ title: "Insumo atualizado!" });
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Insumo cadastrado!" });
      }
      fetchProdutos();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKit = async (kit: any) => {
    try {
      setLoading(true);
      const isEditing = !!kit.id;

      if (isEditing) {
        // 1. Atualizar o kit principal
        const { error: kitError } = await supabase
          .from('kits_receitas')
          .update({ nome: kit.nome, descricao: kit.descricao, preco_venda: kit.preco_venda })
          .eq('id', kit.id);
        if (kitError) throw kitError;

        // 2. Sincronizar itens (mais simples deletar e inserir de novo)
        await supabase.from('kit_receita_itens').delete().eq('kit_id', kit.id);

        if (kit.itens && kit.itens.length > 0) {
          const itensPayload = kit.itens.map((item: any) => ({
            kit_id: kit.id,
            receita_id: item.receita_id,
            produto_id: item.produto_id,
            papel: item.papel,
            quantidade: item.quantidade,
            unidade: item.unidade
          }));
          const { error: itensError } = await supabase
            .from('kit_receita_itens')
            .insert(itensPayload);
          if (itensError) throw itensError;
        }

        toast({ title: "Kit atualizado!", description: kit.nome });
      } else {
        // 1. Salvar o kit principal
        const { data: kitData, error: kitError } = await supabase
          .from('kits_receitas')
          .insert([{ nome: kit.nome, descricao: kit.descricao, preco_venda: kit.preco_venda }])
          .select()
          .single();
        if (kitError) throw kitError;

        // 2. Salvar os itens do kit
        if (kit.itens && kit.itens.length > 0) {
          const itensPayload = kit.itens.map((item: any) => ({
            kit_id: kitData.id,
            receita_id: item.receita_id,
            produto_id: item.produto_id,
            papel: item.papel,
            quantidade: item.quantidade,
            unidade: item.unidade
          }));
          const { error: itensError } = await supabase
            .from('kit_receita_itens')
            .insert(itensPayload);

          if (itensError) {
            // Se falhar ao salvar itens, removemos o kit "vazio" para não poluir
            await supabase.from('kits_receitas').delete().eq('id', kitData.id);
            throw itensError;
          }
        }
        toast({ title: "Kit criado com sucesso! 🎉", description: kit.nome });
      }

      fetchKits();
      setShowNovoKit(false);
      setKitParaEditar(null);
    } catch (error: any) {
      toast({ title: "Erro ao salvar kit", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKit = async (id: string) => {
    try {
      const { error } = await supabase.from('kits_receitas').delete().eq('id', id);
      if (error) throw error;
      setKits(kits.filter(k => k.id !== id));
      toast({ title: "Kit removido" });
    } catch (error: any) {
      toast({ title: "Erro ao remover kit", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveCustoFixo = async (custo: CustoFixoData) => {
    try {
      setLoading(true);
      const isEditing = !!custoFixoParaEditar;
      const payload = {
        nome: custo.nome,
        valor_mensal: custo.valor_mensal,
        categoria: custo.categoria,
        ativo: custo.ativo
      };

      if (isEditing) {
        const { error } = await supabase
          .from('custos_fixos')
          .update(payload)
          .eq('id', custoFixoParaEditar.id);
        if (error) throw error;
        toast({ title: "Custo mensal atualizado!" });
      } else {
        const { error } = await supabase
          .from('custos_fixos')
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Custo mensal cadastrado!" });
      }
      fetchCustosFixos();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduto = async (id: string) => {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      setProdutos(produtos.filter(p => p.id !== id));
      toast({ title: "Item removido" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteCustoFixo = async (id: string) => {
    try {
      const { error } = await supabase.from('custos_fixos').delete().eq('id', id);
      if (error) throw error;
      setCustosFixos(custosFixos.filter(c => c.id !== id));
      toast({ title: "Custo fixo removido" });
    } catch (error: any) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    const insumosTotal = produtos.filter(p =>
      ['Ingredientes', 'Embalagem', 'Decoração', 'Descartáveis', 'Ingredientes'].includes(p.categoria) ||
      (p.unidade_compra !== undefined && p.unidade_compra !== null)
    ).length;

    const acabados = produtos.filter(p => p.categoria === "Produtos Acabados").length;
    const kitsTotal = kits.length;
    const baixo = produtos.filter(p => p.quantidade <= p.minimo).length;
    const custoFixoTotal = custosFixos.reduce((total, item) => total + (item.ativo ? Number(item.valor_mensal) : 0), 0);
    return { insumos: insumosTotal, acabados, kits: kitsTotal, baixo, custoFixoTotal };
  }, [produtos, custosFixos, kits]);

  const filteredProdutos = useMemo(() => {
    return produtos.filter(p => {
      let matchesTab = false;
      if (activeTab === "Insumos") {
        matchesTab = (
          ['Ingredientes', 'Embalagem', 'Decoração', 'Descartáveis'].includes(p.categoria) ||
          (p.unidade_compra !== undefined && p.unidade_compra !== null)
        );
      } else {
        matchesTab = p.categoria === activeTab;
      }
      const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [produtos, activeTab, searchTerm]);

  return (
    <>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-gray-800">Estoque de <span className="text-[#EFB6BF]">Produtos</span></h1>
          <Button
            onClick={() => {
              if (activeTab === "Insumos") setShowNovoInsumo(true);
              else if (activeTab === "Custos Fixos") setShowNovoCustoFixo(true);
              else if (activeTab === "Kits") setShowNovoKit(true);
              else setShowNovoProduto(true);
            }}
            className="bg-[#EFB6BF] hover:bg-[#EFB6BF]/90 text-white font-black rounded-full h-9 px-6 shadow-lg shadow-[#EFB6BF]/20 flex items-center gap-2 text-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {activeTab === "Insumos" ? "Novo insumo" : activeTab === "Custos Fixos" ? "Novo custo mensal" : activeTab === "Kits" ? "Novo kit" : "Novo produto"}
          </Button>
        </div>

        {/* Top Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100/50 shadow-sm flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500" />
            <div className="flex items-center gap-2 text-amber-500/60 text-sm font-medium uppercase tracking-[0.2em] relative z-10">
              <Beaker className="w-3.5 h-3.5" /> Insumos
            </div>
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-800 tracking-tighter">{stats.insumos}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100/50 shadow-sm flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500" />
            <div className="flex items-center gap-2 text-green-500/60 text-sm font-medium uppercase tracking-[0.2em] relative z-10">
              <Package className="w-3.5 h-3.5" /> Finalizados
            </div>
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-800 tracking-tighter">{stats.acabados}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100/50 shadow-sm flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500" />
            <div className="flex items-center gap-2 text-[#EFB6BF] text-sm font-medium uppercase tracking-[0.2em] relative z-10">
              <ShoppingBag className="w-3.5 h-3.5" /> Kits
            </div>
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-gray-800 tracking-tighter">{stats.kits}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100/50 shadow-sm flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12" />
            <div className="flex items-center gap-2 text-rose-500/60 text-sm font-medium uppercase tracking-[0.2em] relative z-10">
              <AlertTriangle className="w-3.5 h-3.5" /> Críticos
            </div>
            <div className="relative z-10 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-rose-500 tracking-tighter">{stats.baixo}</span>
            </div>
          </div>
        </div>

        {/* Tabs Selector */}
        <div className="bg-gray-100/50 p-1.5 rounded-full flex max-w-fit flex-wrap">
          {["Insumos", "Produtos Acabados", "Kits", "Custos Fixos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-white text-gray-800 shadow-sm border border-gray-100/50" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <Input
            placeholder="O que você está procurando?..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-none h-10 pl-11 rounded-xl text-sm font-semibold text-gray-700 placeholder:text-gray-300 shadow-sm focus:shadow-md transition-all"
          />
        </div>

        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-gray-50">
                <TableHead className="font-bold text-[12px] uppercase tracking-wider text-gray-400 pl-6 h-10">Item & Categoria</TableHead>
                {activeTab === "Custos Fixos" ? (
                  <>
                    <TableHead className="font-bold text-[12px] uppercase tracking-wider text-gray-400">Valor Mensal</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-wider text-gray-400">Status</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-bold text-[12px] uppercase tracking-wider text-gray-400">Estoque Atual</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-wider text-gray-400">Mínimo</TableHead>
                    <TableHead className="font-bold text-[12px] uppercase tracking-wider text-gray-400 text-right pr-8">Valores (Unit / Compra)</TableHead>
                  </>
                )}
                <TableHead className="text-right font-bold text-[12px] uppercase tracking-wider text-gray-400 pr-8">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-48 text-gray-300 font-bold uppercase tracking-widest text-xs">
                    Carregando estoque...
                  </TableCell>
                </TableRow>
              ) : activeTab === "Custos Fixos" ? (
                custosFixos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-48 text-gray-300 font-bold uppercase tracking-widest text-xs">
                      Nenhum custo fixo cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  custosFixos.map((custo) => (
                    <TableRow key={custo.id} className="hover:bg-gray-50/30 border-b border-gray-50 group transition-colors">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-[14px] bg-blue-50 text-blue-400 flex items-center justify-center shadow-sm">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-700 tracking-tight">{custo.nome}</span>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{custo.categoria}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-base font-black text-foreground tracking-tight">
                          {custo.valor_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full animate-pulse",
                            custo.ativo ? "bg-green-500" : "bg-gray-300"
                          )} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            custo.ativo ? "text-green-600" : "text-gray-400"
                          )}>
                            {custo.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => {
                              setCustoFixoParaEditar(custo);
                              setShowNovoCustoFixo(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleDeleteCustoFixo(custo.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : activeTab === "Kits" ? (
                kits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                      Nenhum kit criado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  kits.filter(k => k.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((kit) => (
                    <TableRow key={kit.id} className="hover:bg-gray-50/50 border-b border-border/5 group transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center shadow-sm border border-border/10">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-gray-800 tracking-tight">{kit.nome}</span>
                            <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest truncate max-w-[200px]">
                              {kit.descricao || "Sem descrição"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell colSpan={2}>
                        <div className="flex flex-wrap gap-1">
                          {(kit.itens || []).slice(0, 3).map((item, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-[9px] font-black rounded-lg border border-border/5 uppercase tracking-tighter">
                              {item.nome}
                            </span>
                          ))}
                          {(kit.itens || []).length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-400 text-[9px] font-black rounded-lg border border-border/5 uppercase tracking-tighter">
                              +{kit.itens.length - 3} itens
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end">
                          <span className="text-base font-black text-foreground tracking-tight">
                            {kit.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Preço de Venda</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
                            onClick={() => {
                              setKitParaEditar(kit);
                              setShowNovoKit(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleDeleteKit(kit.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((produto) => (
                  <TableRow key={produto.id} className="hover:bg-gray-50/50 border-b border-border/5 group transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border border-border/10",
                          activeTab === "Insumos" ? "bg-amber-50 text-amber-500" : "bg-green-50 text-green-500"
                        )}>
                          {activeTab === "Insumos" ? <Beaker className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-gray-800 tracking-tight">{produto.nome}</span>
                          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{produto.categoria}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className={cn(
                            "text-lg font-black",
                            produto.quantidade <= produto.minimo ? "text-red-500" : "text-green-600"
                          )}>
                            {produto.quantidade}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">{produto.unidade}</span>
                        </div>
                        {produto.quantidade <= produto.minimo && (
                          <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Estoque Crítico</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline gap-1 opacity-40">
                        <span className="text-sm font-bold text-foreground">{produto.minimo}</span>
                        <span className="text-[9px] font-bold uppercase">{produto.unidade}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-black text-foreground tracking-tight">
                          {produto.unidade === 'g' || produto.unidade === 'ml'
                            ? (produto.preco_medio || 0).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 5
                            })
                            : produto.preco_medio?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
                          } <span className="text-[8px] text-muted-foreground/40 font-bold">/ {produto.unidade.toUpperCase()}</span>
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase">
                          Compra: {produto.preco_embalagem?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5"
                          onClick={() => {
                            if (activeTab === "Insumos") {
                              setInsumoParaEditar(produto);
                              setShowNovoInsumo(true);
                            } else {
                              setProdutoParaEditar(produto);
                              setShowNovoProduto(true);
                            }
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                          onClick={() => handleDeleteProduto(produto.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* MODAIS PARCIALMENTE ATIVOS */}

      <NovoProdutoModal
        open={showNovoProduto}
        onOpenChange={(open) => {
          setShowNovoProduto(open);
          if (!open) setProdutoParaEditar(null);
        }}
        onSubmit={handleAddProduto}
        produto={produtoParaEditar ? {
          ...produtoParaEditar,
          precoMedio: produtoParaEditar.preco_medio,
          precoVenda: produtoParaEditar.preco_venda,
          dataValidade: (() => {
            if (!produtoParaEditar.data_validade) return undefined;
            const d = new Date(produtoParaEditar.data_validade);
            return isNaN(d.getTime()) ? undefined : d;
          })()
        } : undefined}
      />

      <NovoInsumoModal
        open={showNovoInsumo}
        onOpenChange={(open) => {
          setShowNovoInsumo(open);
          if (!open) setInsumoParaEditar(null);
        }}
        onSubmit={handleAddInsumo}
        insumo={insumoParaEditar ? {
          ...insumoParaEditar,
          preco_embalagem: insumoParaEditar.preco_embalagem || 0,
          quantidade_por_embalagem: insumoParaEditar.quantidade_por_embalagem || 0,
          perdas_percentual: insumoParaEditar.perdas_percentual || 0,
          unidade_compra: insumoParaEditar.unidade_compra || 'kg'
        } : undefined}
      />

      <NovoKitModal
        open={showNovoKit}
        onOpenChange={(val) => {
          setShowNovoKit(val);
          if (!val) setKitParaEditar(null);
        }}
        kitParaEditar={kitParaEditar}
        onSubmit={handleCreateKit}
      />

      <NovoCustoFixoModal
        open={showNovoCustoFixo}
        onOpenChange={setShowNovoCustoFixo}
        onSubmit={handleSaveCustoFixo}
      />
    </>
  );
}
