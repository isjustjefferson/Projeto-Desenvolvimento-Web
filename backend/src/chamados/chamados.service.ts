import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Chamado, Status } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import type { UsuarioInterno } from '../dados/seed.js';
import type {
  AprovarChamadoDto,
  ConcluirChamadoDto,
  CriarChamadoDto,
  FiltrosChamadosDto,
} from './dto/chamados.dto.js';

const STATUS_CONDOMINO: Status[] = [
  'AGUARDANDO_APROVACAO',
  'EM_ANDAMENTO',
  'CONCLUIDO',
];

@Injectable()
export class ChamadosService {
  constructor(private readonly store: StoreService) {}

  listar(
    usuario: UsuarioInterno,
    filtros: FiltrosChamadosDto,
  ): { ok: true; chamados: Chamado[] } {
    const chamados = this.store
      .getChamados()
      .filter((c) => this.noEscopo(c, usuario))
      .filter((c) => this.atendeFiltros(c, filtros));
    return { ok: true, chamados };
  }

  obterPorId(id: number, usuario: UsuarioInterno): { ok: true; chamado: Chamado } {
    const chamado = this.buscar(id);
    if (!this.podeVer(chamado, usuario)) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    return { ok: true, chamado };
  }

  criar(
    usuario: UsuarioInterno,
    dados: CriarChamadoDto,
  ): { ok: true; chamado: Chamado } {
    const agora = new Date().toISOString();
    const novo: Chamado = {
      id: this.store.incProximoIdChamado(),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      categoria: dados.categoria,
      local: {
        predio: dados.local.predio.trim(),
        andar: dados.local.andar?.trim(),
        sala: dados.local.sala?.trim(),
      },
      status: 'AGUARDANDO_APROVACAO',
      prioridade: null,
      foto: dados.foto ?? null,
      criadoPorId: usuario.id,
      prestadorId: null,
      criadoEm: agora,
      atualizadoEm: agora,
      historico: [
        {
          id: this.store.incProximoIdHistorico(),
          usuarioId: usuario.id,
          de: null,
          para: 'AGUARDANDO_APROVACAO',
          dataHora: agora,
        },
      ],
      solucao: null,
    };
    this.store.salvarChamado(novo);
    return { ok: true, chamado: novo };
  }

  aprovar(
    id: number,
    autenticado: UsuarioInterno,
    dados: AprovarChamadoDto,
  ): { ok: true; chamado: Chamado } {
    const chamado = this.buscar(id);
    if (chamado.status !== 'AGUARDANDO_APROVACAO') {
      throw new BadRequestException(
        'Apenas chamados em aguardando aprovação podem ser aprovados.',
      );
    }
    const prestador = this.store.getUsuarioInternoPorId(dados.prestadorId);
    if (!prestador || prestador.role !== 'PRESTADOR') {
      throw new BadRequestException('Informe um prestador válido.');
    }
    return this.transicionar(
      chamado,
      autenticado,
      'REVISADO',
      `Aprovado com prioridade ${dados.prioridade} e atribuído ao prestador`,
      { prioridade: dados.prioridade, prestadorId: dados.prestadorId },
    );
  }

  iniciar(id: number, autenticado: UsuarioInterno): { ok: true; chamado: Chamado } {
    const chamado = this.buscar(id);
    if (chamado.status !== 'REVISADO') {
      throw new BadRequestException(
        'Apenas chamados revisados podem ser iniciados.',
      );
    }
    this.validarDonoPrestador(chamado, autenticado);
    return this.transicionar(chamado, autenticado, 'EM_ANDAMENTO');
  }

  concluir(
    id: number,
    autenticado: UsuarioInterno,
    dados: ConcluirChamadoDto,
  ): { ok: true; chamado: Chamado } {
    const chamado = this.buscar(id);
    if (chamado.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException(
        'Apenas chamados em andamento podem ser concluídos.',
      );
    }
    this.validarDonoPrestador(chamado, autenticado);
    return this.transicionar(chamado, autenticado, 'CONCLUIDO', undefined, {
      solucao: {
        descricao: dados.descricao.trim(),
        materiais: dados.materiais.trim(),
      },
    });
  }

  // ---- Helpers ----

  private noEscopo(c: Chamado, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'CONDOMINO') {
      return (
        c.criadoPorId === usuario.id && STATUS_CONDOMINO.includes(c.status)
      );
    }
    // PRESTADOR: disponíveis (REVISADO) ou atribuídos a ele
    return c.status === 'REVISADO' || c.prestadorId === usuario.id;
  }

  private podeVer(c: Chamado, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'CONDOMINO') return c.criadoPorId === usuario.id;
    return c.prestadorId === usuario.id || c.status === 'REVISADO';
  }

  private atendeFiltros(c: Chamado, f: FiltrosChamadosDto): boolean {
    if (f.status && c.status !== f.status) return false;
    if (f.prioridade && c.prioridade !== f.prioridade) return false;
    if (f.categoria && c.categoria !== f.categoria) return false;
    if (f.prestadorId && c.prestadorId !== f.prestadorId) return false;
    if (f.predio && c.local.predio.toLowerCase() !== f.predio.toLowerCase()) {
      return false;
    }
    if (f.q) {
      const termo = f.q.toLowerCase();
      const match =
        c.titulo.toLowerCase().includes(termo) ||
        c.descricao.toLowerCase().includes(termo) ||
        c.local.predio.toLowerCase().includes(termo);
      if (!match) return false;
    }
    if (f.de || f.ate) {
      const criado = new Date(c.criadoEm).getTime();
      if (f.de && criado < new Date(f.de).getTime()) return false;
      if (f.ate && criado > new Date(f.ate).getTime()) return false;
    }
    return true;
  }

  private validarDonoPrestador(c: Chamado, usuario: UsuarioInterno): void {
    if (
      usuario.role !== 'SINDICO' &&
      usuario.role !== 'ADMINISTRADOR' &&
      c.prestadorId !== usuario.id
    ) {
      throw new ForbiddenException(
        'Este chamado não está atribuído a você.',
      );
    }
  }

  private transicionar(
    chamado: Chamado,
    autenticado: UsuarioInterno,
    para: Status,
    observacao?: string,
    extras: Partial<Chamado> = {},
  ): { ok: true; chamado: Chamado } {
    const agora = new Date().toISOString();
    const atualizado: Chamado = {
      ...chamado,
      ...extras,
      status: para,
      atualizadoEm: agora,
      historico: [
        {
          id: this.store.incProximoIdHistorico(),
          usuarioId: autenticado.id,
          de: chamado.status,
          para,
          dataHora: agora,
          observacao,
        },
        ...chamado.historico,
      ],
    };
    this.store.salvarChamado(atualizado);
    return { ok: true, chamado: atualizado };
  }

  private buscar(id: number): Chamado {
    const chamado = this.store.getChamadoPorId(id);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    return chamado;
  }
}