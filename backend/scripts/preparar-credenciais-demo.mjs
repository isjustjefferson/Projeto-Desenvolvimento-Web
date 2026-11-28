import { randomBytes } from 'node:crypto';
import { open, realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import pg from 'pg';

const SEM_CREDENCIAL = '!demo-sem-credencial';
const SENHA_PUBLICA = '123456';
const raizRepositorio = fileURLToPath(new URL('../../', import.meta.url));

class ErroOperador extends Error {}

async function caminhoPrivado(caminho) {
  if (!caminho || !isAbsolute(caminho)) {
    throw new ErroOperador('Informe o caminho absoluto de um arquivo novo em um diretório privado.');
  }
  const pasta = await realpath(dirname(caminho));
  const repositorio = await realpath(raizRepositorio);
  const relativo = relative(repositorio, pasta);
  if (!relativo || (relativo !== '..' && !relativo.startsWith(`..${sep}`) && !isAbsolute(relativo))) {
    throw new ErroOperador('O arquivo de credenciais deve ficar fora do repositório.');
  }
  return join(pasta, basename(caminho));
}

function conexaoDemo() {
  const texto = process.env.DEMO_DATABASE_URL;
  if (!texto || !URL.canParse(texto)) {
    throw new ErroOperador('Defina DEMO_DATABASE_URL com a conexão do banco de demonstração.');
  }
  const url = new URL(texto);
  if (!['postgresql:', 'postgres:'].includes(url.protocol) || !url.hostname) {
    throw new ErroOperador('DEMO_DATABASE_URL precisa apontar para um banco PostgreSQL.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (!local && !['require', 'verify-ca', 'verify-full'].includes(url.searchParams.get('sslmode'))) {
    throw new ErroOperador('Configure SSL na URL do banco remoto.');
  }
  return new pg.Client({ connectionString: texto, connectionTimeoutMillis: 8000 });
}

async function preparar(caminho, db) {
  await db.connect();
  try {
    await db.query('BEGIN');
    const { rows } = await db.query('SELECT id, email, papel, ativo, senha_hash FROM usuarios ORDER BY id');
    const credenciais = [];
    for (const usuario of rows) {
      const primeiraSenha = usuario.senha_hash === SEM_CREDENCIAL;
      if (!primeiraSenha && !(await bcrypt.compare(SENHA_PUBLICA, usuario.senha_hash))) continue;

      const senha = randomBytes(24).toString('base64url');
      const senhaHash = await bcrypt.hash(senha, 10);
      const ativo = primeiraSenha || usuario.ativo;
      const alteracao = await db.query(
        `UPDATE usuarios SET senha_hash = $1, ativo = $2
          WHERE id = $3 AND senha_hash = $4 AND ativo = $5`,
        [senhaHash, ativo, usuario.id, usuario.senha_hash, usuario.ativo],
      );
      if (alteracao.rowCount !== 1) {
        throw new ErroOperador('Uma conta foi alterada durante a rotação. Execute novamente.');
      }
      await db.query('DELETE FROM sessoes_autenticacao WHERE usuario_id = $1', [usuario.id]);
      await db.query('DELETE FROM tokens_reset WHERE usuario_id = $1', [usuario.id]);
      credenciais.push({ email: usuario.email, papel: usuario.papel, ativo, senha });
    }
    if (credenciais.length) {
      const arquivo = await open(caminho, 'wx', 0o600);
      try {
        await arquivo.writeFile(JSON.stringify(credenciais, null, 2) + '\n');
        await arquivo.sync();
      } finally {
        await arquivo.close();
      }
    }
    await db.query('COMMIT');
    console.log(`${credenciais.length} conta(s) preparada(s).`);
  } catch (erro) {
    await db.query('ROLLBACK').catch(() => {});
    throw erro;
  } finally {
    await db.end();
  }
}

try {
  const caminho = await caminhoPrivado(process.argv[2]);
  await preparar(caminho, conexaoDemo());
} catch (erro) {
  const mensagem = erro instanceof ErroOperador
    ? erro.message
    : 'Falha ao preparar as contas. Confira o banco, a migração de sessões e o caminho do arquivo.';
  console.error(mensagem);
  process.exitCode = 1;
}
