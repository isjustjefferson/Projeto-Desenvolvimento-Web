-- Tabelas do modelo de dados, sem as chaves estrangeiras.
-- Executar DEPOIS de 01_tipos.sql e ANTES de 03_chaves_estrangeiras.sql.
--
-- Referência: docs/modelo-de-dados.md, seção 3.1
--
-- As FKs ficam em arquivo separado para que a ordem de aplicação do DDL
-- fique explícita: tipos -> tabelas -> FKs -> CHECK -> índices.

CREATE TABLE IF NOT EXISTS usuarios (
    id               integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome             varchar(120) NOT NULL,
    email            varchar(180) NOT NULL,
    papel            papel        NOT NULL,
    localizacao      varchar(120),
    especialidade    varchar(80),
    ativo            boolean      NOT NULL DEFAULT true,
    foto             bytea,
    senha_hash       varchar(100) NOT NULL,
    criado_em        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT usuarios_email_unq UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS locais (
    id               integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    predio           varchar(80)  NOT NULL,
    andar            varchar(40),
    sala             varchar(60)
);

CREATE TABLE IF NOT EXISTS chamados (
    id                   integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo               varchar(160) NOT NULL,
    descricao            text         NOT NULL,
    categoria            categoria    NOT NULL,
    status               status       NOT NULL DEFAULT 'AGUARDANDO_APROVACAO',
    prioridade           prioridade,
    local_id             integer      NOT NULL,
    criado_por_id        integer      NOT NULL,
    tecnico_id           integer,
    foto                 bytea,
    solucao_descricao    text,
    solucao_materiais    text,
    criado_em            timestamptz  NOT NULL DEFAULT now(),
    atualizado_em        timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS historicos (
    id           integer      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chamado_id   integer      NOT NULL,
    usuario_id   integer      NOT NULL,
    de_status    status,
    para_status  status       NOT NULL,
    data_hora    timestamptz  NOT NULL DEFAULT now(),
    observacao   text
);

CREATE TABLE IF NOT EXISTS tokens_reset (
    token        varchar(128) PRIMARY KEY,
    usuario_id   integer      NOT NULL,
    expira_em    timestamptz  NOT NULL
);
