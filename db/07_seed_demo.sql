-- Seed de demonstração: usuários, locais, chamados e históricos (mesmos dados do
-- seed em memória em backend/src/dados/seed.ts, com senha padrão "123456").
-- Reexecutável via ON CONFLICT DO NOTHING, preservando bancos já populados.
-- As datas são relativas a now() para aproximar o comportamento do seed em memória.

INSERT INTO usuarios (id, nome, email, papel, unidade, setor, especialidade, ativo, senha_hash)
OVERRIDING SYSTEM VALUE
VALUES
(1, 'Ana Souza', 'ana@predial.com', 'CONDOMINO', 'Bloco A, Ap 204', 'Apartamento 204', NULL, true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
(2, 'Carlos Lima', 'carlos@predial.com', 'CONDOMINO', 'Bloco A, Ap 102', 'Apartamento 102', NULL, true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
(3, 'João Eletricista', 'joao@predial.com', 'PRESTADOR', NULL, 'Manutenção', 'Elétrica', true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
(4, 'Marta Encanadora', 'marta@predial.com', 'PRESTADOR', NULL, 'Manutenção', 'Hidráulica', true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
(5, 'Ricardo Síndico', 'ricardo@predial.com', 'SINDICO', NULL, 'Administração', NULL, true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
(6, 'Tiago TI', 'tiago@predial.com', 'ADMINISTRADOR', NULL, 'Tecnologia da Informação', NULL, true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy')
ON CONFLICT DO NOTHING;

SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 1));

INSERT INTO usuarios (nome, email, papel, setor, especialidade, ativo, senha_hash)
VALUES
('Paulo Climatização', 'paulo@predial.com', 'PRESTADOR', 'Manutenção', 'Climatização', true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
('Carla Marceneira', 'carla@predial.com', 'PRESTADOR', 'Manutenção', 'Mobiliário', true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
('Roberto Estrutural', 'roberto@predial.com', 'PRESTADOR', 'Manutenção', 'Estrutural', true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy'),
('Fernanda Manutenção Geral', 'fernanda@predial.com', 'PRESTADOR', 'Manutenção', 'Outros', true, '$2b$10$DmCrxiTKQDGTfdr4kbLSBeftMtEX76cN..OA6qH6.5Vo7DA4gJdIy')
ON CONFLICT (email) DO NOTHING;

INSERT INTO locais (id, predio, andar, sala)
OVERRIDING SYSTEM VALUE
VALUES
(1, 'Bloco A', '2º andar', '204'),
(2, 'Bloco A', '1º andar', '102'),
(3, 'Bloco A', '2º andar', 'Corredor'),
(4, 'Bloco B', 'Térreo', 'Recepção'),
(5, 'Bloco A', '1º andar', 'Corredor')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chamados (id, titulo, descricao, categoria, status, prioridade,
    local_id, criado_por_id, tecnico_id, foto, classificacao,
    solucao_descricao, solucao_materiais, criado_em, atualizado_em)
OVERRIDING SYSTEM VALUE
VALUES
(1, 'Tomada sem energia',
    'A tomada da sala de estar do ap 204 não funciona. Já testei outros aparelhos e nenhum funciona.',
    'ELETRICA', 'CONCLUIDO', 'MEDIA', 1, 1, 3, NULL, NULL,
    'Tomada trocada por uma nova, fiação revisada.', '1 tomada 2P+T, fita isolante',
    now() - interval '5 days', now() - interval '3 days'),
(2, 'Vazamento no banheiro',
    'Há um vazamento constante embaixo da pia do banheiro do ap 102.',
    'HIDRAULICA', 'EM_ANDAMENTO', 'ALTA', 2, 2, 4, NULL, NULL,
    NULL, NULL,
    now() - interval '2 days', now() - interval '6 hours'),
(3, 'Ar-condicionado sem gelar',
    'O ar-condicionado do corredor do 2º andar liga mas não está gelando.',
    'CLIMATIZACAO', 'AGUARDANDO_APROVACAO', 'MEDIA', 3, 1, NULL, NULL, NULL,
    NULL, NULL,
    now() - interval '8 hours', now() - interval '8 hours'),
(4, 'Cadeira quebrada',
    'Uma cadeira da recepção quebrou o encosto e precisa de conserto ou substituição.',
    'MOBILIARIO', 'REVISADO', 'BAIXA', 4, 2, NULL, NULL, NULL,
    NULL, NULL,
    now() - interval '3 days', now() - interval '1 day'),
(5, 'Infiltração no teto',
    'Mancha de infiltração crescendo no teto do corredor do 1º andar.',
    'ESTRUTURAL', 'AGUARDANDO_APROVACAO', 'CRITICA', 5, 1, NULL, NULL, NULL,
    NULL, NULL,
    now() - interval '5 hours', now() - interval '5 hours')
ON CONFLICT (id) DO NOTHING;

INSERT INTO historicos (id, chamado_id, usuario_id, de_status, para_status, data_hora, observacao)
OVERRIDING SYSTEM VALUE
VALUES
(1, 1, 1, NULL, 'CONCLUIDO', now() - interval '5 days', NULL),
(2, 1, 3, 'REVISADO', 'EM_ANDAMENTO', now() - interval '4 days', NULL),
(3, 1, 5, 'AGUARDANDO_APROVACAO', 'REVISADO', now() - interval '4 days', NULL),
(4, 1, 1, NULL, 'AGUARDANDO_APROVACAO', now() - interval '5 days', NULL),
(5, 2, 4, 'REVISADO', 'EM_ANDAMENTO', now() - interval '6 hours', NULL),
(6, 2, 5, 'AGUARDANDO_APROVACAO', 'REVISADO', now() - interval '2 days', NULL),
(7, 2, 2, NULL, 'AGUARDANDO_APROVACAO', now() - interval '2 days', NULL),
(8, 3, 1, NULL, 'AGUARDANDO_APROVACAO', now() - interval '8 hours', NULL),
(9, 4, 5, 'AGUARDANDO_APROVACAO', 'REVISADO', now() - interval '1 day', NULL),
(10, 4, 2, NULL, 'AGUARDANDO_APROVACAO', now() - interval '3 days', NULL),
(11, 5, 1, NULL, 'AGUARDANDO_APROVACAO', now() - interval '5 hours', NULL)
ON CONFLICT (id) DO NOTHING;

-- Ajusta as sequências para continuar após os ids semeados.
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 1));
SELECT setval('locais_id_seq', COALESCE((SELECT MAX(id) FROM locais), 1));
SELECT setval('chamados_id_seq', COALESCE((SELECT MAX(id) FROM chamados), 1));
SELECT setval('historicos_id_seq', COALESCE((SELECT MAX(id) FROM historicos), 1));
