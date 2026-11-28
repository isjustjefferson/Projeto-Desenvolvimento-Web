# Deploy do banco na nuvem (Supabase / Postgres gerenciado)

Este guia aplica o schema do projeto (`db/`, fonte da verdade) em um PostgreSQL gerenciado. O backend usa TypeORM com `synchronize: false`.

## 1) Criar o banco
1. Crie um projeto no [Supabase](https://supabase.com/) (ou Neon/Render/RDS).
2. Obtenha a **connection string** em *Project Settings → Database*.
3. Para o backend NestJS/TypeORM (server-side), prefira a **conexão direta** (porta `5432`, host `db.<ref>.supabase.co`) quando disponível. Se usar pooler, valide o modo (pooler em *transaction* pode exigir ajustes com prepared statements).
4. **Não compartilhe** senha/URL em chat, tickets públicos ou commits. Use apenas `backend/.env` local/segredos do ambiente de deploy.

## 2) Configurar o backend
Configure estas variáveis no ambiente do backend publicado e armazene a URL do banco como segredo:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
DB_SSL=require
# DB_SSL_REJECT_UNAUTHORIZED=false  # padrão; true apenas se você configurar CA
NODE_ENV=production
```

Para desenvolvimento local por HTTP, configure `NODE_ENV=development` no `backend/.env`, fora do Git. Em produção, sirva a interface e o proxy de `/api` na mesma origem HTTPS para que o navegador possa usar o cookie `Secure`.

## 3) Aplicar o schema (ordem obrigatória)
Execute contra o banco remoto com `ON_ERROR_STOP=1`. Exemplo com `psql` (PowerShell):

```powershell
$env:PGPASSWORD = "SUA_SENHA"
$env:PGSSLMODE  = "require"
$base = "psql -h HOST -p 5432 -U USER -d postgres -v ON_ERROR_STOP=1 -f"
# Ajuste HOST/USER/DB conforme o provedor (Supabase: user geralmente postgres; db pode ser postgres)

Invoke-Expression "$base db/01_tipos.sql"
Invoke-Expression "$base db/01b_tipos_despesas.sql"
Invoke-Expression "$base db/02_tabelas.sql"
Invoke-Expression "$base db/02b_despesas_tabelas.sql"
Invoke-Expression "$base db/03_chaves_estrangeiras.sql"
Invoke-Expression "$base db/03b_chaves_despesas.sql"
Invoke-Expression "$base db/04_check_rn04.sql"
Invoke-Expression "$base db/05_indices.sql"
Invoke-Expression "$base db/05b_indices_despesas.sql"
Invoke-Expression "$base db/06_migracao_papel.sql"
Invoke-Expression "$base db/07_seed_demo.sql"
Invoke-Expression "$base db/08_orcamentos.sql"
Invoke-Expression "$base db/09_nota_fiscal_ocr.sql"
Invoke-Expression "$base db/10_migracao_status_recusado.sql"
Invoke-Expression "$base db/11_trabalhos_ocr.sql"
Invoke-Expression "$base db/12_sessoes_autenticacao.sql"
```

Alternativa: rodar os mesmos arquivos no **SQL Editor** do Supabase, na mesma ordem, conferindo erros.

## 4) Preparar as credenciais da demo

O seed cria contas inativas fora do Compose de desenvolvimento. Para uma demo existente, o comando abaixo também troca a senha de contas que ainda usam a senha pública e revoga suas sessões. Execute após aplicar o schema, durante a janela de implantação com o acesso à API suspenso. Confirme que a conexão aponta para o banco de demonstração.

Execute na raiz do repositório com as dependências do backend instaladas e um caminho novo em uma pasta privada fora do repositório.

```powershell
$env:DEMO_DATABASE_URL = Read-Host -MaskInput 'Connection string do banco da demo com SSL'
try {
  npm --prefix backend run preparar:demo -- 'C:\caminho-privado\contas-demo.json'
} finally {
  Remove-Item Env:\DEMO_DATABASE_URL
}
```

O comando ativa as contas novas do seed e gera uma senha diferente por conta. Em contas existentes que ainda usam a senha pública, preserva o status de ativação. Ele grava as novas senhas no arquivo local, e o banco recebe somente os hashes. Importe as credenciais necessárias no gerenciador de senhas da equipe e entregue ao professor somente os perfis previstos para a avaliação.

## 5) Verificação rápida
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- Esperado incluir: usuarios, locais, chamados, historicos, tokens_reset, despesas,
-- anexos_despesa, orcamentos, trabalhos_ocr, sessoes_autenticacao
SELECT count(*) FROM pg_constraint WHERE contype = 'f';
SELECT count(*) FROM pg_constraint WHERE contype = 'c';
SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'status' ORDER BY enumsortorder;
-- Deve incluir: AGUARDANDO_APROVACAO, REVISADO, EM_ANDAMENTO, CONCLUIDO, RECUSADO
```

## 6) Smoke test da aplicação
Com `DATABASE_URL` apontando para a nuvem:
1. Inicie o backend (`npm run start:dev` em `backend/`).
2. Teste: login/auth, criar/listar/obter chamado, transições, despesas e anexos (`bytea`).
3. Valide que não há erros de SSL/conexão.

## 7) Observações do projeto
- O backend usa PostgreSQL em execução normal. O seed em memória é usado nos testes. O seed SQL pode ser reaplicado e preserva as credenciais existentes.
- Testes automatizados do backend em `backend/`: `npm test` e `npm run test:e2e`.
