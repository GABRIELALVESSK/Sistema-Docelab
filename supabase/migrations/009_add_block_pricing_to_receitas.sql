-- Adiciona colunas para precificação em blocos (Checklist Inteligente)
ALTER TABLE receitas 
ADD COLUMN IF NOT EXISTS usar_bloco_utensilios BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS usar_bloco_mao_obra BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN receitas.usar_bloco_utensilios IS 'Indica se a receita usa o bloco aditivo de 7% para utensílios';
COMMENT ON COLUMN receitas.usar_bloco_mao_obra IS 'Indica se a receita usa o bloco aditivo de 40% para mão de obra (modo simplificado)';
