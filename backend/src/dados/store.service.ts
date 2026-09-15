import { Injectable } from '@nestjs/common';
import type { Chamado, UsuarioPublico } from '../contrato.js';
import { chamadosSeed, usuariosSeed } from './seed.js';
import type { UsuarioInterno } from './seed.js';

// Persistência em memória (sem banco). Carrega o seed do mock do front
// e mantém os contadores de ID para os novos registros criados via API.
interface TokenReset {
  email: string;
  expiraEm: number;
}

@Injectable()
export class StoreService {
  private readonly usuarios = new Map<number, UsuarioInterno>(
    usuariosSeed.map((u) => [u.id, u]),
  );
  private readonly chamados = new Map<number, Chamado>(
    chamadosSeed.map((c) => [c.id, c]),
  );
  private readonly tokensReset = new Map<string, TokenReset>();

  private proximoIdUsuario = Math.max(...this.usuarios.keys()) + 1;
  private proximoIdChamado = Math.max(...this.chamados.keys()) + 1;
  private proximoIdHistorico =
    Math.max(...chamadosSeed.flatMap((c) => c.historico.map((h) => h.id))) + 1;

  // ---- Usuários ----
  getUsuariosInternos(): UsuarioInterno[] {
    return [...this.usuarios.values()];
  }

  getUsuariosPublicos(): UsuarioPublico[] {
    return this.getUsuariosInternos().map(
      ({ senhaHash: _senha, ...usuario }) => usuario,
    );
  }

  getUsuarioInternoPorId(id: number): UsuarioInterno | undefined {
    return this.usuarios.get(id);
  }

  getUsuarioPorEmail(email: string): UsuarioInterno | undefined {
    const chave = email.trim().toLowerCase();
    return [...this.usuarios.values()].find(
      (u) => u.email.toLowerCase() === chave,
    );
  }

  getUsuarioPublicoPorId(id: number): UsuarioPublico | undefined {
    const u = this.usuarios.get(id);
    if (!u) return undefined;
    const { senhaHash: _senha, ...usuario } = u;
    return usuario;
  }

  salvarUsuario(usuario: UsuarioInterno): void {
    this.usuarios.set(usuario.id, usuario);
  }

  atualizarUsuario(usuario: UsuarioInterno): void {
    this.usuarios.set(usuario.id, usuario);
  }

  excluirUsuario(id: number): void {
    this.usuarios.delete(id);
  }

  // ---- Tokens de redefinição de senha ----
  salvarTokenReset(token: string, email: string, expiraEm: number): void {
    this.tokensReset.set(token, { email, expiraEm });
  }

  getTokenReset(token: string): TokenReset | undefined {
    return this.tokensReset.get(token);
  }

  removerTokenReset(token: string): void {
    this.tokensReset.delete(token);
  }

  getProximoIdUsuario(): number {
    return this.proximoIdUsuario;
  }

  incProximoIdUsuario(): number {
    return this.proximoIdUsuario++;
  }

  // ---- Chamados ----
  getChamados(): Chamado[] {
    return [...this.chamados.values()];
  }

  getChamadoPorId(id: number): Chamado | undefined {
    return this.chamados.get(id);
  }

  getProximoIdChamado(): number {
    return this.proximoIdChamado;
  }

  incProximoIdChamado(): number {
    return this.proximoIdChamado++;
  }

  getProximoIdHistorico(): number {
    return this.proximoIdHistorico;
  }

  incProximoIdHistorico(): number {
    return this.proximoIdHistorico++;
  }
}