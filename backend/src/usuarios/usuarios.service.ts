import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { Repository } from 'typeorm';
import type { UsuarioPublico, UsuarioResumo } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import { UsuarioEntity } from '../database/entities/usuario.entity.js';
import { mapUsuarioToContrato } from '../database/mappers/usuario.mapper.js';
import { papelParaRole, roleParaPapel } from '../database/mappers/papel.mapper.js';
import { senhaPadrao } from '../dados/seed.js';
import type { UsuarioInterno } from '../dados/seed.js';
import type { AlterarRoleDto, CriarUsuarioDto } from './dto/usuarios.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly store: StoreService,
    @Inject('USUARIO_REPO') private readonly usuarioRepo: Repository<UsuarioEntity>,
  ) {}

  async listar(): Promise<{ ok: true; usuarios: UsuarioPublico[] }> {
    if (this.usaStore()) return { ok: true, usuarios: this.store.getUsuariosPublicos() };
    const usuarios = await this.usuarioRepo.find({ order: { id: 'ASC' } });
    return { ok: true, usuarios: usuarios.map(mapUsuarioToContrato) };
  }

  async listarResumo(): Promise<{ ok: true; usuarios: UsuarioResumo[] }> {
    if (this.usaStore()) {
      return {
        ok: true,
        usuarios: this.store.getUsuariosPublicos().map((usuario) => ({
          id: usuario.id,
          nome: usuario.nome,
          role: usuario.role,
          especialidade: usuario.especialidade,
        })),
      };
    }
    const usuarios = await this.usuarioRepo.find({ order: { id: 'ASC' } });
    return {
      ok: true,
      usuarios: usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        role: papelParaRole(u.papel),
        especialidade: u.especialidade ?? undefined,
      })),
    };
  }

  async criar(dados: CriarUsuarioDto): Promise<{ ok: true; usuario: UsuarioPublico }> {
    const email = dados.email.trim().toLowerCase();
    if (this.usaStore()) {
      if (this.store.getUsuarioPorEmail(email)) throw new ConflictException('Este e-mail já está cadastrado.');
      const role = dados.role ?? 'CONDOMINO';
      const novo: UsuarioInterno = {
        id: this.store.incProximoIdUsuario(),
        nome: dados.nome.trim(),
        email,
        role,
        especialidade: role === 'PRESTADOR' ? dados.especialidade?.trim() : undefined,
        setor: role !== 'PRESTADOR' ? dados.setor?.trim() : undefined,
        ativo: true,
        criadoEm: new Date().toISOString(),
        senhaHash: bcrypt.hashSync(dados.senha || senhaPadrao, SALT_ROUNDS),
      };
      this.store.salvarUsuario(novo);
      return { ok: true, usuario: this.paraPublico(novo) };
    }
    if (await this.usuarioRepo.findOne({ where: { email } })) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }
    const role = dados.role ?? 'CONDOMINO';
    const entidade = this.usuarioRepo.create({
      nome: dados.nome.trim(),
      email,
      papel: roleParaPapel(role),
      especialidade: role === 'PRESTADOR' ? (dados.especialidade?.trim() ?? null) : null,
      setor: role !== 'PRESTADOR' ? (dados.setor?.trim() ?? null) : null,
      ativo: true,
      senhaHash: bcrypt.hashSync(dados.senha || senhaPadrao, SALT_ROUNDS),
    });
    const salvo = await this.usuarioRepo.save(entidade);
    return { ok: true, usuario: mapUsuarioToContrato(salvo) };
  }

  async alterarRole(id: number, dados: AlterarRoleDto, autenticadoId: number): Promise<{ ok: true; usuario: UsuarioPublico }> {
    if (this.usaStore()) {
      const alvo = this.buscarStore(id);
      this.validarProtecao(alvo, autenticadoId);
      if (alvo.role === 'ADMINISTRADOR' && dados.role !== 'ADMINISTRADOR' && this.contarAdminsStore() <= 1) {
        throw new BadRequestException('Não é possível remover o último administrador.');
      }
      const atualizado: UsuarioInterno = { ...alvo, role: dados.role };
      this.store.atualizarUsuario(atualizado);
      return { ok: true, usuario: this.paraPublico(atualizado) };
    }
    const alvo = await this.usuarioRepo.findOne({ where: { id } });
    if (!alvo) throw new NotFoundException('Usuário não encontrado.');
    if (alvo.id === autenticadoId) throw new BadRequestException('Você não pode realizar esta ação na própria conta.');
    if (alvo.papel === 'ADMINISTRADOR' && dados.role !== 'ADMINISTRADOR') {
      const admins = await this.usuarioRepo.count({ where: { papel: 'ADMINISTRADOR' } });
      if (admins <= 1) throw new BadRequestException('Não é possível remover o último administrador.');
    }
    alvo.papel = roleParaPapel(dados.role);
    const salvo = await this.usuarioRepo.save(alvo);
    return { ok: true, usuario: mapUsuarioToContrato(salvo) };
  }

  async excluir(id: number, autenticadoId: number): Promise<{ ok: true }> {
    if (this.usaStore()) {
      const alvo = this.buscarStore(id);
      this.validarProtecao(alvo, autenticadoId);
      if (alvo.role === 'ADMINISTRADOR' && this.contarAdminsStore() <= 1) {
        throw new BadRequestException('Não é possível excluir o último administrador.');
      }
      this.store.excluirUsuario(id);
      return { ok: true };
    }
    const alvo = await this.usuarioRepo.findOne({ where: { id } });
    if (!alvo) throw new NotFoundException('Usuário não encontrado.');
    if (alvo.id === autenticadoId) throw new BadRequestException('Você não pode realizar esta ação na própria conta.');
    if (alvo.papel === 'ADMINISTRADOR') {
      const admins = await this.usuarioRepo.count({ where: { papel: 'ADMINISTRADOR' } });
      if (admins <= 1) throw new BadRequestException('Não é possível excluir o último administrador.');
    }
    await this.usuarioRepo.delete(id);
    return { ok: true };
  }

  private usaStore(): boolean {
    return process.env.NODE_ENV === 'test' || !!process.env.VITEST;
  }

  private validarProtecao(alvo: UsuarioInterno, autenticadoId: number): void {
    if (alvo.id === autenticadoId) {
      throw new BadRequestException('Você não pode realizar esta ação na própria conta.');
    }
  }

  private buscarStore(id: number): UsuarioInterno {
    const usuario = this.store.getUsuarioInternoPorId(id);
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return usuario;
  }

  private contarAdminsStore(): number {
    return this.store.getUsuariosInternos().filter((u) => u.role === 'ADMINISTRADOR').length;
  }

  private paraPublico({ senhaHash: _senha, ...usuario }: UsuarioInterno): UsuarioPublico {
    return usuario;
  }
}