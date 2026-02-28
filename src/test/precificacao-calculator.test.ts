/**
 * Testes Unitários para o Módulo de Precificação Avançada
 * 
 * Valida todas as regras de cálculo e cenários de uso
 */

import { describe, it, expect } from 'vitest';
import {
    calcularPrecoPorUnidadeBasica,
    calcularCustoItem,
    calcularPrecificacao,
    obterUnidadeBasica,
    formatarMoeda,
    formatarPercentual,
    type Insumo,
    type ReceitaIngrediente,
    type ParametrosPrecificacao
} from '../lib/precificacao-calculator';

// ============================================================================
// FIXTURES DE TESTE
// ============================================================================

const insumoChocolatePo: Insumo = {
    id: '1',
    nome: 'Chocolate em Pó',
    categoria: 'Ingredientes',
    unidade_compra: 'kg',
    quantidade_por_embalagem: 1,
    preco_embalagem: 45.00,
    perdas_percentual: 2,
    ativo: true
};

const insumoLeiteCondensado: Insumo = {
    id: '2',
    nome: 'Leite Condensado',
    categoria: 'Ingredientes',
    unidade_compra: 'un',
    quantidade_por_embalagem: 395,
    preco_embalagem: 4.50,
    perdas_percentual: 0,
    ativo: true
};

const insumoCanudos: Insumo = {
    id: '3',
    nome: 'Canudos Coloridos',
    categoria: 'Embalagem',
    unidade_compra: 'pacote',
    quantidade_por_embalagem: 100,
    preco_embalagem: 12.00,
    perdas_percentual: 0,
    ativo: true
};

const insumoCaixaTransporte: Insumo = {
    id: '4',
    nome: 'Caixa de Transporte Reutilizável',
    categoria: 'Embalagem',
    unidade_compra: 'un',
    quantidade_por_embalagem: 1,
    preco_embalagem: 50.00,
    perdas_percentual: 0,
    ativo: true
};

const parametrosPadrao: ParametrosPrecificacao = {
    percentual_seguranca: 20,
    multiplicador_fixos_mao_obra: 2,
    margens_lucro: [30, 50, 70],
    arredondamento_casas: 2,
    arredondamento_tipo: 'nenhum'
};

// ============================================================================
// TESTES: Regra 1 - Converter Preço para Unidade Básica
// ============================================================================

describe('calcularPrecoPorUnidadeBasica', () => {
    it('deve converter kg para g corretamente', () => {
        const preco = calcularPrecoPorUnidadeBasica(insumoChocolatePo);
        // R$ 45 / 1kg = R$ 45 / 1000g = R$ 0,045/g
        expect(preco).toBeCloseTo(0.045, 4);
    });

    it('deve calcular preço unitário para embalagem individual', () => {
        const preco = calcularPrecoPorUnidadeBasica(insumoLeiteCondensado);
        // R$ 4,50 / 395g = ~R$ 0,0114/g
        expect(preco).toBeCloseTo(0.01139, 4);
    });

    it('deve calcular preço unitário para pacote', () => {
        const preco = calcularPrecoPorUnidadeBasica(insumoCanudos);
        // R$ 12 / 100un = R$ 0,12/un
        expect(preco).toBeCloseTo(0.12, 2);
    });

    it('deve lançar erro para quantidade zero', () => {
        const insumoInvalido = { ...insumoChocolatePo, quantidade_por_embalagem: 0 };
        expect(() => calcularPrecoPorUnidadeBasica(insumoInvalido)).toThrow();
    });

    it('deve lançar erro para preço negativo', () => {
        const insumoInvalido = { ...insumoChocolatePo, preco_embalagem: -10 };
        expect(() => calcularPrecoPorUnidadeBasica(insumoInvalido)).toThrow();
    });
});

describe('obterUnidadeBasica', () => {
    it('deve retornar "g" para kg', () => {
        expect(obterUnidadeBasica('kg')).toBe('g');
    });

    it('deve retornar "g" para g', () => {
        expect(obterUnidadeBasica('g')).toBe('g');
    });

    it('deve retornar "ml" para L', () => {
        expect(obterUnidadeBasica('L')).toBe('ml');
    });

    it('deve retornar "un" para pacote', () => {
        expect(obterUnidadeBasica('pacote')).toBe('un');
    });
});

// ============================================================================
// TESTES: Regra 2 - Calcular Custo do Item (3 Modos)
// ============================================================================

