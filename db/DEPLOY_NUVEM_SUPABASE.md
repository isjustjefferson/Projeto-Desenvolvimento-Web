# Deploy do banco na nuvem (Supabase / Postgres gerenciado)

Este guia aplica o schema do projeto (`db/`, fonte da verdade) em um PostgreSQL gerenciado. O backend usa TypeORM com `synchronize: false`.

## 1) Criar o banco
1. Crie um projeto no [Supabase](https://supabase.com/) (ou Neon/Render/RDS).
2. Obtenha a **connection string** em *Project Settings → Database*.
3. Para o backend NestJS/TypeORM (server-side), prefira a **conexão direta** (porta `5432`, host `db.<ref>.supabase.co`) quando disponível. Se usar pooler, valide o modo (pooler em *transaction* pode exigir ajustes com prepared statements).
4. **Não compartilhe** senha/URL em chat, tickets públicos ou commits. Use apenas `backend/.env` local/segredos do ambiente de deploy.

## 2) Configurar o backend
No `backend/.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
DB_SSL=require
# DB_SSL_REJECT_UNAUTHORIZED=false  # padrão; true apenas se você configurar CA
NODE_ENV=development
```

> `backend/.env` deve permanecer fora do Git.

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
```

Alternativa: rodar os mesmos arquivos no **SQL Editor** do Supabase, na mesma ordem, conferindo erros.

## 4) Verificação rápida
```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
-- Esperado incluir: usuarios, locais, chamados, historicos, tokens_reset, despesas, anexos_despesa
SELECT count(*) FROM pg_constraint WHERE contype = 'f';
SELECT count(*) FROM pg_constraint WHERE contype = 'c';
```

## 5) Smoke test da aplicação
Com `DATABASE_URL` apontando para a nuvem:
1. Inicie o backend (`npm run start:dev` em `backend/`).
2. Teste: login/auth, criar/listar/obter chamado, transições, despesas e anexos (`bytea`).
3. Valide que não há erros de SSL/conexão.

## 6) Observações do projeto
- Parte do fluxo ainda pode depender de `StoreService`/seed em memória durante a migração gradual (Strangler Fig). Subir o Postgres na nuvem não carrega automaticamente dados desse seed.
- Planeje carga inicial (ex.: usuário admin) via SQL controlado, sem expor segredos no repositório.
- Testes automatizados: `npm test` e `npm run test:e2e` (há 1 falha e2e pré-existente conhecida).