/**
 * Calculadora de Precificação Avançada
 * 
 * Este módulo implementa toda a lógica de cálculo de precificação seguindo as regras:
 * 1. Converter preço por embalagem → preço por unidade básica (g, ml, un)
 * 2. Calcular custo do item na receita (3 modos: Proporcional, Compra Mínima, Amortizado)
 * 3. Calcular CMV total e unitário
 * 4. Aplicar segurança (ex: +20%)
 * 5. Aplicar fixos/mão de obra (ex: 2x)
 * 6. Calcular 3 preços finais com margens de lucro (30%, 50%, 70%)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Insumo {
    id: string;
    nome: string;
    categoria: string;
    unidade_compra: 'kg' | 'g' | 'L' | 'ml' | 'un' | 'pacote' | 'rolo' | 'frasco' | 'lata' | 'cx' | 'pct' | 'm' | 'cm' | 'mm';
    quantidade_por_embalagem: number;
    preco_embalagem: number;
    perdas_percentual: number;
    ativo: boolean;
}

export interface ReceitaIngrediente {
    id?: string;
    produto_id: string;
    quantidade_usada: number;
    unidade_usada: 'g' | 'ml' | 'un' | 'cm' | 'm' | 'mm' | 'kg' | 'L'; // including 'kg' and 'L' since it comes from the form
    modo_custo: 'proporcional' | 'compra_minima' | 'amortizado';
    usos_amortizacao?: number;
}

export interface ParametrosPrecificacao {
    percentual_seguranca: number; // ex: 20 para 20%
    percentual_utensilios?: number; // ex: 7%
    percentual_mao_obra_fixo?: number; // ex: 40%
    multiplicador_fixos_mao_obra: number;
    margens_lucro: number[]; // ex: [30, 50, 70]
    arredondamento_casas?: number;
    arredondamento_tipo?: 'nenhum' | 'cima_0_10' | 'cima_0_50' | 'psicologico_0_90';
    custo_fixo_total_mensal?: number;
    horas_trabalho_mensal?: number;
    tempo_producao_minutos?: number;
}

export interface ResultadoPrecificacao {
    // CMV
    cmv_total: number;
    cmv_unitario: number;

    // Intermediários
    cmv_com_seguranca: number;
    custo_base_total: number;
    custo_base_unitario: number;

    // Custos Fixos (Rateio)
    custo_fixo_rateio: number;
    custo_por_minuto: number;

    // Preços finais
    precos: {
        lucro_30: number;
        lucro_50: number;
        lucro_70: number;
    };

    // Detalhes para auditoria
    detalhamento_custos: ItemCusto[];
    parametros_usados: ParametrosPrecificacao;

    // Métricas adicionais
    markup: number; // quanto multiplicou do custo (preço / custo)
    margem_real_30: number; // margem real em %
    margem_real_50: number;
    margem_real_70: number;
}

export interface ItemCusto {
    insumo_id: string;
    insumo_nome: string;
    quantidade_usada: number;
    unidade_usada: string;
    modo_custo: string;
    preco_unitario: number;
    custo_total: number;
    percentual_do_cmv: number;
}

// ============================================================================
// REGRA 1: Converter Preço para Unidade Básica
// ============================================================================

/**
 * Converte o preço da embalagem para preço por unidade básica (g, ml, un)
 * 
 * Exemplos:
 * - Chocolate 1kg por R$ 45 → R$ 0,045/g
 * - Leite 1L por R$ 5 → R$ 0,005/ml
 * - Ovos pacote 12un por R$ 18 → R$ 1,50/un
 */
export function calcularPrecoPorUnidadeBasica(insumo: Insumo): number {
    const { preco_embalagem, quantidade_por_embalagem, unidade_compra } = insumo;

    if (quantidade_por_embalagem <= 0) {
        throw new Error(`Quantidade por embalagem deve ser maior que 0 para o insumo ${insumo.nome}`);
    }

    if (preco_embalagem < 0) {
        throw new Error(`Preço da embalagem não pode ser negativo para o insumo ${insumo.nome}`);
    }

    // Converter kg para g
    if (unidade_compra === 'kg') {
        return preco_embalagem / (quantidade_por_embalagem * 1000);
    }

    // Converter L para ml
    if (unidade_compra === 'L') {
        return preco_embalagem / (quantidade_por_embalagem * 1000);
    }

    // Converter unidades de comprimento para cm (unidade base para comprimento)
    if (unidade_compra === 'm') {
        return preco_embalagem / (quantidade_por_embalagem * 100);
    }

    if (unidade_compra === 'mm') {
        return preco_embalagem / (quantidade_por_embalagem / 10);
    }

    // Para unidades, pacotes, rolos, frascos, etc, e cm (já que cm é a base)
    return preco_embalagem / quantidade_por_embalagem;
}

