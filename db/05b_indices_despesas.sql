CREATE INDEX IF NOT EXISTS despesas_chamado_idx        ON despesas (chamado_id);
CREATE INDEX IF NOT EXISTS despesas_status_idx         ON despesas (status);
CREATE INDEX IF NOT EXISTS despesas_registrado_por_idx ON despesas (registrado_por_id);
CREATE INDEX IF NOT EXISTS despesas_aprovado_por_idx   ON despesas (aprovado_por_id);
CREATE INDEX IF NOT EXISTS despesas_criado_em_idx      ON despesas (criado_em DESC);
CREATE INDEX IF NOT EXISTS anexos_despesa_despesa_idx  ON anexos_despesa (despesa_id);
CREATE INDEX IF NOT EXISTS anexos_despesa_enviado_por_idx ON anexos_despesa (enviado_por_id);
CREATE INDEX IF NOT EXISTS anexos_despesa_criado_em_idx ON anexos_despesa (criado_em DESC);