describe('calcularCustoItem - Modo Proporcional', () => {
    it('deve calcular custo proporcional sem perdas', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '2',
            quantidade_usada: 395,
            unidade_usada: 'g',
            modo_custo: 'proporcional'
        };

        const custo = calcularCustoItem(insumoLeiteCondensado, ingrediente);
        // 395g × R$ 0,0114/g = R$ 4,50
        expect(custo).toBeCloseTo(4.50, 2);
    });

    it('deve calcular custo proporcional com perdas', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '1',
            quantidade_usada: 200,
            unidade_usada: 'g',
            modo_custo: 'proporcional'
        };

        const custo = calcularCustoItem(insumoChocolatePo, ingrediente);
        // 200g × R$ 0,045/g × 1,02 (perdas 2%) = R$ 9,18
        expect(custo).toBeCloseTo(9.18, 2);
    });
});

describe('calcularCustoItem - Modo Compra Mínima', () => {
    it('deve comprar 1 embalagem quando usa menos que 1', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '3',
            quantidade_usada: 20,
            unidade_usada: 'un',
            modo_custo: 'compra_minima'
        };

        const custo = calcularCustoItem(insumoCanudos, ingrediente);
        // Usa 20un, mas precisa comprar pacote 100un = R$ 12,00
        expect(custo).toBe(12.00);
    });

    it('deve comprar 2 embalagens quando usa mais que 1', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '3',
            quantidade_usada: 150,
            unidade_usada: 'un',
            modo_custo: 'compra_minima'
        };

        const custo = calcularCustoItem(insumoCanudos, ingrediente);
        // Usa 150un = precisa 2 pacotes = R$ 24,00
        expect(custo).toBe(24.00);
    });
});

describe('calcularCustoItem - Modo Amortizado', () => {
    it('deve dividir custo pelo número de usos', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '4',
            quantidade_usada: 1,
            unidade_usada: 'un',
            modo_custo: 'amortizado',
            usos_amortizacao: 50
        };

        const custo = calcularCustoItem(insumoCaixaTransporte, ingrediente);
        // R$ 50 / 50 usos = R$ 1,00 por uso
        expect(custo).toBe(1.00);
    });

    it('deve usar 1 uso como padrão se não especificado', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '4',
            quantidade_usada: 1,
            unidade_usada: 'un',
            modo_custo: 'amortizado'
        };

        const custo = calcularCustoItem(insumoCaixaTransporte, ingrediente);
        // R$ 50 / 1 uso = R$ 50,00
        expect(custo).toBe(50.00);
    });

    it('deve lançar erro para usos zero ou negativo', () => {
        const ingrediente: ReceitaIngrediente = {
            produto_id: '4',
            quantidade_usada: 1,
            unidade_usada: 'un',
            modo_custo: 'amortizado',
            usos_amortizacao: 0
        };

        expect(() => calcularCustoItem(insumoCaixaTransporte, ingrediente)).toThrow();
    });
});

// ============================================================================
// TESTES: Regras 3-6 - Calcular Precificação Completa
// ============================================================================

