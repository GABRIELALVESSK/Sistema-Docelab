import { describe, it, expect } from 'vitest';
import { calcularPrecificacao } from '../lib/precificacao-calculator';

describe('Kit Pricing Integration Verification', () => {
    it('should correctly calculate recipe cost when using a kit with custo_total', () => {
        // In the system, when a kit is used in a recipe, it's treated as a "pseudo-insumo"
        // in the calculation parameters, or its cost is directly added to the CMV.
        // Based on NovaReceitaModal.tsx, ingredients with tipo 'kit' have custo_unitario = custo_total.

        const kitId = 'kit-123';
        const kitCustoTotal = 50.00;

        const ingredientes = [
            {
                produto_id: kitId,
                quantidade_usada: 1,
                unidade_usada: 'un' as const,
                modo_custo: 'proporcional' as const
            }
        ];

        const insumos = [
            {
                id: kitId,
                nome: 'Kit Festinha',
                categoria: 'Kits',
                unidade_compra: 'un' as const,
                quantidade_por_embalagem: 1,
                preco_embalagem: kitCustoTotal, // We map kit's custo_total to preco_embalagem for the calculator
                perdas_percentual: 0,
                ativo: true
            }
        ];

        const parametros = {
            percentual_seguranca: 0,
            multiplicador_fixos_mao_obra: 1,
            margens_lucro: [30, 50, 70]
        };

        const resultado = calcularPrecificacao({
            ingredientes,
            insumos,
            rendimento_unidades: 1,
            parametros
        });

        // CMV should be exactly the kit's cost
        expect(resultado.cmv_total).toBe(50);
        // Suggested price with 30% margin (1.3 * 50 = 65)
        expect(resultado.precos.lucro_30).toBe(65);
    });
});
