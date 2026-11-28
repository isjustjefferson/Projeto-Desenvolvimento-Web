# Banco de Dados - Sistema de Gestão de Chamados

**Responsável:** Jefferson Felipe ([@isjustjefferson](https://github.com/isjustjefferson))  
**Projeto:** Sistema de Gestão de Chamados de Manutenção Predial  
**SGBD:** PostgreSQL 14+ (validado em 18)

---

## Estrutura

```text
db/
├── README.md                      # Este guia
├── modelo-de-dados.md             # Modelo conceitual, lógico e físico
├── 01_tipos.sql                   # ENUMs principais
├── 01b_tipos_despesas.sql         # ENUMs de despesas/anexos
├── 02_tabelas.sql                 # Tabelas principais
├── 02b_despesas_tabelas.sql       # Tabelas despesas e anexos_despesa
├── 03_chaves_estrangeiras.sql     # FKs principais
├── 03b_chaves_despesas.sql        # FKs de despesas
├── 04_check_rn04.sql              # CHECK da regra RN04
├── 05_indices.sql                 # Índices principais
├── 05b_indices_despesas.sql       # Índices de despesas
06_migracao_papel.sql          # migra enum papel (perfis novos)
07_seed_demo.sql               # seed demo (contas inicialmente inativas, locais, chamados e históricos)
08_orcamentos.sql              # tabela orcamentos
09_nota_fiscal_ocr.sql         # colunas OCR em anexos_despesa
10_migracao_status_recusado.sql # status RECUSADO em bancos existentes
11_trabalhos_ocr.sql           # fila persistente para o worker local
12_sessoes_autenticacao.sql    # sessões compartilhadas entre Chamados e Financeiro
└── scripts/
    └── iniciar-banco.ps1          # Script de provisionamento
```

---

## Entregas

| Entrega | Arquivo | Status | Descrição |
| :--- | :--- | :---: | :--- |
| **Modelo de Dados** | [modelo-de-dados.md](./modelo-de-dados.md) | ✅ Concluído | Minimundo, MER, modelo relacional e físico |
| **DDL** | `01_tipos.sql` a `05_indices.sql` | ✅ Concluído | Schema validado em PostgreSQL 18 |
| **Provisionamento** | [scripts/iniciar-banco.ps1](./scripts/iniciar-banco.ps1) | ✅ Concluído | Cria papel/banco, aplica DDL e verifica |

---

## Pré-requisitos

- [PostgreSQL](https://www.postgresql.org/) 14 ou superior instalado e com `psql` no `PATH`
- PowerShell 5.1 ou superior

---

## Como provisionar o banco

### Opção 1: Script automatizado (recomendado)

Abra o PowerShell na raiz do projeto:

```powershell
.\db\scripts\iniciar-banco.ps1
```

O script irá:
1. Criar o papel `predial` (ou gerar senha se não informada)
2. Criar o banco `predial` com `UTF8`
3. Aplicar os arquivos SQL na ordem correta
4. Verificar 10 tabelas, 34 índices, 16 FKs, o CHECK da RN04, 11 ENUMs, o status `RECUSADO`, a tabela `orcamentos` e as colunas OCR.

**Variáveis opcionais:**

```powershell
# Banco/papel diferentes
.\db\scripts\iniciar-banco.ps1 -NomeBanco predial_dev -NomePapel predial_dev

# Recriar do zero (apaga dados existentes)
.\db\scripts\iniciar-banco.ps1 -Recriar

# Usar senha do ambiente
$env:DB_PASSWORD = "sua-senha"; .\db\scripts\iniciar-banco.ps1
```

### Opção 2: Manual com psql

```bash
psql -U postgres -v ON_ERROR_STOP=1 -f db/01_tipos.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/01b_tipos_despesas.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/02_tabelas.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/02b_despesas_tabelas.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/03_chaves_estrangeiras.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/03b_chaves_despesas.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/04_check_rn04.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/05_indices.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/05b_indices_despesas.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/06_migracao_papel.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/07_seed_demo.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/08_orcamentos.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/09_nota_fiscal_ocr.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/10_migracao_status_recusado.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/11_trabalhos_ocr.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/12_sessoes_autenticacao.sql
```

> **Importante:** Sempre use `-v ON_ERROR_STOP=1`. Sem isso, o `psql` continua após erro e retorna sucesso.

Para inicializar um banco local de desenvolvimento com as mesmas contas de teste do Compose, substitua a linha do seed por `psql -U postgres -v ON_ERROR_STOP=1 -c "SET predial.seed_local = 'on'" -f db/07_seed_demo.sql` durante a carga inicial. Para uma demo publicada, use o fluxo de [credenciais individuais](DEPLOY_NUVEM_SUPABASE.md#4-preparar-as-credenciais-da-demo).

---

## Conexão com a aplicação

As variáveis de ambiente esperadas pelo backend:

| Variável | Exemplo | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://predial:senha@localhost:5432/predial` | URL de conexão |
| `DB_TZ` | `UTC` | Fuso da sessão (recomendado) |

---

## Verificação rápida

```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';                                      -- 8
SELECT count(*) FROM pg_constraint WHERE contype = 'f';                                                              -- 14
SELECT count(*) FROM pg_constraint WHERE contype = 'c' AND conname = 'chamados_conclusao_incompleta_chk';             -- 1 (CHECK RN04)
```

---

## Referências

- [Modelo de Dados](./modelo-de-dados.md)
- [README do Projeto](../README.md)
