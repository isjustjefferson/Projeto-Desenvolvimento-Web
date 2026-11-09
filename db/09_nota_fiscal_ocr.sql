-- Dados extraídos de notas fiscais via OCR (anexo de despesa): valor total
-- lido do documento, texto bruto extraído e momento da extração. Todas as
-- colunas são nullable: anexos antigos/enviados sem OCR permanecem válidos.
-- Reexecutável (ADD COLUMN IF NOT EXISTS).

ALTER TABLE anexos_despesa
    ADD COLUMN IF NOT EXISTS valor_total_centavos integer
        CONSTRAINT anexos_despesa_valor_chk CHECK (valor_total_centavos >= 0),
    ADD COLUMN IF NOT EXISTS texto_ocr text,
    ADD COLUMN IF NOT EXISTS ocr_extraido_em timestamptz;
