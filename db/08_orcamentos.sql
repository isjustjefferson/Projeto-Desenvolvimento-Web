-- Orçamentos: etapa intermediária do fluxo em que o prestador submete um
-- orçamento prévio (ou cobrança de visita técnica) que precisa ser aprovado
-- pelo síndico/administrador antes da execução. Reexecutável (IF NOT EXISTS).
-- Executar DEPOIS de 02_tabelas.sql e 03_chaves_estrangeiras.sql.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_orcamento') THEN
        CREATE TYPE status_orcamento AS ENUM ('PENDENTE', 'APROVADO', 'REJEITADO');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS orcamentos (
    id                integer           GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chamado_id        integer           NOT NULL,
    prestador_id      integer           NOT NULL,
    descricao         text              NOT NULL,
    valor_centavos    integer           NOT NULL,
    status            status_orcamento  NOT NULL DEFAULT 'PENDENTE',
    motivo_rejeicao   text,
    aprovado_por_id   integer,
    aprovado_em       timestamptz,
    criado_em         timestamptz       NOT NULL DEFAULT now(),
    atualizado_em     timestamptz       NOT NULL DEFAULT now(),
    CONSTRAINT orcamentos_valor_chk CHECK (valor_centavos >= 0)
);

CREATE INDEX IF NOT EXISTS orcamentos_chamado_idx ON orcamentos (chamado_id);

-- FKs (mesmo padrão das demais tabelas; blocos idempotentes):
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_chamado_fk') THEN
        ALTER TABLE orcamentos
            ADD CONSTRAINT orcamentos_chamado_fk
            FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_prestador_fk') THEN
        ALTER TABLE orcamentos
            ADD CONSTRAINT orcamentos_prestador_fk
            FOREIGN KEY (prestador_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orcamentos_aprovado_por_fk') THEN
        ALTER TABLE orcamentos
            ADD CONSTRAINT orcamentos_aprovado_por_fk
            FOREIGN KEY (aprovado_por_id) REFERENCES usuarios(id) ON DELETE SET NULL;
    END IF;
END $$;
