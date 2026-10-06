-- Índices para os filtros do RF06, as agregações do RF05 e a ordenação do RF04.
-- Executar por último: assim os índices são criados depois das FKs e não
-- reescrevem a tabela.
--
-- Referência: docs/modelo-de-dados.md, seção 4.4
--
-- (predio, andar, sala) de locais NÃO é UNIQUE de propósito: com andar e sala
-- opcionais, duas linhas podem ter sala nula, e em SQL dois NULL não são iguais
-- entre si, o que faria a restrição falhar em silêncio. A desambiguação de local
-- fica com a aplicação até existir regra de negócio que a defina.

-- Filtros do RF06
CREATE INDEX IF NOT EXISTS chamados_status_idx       ON chamados (status);
CREATE INDEX IF NOT EXISTS chamados_categoria_idx    ON chamados (categoria);
CREATE INDEX IF NOT EXISTS chamados_prioridade_idx   ON chamados (prioridade);
CREATE INDEX IF NOT EXISTS chamados_local_idx        ON chamados (local_id);
CREATE INDEX IF NOT EXISTS chamados_criado_por_idx   ON chamados (criado_por_id);
CREATE INDEX IF NOT EXISTS chamados_tecnico_idx      ON chamados (tecnico_id);
CREATE INDEX IF NOT EXISTS chamados_criado_em_idx    ON chamados (criado_em DESC);

-- Ordenação e rastreabilidade do RF04. O índice composto produz ordem total
-- mesmo quando vários eventos compartilham o mesmo instante, que é a ambiguidade
-- do seed em src/dados/seed.ts (anomalia A5 do doc).
CREATE INDEX IF NOT EXISTS historicos_chamado_data_idx ON historicos (chamado_id, data_hora DESC, id DESC);

CREATE INDEX IF NOT EXISTS tokens_reset_expira_idx     ON tokens_reset (expira_em);
CREATE INDEX IF NOT EXISTS usuarios_ativo_idx          ON usuarios (ativo);
