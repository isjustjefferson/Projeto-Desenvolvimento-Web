-- Migração: renomeia os valores do enum `papel` para os nomes de perfil da API
-- (CONDOMINO/PRESTADOR/SINDICO). Os dados existentes são preservados pelo RENAME.
-- Reexecutável: cada bloco só renomeia se o rótulo antigo ainda existir.
-- Executar DEPOIS de 01_tipos.sql / 02_tabelas.sql (o enum já precisa existir).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'papel' AND e.enumlabel = 'SOLICITANTE'
    ) THEN
        ALTER TYPE papel RENAME VALUE 'SOLICITANTE' TO 'CONDOMINO';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'papel' AND e.enumlabel = 'TECNICO'
    ) THEN
        ALTER TYPE papel RENAME VALUE 'TECNICO' TO 'PRESTADOR';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'papel' AND e.enumlabel = 'GESTOR'
    ) THEN
        ALTER TYPE papel RENAME VALUE 'GESTOR' TO 'SINDICO';
    END IF;
END $$;
