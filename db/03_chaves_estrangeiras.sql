-- Chaves estrangeiras.
-- Executar DEPOIS de 02_tabelas.sql (as tabelas referenciadas precisam existir).
--
-- Referência: docs/modelo-de-dados.md, seção 4.2
--
-- Cada ON DELETE decorre de uma regra de negócio:
--   criado_por_id  RESTRICT  RN07: não se exclui autor de chamado
--   tecnico_id     SET NULL  o técnico é acessório, o chamado é histórico
--   local_id       RESTRICT  local com chamado é referenciado
--   chamado_id     CASCADE   o histórico pertence ao chamado
--   usuario_id     RESTRICT  o histórico não fica órfão de autor
--
-- RESTRICT em vez de NO ACTION porque RESTRICT verifica imediatamente, sem
-- esperar o fim da transação.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chamados_local_fk') THEN
        ALTER TABLE chamados
            ADD CONSTRAINT chamados_local_fk
                FOREIGN KEY (local_id) REFERENCES locais (id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chamados_criado_por_fk') THEN
        ALTER TABLE chamados
            ADD CONSTRAINT chamados_criado_por_fk
                FOREIGN KEY (criado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chamados_tecnico_fk') THEN
        ALTER TABLE chamados
            ADD CONSTRAINT chamados_tecnico_fk
                FOREIGN KEY (tecnico_id) REFERENCES usuarios (id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historicos_chamado_fk') THEN
        ALTER TABLE historicos
            ADD CONSTRAINT historicos_chamado_fk
                FOREIGN KEY (chamado_id) REFERENCES chamados (id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'historicos_usuario_fk') THEN
        ALTER TABLE historicos
            ADD CONSTRAINT historicos_usuario_fk
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tokens_reset_usuario_fk') THEN
        ALTER TABLE tokens_reset
            ADD CONSTRAINT tokens_reset_usuario_fk
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE;
    END IF;
END $$;
