import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import type { UsuarioPublico } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import { UsuarioEntity } from '../database/entities/usuario.entity.js';
import { base64ToBuffer } from '../database/mappers/bytes.mapper.js';
import { mapUsuarioToContrato } from '../database/mappers/usuario.mapper.js';
import type { UsuarioInterno } from '../dados/seed.js';
import type {
  AtualizarContaDto,
  LoginDto,
  RegistrarDto,
} from './dto/auth.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly store: StoreService,
    @Inject('USUARIO_REPO') private readonly usuarioRepo: Repository<UsuarioEntity>,
  ) {}

  async login(dados: LoginDto): Promise<{ ok: true; usuario: UsuarioPublico }> {
    const email = dados.email.trim().toLowerCase();
    if (this.usaStore()) {
      const usuario = this.store.getUsuarioPorEmail(email);
      if (!usuario) throw new UnauthorizedException('E-mail não encontrado. Crie uma conta.');
      if (!bcrypt.compareSync(dados.senha, usuario.senhaHash)) {
        throw new UnauthorizedException('Senha incorreta. Tente novamente.');
      }
      if (!usuario.ativo) throw new UnauthorizedException('Conta desativada. Contate o administrador.');
      return { ok: true, usuario: this.paraPublico(usuario) };
    }
    const usuario = await this.usuarioRepo.findOne({ where: { email } });
    if (!usuario) throw new UnauthorizedException('E-mail não encontrado. Crie uma conta.');
    if (!bcrypt.compareSync(dados.senha, usuario.senhaHash)) {
      throw new UnauthorizedException('Senha incorreta. Tente novamente.');
    }
    if (!usuario.ativo) throw new UnauthorizedException('Conta desativada. Contate o administrador.');
    return { ok: true, usuario: mapUsuarioToContrato(usuario) };
  }

  async registrar(dados: RegistrarDto): Promise<{ ok: true; usuario: UsuarioPublico }> {
    const email = dados.email.trim().toLowerCase();
    if (this.usaStore()) {
      if (this.store.getUsuarioPorEmail(email)) throw new ConflictException('Este e-mail já está cadastrado.');
      const novo: UsuarioInterno = {
        id: this.store.incProximoIdUsuario(),
        nome: dados.nome.trim(),
        email,
        role: 'CONDOMINO',
        unidade: dados.unidade.trim(),
        setor: dados.unidade.trim(),
        ativo: true,
        criadoEm: new Date().toISOString(),
        senhaHash: bcrypt.hashSync(dados.senha, SALT_ROUNDS),
      };
      this.store.salvarUsuario(novo);
      return { ok: true, usuario: this.paraPublico(novo) };
    }
    if (await this.usuarioRepo.findOne({ where: { email } })) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }
    const entidade = this.usuarioRepo.create({
      nome: dados.nome.trim(),
      email,
      papel: 'CONDOMINO',
      localizacao: dados.unidade.trim(),
      unidade: dados.unidade.trim(),
      setor: dados.unidade.trim(),
      ativo: true,
      senhaHash: bcrypt.hashSync(dados.senha, SALT_ROUNDS),
    });
    const salvo = await this.usuarioRepo.save(entidade);
    return { ok: true, usuario: mapUsuarioToContrato(salvo) };
  }

  async obterMe(id: number): Promise<{ ok: true; usuario: UsuarioPublico }> {
    if (this.usaStore()) {
      const usuario = this.store.getUsuarioInternoPorId(id);
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
      return { ok: true, usuario: this.paraPublico(usuario) };
    }
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return { ok: true, usuario: mapUsuarioToContrato(usuario) };
  }

  async atualizarConta(id: number, dados: AtualizarContaDto): Promise<{ ok: true; usuario: UsuarioPublico }> {
    if (this.usaStore()) {
      const usuario = this.store.getUsuarioInternoPorId(id);
      if (!usuario) throw new NotFoundException('Usuário não encontrado.');
      const atualizado: UsuarioInterno = {
        ...usuario,
        nome: dados.nome?.trim() ?? usuario.nome,
        foto: dados.foto ?? usuario.foto,
      };
      this.store.atualizarUsuario(atualizado);
      return { ok: true, usuario: this.paraPublico(atualizado) };
    }
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    if (dados.nome !== undefined) usuario.nome = dados.nome.trim();
    if (dados.foto !== undefined) usuario.foto = base64ToBuffer(dados.foto) as any;
    const salvo = await this.usuarioRepo.save(usuario);
    return { ok: true, usuario: mapUsuarioToContrato(salvo) };
  }

  async excluirConta(id: number): Promise<{ ok: true }> {
    if (this.usaStore()) {
      this.store.excluirUsuario(id);
      return { ok: true };
    }
    await this.usuarioRepo.delete(id);
    return { ok: true };
  }

  private usaStore(): boolean {
    return process.env.NODE_ENV === 'test' || !!process.env.VITEST;
  }

  private paraPublico({ senhaHash: _senha, ...usuario }: UsuarioInterno): UsuarioPublico {
    return usuario;
  }
}