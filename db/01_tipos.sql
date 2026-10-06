-- Domínios enumerados do modelo de dados.
-- Executar ANTES de 02_tabelas.sql: as colunas tipadas dependem destes tipos.
--
-- Referência: docs/modelo-de-dados.md, seção 4.1
--
-- CREATE TYPE não aceita IF NOT EXISTS. Cada bloco DO$$ abaixo consulta o
-- catálogo e só cria o tipo se ele ainda não existir, o que torna o script
-- reexecutável sem efeito colateral.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'papel') THEN
        CREATE TYPE papel AS ENUM ('SOLICITANTE', 'TECNICO', 'GESTOR', 'ADMINISTRADOR');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
        CREATE TYPE status AS ENUM ('AGUARDANDO_APROVACAO', 'REVISADO', 'EM_ANDAMENTO', 'CONCLUIDO');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridade') THEN
        CREATE TYPE prioridade AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria') THEN
        CREATE TYPE categoria AS ENUM ('ELETRICA', 'HIDRAULICA', 'CLIMATIZACAO', 'MOBILIARIO', 'ESTRUTURAL', 'OUTROS');
    END IF;
END $$;
