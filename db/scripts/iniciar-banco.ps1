<#
.SYNOPSIS
    Provisiona um banco PostgreSQL com o modelo de dados do sistema.

.DESCRIPTION
    Cria o papel e o banco (se não existirem), aplica o DDL na ordem correta e
    imprime o resultado da verificação.

    A ordem de aplicação é obrigatória e respeitada por este script:
        01 tipos -> 02 tabelas -> 03 FKs -> 04 CHECK -> 05 índices

.EXAMPLE
    .\iniciar-banco.ps1
    Provisiona o banco predial em localhost:5432 com as credenciais padrão.

.EXAMPLE
    .\iniciar-banco.ps1 -NomeBanco predial_dev -Recriar
    Apaga e recria o banco. -Recriar remove TODOS os dados.

.EXAMPLE
    $env:DB_PASSWORD = 'outra-senha'; .\iniciar-banco.ps1
    Usa senha vinda do ambiente, sem passá-la na linha de comando.
#>

[CmdletBinding()]
param(
    [string] $NomeBanco    = 'predial',
    [string] $NomePapel     = 'predial',
    [string] $Host          = 'localhost',
    [int]    $Porta         = 5432,
    [string] $UsuarioAdmin  = 'postgres',
    [string] $SenhaAdmin    = $env:PGPASSWORD,
    [string] $SenhaPapel    = $env:DB_PASSWORD,
    [switch] $Recriar,
    [switch] $PularVerificacao
)

$ErrorActionPreference = 'Stop'

$raizBanco = Split-Path -Parent $PSScriptRoot
$dirSql    = Join-Path $raizBanco 'db'

function Write-Etapa {
    param([string] $Mensagem)
    Write-Host "`n==> $Mensagem" -ForegroundColor Cyan
}

function Write-Ok {
    param([string] $Mensagem)
    Write-Host "    ok: $Mensagem" -ForegroundColor Green
}

function Write-Erro {
    param([string] $Mensagem)
    Write-Host "    ERRO: $Mensagem" -ForegroundColor Red
}

function Invoke-Sql {
    <#
        Executa SQL contra um banco e retorna a saída como texto.
        -v ON_ERROR_STOP=1 é obrigatório: sem ele o psql continua após um erro e
        devolve código de saída 0, mascarando script parcialmente aplicado.
    #>
    param(
        [Parameter(Mandatory)] [string] $Sql,
        [Parameter(Mandatory)] [string] $Banco,
        [string] $Usuario = $UsuarioAdmin,
        [string] $Senha   = $SenhaAdmin
    )

    if ($Senha) {
        $env:PGPASSWORD = $Senha
    } else {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }

    $argsPsql = @(
        '-h', $Host, '-p', $Porta, '-U', $Usuario, '-d', $Banco,
        '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-F', '|',
        '-c', $Sql
    )

    $saida = & psql @argsPsql 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($saida | Out-String).Trim()
    }
    return $saida
}

function Invoke-ArquivoSql {
    param(
        [Parameter(Mandatory)] [string] $Caminho,
        [Parameter(Mandatory)] [string] $Banco
    )

    if (-not (Test-Path -LiteralPath $Caminho)) {
        throw "Arquivo SQL não encontrado: $Caminho"
    }

    if ($SenhaAdmin) {
        $env:PGPASSWORD = $SenhaAdmin
    } else {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }

    $saida = & psql '-h' $Host '-p' $Porta '-U' $UsuarioAdmin '-d' $Banco `
                      '-v' 'ON_ERROR_STOP=1' '-f' $Caminho 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($saida | Out-String).Trim()
    }
    $nome = Split-Path -Leaf $Caminho
    Write-Ok $nome
}

# ---------------------------------------------------------------------------
Write-Host "Provisionando banco '$NomeBanco' em $Host`:$Porta" -ForegroundColor White

if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    throw "psql não encontrado no PATH. Instale o PostgreSQL 14+ ou adicione o diretório bin ao PATH."
}

# Conectividade: a coluna de existência do papel decide se criamos o banco.
Write-Etapa 'Verificando conexão'
try {
    Invoke-Sql -Sql 'SELECT 1;' -Banco 'postgres' | Out-Null
    Write-Ok "conectado como $UsuarioAdmin"
} catch {
    throw "Não foi possível conectar em $Host`:$Porta como $UsuarioAdmin. $PSItem"
}

# ---------------------------------------------------------------------------
Write-Etapa 'Papel e banco'

$papelExiste = Invoke-Sql -Sql "SELECT 1 FROM pg_roles WHERE rolname = '$NomePapel';" -Banco 'postgres'

if ($Recriar -and $papelExiste -match '1') {
    $emUso = Invoke-Sql -Sql "SELECT count(*) FROM pg_database WHERE datname = '$NomeBanco';" -Banco 'postgres'
    if ($emUso -match '\d' -and [int]($emUso.Trim()) -gt 0) {
        Write-Host "    -Recriar: removendo o banco '$NomeBanco'" -ForegroundColor Yellow
        Invoke-Sql -Sql "DROP DATABASE IF EXISTS $NomeBanco;" -Banco 'postgres' | Out-Null
        Write-Ok "banco removido"
    }
}

if ($Recriar -and $papelExiste -notmatch '1') {
    Invoke-Sql -Sql "DROP ROLE IF EXISTS $NomePapel;" -Banco 'postgres' | Out-Null
}

