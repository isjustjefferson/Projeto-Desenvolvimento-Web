\set ON_ERROR_STOP on
\i /provisionamento/01_tipos.sql
\i /provisionamento/01b_tipos_despesas.sql
\i /provisionamento/02_tabelas.sql
\i /provisionamento/02b_despesas_tabelas.sql
\i /provisionamento/03_chaves_estrangeiras.sql
\i /provisionamento/03b_chaves_despesas.sql
\i /provisionamento/04_check_rn04.sql
\i /provisionamento/05_indices.sql
\i /provisionamento/05b_indices_despesas.sql
\i /provisionamento/06_migracao_papel.sql
SET predial.seed_local = 'on';
\i /provisionamento/07_seed_demo.sql
RESET predial.seed_local;
\i /provisionamento/08_orcamentos.sql
\i /provisionamento/09_nota_fiscal_ocr.sql
\i /provisionamento/10_migracao_status_recusado.sql
\i /provisionamento/11_trabalhos_ocr.sql
\i /provisionamento/12_sessoes_autenticacao.sql
