import { Inject, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { DataSource, Repository } from 'typeorm';
import { StoreService } from '../dados/store.service.js';
import { UsuarioEntity } from '../database/entities/usuario.entity.js';
import { mapUsuarioToInterno } from '../database/mappers/usuario.mapper.js';

export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;
const formatoToken = /^[A-Za-z0-9_-]{43}$/;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class SessoesService {
  private readonly sessoesTeste = new Map<string, { usuarioId: number; expiraEm: number }>();
  private readonly emTeste = process.env.NODE_ENV === 'test' || !!process.env.VITEST;

  constructor(
    private readonly store: StoreService,
    @Inject('USUARIO_REPO') private readonly usuarios: Repository<UsuarioEntity>,
    @Inject('DATA_SOURCE') private readonly db: DataSource,
  ) {}

  async criar(usuarioId: number): Promise<string> {
    const token = randomBytes(32).toString('base64url');
    const hash = hashToken(token);
    const agora = Date.now();
    const expiraEm = agora + DURACAO_SESSAO_MS;
    if (this.emTeste) {
      this.sessoesTeste.set(hash, { usuarioId, expiraEm });
    } else {
      await this.db.query(
        `WITH expiradas AS (DELETE FROM sessoes_autenticacao WHERE expira_em <= now())
         INSERT INTO sessoes_autenticacao (token_hash, usuario_id, expira_em) VALUES ($1, $2, $3)`,
        [hash, usuarioId, new Date(expiraEm)],
      );
    }
    return token;
  }

  async revogar(token: string | undefined): Promise<void> {
    if (!token || !formatoToken.test(token)) return;
    const hash = hashToken(token);
    if (this.emTeste) {
      this.sessoesTeste.delete(hash);
    } else {
      await this.db.query('DELETE FROM sessoes_autenticacao WHERE token_hash = $1', [hash]);
    }
  }

  async usuarioDaSessao(token: string | undefined) {
    if (!token || !formatoToken.test(token)) return undefined;
    const hash = hashToken(token);
    if (this.emTeste) {
      const sessao = this.sessoesTeste.get(hash);
      if (!sessao || sessao.expiraEm <= Date.now()) return undefined;
      const usuario = this.store.getUsuarioInternoPorId(sessao.usuarioId);
      return usuario?.ativo ? usuario : undefined;
    }
    const [sessao] = await this.db.query<{ usuario_id: number }[]>(
      'SELECT usuario_id FROM sessoes_autenticacao WHERE token_hash = $1 AND expira_em > now()',
      [hash],
    );
    if (!sessao) return undefined;
    const usuario = await this.usuarios.findOne({ where: { id: sessao.usuario_id, ativo: true } });
    return usuario ? mapUsuarioToInterno(usuario) : undefined;
  }
}