# A senha do papel só é usada na criação. Se não vier do ambiente, geramos uma
# senha aleatória e a exibimos uma vez: é mais seguro do que uma senha padrão
# conhecida no repositório.
$senhaEfetiva = $SenhaPapel
$senhaGerada  = $false
if (-not $senhaEfetiva) {
    $bytes        = New-Object byte[] 18
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $senhaEfetiva = [Convert]::ToBase64String($bytes).Replace('+', 'a').Replace('/', 'b').TrimEnd('=')
    $senhaGerada   = $true
}

if ($papelExiste -notmatch '1') {
    Invoke-Sql -Sql "CREATE ROLE $NomePapel LOGIN PASSWORD '$senhaEfetiva';" -Banco 'postgres' | Out-Null
    Write-Ok "papel $NomePapel criado"
} else {
    Write-Ok "papel $NomePapel já existe"
}

$bancoExiste = Invoke-Sql -Sql "SELECT 1 FROM pg_database WHERE datname = '$NomeBanco';" -Banco 'postgres'

if ($bancoExiste -notmatch '1') {
    # ENCODING UTF8 explícito: o padrão depende da locale do servidor e pode ser
    # SQL_ASCII, o que quebra a acentuação de nomes e descrições.
    Invoke-Sql -Sql "CREATE DATABASE $NomeBanco OWNER $NomePapel ENCODING 'UTF8';" -Banco 'postgres' | Out-Null
    Write-Ok "banco $NomeBanco criado (UTF8)"
} else {
    Write-Ok "banco $NomeBanco já existe"
}

# ---------------------------------------------------------------------------
Write-Etapa 'Aplicando o DDL na ordem correta'

Invoke-ArquivoSql -Caminho (Join-Path $dirSql '01_tipos.sql')             -Banco $NomeBanco
Invoke-ArquivoSql -Caminho (Join-Path $dirSql '02_tabelas.sql')           -Banco $NomeBanco
Invoke-ArquivoSql -Caminho (Join-Path $dirSql '03_chaves_estrangeiras.sql') -Banco $NomeBanco
Invoke-ArquivoSql -Caminho (Join-Path $dirSql '04_check_rn04.sql')        -Banco $NomeBanco
Invoke-ArquivoSql -Caminho (Join-Path $dirSql '05_indices.sql')           -Banco $NomeBanco

# ---------------------------------------------------------------------------
if (-not $PularVerificacao) {
    Write-Etapa 'Verificando a implantação'

    $tabelas = Invoke-Sql -Sql "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" -Banco $NomeBanco
    $indice  = Invoke-Sql -Sql "SELECT count(*) FROM pg_indexes WHERE schemaname = 'public';" -Banco $NomeBanco
    $fks     = Invoke-Sql -Sql "SELECT count(*) FROM pg_constraint WHERE contype = 'f';" -Banco $NomeBanco
    $checks  = Invoke-Sql -Sql "SELECT count(*) FROM pg_constraint WHERE contype = 'c' AND conname = 'chamados_conclusao_incompleta_chk';" -Banco $NomeBanco
    $tipos   = Invoke-Sql -Sql "SELECT count(*) FROM pg_type WHERE typname IN ('papel','status','prioridade','categoria');" -Banco $NomeBanco

    $esperado = @{
        tabelas = 5; indices = 16; fks = 6; checks = 1; tipos = 4
    }

    $divergencias = @()
    foreach ($chave in $esperado.Keys) {
        $obtido = [int]($(
            switch ($chave) {
                'tabelas' { $tabelas }; 'indices' { $indice }
                'fks'     { $fks };     'checks' { $checks }
                'tipos'   { $tipos }
            }
        ).Trim())
        $rotulo = switch ($chave) {
            'tabelas' { 'tabelas' }; 'indices' { 'índices' }
            'fks'     { 'chaves estrangeiras' }; 'checks' { 'CHECK do RN04' }
            'tipos'   { 'tipos ENUM' }
        }
        if ($obtido -eq $esperado[$chave]) {
            Write-Ok "$rotulo`: $obtido"
        } else {
            Write-Erro "$rotulo`: esperado $($esperado[$chave]), encontrado $obtido"
            $divergencias += $rotulo
        }
    }

    if ($divergencias.Count -gt 0) {
        throw "Verificação falhou em: $($divergencias -join ', ')"
    }
}

# ---------------------------------------------------------------------------
Write-Host "`nBanco '$NomeBanco' pronto." -ForegroundColor Green

if ($senhaGerada) {
    Write-Host "`nSenha gerada para o papel $NomePapel (exibida uma única vez):" -ForegroundColor Yellow
    Write-Host "    $senhaEfetiva" -ForegroundColor White
    Write-Host "Guarde-a e defina como DB_PASSWORD antes de rodar a aplicacao." -ForegroundColor Yellow
}

Write-Host "`nPara a aplicacao:" -ForegroundColor White
Write-Host "    DATABASE_URL=postgresql://${NomePapel}:<senha>@${Host}:${Porta}/${NomeBanco}"
Write-Host "    DB_TZ=UTC"
Write-Host ""
Write-Host "Os dados de demonstracao sao carregados pelo seed da aplicacao (Fase 5)."
Write-Host "Os arquivos em db/ sao reexecutaveis: nao ha erro ao rodar duas vezes.`n"
