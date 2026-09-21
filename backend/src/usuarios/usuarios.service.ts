import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import type { UsuarioPublico } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import { senhaPadrao } from '../dados/seed.js';
import type { UsuarioInterno } from '../dados/seed.js';
import type { AlterarRoleDto, CriarUsuarioDto } from './dto/usuarios.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuariosService {
  constructor(private readonly store: StoreService) {}

  listar(): { ok: true; usuarios: UsuarioPublico[] } {
    return { ok: true, usuarios: this.store.getUsuariosPublicos() };
  }

  criar(dados: CriarUsuarioDto): { ok: true; usuario: UsuarioPublico } {
    const email = dados.email.trim().toLowerCase();
    if (this.store.getUsuarioPorEmail(email)) {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }

    const role = dados.role ?? 'SOLICITANTE';
    const novo: UsuarioInterno = {
      id: this.store.incProximoIdUsuario(),
      nome: dados.nome.trim(),
      email,
      role,
      especialidade:
        role === 'TECNICO' ? dados.especialidade?.trim() : undefined,
      setor: role !== 'TECNICO' ? dados.setor?.trim() : undefined,
      ativo: true,
      criadoEm: new Date().toISOString(),
      senhaHash: bcrypt.hashSync(dados.senha || senhaPadrao, SALT_ROUNDS),
    };

    this.store.salvarUsuario(novo);
    return { ok: true, usuario: this.paraPublico(novo) };
  }

  alterarRole(
    id: number,
    dados: AlterarRoleDto,
    autenticadoId: number,
  ): { ok: true; usuario: UsuarioPublico } {
    const alvo = this.buscar(id);
    this.validarProtecao(alvo, autenticadoId);
    if (
      alvo.role === 'ADMINISTRADOR' &&
      dados.role !== 'ADMINISTRADOR' &&
      this.contarAdmins() <= 1
    ) {
      throw new BadRequestException(
        'Não é possível remover o último administrador.',
      );
    }
    const atualizado: UsuarioInterno = { ...alvo, role: dados.role };
    this.store.atualizarUsuario(atualizado);
    return { ok: true, usuario: this.paraPublico(atualizado) };
  }

  excluir(id: number, autenticadoId: number): { ok: true } {
    const alvo = this.buscar(id);
    this.validarProtecao(alvo, autenticadoId);
    if (alvo.role === 'ADMINISTRADOR' && this.contarAdmins() <= 1) {
      throw new BadRequestException(
        'Não é possível excluir o último administrador.',
      );
    }
    this.store.excluirUsuario(id);
    return { ok: true };
  }

  private validarProtecao(alvo: UsuarioInterno, autenticadoId: number): void {
    if (alvo.id === autenticadoId) {
      throw new BadRequestException(
        'Você não pode realizar esta ação na própria conta.',
      );
    }
  }

  private buscar(id: number): UsuarioInterno {
    const usuario = this.store.getUsuarioInternoPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    return usuario;
  }

  private contarAdmins(): number {
    return this.store
      .getUsuariosInternos()
      .filter((u) => u.role === 'ADMINISTRADOR').length;
  }

  private paraPublico({
    senhaHash: _senha,
    ...usuario
  }: UsuarioInterno): UsuarioPublico {
    return usuario;
  }
}