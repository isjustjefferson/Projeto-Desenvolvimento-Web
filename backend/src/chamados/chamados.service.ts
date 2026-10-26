import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { AnexoDespesa, Chamado, Despesa, ResumoFinanceiro, Status } from '../contrato.js';
import { StoreService } from '../dados/store.service.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { classificarChamado } from './criticidade.js';
import type {
  AnexoDespesaDto,
  AprovarChamadoDto,
  ConcluirChamadoDto,
  CriarChamadoDto,
  CriarDespesaDto,
  EditarDespesaDto,
  FiltrosChamadosDto,
  RejeitarDespesaDto,
} from './dto/chamados.dto.js';

const STATUS_SOLICITANTE: Status[] = [
  'AGUARDANDO_APROVACAO',
  'EM_ANDAMENTO',
  'CONCLUIDO',
];

const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const TAMANHO_MAX_ANEXO = 5 * 1024 * 1024;
const MAX_ANEXOS_POR_DESPESA = 5;

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
      .filter((c) => this.atendeFiltros(c, filtros))
      .map((c) => this.prepararChamadoParaResposta(c, usuario));
    return { ok: true, chamados };
  }

  obterPorId(id: number, usuario: UsuarioInterno): { ok: true; chamado: Chamado } {
    const chamado = this.buscar(id);
    if (!this.podeVer(chamado, usuario)) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    return { ok: true, chamado: this.prepararChamadoParaResposta(chamado, usuario) };
  }

  criar(
    usuario: UsuarioInterno,
    dados: CriarChamadoDto,
  ): { ok: true; chamado: Chamado } {
    const agora = new Date().toISOString();
    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const local = {
      predio: dados.local.predio.trim(),
      andar: dados.local.andar?.trim(),
      sala: dados.local.sala?.trim(),
    };
    const novo: Chamado = {
      id: this.store.incProximoIdChamado(),
      titulo,
      descricao,
      categoria: dados.categoria,
      local,
      status: 'AGUARDANDO_APROVACAO',
      prioridade: null,
      classificacao: classificarChamado({
        titulo,
        descricao,
        categoria: dados.categoria,
        local,
      }),
      foto: dados.foto ?? null,
      criadoPorId: usuario.id,
      tecnicoId: null,
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
    const tecnico = this.store.getUsuarioInternoPorId(dados.tecnicoId);
    if (!tecnico || tecnico.role !== 'TECNICO') {
      throw new BadRequestException('Informe um técnico válido.');
    }
    return this.transicionar(
      chamado,
      autenticado,
      'REVISADO',
      `Aprovado com prioridade ${dados.prioridade} e atribuído ao técnico`,
      { prioridade: dados.prioridade, tecnicoId: dados.tecnicoId },
    );
  }

  iniciar(id: number, autenticado: UsuarioInterno): { ok: true; chamado: Chamado } {
    const chamado = this.buscar(id);
    if (chamado.status !== 'REVISADO') {
      throw new BadRequestException(
        'Apenas chamados revisados podem ser iniciados.',
      );
    }
    this.validarDonoTecnico(chamado, autenticado);
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
    this.validarDonoTecnico(chamado, autenticado);
    const despesas = this.store.getDespesasPorChamado(chamado.id);
    const pendentes = despesas.filter((d) => d.status === 'PENDENTE');
    if (pendentes.length > 0) {
      throw new BadRequestException(
        'Não é possível concluir o chamado com despesas pendentes de aprovação.',
      );
    }
    const atualizado = this.transicionar(chamado, autenticado, 'CONCLUIDO', undefined, {
      solucao: {
        descricao: dados.descricao.trim(),
        materiais: dados.materiais.trim(),
      },
    });
    return { ok: true, chamado: this.prepararChamadoParaResposta(atualizado.chamado, autenticado) };
  }

  // ---- Helpers ----

  private noEscopo(c: Chamado, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'SOLICITANTE') {
      return (
        c.criadoPorId === usuario.id && STATUS_SOLICITANTE.includes(c.status)
      );
    }
    // TECNICO: disponíveis (REVISADO) ou atribuídos a ele
    return c.status === 'REVISADO' || c.tecnicoId === usuario.id;
  }

  private podeVer(c: Chamado, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'SOLICITANTE') return c.criadoPorId === usuario.id;
    return c.tecnicoId === usuario.id || c.status === 'REVISADO';
  }

  private atendeFiltros(c: Chamado, f: FiltrosChamadosDto): boolean {
    if (f.status && c.status !== f.status) return false;
    if (f.prioridade && c.prioridade !== f.prioridade) return false;
    if (f.categoria && c.categoria !== f.categoria) return false;
    if (f.tecnicoId && c.tecnicoId !== f.tecnicoId) return false;
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

  private validarDonoTecnico(c: Chamado, usuario: UsuarioInterno): void {
    if (
      usuario.role !== 'GESTOR' &&
      usuario.role !== 'ADMINISTRADOR' &&
      c.tecnicoId !== usuario.id
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

  // ---- Despesas ----
  listarDespesas(
    id: number,
    usuario: UsuarioInterno,
  ): { ok: true; despesas: Despesa[]; resumoFinanceiro: ResumoFinanceiro } {
    const chamado = this.buscar(id);
    if (!this.podeVer(chamado, usuario)) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    const despesas = this.store.getDespesasPorChamado(chamado.id);
    if (usuario.role === 'SOLICITANTE') {
      throw new ForbiddenException('Sem permissão para visualizar despesas.');
    }
    const resumo = this.calcularResumo(despesas);
    return { ok: true, despesas, resumoFinanceiro: resumo };
  }

  criarDespesa(
    id: number,
    usuario: UsuarioInterno,
    dados: CriarDespesaDto,
  ): { ok: true; despesa: Despesa } {
    const chamado = this.buscar(id);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para lançar despesas.');
    }
    if (chamado.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException(
        'Despesas só podem ser lançadas em chamados em andamento.',
      );
    }
    this.validarDataEmissao(dados.dataEmissao);
    this.validarAnexos(dados.anexos);

    const agora = new Date().toISOString();
    const anexos: AnexoDespesa[] = (dados.anexos || []).map((anexo) => {
      const hash = crypto
        .createHash('sha256')
        .update(anexo.conteudo)
        .digest('hex');
      return {
        id: this.store.incProximoIdAnexoDespesa(),
        despesaId: 0,
        tipo: anexo.tipo,
        tipoDocumentoFiscal: anexo.tipoDocumentoFiscal,
        chaveNFe: anexo.chaveNFe?.trim() || undefined,
        numero: anexo.numero?.trim() || undefined,
        serie: anexo.serie?.trim() || undefined,
        nomeArquivo: anexo.nomeArquivo,
        mimeType: anexo.mimeType,
        tamanhoBytes: anexo.tamanhoBytes,
        hashSha256: hash,
        conteudo: anexo.conteudo,
        enviadoPorId: usuario.id,
        criadoEm: agora,
      };
    });

    const despesa: Despesa = {
      id: this.store.incProximoIdDespesa(),
      chamadoId: chamado.id,
      registradoPorId: usuario.id,
      categoria: dados.categoria,
      descricao: dados.descricao.trim(),
      fornecedor: dados.fornecedor?.trim() || undefined,
      cnpj: dados.cnpj?.trim() || undefined,
      numeroNota: dados.numeroNota?.trim() || undefined,
      serie: dados.serie?.trim() || undefined,
      dataEmissao: dados.dataEmissao,
      valorCentavos: dados.valorCentavos,
      formaPagamento: dados.formaPagamento,
      pagoPor: dados.pagoPor,
      status: 'PENDENTE',
      criadoEm: agora,
      atualizadoEm: agora,
      anexos: [],
    };

    for (const anexo of anexos) {
      anexo.despesaId = despesa.id;
    }
    despesa.anexos = anexos;

    this.store.salvarDespesa(despesa);
    return { ok: true, despesa };
  }

  editarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dados: EditarDespesaDto,
  ): { ok: true; despesa: Despesa } {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para editar despesas.');
    }
    const despesa = this.buscarDespesa(despesaId);
    if (despesa.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesa.status !== 'PENDENTE') {
      throw new BadRequestException('Apenas despesas pendentes podem ser editadas.');
    }
    this.validarDataEmissao(dados.dataEmissao);

    const agora = new Date().toISOString();
    const atualizada: Despesa = {
      ...despesa,
      ...dados,
      descricao: dados.descricao?.trim() ?? despesa.descricao,
      fornecedor:
        dados.fornecedor !== undefined
          ? dados.fornecedor.trim() || undefined
          : despesa.fornecedor,
      cnpj: dados.cnpj !== undefined ? dados.cnpj.trim() || undefined : despesa.cnpj,
      numeroNota:
        dados.numeroNota !== undefined
          ? dados.numeroNota.trim() || undefined
          : despesa.numeroNota,
      serie: dados.serie !== undefined ? dados.serie.trim() || undefined : despesa.serie,
      dataEmissao: dados.dataEmissao ?? despesa.dataEmissao,
      atualizadoEm: agora,
    };
    this.store.salvarDespesa(atualizada);
    return { ok: true, despesa: atualizada };
  }

  removerDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
  ): { ok: true } {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para remover despesas.');
    }
    const despesa = this.buscarDespesa(despesaId);
    if (despesa.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesa.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Apenas despesas pendentes podem ser removidas.',
      );
    }
    this.store.removerDespesa(despesa.id);
    return { ok: true };
  }

  anexarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dto: AnexoDespesaDto,
  ): { ok: true; despesa: Despesa } {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para anexar arquivos.');
    }
    const despesa = this.buscarDespesa(despesaId);
    if (despesa.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesa.status !== 'PENDENTE') {
      throw new BadRequestException('Não é possível anexar em despesa não pendente.');
    }
    this.validarAnexos([dto]);
    if (despesa.anexos.length >= MAX_ANEXOS_POR_DESPESA) {
      throw new BadRequestException('Máximo de 5 anexos por despesa.');
    }
    const agora = new Date().toISOString();
    const hash = crypto.createHash('sha256').update(dto.conteudo).digest('hex');
    const anexo: AnexoDespesa = {
      id: this.store.incProximoIdAnexoDespesa(),
      despesaId: despesa.id,
      tipo: dto.tipo,
      tipoDocumentoFiscal: dto.tipoDocumentoFiscal,
      chaveNFe: dto.chaveNFe?.trim() || undefined,
      numero: dto.numero?.trim() || undefined,
      serie: dto.serie?.trim() || undefined,
      nomeArquivo: dto.nomeArquivo,
      mimeType: dto.mimeType,
      tamanhoBytes: dto.tamanhoBytes,
      hashSha256: hash,
      conteudo: dto.conteudo,
      enviadoPorId: usuario.id,
      criadoEm: agora,
    };
    const atualizada: Despesa = {
      ...despesa,
      anexos: [...despesa.anexos, anexo],
      atualizadoEm: agora,
    };
    this.store.salvarDespesa(atualizada);
    return { ok: true, despesa: atualizada };
  }

  removerAnexoDespesa(
    chamadoId: number,
    despesaId: number,
    anexoId: number,
    usuario: UsuarioInterno,
  ): { ok: true; despesa: Despesa } {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para remover anexos.');
    }
    const despesa = this.buscarDespesa(despesaId);
    if (despesa.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesa.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Não é possível remover anexo de despesa não pendente.',
      );
    }
    const atualizada: Despesa = {
      ...despesa,
      anexos: despesa.anexos.filter((a) => a.id !== anexoId),
      atualizadoEm: new Date().toISOString(),
    };
    this.store.salvarDespesa(atualizada);
    return { ok: true, despesa: atualizada };
  }

  aprovarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
  ): { ok: true; despesa: Despesa } {
    if (usuario.role !== 'GESTOR' && usuario.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas gestor ou administrador podem aprovar.');
    }
    const chamado = this.buscar(chamadoId);
    const despesa = this.buscarDespesa(despesaId);
    if (despesa.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesa.status !== 'PENDENTE') {
      throw new BadRequestException('Apenas despesas pendentes podem ser aprovadas.');
    }
    const agora = new Date().toISOString();
    const atualizada: Despesa = {
      ...despesa,
      status: 'APROVADA',
      aprovadoPorId: usuario.id,
      aprovadoEm: agora,
      motivoRejeicao: undefined,
      atualizadoEm: agora,
    };
    this.store.salvarDespesa(atualizada);
    return { ok: true, despesa: atualizada };
  }

  rejeitarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dto: RejeitarDespesaDto,
  ): { ok: true; despesa: Despesa } {
    if (usuario.role !== 'GESTOR' && usuario.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas gestor ou administrador podem rejeitar.');
    }
    const chamado = this.buscar(chamadoId);
    const despesa = this.buscarDespesa(despesaId);
    if (despesa.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesa.status !== 'PENDENTE') {
      throw new BadRequestException('Apenas despesas pendentes podem ser rejeitadas.');
    }
    const agora = new Date().toISOString();
    const atualizada: Despesa = {
      ...despesa,
      status: 'REJEITADA',
      motivoRejeicao: dto.motivo.trim(),
      aprovadoPorId: usuario.id,
      aprovadoEm: agora,
      atualizadoEm: agora,
    };
    this.store.salvarDespesa(atualizada);
    return { ok: true, despesa: atualizada };
  }

  private buscarDespesa(id: number): Despesa {
    const despesa = this.store.getDespesaPorId(id);
    if (!despesa) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    return despesa;
  }

  private podeGerenciarDespesas(c: Chamado, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'GESTOR' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'TECNICO') {
      return c.tecnicoId === usuario.id;
    }
    return false;
  }

  private calcularResumo(despesas: Despesa[]): ResumoFinanceiro {
    let totalCentavos = 0;
    let aprovadoCentavos = 0;
    let pendenteCentavos = 0;
    let rejeitadoCentavos = 0;
    for (const d of despesas) {
      totalCentavos += d.valorCentavos;
      if (d.status === 'APROVADA') aprovadoCentavos += d.valorCentavos;
      if (d.status === 'PENDENTE') pendenteCentavos += d.valorCentavos;
      if (d.status === 'REJEITADA') rejeitadoCentavos += d.valorCentavos;
    }
    return { totalCentavos, aprovadoCentavos, pendenteCentavos, rejeitadoCentavos };
  }

  private prepararChamadoParaResposta(
    chamado: Chamado,
    usuario: UsuarioInterno,
  ): Chamado {
    const despesas = this.store.getDespesasPorChamado(chamado.id);
    const resumoFinanceiro = this.calcularResumo(despesas);
    if (usuario.role === 'SOLICITANTE') {
      return {
        ...chamado,
        despesas: undefined,
        resumoFinanceiro: {
          totalCentavos: resumoFinanceiro.aprovadoCentavos,
          aprovadoCentavos: resumoFinanceiro.aprovadoCentavos,
          pendenteCentavos: 0,
          rejeitadoCentavos: 0,
        },
      };
    }
    return {
      ...chamado,
      despesas,
      resumoFinanceiro,
    };
  }

  private validarDataEmissao(dataEmissao?: string): void {
    if (!dataEmissao) return;
    const data = new Date(dataEmissao);
    if (Number.isNaN(data.getTime())) {
      throw new BadRequestException('Data de emissão inválida.');
    }
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    if (data > hoje) {
      throw new BadRequestException('Data de emissão não pode ser futura.');
    }
  }

  private validarAnexos(anexos?: AnexoDespesaDto[]): void {
    if (!anexos || anexos.length === 0) return;
    if (anexos.length > MAX_ANEXOS_POR_DESPESA) {
      throw new BadRequestException('Máximo de 5 anexos por despesa.');
    }
    for (const anexo of anexos) {
      if (!MIME_PERMITIDOS.includes(anexo.mimeType)) {
        throw new BadRequestException('Tipo de arquivo não permitido.');
      }
      if (anexo.tamanhoBytes > TAMANHO_MAX_ANEXO) {
        throw new BadRequestException('Anexo excede o limite de 5MB.');
      }
      if (!anexo.conteudo) {
        throw new BadRequestException('Conteúdo do anexo inválido.');
      }
    }
  }

  private buscar(id: number): Chamado {
    const chamado = this.store.getChamadoPorId(id);
    if (!chamado) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    return chamado;
  }
}