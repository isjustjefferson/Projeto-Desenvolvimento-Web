-- Restrição de verificação do RN04: chamado CONCLUIDO exige solução com
-- descrição e materiais preenchidos.
-- Executar DEPOIS de 03_chaves_estrangeiras.sql.
--
-- Referência: docs/modelo-de-dados.md, seção 4.3
--
-- Os IS NOT NULL são indispensáveis. Em SQL, um CHECK é satisfeito quando a
-- expressão resulta em TRUE *ou* em NULL: só FALSE reprova. Sem eles, um
-- CONCLUIDO com solução NULL produz btrim(NULL) <> '' -> NULL e passaria.
-- Isso foi confirmado executando o DDL: a versão sem IS NOT NULL aceitou
-- chamados CONCLUIDO com solução nula ou em branco.
--
-- O btrim continua necessário para o caso que IS NOT NULL não pega: campo
-- preenchido apenas com espaços.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chamados_conclusao_incompleta_chk') THEN
        ALTER TABLE chamados
            ADD CONSTRAINT chamados_conclusao_incompleta_chk
                CHECK (
                    status <> 'CONCLUIDO'
                    OR (
                        solucao_descricao IS NOT NULL
                        AND solucao_materiais IS NOT NULL
                        AND btrim(solucao_descricao) <> ''
                        AND btrim(solucao_materiais) <> ''
                    )
                );
    END IF;
END $$;
