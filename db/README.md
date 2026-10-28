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
├── 01_tipos.sql                   # ENUMs
├── 02_tabelas.sql                 # Tabelas
├── 03_chaves_estrangeiras.sql     # FKs e regras ON DELETE
├── 04_check_rn04.sql              # CHECK da regra RN04
├── 05_indices.sql                 # Índices
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
4. Verificar: 5 tabelas, 16 índices, 6 FKs, 1 CHECK, 4 ENUMs

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
psql -U postgres -v ON_ERROR_STOP=1 -f db/02_tabelas.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/03_chaves_estrangeiras.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/04_check_rn04.sql
psql -U postgres -v ON_ERROR_STOP=1 -f db/05_indices.sql
```

> **Importante:** Sempre use `-v ON_ERROR_STOP=1`. Sem isso, o `psql` continua após erro e retorna sucesso.

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
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'; -- 5
SELECT count(*) FROM pg_constraint WHERE contype = 'f';                           -- 6
SELECT count(*) FROM pg_constraint WHERE contype = 'c';                           -- 1 (CHECK RN04)
```

---

## Referências

- [Modelo de Dados](./modelo-de-dados.md)
- [README do Projeto](../README.md)
