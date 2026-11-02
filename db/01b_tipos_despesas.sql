DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_despesa') THEN
        CREATE TYPE categoria_despesa AS ENUM ('MATERIAL', 'MAO_DE_OBRA', 'SERVICO_TERCEIRO', 'DESLOCAMENTO', 'OUTROS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_despesa') THEN
        CREATE TYPE status_despesa AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'forma_pagamento') THEN
        CREATE TYPE forma_pagamento AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'FATURADO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pago_por') THEN
        CREATE TYPE pago_por AS ENUM ('TECNICO', 'EMPRESA');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_anexo') THEN
        CREATE TYPE tipo_anexo AS ENUM ('NOTA_FISCAL', 'RECIBO', 'COMPROVANTE_PAGAMENTO', 'OUTRO');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_fiscal') THEN
        CREATE TYPE tipo_documento_fiscal AS ENUM ('NFE', 'NFSE', 'NFCE', 'CUPOM_FISCAL', 'RECIBO', 'BOLETO_COMPROVANTE', 'OUTRO');
    END IF;
END $$;
