import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { Repository } from 'typeorm';
import type { AnexoDespesa, Chamado, Despesa, ResumoFinanceiro, Status } from '../contrato.js';
import { anexoSemConteudo, despesaSemConteudo } from '../common/anexos.js';
import { StoreService } from '../dados/store.service.js';
import { ChamadoEntity } from '../database/entities/chamado.entity.js';
import { HistoricoEntity } from '../database/entities/historico.entity.js';
import { LocalEntity } from '../database/entities/local.entity.js';
import { UsuarioEntity } from '../database/entities/usuario.entity.js';
import { DespesaEntity } from '../database/entities/despesa.entity.js';
import { AnexoDespesaEntity } from '../database/entities/anexo-despesa.entity.js';
import { mapDespesaToContrato } from '../database/mappers/despesa.mapper.js';
import { mapChamadoToContrato } from '../database/mappers/chamado.mapper.js';
import { mapUsuarioToContrato } from '../database/mappers/usuario.mapper.js';
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
  constructor(
    private readonly store: StoreService,
    @Inject('CHAMADO_REPO') private readonly chamadoRepo: Repository<ChamadoEntity>,
    @Inject('HISTORICO_REPO') private readonly historicoRepo: Repository<HistoricoEntity>,
    @Inject('LOCAL_REPO') private readonly localRepo: Repository<LocalEntity>,
    @Inject('USUARIO_REPO') private readonly usuarioRepo: Repository<UsuarioEntity>,
    @Inject('DESPESA_REPO') private readonly despesaRepo: Repository<DespesaEntity>,
    @Inject('ANEXO_DESPESA_REPO') private readonly anexoRepo: Repository<AnexoDespesaEntity>,
  ) {}

  listar(
    usuario: UsuarioInterno,
    filtros: FiltrosChamadosDto,
  ): { ok: true; chamados: Chamado[] } {
    const chamados = this.store
      .getChamados()
      .filter((c) => this.noEscopo(c, usuario))
      .filter((c) => this.atendeFiltros(c, filtros))
      .map((c) => this.prepararChamadoParaResposta(c, usuario, false));
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
  async listarDespesas(
    id: number,
    usuario: UsuarioInterno,
  ): Promise<{ ok: true; despesas: Despesa[]; resumoFinanceiro: ResumoFinanceiro }> {
    const chamado = this.buscar(id);
    if (!this.podeVer(chamado, usuario)) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    if (usuario.role === 'SOLICITANTE') {
      throw new ForbiddenException('Sem permissão para visualizar despesas.');
    }
    const despesasEnt = await this.despesaRepo.find({
      where: { chamadoId: chamado.id },
      relations: ['anexos'] as any,
      order: { id: 'ASC' },
    });
    const despesas = despesasEnt.map((d) => mapDespesaToContrato(d, false) as any);
    const resumo = this.calcularResumo(despesas);
    return { ok: true, despesas, resumoFinanceiro: resumo };
  }

  async criarDespesa(
    id: number,
    usuario: UsuarioInterno,
    dados: CriarDespesaDto,
  ): Promise<{ ok: true; despesa: Despesa }> {
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

    const agora = new Date();
    const despesaEnt = this.despesaRepo.create({
      chamadoId: chamado.id,
      registradoPorId: usuario.id,
      categoria: dados.categoria as any,
      descricao: dados.descricao.trim(),
      fornecedor: dados.fornecedor?.trim() || null,
      cnpj: dados.cnpj?.trim() || null,
      numeroNota: dados.numeroNota?.trim() || null,
      serie: dados.serie?.trim() || null,
      dataEmissao: dados.dataEmissao || null,
      valorCentavos: dados.valorCentavos,
      formaPagamento: dados.formaPagamento || null,
      pagoPor: dados.pagoPor || null,
      status: 'PENDENTE',
      criadoEm: agora,
      atualizadoEm: agora,
    } as any);
    const savedRes = await this.despesaRepo.save(despesaEnt);
    const saved = Array.isArray(savedRes) ? savedRes[0] : savedRes;

    if (dados.anexos && dados.anexos.length > 0) {
      for (const anexo of dados.anexos) {
        const hash = crypto
          .createHash('sha256')
          .update(anexo.conteudo)
          .digest('hex');
        const buf = Buffer.from(anexo.conteudo, 'base64');
        const aEnt = this.anexoRepo.create({
          despesaId: saved.id,
          tipo: anexo.tipo as any,
          tipoDocumentoFiscal: anexo.tipoDocumentoFiscal || null,
          chaveNfe: anexo.chaveNFe?.trim() || null,
          numero: anexo.numero?.trim() || null,
          serie: anexo.serie?.trim() || null,
          nomeArquivo: anexo.nomeArquivo,
          mimeType: anexo.mimeType,
          tamanhoBytes: anexo.tamanhoBytes,
          hashSha256: hash,
          conteudo: buf,
          enviadoPorId: usuario.id,
          criadoEm: agora,
        } as any);
        await this.anexoRepo.save(aEnt);
      }
    }

    const full = (await this.despesaRepo.findOne({
      where: { id: (saved as any).id },
      relations: { anexos: true } as any,
    })) as DespesaEntity | null;
    return { ok: true, despesa: mapDespesaToContrato(full as any, false) as any };
  }

  async editarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dados: EditarDespesaDto,
  ): Promise<{ ok: true; despesa: Despesa }> {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para editar despesas.');
    }
    const despesaEntRes = (await this.despesaRepo.findOne({
      where: { id: despesaId },
      relations: ['anexos'] as any,
    }));
    const despesaEnt: DespesaEntity | null = Array.isArray(despesaEntRes) ? (despesaEntRes[0] as any) : (despesaEntRes as any);
    if (!despesaEnt || despesaEnt.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesaEnt.status !== 'PENDENTE') {
      throw new BadRequestException('Apenas despesas pendentes podem ser editadas.');
    }
    this.validarDataEmissao(dados.dataEmissao);

    const agora = new Date();
    if (dados.categoria !== undefined) despesaEnt.categoria = dados.categoria as any;
    if (dados.descricao !== undefined) despesaEnt.descricao = dados.descricao.trim();
    if (dados.fornecedor !== undefined) despesaEnt.fornecedor = dados.fornecedor?.trim() || null;
    if (dados.cnpj !== undefined) despesaEnt.cnpj = dados.cnpj?.trim() || null;
    if (dados.numeroNota !== undefined) despesaEnt.numeroNota = dados.numeroNota?.trim() || null;
    if (dados.serie !== undefined) despesaEnt.serie = dados.serie?.trim() || null;
    if (dados.dataEmissao !== undefined) despesaEnt.dataEmissao = dados.dataEmissao || null;
    if (dados.valorCentavos !== undefined) despesaEnt.valorCentavos = dados.valorCentavos;
    if (dados.formaPagamento !== undefined) despesaEnt.formaPagamento = (dados.formaPagamento as any) || null;
    if (dados.pagoPor !== undefined) despesaEnt.pagoPor = (dados.pagoPor as any) || null;
    despesaEnt.atualizadoEm = agora;
    await this.despesaRepo.save(despesaEnt);
    const full = await this.despesaRepo.findOne({
      where: { id: despesaEnt.id },
      relations: { anexos: true },
    });
    return { ok: true, despesa: mapDespesaToContrato(full as any, false) as any };
  }

  async removerDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
  ): Promise<{ ok: true }> {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para remover despesas.');
    }
    const despesaEnt = await this.despesaRepo.findOne({ where: { id: despesaId } });
    if (!despesaEnt || despesaEnt.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesaEnt.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Apenas despesas pendentes podem ser removidas.',
      );
    }
    await this.anexoRepo.delete({ despesaId: despesaEnt.id });
    await this.despesaRepo.delete({ id: despesaEnt.id });
    return { ok: true };
  }

  async anexarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dto: AnexoDespesaDto,
  ): Promise<{ ok: true; despesa: Despesa }> {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para anexar arquivos.');
    }
    const despesaEnt = await this.despesaRepo.findOne({
      where: { id: despesaId },
      relations: { anexos: true },
    });
    if (!despesaEnt || despesaEnt.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesaEnt.status !== 'PENDENTE') {
      throw new BadRequestException('Não é possível anexar em despesa não pendente.');
    }
    this.validarAnexos([dto]);
    if ((despesaEnt as any).anexos && (despesaEnt as any).anexos.length >= MAX_ANEXOS_POR_DESPESA) {
      throw new BadRequestException('Máximo de 5 anexos por despesa.');
    }
    const agora = new Date();
    const hash = crypto.createHash('sha256').update(dto.conteudo).digest('hex');
    const buf = Buffer.from(dto.conteudo, 'base64');
    const aEnt = this.anexoRepo.create({
      despesaId: despesaEnt.id,
      tipo: dto.tipo as any,
      tipoDocumentoFiscal: dto.tipoDocumentoFiscal || null,
      chaveNfe: dto.chaveNFe?.trim() || null,
      numero: dto.numero?.trim() || null,
      serie: dto.serie?.trim() || null,
      nomeArquivo: dto.nomeArquivo,
      mimeType: dto.mimeType,
      tamanhoBytes: dto.tamanhoBytes,
      hashSha256: hash,
      conteudo: buf,
      enviadoPorId: usuario.id,
      criadoEm: agora,
    } as any);
    await this.anexoRepo.save(aEnt);
    despesaEnt.atualizadoEm = agora;
    await this.despesaRepo.save(despesaEnt);
    const full = await this.despesaRepo.findOne({
      where: { id: despesaEnt.id },
      relations: { anexos: true },
    });
    return { ok: true, despesa: mapDespesaToContrato(full as any, false) as any };
  }

  async removerAnexoDespesa(
    chamadoId: number,
    despesaId: number,
    anexoId: number,
    usuario: UsuarioInterno,
  ): Promise<{ ok: true; despesa: Despesa }> {
    const chamado = this.buscar(chamadoId);
    if (!this.podeGerenciarDespesas(chamado, usuario)) {
      throw new ForbiddenException('Sem permissão para remover anexos.');
    }
    const despesaEnt = await this.despesaRepo.findOne({
      where: { id: despesaId },
      relations: { anexos: true },
    });
    if (!despesaEnt || despesaEnt.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesaEnt.status !== 'PENDENTE') {
      throw new BadRequestException(
        'Não é possível remover anexo de despesa não pendente.',
      );
    }
    await this.anexoRepo.delete({ id: anexoId, despesaId: despesaEnt.id });
    despesaEnt.atualizadoEm = new Date();
    await this.despesaRepo.save(despesaEnt);
    const fullRes = (await this.despesaRepo.findOne({
      where: { id: (despesaEnt as any).id },
      relations: ['anexos'] as any,
    }));
    const full: DespesaEntity | null = Array.isArray(fullRes) ? (fullRes[0] as any) : (fullRes as any);
    return { ok: true, despesa: mapDespesaToContrato(full as any, false) as any };
  }

  async aprovarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
  ): Promise<{ ok: true; despesa: Despesa }> {
    if (usuario.role !== 'GESTOR' && usuario.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas gestor ou administrador podem aprovar.');
    }
    const chamado = this.buscar(chamadoId);
    const despesaEnt = await this.despesaRepo.findOne({
      where: { id: despesaId },
      relations: { anexos: true },
    });
    if (!despesaEnt || despesaEnt.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesaEnt.status !== 'PENDENTE') {
      throw new BadRequestException('Apenas despesas pendentes podem ser aprovadas.');
    }
    const agora = new Date();
    despesaEnt.status = 'APROVADA';
    despesaEnt.aprovadoPorId = usuario.id;
    despesaEnt.aprovadoEm = agora;
    despesaEnt.motivoRejeicao = null as any;
    despesaEnt.atualizadoEm = agora;
    await this.despesaRepo.save(despesaEnt);
    const fullEnt = await (this.despesaRepo as any).findOne({ where: { id: (despesaEnt as any).id }, relations: ['anexos'] });
    return { ok: true, despesa: mapDespesaToContrato(Array.isArray(fullEnt) ? fullEnt[0] : fullEnt, false) as any };
  }

  async rejeitarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dto: RejeitarDespesaDto,
  ): Promise<{ ok: true; despesa: Despesa }> {
    if (usuario.role !== 'GESTOR' && usuario.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas gestor ou administrador podem rejeitar.');
    }
    const chamado = this.buscar(chamadoId);
    const despesaEnt = await this.despesaRepo.findOne({
      where: { id: despesaId },
      relations: { anexos: true },
    });
    if (!despesaEnt || despesaEnt.chamadoId !== chamado.id) {
      throw new NotFoundException('Despesa não encontrada.');
    }
    if (despesaEnt.status !== 'PENDENTE') {
      throw new BadRequestException('Apenas despesas pendentes podem ser rejeitadas.');
    }
    const agora = new Date();
    despesaEnt.status = 'REJEITADA';
    despesaEnt.motivoRejeicao = dto.motivo.trim();
    despesaEnt.aprovadoPorId = usuario.id;
    despesaEnt.aprovadoEm = agora;
    despesaEnt.atualizadoEm = agora;
    await this.despesaRepo.save(despesaEnt);
    const fullEnt = await (this.despesaRepo as any).findOne({ where: { id: (despesaEnt as any).id }, relations: ['anexos'] });
    return { ok: true, despesa: mapDespesaToContrato(Array.isArray(fullEnt) ? fullEnt[0] : fullEnt, false) as any };
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
    incluirConteudoAnexos = true,
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
      despesas: incluirConteudoAnexos
        ? despesas
        : despesas.map(despesaSemConteudo),
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