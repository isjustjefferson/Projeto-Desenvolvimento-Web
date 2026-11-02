DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'despesas_chamado_fk') THEN
        ALTER TABLE despesas
            ADD CONSTRAINT despesas_chamado_fk
                FOREIGN KEY (chamado_id) REFERENCES chamados (id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'despesas_registrado_por_fk') THEN
        ALTER TABLE despesas
            ADD CONSTRAINT despesas_registrado_por_fk
                FOREIGN KEY (registrado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'despesas_aprovado_por_fk') THEN
        ALTER TABLE despesas
            ADD CONSTRAINT despesas_aprovado_por_fk
                FOREIGN KEY (aprovado_por_id) REFERENCES usuarios (id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anexos_despesa_despesa_fk') THEN
        ALTER TABLE anexos_despesa
            ADD CONSTRAINT anexos_despesa_despesa_fk
                FOREIGN KEY (despesa_id) REFERENCES despesas (id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'anexos_despesa_enviado_por_fk') THEN
        ALTER TABLE anexos_despesa
            ADD CONSTRAINT anexos_despesa_enviado_por_fk
                FOREIGN KEY (enviado_por_id) REFERENCES usuarios (id) ON DELETE RESTRICT;
    END IF;
END $$;
