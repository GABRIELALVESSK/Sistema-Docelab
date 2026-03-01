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
      <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in-fade">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-pink/40 flex items-center justify-center text-primary shrink-0 relative overflow-hidden">
                <Box className="w-6 h-6" />
                <div className="absolute inset-0 bg-white/10" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  Estoque de <span className="text-primary">Produtos</span>
                </h1>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Controle de Insumos e Materiais • {produtos.length} Itens
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                if (activeTab === "Insumos") setShowNovoInsumo(true);
                else if (activeTab === "Custos Fixos") setShowNovoCustoFixo(true);
                else if (activeTab === "Kits") setShowNovoKit(true);
                else setShowNovoProduto(true);
              }}
              className="bg-gray-900 hover:bg-black text-white font-black rounded-2xl h-12 px-8 flex items-center gap-2 text-[13px] transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
            >
              <Plus className="w-5 h-5" />
              {activeTab === "Insumos" ? "Novo Insumo" : activeTab === "Custos Fixos" ? "Novo Custo Mensal" : activeTab === "Kits" ? "Novo Kit" : "Novo Produto"}
            </Button>
          </div>
        </div>

        {/* Stats Summary Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Insumos", value: stats.insumos, icon: <Beaker className="w-7 h-7" />, color: "bg-amber-50 text-amber-500", sub: "Disponíveis" },
            { label: "Finalizados", value: stats.acabados, icon: <Package className="w-7 h-7" />, color: "bg-green-50 text-green-500", sub: "Prontos" },
            { label: "Kits", value: stats.kits, icon: <ShoppingBag className="w-7 h-7" />, color: "bg-pink-50 text-primary", sub: "Cadastrados" },
            { label: "Críticos", value: stats.baixo, icon: <AlertTriangle className="w-7 h-7" />, color: "bg-rose-50 text-rose-500", sub: "Reposição", urgent: stats.baixo > 0 },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[28px] p-6 border border-gray-100/60 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105", stat.color)}>
                <span className="material-symbols-outlined text-[28px]">{stat.icon}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters & Control Section */}
        <div className="bg-white rounded-[32px] p-6 border border-gray-100/50 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Tabs Selector */}
            <div className="bg-gray-50/80 p-1 rounded-2xl flex flex-wrap gap-1 border border-gray-100/30">
              {["Insumos", "Produtos Acabados", "Kits", "Custos Fixos"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeTab === tab
                      ? "bg-white text-gray-900 shadow-sm border border-gray-100 ring-1 ring-black/5"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <Input
                placeholder="O que você está procurando?..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50/50 border-gray-100 h-11 pl-12 rounded-2xl text-[14px] font-semibold text-gray-900 placeholder:text-gray-300 focus:bg-white focus:ring-primary/20 transition-all border-none shadow-inner"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-2xl border border-gray-100/50">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-gray-50 bg-gray-50/30">
                  <TableHead className="font-bold text-xs uppercase tracking-[0.1em] text-gray-400 pl-8 h-12">Item & Categoria</TableHead>
                  {activeTab === "Custos Fixos" ? (
                    <>
                      <TableHead className="font-bold text-xs uppercase tracking-[0.1em] text-gray-400">Valor Mensal</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-[0.1em] text-gray-400">Status</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="font-bold text-xs uppercase tracking-[0.1em] text-gray-400">Estoque Atual</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-[0.1em] text-gray-400">Mínimo</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-[0.1em] text-gray-400 text-right pr-12">Valores (Unit / Compra)</TableHead>
                    </>
                  )}
                  <TableHead className="text-right font-bold text-xs uppercase tracking-[0.1em] text-gray-400 pr-10">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-64">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Carregando estoque...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : activeTab === "Custos Fixos" ? (
                  custosFixos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-64">
                        <div className="flex flex-col items-center justify-center opacity-30">
                          <DollarSign className="w-12 h-12 mb-2 font-light" />
                          <p className="text-xs font-bold uppercase tracking-widest">Nenhum custo fixo</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    custosFixos.map((custo) => (
                      <TableRow key={custo.id} className="hover:bg-gray-50/30 border-b border-gray-50 group transition-colors">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50/50 text-blue-500 flex items-center justify-center shadow-sm">
                              <span className="material-symbols-outlined text-[20px]">schedule</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 tracking-tight text-[15px]">{custo.nome}</span>
                              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{custo.categoria}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-black text-gray-900 tracking-tight">
                            {custo.valor_mensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shadow-sm",
                              custo.ativo ? "bg-green-500 animate-pulse" : "bg-gray-300"
                            )} />
                            <span className={cn(
                              "text-[11px] font-bold uppercase tracking-widest",
                              custo.ativo ? "text-green-600" : "text-gray-400"
                            )}>
                              {custo.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"
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
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50"
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
                      <TableCell colSpan={7} className="text-center h-64 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center opacity-30">
                          <ShoppingBag className="w-12 h-12 mb-2 font-light" />
                          <p className="text-xs font-bold uppercase tracking-widest">Nenhum kit criado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    kits.filter(k => k.nome.toLowerCase().includes(searchTerm.toLowerCase())).map((kit) => (
                      <TableRow key={kit.id} className="hover:bg-gray-50/50 border-b border-gray-50 group transition-colors">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent-pink/50 text-primary flex items-center justify-center shadow-sm">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-800 tracking-tight text-[15px]">{kit.nome}</span>
                              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest truncate max-w-[200px]">
                                {kit.descricao || "Sem descrição"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell colSpan={2}>
                          <div className="flex flex-wrap gap-1">
                            {(kit.itens || []).slice(0, 3).map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-bold rounded-md border border-gray-200/50 uppercase tracking-wider">
                                {item.nome}
                              </span>
                            ))}
                            {(kit.itens || []).length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-md border border-gray-100/50 uppercase">
                                +{kit.itens.length - 3} itens
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-12">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-gray-900 tracking-tight">
                              {kit.preco_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">Preço de Venda</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"
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
                              className="h-8 w-8 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50"
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
                    <TableCell colSpan={7} className="text-center h-64">
                      <div className="flex flex-col items-center justify-center opacity-30">
                        <Package className="w-12 h-12 mb-2 font-light" />
                        <p className="text-xs font-bold uppercase tracking-widest">Nenhum item encontrado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProdutos.map((produto) => (
                    <TableRow key={produto.id} className="hover:bg-gray-50/50 border-b border-gray-50 group transition-colors">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden",
                            activeTab === "Insumos" ? "bg-amber-50 text-amber-500" : "bg-green-50 text-green-500"
                          )}>
                            {activeTab === "Insumos" ? <Beaker className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                            <div className="absolute inset-0 bg-white/20" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 tracking-tight text-[15px]">{produto.nome}</span>
                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{produto.categoria}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className={cn(
                              "text-lg font-black tracking-tight",
                              produto.quantidade <= produto.minimo ? "text-rose-500" : "text-green-600"
                            )}>
                              {produto.quantidade}
                            </span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{produto.unidade}</span>
                          </div>
                          {produto.quantidade <= produto.minimo && (
                            <span className="text-[8px] font-black text-rose-400 uppercase tracking-tighter bg-rose-50 px-1.5 py-0.5 rounded inline-block w-fit">Crítico</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-baseline gap-1 opacity-50">
                          <span className="text-base font-bold text-gray-500">{produto.minimo}</span>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{produto.unidade}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-12">
                        <div className="flex flex-col items-end">
                          <span className="text-[15px] font-black text-gray-900 tracking-tight">
                            {produto.unidade === 'g' || produto.unidade === 'ml'
                              ? (produto.preco_medio || 0).toLocaleString('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4
                              })
                              : produto.preco_medio?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'
                            } <span className="text-[8px] text-gray-300 font-bold ml-0.5">/ {produto.unidade.toUpperCase()}</span>
                          </span>
                          <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">
                            COMPRA: {produto.preco_embalagem?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 0,00'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5"
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
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50"
                            onClick={() => handleDeleteProduto(produto.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

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
