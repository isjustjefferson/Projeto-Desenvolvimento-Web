CREATE TABLE IF NOT EXISTS sessoes_autenticacao (
    token_hash   char(64) PRIMARY KEY,
    usuario_id   integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    expira_em    timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessoes_autenticacao_usuario_idx ON sessoes_autenticacao (usuario_id);
CREATE INDEX IF NOT EXISTS sessoes_autenticacao_expira_idx ON sessoes_autenticacao (expira_em);

ALTER TABLE sessoes_autenticacao ENABLE ROW LEVEL SECURITY;