describe('calcularPrecificacao', () => {
    it('deve calcular precificação completa corretamente', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 200,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            },
            {
                produto_id: '2',
                quantidade_usada: 395,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos: [insumoChocolatePo, insumoLeiteCondensado],
            rendimento_unidades: 24,
            parametros: parametrosPadrao
        });

        // CMV = 9,18 (chocolate) + 4,50 (leite) = R$ 13,68
        expect(resultado.cmv_total).toBeCloseTo(13.68, 2);

        // CMV unitário = 13,68 / 24 = R$ 0,57
        expect(resultado.cmv_unitario).toBeCloseTo(0.57, 2);

        // CMV + 20% segurança = 13,68 × 1,20 = R$ 16,416
        expect(resultado.cmv_com_seguranca).toBeCloseTo(16.416, 2);

        // Custo base = 16,416 × 2 = R$ 32,832
        expect(resultado.custo_base_total).toBeCloseTo(32.832, 2);

        // Custo base unitário = 32,832 / 24 = R$ 1,368
        expect(resultado.custo_base_unitario).toBeCloseTo(1.368, 2);

        // Preço 30% = 1,368 × 1,30 = R$ 1,78
        expect(resultado.precos.lucro_30).toBeCloseTo(1.78, 2);

        // Preço 50% = 1,368 × 1,50 = R$ 2,05
        expect(resultado.precos.lucro_50).toBeCloseTo(2.05, 2);

        // Preço 70% = 1,368 × 1,70 = R$ 2,33
        expect(resultado.precos.lucro_70).toBeCloseTo(2.33, 2);
    });

    it('deve calcular detalhamento de custos por item', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 200,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            },
            {
                produto_id: '2',
                quantidade_usada: 395,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos: [insumoChocolatePo, insumoLeiteCondensado],
            rendimento_unidades: 1,
            parametros: parametrosPadrao
        });

        expect(resultado.detalhamento_custos).toHaveLength(2);

        // Deve estar ordenado por % do CMV (maior para menor)
        expect(resultado.detalhamento_custos[0].percentual_do_cmv)
            .toBeGreaterThan(resultado.detalhamento_custos[1].percentual_do_cmv);

        // Soma dos percentuais deve ser ~100%
        const somaPercentuais = resultado.detalhamento_custos.reduce(
            (sum, item) => sum + item.percentual_do_cmv, 0
        );
        expect(somaPercentuais).toBeCloseTo(100, 1);
    });

    it('deve calcular markup corretamente', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 100,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos: [insumoChocolatePo],
            rendimento_unidades: 1,
            parametros: parametrosPadrao
        });

        // Markup = Preço / Custo Base
        const markupEsperado = resultado.precos.lucro_50 / resultado.custo_base_unitario;
        expect(resultado.markup).toBeCloseTo(markupEsperado, 2);
    });

    it('deve lançar erro para rendimento zero', () => {
        expect(() =>
            calcularPrecificacao({
                ingredientes: [],
                insumos: [],
                rendimento_unidades: 0,
                parametros: parametrosPadrao
            })
        ).toThrow('Rendimento deve ser maior que 0');
    });

    it('deve lançar erro para lista vazia de ingredientes', () => {
        expect(() =>
            calcularPrecificacao({
                ingredientes: [],
                insumos: [insumoChocolatePo],
                rendimento_unidades: 1,
                parametros: parametrosPadrao
            })
        ).toThrow('Adicione pelo menos um ingrediente');
    });

    it('deve lançar erro para insumo não encontrado', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: 'inexistente',
                quantidade_usada: 100,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        expect(() =>
            calcularPrecificacao({
                ingredientes,
                insumos: [insumoChocolatePo],
                rendimento_unidades: 1,
                parametros: parametrosPadrao
            })
        ).toThrow('Insumo não encontrado');
    });

    it('deve lançar erro para insumo inativo', () => {
        const insumoInativo = { ...insumoChocolatePo, ativo: false };
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 100,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        expect(() =>
            calcularPrecificacao({
                ingredientes,
                insumos: [insumoInativo],
                rendimento_unidades: 1,
                parametros: parametrosPadrao
            })
        ).toThrow('Insumo inativo');
    });
});

// ============================================================================
// TESTES: Arredondamento
// ============================================================================

describe('calcularPrecificacao - Arredondamento', () => {
    it('deve arredondar para cima no próximo 0,10', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 50,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos: [insumoChocolatePo],
            rendimento_unidades: 1,
            parametros: {
                ...parametrosPadrao,
                arredondamento_tipo: 'cima_0_10'
            }
        });

        // Preços devem terminar em 0,X0
        const precoStr = resultado.precos.lucro_50.toFixed(2);
        expect(precoStr.endsWith('0')).toBe(true);
    });

    it('deve arredondar para cima no próximo 0,50', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 50,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos: [insumoChocolatePo],
            rendimento_unidades: 1,
            parametros: {
                ...parametrosPadrao,
                arredondamento_tipo: 'cima_0_50'
            }
        });

        // Preços devem terminar em X,00 ou X,50
        const decimal = resultado.precos.lucro_50 % 1;
        expect([0, 0.5]).toContain(Math.round(decimal * 2) / 2);
    });

    it('deve arredondar para preço psicológico X,90', () => {
        const ingredientes: ReceitaIngrediente[] = [
            {
                produto_id: '1',
                quantidade_usada: 50,
                unidade_usada: 'g',
                modo_custo: 'proporcional'
            }
        ];

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos: [insumoChocolatePo],
            rendimento_unidades: 1,
            parametros: {
                ...parametrosPadrao,
                arredondamento_tipo: 'psicologico_0_90'
            }
        });

        // Preços devem terminar em X,90
        const precoStr = resultado.precos.lucro_50.toFixed(2);
        expect(precoStr.endsWith('90')).toBe(true);
    });
});

// ============================================================================
// TESTES: Funções de Formatação
// ============================================================================

describe('formatarMoeda', () => {
    it('deve formatar valor em reais corretamente', () => {
        expect(formatarMoeda(10.5)).toBe('R$ 10,50');
        expect(formatarMoeda(1234.56)).toBe('R$ 1.234,56');
        expect(formatarMoeda(0)).toBe('R$ 0,00');
    });
});

describe('formatarPercentual', () => {
    it('deve formatar percentual com 1 casa decimal por padrão', () => {
        expect(formatarPercentual(25.5)).toBe('25.5%');
        expect(formatarPercentual(100)).toBe('100.0%');
    });

    it('deve formatar percentual com casas decimais personalizadas', () => {
        expect(formatarPercentual(25.567, 2)).toBe('25.57%');
        expect(formatarPercentual(25.567, 0)).toBe('26%');
    });
});
