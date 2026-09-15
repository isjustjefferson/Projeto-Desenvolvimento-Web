import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import type { UsuarioPublico } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import type { UsuarioInterno } from '../dados/seed.js';
import type {
  AtualizarContaDto,
  LoginDto,
  RedefinirSenhaDto,
  RegistrarDto,
} from './dto/auth.dto.js';

const SALT_ROUNDS = 10;
const TEMPO_TOKEN_HORAS = 1;

@Injectable()
export class AuthService {
  constructor(private readonly store: StoreService) {}

  login(dados: LoginDto): { ok: true; usuario: UsuarioPublico } {
    const usuario = this.store.getUsuarioPorEmail(dados.email);
    if (!usuario) {
      throw new UnauthorizedException(
        'E-mail não encontrado. Crie uma conta.',
      );
    }
    if (!bcrypt.compareSync(dados.senha, usuario.senhaHash)) {
      throw new UnauthorizedException('Senha incorreta. Tente novamente.');
    }
    if (!usuario.ativo) {
      throw new UnauthorizedException(
        'Conta desativada. Contate o administrador.',
      );
    }
    return { ok: true, usuario: this.paraPublico(usuario) };
  }

  registrar(dados: RegistrarDto): { ok: true; usuario: UsuarioPublico } {
    const email = dados.email.trim().toLowerCase();
    if (this.store.getUsuarioPorEmail(email)) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const novo: UsuarioInterno = {
      id: this.store.incProximoIdUsuario(),
      nome: dados.nome.trim(),
      email,
      role: 'SOLICITANTE',
      unidade: dados.unidade.trim(),
      setor: dados.unidade.trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
      senhaHash: bcrypt.hashSync(dados.senha, SALT_ROUNDS),
    };

    this.store.salvarUsuario(novo);
    return { ok: true, usuario: this.paraPublico(novo) };
  }

  esqueciSenha(email: string): { ok: true; token: string } {
    const usuario = this.store.getUsuarioPorEmail(email);
    if (!usuario) {
      throw new NotFoundException('E-mail não encontrado.');
    }
    // Demo: o token é devolvido na resposta (numa integração real iria por e-mail)
    const token = randomUUID();
    this.store.salvarTokenReset(
      token,
      usuario.email,
      Date.now() + TEMPO_TOKEN_HORAS * 3_600_000,
    );
    return { ok: true, token };
  }

  redefinirSenha(dados: RedefinirSenhaDto): { ok: true } {
    const registro = this.store.getTokenReset(dados.token);
    if (!registro || registro.expiraEm < Date.now()) {
      throw new HttpException(
        'Token inválido ou expirado.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const usuario = this.store.getUsuarioPorEmail(registro.email);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    this.store.atualizarUsuario({
      ...usuario,
      senhaHash: bcrypt.hashSync(dados.novaSenha, SALT_ROUNDS),
    });
    this.store.removerTokenReset(dados.token);
    return { ok: true };
  }

  obterMe(id: number): { ok: true; usuario: UsuarioPublico } {
    const usuario = this.store.getUsuarioInternoPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return { ok: true, usuario: this.paraPublico(usuario) };
  }

  atualizarConta(
    id: number,
    dados: AtualizarContaDto,
  ): { ok: true; usuario: UsuarioPublico } {
    const usuario = this.store.getUsuarioInternoPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    const atualizado: UsuarioInterno = {
      ...usuario,
      nome: dados.nome?.trim() ?? usuario.nome,
      foto: dados.foto ?? usuario.foto,
    };
    this.store.atualizarUsuario(atualizado);
    return { ok: true, usuario: this.paraPublico(atualizado) };
  }

  excluirConta(id: number): { ok: true } {
    this.store.excluirUsuario(id);
    return { ok: true };
  }

  private paraPublico({
    senhaHash: _senha,
    ...usuario
  }: UsuarioInterno): UsuarioPublico {
    return usuario;
  }
}