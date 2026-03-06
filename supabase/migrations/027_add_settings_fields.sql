-- Adiciona campos de configurações adicionais
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS whatsapp BOOLEAN DEFAULT false;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS google_calendar BOOLEAN DEFAULT false;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS idioma TEXT DEFAULT 'Português (Brasil)';
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS moeda TEXT DEFAULT 'BRL';
