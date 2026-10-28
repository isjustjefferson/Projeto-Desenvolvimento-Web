CREATE TABLE IF NOT EXISTS despesas (
    id                integer           GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chamado_id        integer           NOT NULL,
    registrado_por_id integer           NOT NULL,
    categoria         categoria_despesa NOT NULL,
    descricao         text              NOT NULL,
    fornecedor        varchar(160),
    cnpj              varchar(18),
    numero_nota       varchar(60),
    serie             varchar(20),
    data_emissao      date,
    valor_centavos    integer           NOT NULL CHECK (valor_centavos >= 0),
    forma_pagamento   forma_pagamento,
    pago_por          pago_por,
    status            status_despesa    NOT NULL DEFAULT 'PENDENTE',
    motivo_rejeicao   text,
    aprovado_por_id   integer,
    aprovado_em       timestamptz,
    criado_em         timestamptz       NOT NULL DEFAULT now(),
    atualizado_em     timestamptz       NOT NULL DEFAULT now(),
    CONSTRAINT despesas_valor_chk CHECK (valor_centavos >= 0)
);

CREATE TABLE IF NOT EXISTS anexos_despesa (
    id                    integer        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    despesa_id            integer        NOT NULL,
    tipo                  tipo_anexo     NOT NULL,
    tipo_documento_fiscal tipo_documento_fiscal,
    chave_nfe             varchar(44),
    numero                varchar(60),
    serie                 varchar(20),
    nome_arquivo          varchar(255)   NOT NULL,
    mime_type             varchar(120)   NOT NULL,
    tamanho_bytes         integer        NOT NULL CHECK (tamanho_bytes >= 0),
    hash_sha256           varchar(64),
    conteudo              bytea,
    enviado_por_id        integer        NOT NULL,
    criado_em             timestamptz    NOT NULL DEFAULT now()
);