/**
 * Retorna a unidade básica correspondente à unidade de compra
 */
export function obterUnidadeBasica(unidade_compra: Insumo['unidade_compra']): 'g' | 'ml' | 'un' | 'cm' {
    if (unidade_compra === 'kg' || unidade_compra === 'g') return 'g';
    if (unidade_compra === 'L' || unidade_compra === 'ml') return 'ml';
    if (unidade_compra === 'm' || unidade_compra === 'cm' || unidade_compra === 'mm') return 'cm';
    return 'un';
}

// ============================================================================
// REGRA 2: Calcular Custo do Item na Receita (3 Modos)
// ============================================================================

/**
 * Calcula o custo de um item na receita baseado no modo de custo
 * 
 * MODOS:
 * - PROPORCIONAL: Cobra exatamente pelo que foi usado (ex: 50g de chocolate)
 * - COMPRA_MÍNIMA: Considera a embalagem inteira (ex: pacote 100 canudos, usa 20, cobra 100)
 * - AMORTIZADO: Divide o custo por N usos (ex: caixa reutilizável usada 50x)
 */
export function calcularCustoItem(
    insumo: Insumo,
    ingrediente: ReceitaIngrediente
): number {
    const { quantidade_usada, modo_custo, usos_amortizacao } = ingrediente;

    if (quantidade_usada <= 0) {
        throw new Error(`Quantidade usada deve ser maior que 0 para ${insumo.nome}`);
    }

    // Normalizar a quantidade usada para a unidade básica (g, ml, un, cm)
    let quantidadeUsadaBase = quantidade_usada;
    if (ingrediente.unidade_usada === 'kg') quantidadeUsadaBase *= 1000;
    else if (ingrediente.unidade_usada === 'L') quantidadeUsadaBase *= 1000;
    else if (ingrediente.unidade_usada === 'm') quantidadeUsadaBase *= 100;
    else if (ingrediente.unidade_usada === 'mm') quantidadeUsadaBase /= 10;

    switch (modo_custo) {
        case 'proporcional': {
            // Modo padrão: cobra pelo que usou
            const precoUnitario = calcularPrecoPorUnidadeBasica(insumo);
            const custoBase = precoUnitario * quantidadeUsadaBase;

            // Aplicar perdas se configurado
            const fatorPerdas = 1 + (insumo.perdas_percentual / 100);
            return custoBase * fatorPerdas;
        }

        case 'compra_minima': {
            // Calcula quantas embalagens precisa comprar
            let quantidadeEmbalagemBase = insumo.quantidade_por_embalagem;
            if (insumo.unidade_compra === 'kg') quantidadeEmbalagemBase *= 1000;
            else if (insumo.unidade_compra === 'L') quantidadeEmbalagemBase *= 1000;
            else if (insumo.unidade_compra === 'm') quantidadeEmbalagemBase *= 100;
            else if (insumo.unidade_compra === 'mm') quantidadeEmbalagemBase /= 10;

            const unidadesNecessarias = Math.ceil(quantidadeUsadaBase / (quantidadeEmbalagemBase || 1));
            return unidadesNecessarias * insumo.preco_embalagem;
        }

        case 'amortizado': {
            // Divide o custo da embalagem pelo número de usos
            const usosEstimados = usos_amortizacao || 1;
            if (usosEstimados <= 0) {
                throw new Error(`Usos de amortização deve ser maior que 0 para ${insumo.nome}`);
            }
            return insumo.preco_embalagem / usosEstimados;
        }

        default:
            throw new Error(`Modo de custo inválido: ${modo_custo}`);
    }
}

// ============================================================================
// REGRA 3-6: Calcular Precificação Completa
// ============================================================================

/**
 * Calcula a precificação completa de uma receita/produto
 * 
 * Fluxo:
 * 1. CMV = soma dos custos de todos os ingredientes
 * 2. CMV + Segurança (ex: +20%)
 * 3. Custo Base = (CMV + Segurança) × Multiplicador Fixos/M.O (ex: 2x)
 * 4. Preços Finais = Custo Base × (1 + Margem Lucro)
 */
export function calcularPrecificacao(params: {
    ingredientes: ReceitaIngrediente[];
    insumos: Insumo[];
    rendimento_unidades: number;
    parametros: ParametrosPrecificacao;
}): ResultadoPrecificacao {
    const { ingredientes, insumos, rendimento_unidades, parametros } = params;

    // Validações
    if (rendimento_unidades <= 0) {
        throw new Error('Rendimento deve ser maior que 0');
    }

    if (ingredientes.length === 0) {
        throw new Error('Adicione pelo menos um ingrediente');
    }

    // ============================================================================
    // ETAPA 1: Calcular CMV Total
    // ============================================================================

    let cmv_total = 0;
    const detalhamento_custos: ItemCusto[] = [];

    for (const ingrediente of ingredientes) {
        const insumo = insumos.find(i => i.id === ingrediente.produto_id);

        if (!insumo) {
            throw new Error(`Insumo não encontrado: ${ingrediente.produto_id}`);
        }

        if (!insumo.ativo) {
            throw new Error(`Insumo inativo: ${insumo.nome}. Selecione um insumo ativo.`);
        }

        const custo = calcularCustoItem(insumo, ingrediente);
        cmv_total += custo;

        detalhamento_custos.push({
            insumo_id: insumo.id,
            insumo_nome: insumo.nome,
            quantidade_usada: ingrediente.quantidade_usada,
            unidade_usada: ingrediente.unidade_usada,
            modo_custo: ingrediente.modo_custo,
            preco_unitario: calcularPrecoPorUnidadeBasica(insumo),
            custo_total: custo,
            percentual_do_cmv: 0 // Será calculado depois
        });
    }

    // Calcular percentual de cada item no CMV
    detalhamento_custos.forEach(item => {
        item.percentual_do_cmv = cmv_total > 0 ? (item.custo_total / cmv_total) * 100 : 0;
    });

    // ============================================================================
    // ETAPA 2: CMV Unitário
    // ============================================================================

    const cmv_unitario = cmv_total / rendimento_unidades;

    // ============================================================================
    // ETAPA 3: Aplicar Blocos de Custo (Indiretos)
    // ============================================================================

    // O usuário sugeriu blocos aditivos: Seguranca (20%) + Utensilios (7%) + Mão de Obra (40%)
    const seguranca = parametros.percentual_seguranca || 0;
    const utensilios = parametros.percentual_utensilios || 0;
    const mao_obra_fixo = parametros.percentual_mao_obra_fixo || 0;

    const fator_blocos = 1 + ((seguranca + utensilios + mao_obra_fixo) / 100);
    const cmv_com_blocos = cmv_total * fator_blocos;

    // ============================================================================
    // ETAPA 4: Aplicar Overhead (Rateio ou Multiplicador)
    // ============================================================================

    // Se a mão de obra fixa (40%) estiver ativa, ignoramos o cálculo detalhado de tempo/hora
    // para evitar "overprice" (atropelamento de lógica) conforme solicitado pelo usuário.
    const usarCalculoDetalhado = mao_obra_fixo === 0;

    const multiplicador = usarCalculoDetalhado ? (parametros.multiplicador_fixos_mao_obra || 1) : 1;
    const custo_base_total_parcial = cmv_com_blocos * multiplicador;

    // Calcular Rateio de Custos Fixos (Aluguel, etc.) apenas se necessário
    let custo_fixo_rateio = 0;
    if (usarCalculoDetalhado && parametros.custo_fixo_total_mensal && parametros.tempo_producao_minutos) {
        const horasMensais = parametros.horas_trabalho_mensal || 220;
        const minutosMensais = horasMensais * 60;

        if (minutosMensais > 0) {
            const custo_por_minuto = parametros.custo_fixo_total_mensal / minutosMensais;
            custo_fixo_rateio = custo_por_minuto * parametros.tempo_producao_minutos;
        }
    }

    const custo_base_total = custo_base_total_parcial + custo_fixo_rateio;
    const custo_base_unitario = custo_base_total / rendimento_unidades;

    // ============================================================================
    // ETAPA 5: Calcular Preços com 3 Margens de Lucro
    // ============================================================================

    const [margem1, margem2, margem3] = parametros.margens_lucro;

    let preco_30 = custo_base_unitario * (1 + margem1 / 100);
    let preco_50 = custo_base_unitario * (1 + margem2 / 100);
    let preco_70 = custo_base_unitario * (1 + margem3 / 100);

    // ============================================================================
    // ETAPA 6: Aplicar Arredondamento (opcional)
    // ============================================================================

    if (parametros.arredondamento_tipo && parametros.arredondamento_tipo !== 'nenhum') {
        preco_30 = aplicarArredondamento(preco_30, parametros.arredondamento_tipo);
        preco_50 = aplicarArredondamento(preco_50, parametros.arredondamento_tipo);
        preco_70 = aplicarArredondamento(preco_70, parametros.arredondamento_tipo);
    }

    // Arredondar para casas decimais
    const casas = parametros.arredondamento_casas || 2;
    preco_30 = parseFloat(preco_30.toFixed(casas));
    preco_50 = parseFloat(preco_50.toFixed(casas));
    preco_70 = parseFloat(preco_70.toFixed(casas));

    // ============================================================================
    // ETAPA 7: Calcular Métricas Adicionais
    // ============================================================================

    const markup = custo_base_unitario > 0 ? preco_50 / custo_base_unitario : 0;

    // Margens reais (considerando que o lucro vem do preço final)
    const margem_real_30 = preco_30 > 0 ? ((preco_30 - custo_base_unitario) / preco_30) * 100 : 0;
    const margem_real_50 = preco_50 > 0 ? ((preco_50 - custo_base_unitario) / preco_50) * 100 : 0;
    const margem_real_70 = preco_70 > 0 ? ((preco_70 - custo_base_unitario) / preco_70) * 100 : 0;

    // ============================================================================
    // RESULTADO FINAL
    // ============================================================================

    return {
        cmv_total,
        cmv_unitario,
        cmv_com_seguranca: cmv_com_blocos,
        custo_base_total,
        custo_base_unitario,
        custo_fixo_rateio,
        custo_por_minuto: 0,
        precos: {
            lucro_30: preco_30,
            lucro_50: preco_50,
            lucro_70: preco_70
        },
        detalhamento_custos: detalhamento_custos.sort((a, b) => b.percentual_do_cmv - a.percentual_do_cmv),
        parametros_usados: parametros,
        markup,
        margem_real_30,
        margem_real_50,
        margem_real_70
    };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Aplica arredondamento psicológico ao preço
 */
function aplicarArredondamento(
    preco: number,
    tipo: 'cima_0_10' | 'cima_0_50' | 'psicologico_0_90'
): number {
    switch (tipo) {
        case 'cima_0_10':
            // Arredonda para o próximo 0,10
            return Math.ceil(preco * 10) / 10;

        case 'cima_0_50':
            // Arredonda para o próximo 0,50
            return Math.ceil(preco * 2) / 2;

        case 'psicologico_0_90':
            // Arredonda para o próximo X,90
            const parteInteira = Math.floor(preco);
            if (preco <= parteInteira + 0.90) {
                return parteInteira + 0.90;
            } else {
                return parteInteira + 1.90;
            }

        default:
            return preco;
    }
}

export function formatarMoeda(valor: number): string {
    let moeda = 'BRL';
    let idioma = 'pt-BR';

    try {
        // Encontrar configurações de usuário do sistema diretamente
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('@docelab/settings/')) {
                const config = JSON.parse(localStorage.getItem(key) || '{}');
                if (config.moeda) moeda = config.moeda;
                if (config.idioma && (config.idioma.includes('English') || config.idioma === 'en-US')) {
                    idioma = 'en-US';
                }
                break;
            }
        }
    } catch (e) {
        // Fallback silencioso
    }

    // Ajuste de legibilidade pra exibição do cifrão da moeda estrangeira
    if (moeda === 'USD' && idioma === 'pt-BR') {
        idioma = 'en-US';
    } else if (moeda === 'BRL' && idioma === 'en-US') {
        idioma = 'pt-BR';
    }

    return valor.toLocaleString(idioma, {
        style: 'currency',
        currency: moeda,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formata um percentual para exibição
 */
export function formatarPercentual(valor: number, casas: number = 1): string {
    return `${valor.toFixed(casas)}%`;
}
