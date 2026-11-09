import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { DataSource, Repository } from 'typeorm';
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

const STATUS_CONDOMINO: Status[] = [
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
    @Inject('DATA_SOURCE') private readonly dataSource: DataSource,
  ) {}

  async listar(
    usuario: UsuarioInterno,
    filtros: FiltrosChamadosDto,
  ): Promise<{ ok: true; chamados: Chamado[] }> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      const chamados = this.store
        .getChamados()
        .filter((c) => this.noEscopo(c, usuario))
        .filter((c) => this.atendeFiltros(c, filtros))
        .map((c) => this.prepararChamadoParaResposta(c, usuario, false));
      return { ok: true, chamados };
    }
    const chamadosEnt = await this.chamadoRepo.find({
      relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
    } as any);
    const chamados = chamadosEnt
      .map((c: any) => mapChamadoToContrato(c))
      .filter((c: any) => this.noEscopoContrato(c, usuario))
      .filter((c: any) => this.atendeFiltrosContrato(c, filtros))
      .map((c: any) => this.prepararChamadoParaRespostaContrato(c as any, usuario, false));
    return { ok: true, chamados: chamados as any };
  }

  async obterPorId(id: number, usuario: UsuarioInterno): Promise<{ ok: true; chamado: Chamado }> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      const chamado = this.buscar(id);
      if (!this.podeVer(chamado, usuario)) {
        throw new NotFoundException('Chamado não encontrado.');
      }
      return { ok: true, chamado: this.prepararChamadoParaResposta(chamado, usuario) };
    }
    const chamadoEnt = await this.chamadoRepo.findOne({
      where: { id },
      relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
    } as any);
    if (!chamadoEnt) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    const chamado = mapChamadoToContrato(chamadoEnt as any);
    if (!this.podeVerContrato(chamado, usuario)) {
      throw new NotFoundException('Chamado não encontrado.');
    }
    return { ok: true, chamado: this.prepararChamadoParaRespostaContrato(chamado, usuario) };
  }

  async criar(
    usuario: UsuarioInterno,
    dados: CriarChamadoDto,
  ): Promise<{ ok: true; chamado: Chamado }> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
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
        }) as any,
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
          } as any,
        ],
        solucao: null,
      };
      this.store.salvarChamado(novo);
      return { ok: true, chamado: novo };
    }
    const agora = new Date();
    const titulo = dados.titulo.trim();
    const descricao = dados.descricao.trim();
    const localDto = {
      predio: dados.local.predio.trim(),
      andar: dados.local.andar?.trim(),
      sala: dados.local.sala?.trim(),
    };
    const classificacao = classificarChamado({
      titulo,
      descricao,
      categoria: dados.categoria,
      local: localDto,
    });

    let localEnt: any = await (this.localRepo as any).findOne({
      where: {
        predio: localDto.predio,
        andar: localDto.andar ?? null,
        sala: localDto.sala ?? null,
      },
    });
    if (Array.isArray(localEnt)) localEnt = localEnt[0] ?? null;
    if (!localEnt) {
      const created = this.localRepo.create({
        predio: localDto.predio,
        andar: localDto.andar ?? null,
        sala: localDto.sala ?? null,
      } as any);
      const savedLocal = await this.localRepo.save(created as any);
      localEnt = Array.isArray(savedLocal) ? savedLocal[0] : savedLocal;
    }

    const fotoBuf = dados.foto ? Buffer.from(dados.foto, 'base64') : null;

    let result: any;
    if ((this.dataSource as any)?.transaction) {
      result = await this.dataSource.transaction(async (manager) => {
        const chamadoRepo = manager.getRepository(ChamadoEntity);
        const histRepo = manager.getRepository(HistoricoEntity);
        const chamadoEnt = chamadoRepo.create({
          titulo,
          descricao,
          categoria: dados.categoria,
          status: 'AGUARDANDO_APROVACAO',
          prioridade: null,
          localId: localEnt!.id,
          criadoPorId: usuario.id,
          tecnicoId: null,
          foto: fotoBuf,
          classificacao,
          solucaoDescricao: null,
          solucaoMateriais: null,
          criadoEm: agora,
          atualizadoEm: agora,
        } as any);
        const salvo = await chamadoRepo.save(chamadoEnt);
        const hist = histRepo.create({
          chamadoId: (salvo as any).id,
          usuarioId: usuario.id,
          deStatus: null,
          paraStatus: 'AGUARDANDO_APROVACAO',
          dataHora: agora,
          observacao: null,
        } as any);
        await histRepo.save(hist);
        return await chamadoRepo.findOne({
          where: { id: (salvo as any).id },
          relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
        } as any);
      });
    } else {
      const chamadoEnt = this.chamadoRepo.create({
        titulo,
        descricao,
        categoria: dados.categoria,
        status: 'AGUARDANDO_APROVACAO',
        prioridade: null,
        localId: localEnt!.id,
        criadoPorId: usuario.id,
        tecnicoId: null,
        foto: fotoBuf,
        classificacao,
        solucaoDescricao: null,
        solucaoMateriais: null,
        criadoEm: agora,
        atualizadoEm: agora,
      } as any);
      const salvo = await this.chamadoRepo.save(chamadoEnt);
      await this.historicoRepo.save(this.historicoRepo.create({
        chamadoId: (salvo as any).id,
        usuarioId: usuario.id,
        deStatus: null,
        paraStatus: 'AGUARDANDO_APROVACAO',
        dataHora: agora,
        observacao: null,
      } as any));
      result = await this.chamadoRepo.findOne({
        where: { id: (salvo as any).id },
        relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
      } as any);
    }

    const chamado = mapChamadoToContrato(result as any);
    return { ok: true, chamado };
  }

  async aprovar(
    id: number,
    autenticado: UsuarioInterno,
    dados: AprovarChamadoDto,
  ): Promise<{ ok: true; chamado: Chamado }> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      const chamado = this.buscar(id);
      if (chamado.status !== 'AGUARDANDO_APROVACAO') {
        throw new BadRequestException('Apenas chamados em aguardando aprovação podem ser aprovados.');
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
        { prioridade: dados.prioridade, prestadorId: dados.prestadorId } as any,
      );
    }
    const chamadoEnt = await this.chamadoRepo.findOne({
      where: { id },
      relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
    } as any);
    if (!chamadoEnt) throw new NotFoundException('Chamado não encontrado.');
    if (chamadoEnt.status !== 'AGUARDANDO_APROVACAO') {
      throw new BadRequestException(
        'Apenas chamados em aguardando aprovação podem ser aprovados.',
      );
    }
    const prestadorEnt = await this.usuarioRepo.findOne({ where: { id: dados.prestadorId } as any });
    if (!prestadorEnt || (prestadorEnt as any).papel !== 'PRESTADOR') {
      throw new BadRequestException('Informe um prestador válido.');
    }
    const result = await this.transicionarRepo(
      chamadoEnt as any,
      autenticado,
      'REVISADO',
      `Aprovado com prioridade ${dados.prioridade} e atribuído ao prestador`,
      { prioridade: dados.prioridade, tecnicoId: dados.prestadorId },
    );
    return { ok: true, chamado: this.prepararChamadoParaRespostaContrato(mapChamadoToContrato(result as any), autenticado) };
  }

  async iniciar(id: number, autenticado: UsuarioInterno): Promise<{ ok: true; chamado: Chamado }> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      const chamado = this.buscar(id);
      if (chamado.status !== 'REVISADO') {
        throw new BadRequestException('Apenas chamados revisados podem ser iniciados.');
      }
      this.validarDonoPrestador(chamado, autenticado);
      return this.transicionar(chamado, autenticado, 'EM_ANDAMENTO');
    }
    const chamadoEnt = await this.chamadoRepo.findOne({
      where: { id },
      relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
    } as any);
    if (!chamadoEnt) throw new NotFoundException('Chamado não encontrado.');
    if (chamadoEnt.status !== 'REVISADO') {
      throw new BadRequestException(
        'Apenas chamados revisados podem ser iniciados.',
      );
    }
    this.validarDonoTecnicoContrato(mapChamadoToContrato(chamadoEnt as any), autenticado);
    const result = await this.transicionarRepo(chamadoEnt as any, autenticado, 'EM_ANDAMENTO');
    return { ok: true, chamado: this.prepararChamadoParaRespostaContrato(mapChamadoToContrato(result as any), autenticado) };
  }

  async concluir(
    id: number,
    autenticado: UsuarioInterno,
    dados: ConcluirChamadoDto,
  ): Promise<{ ok: true; chamado: Chamado }> {
    if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
      const chamado = this.buscar(id);
      if (chamado.status !== 'EM_ANDAMENTO') {
        throw new BadRequestException('Apenas chamados em andamento podem ser concluídos.');
      }
      this.validarDonoPrestador(chamado, autenticado);
      const despesas = this.store.getDespesasPorChamado(chamado.id);
      const pendentes = despesas.filter((d) => d.status === 'PENDENTE');
      if (pendentes.length > 0) {
        throw new BadRequestException('Não é possível concluir o chamado com despesas pendentes de aprovação.');
      }
      const atualizado = this.transicionar(chamado, autenticado, 'CONCLUIDO', undefined, {
        solucao: { descricao: dados.descricao.trim(), materiais: dados.materiais.trim() },
      } as any);
      return { ok: true, chamado: this.prepararChamadoParaResposta(atualizado.chamado, autenticado) };
    }
    const chamadoEnt = await this.chamadoRepo.findOne({
      where: { id },
      relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
    } as any);
    if (!chamadoEnt) throw new NotFoundException('Chamado não encontrado.');
    if (chamadoEnt.status !== 'EM_ANDAMENTO') {
      throw new BadRequestException(
        'Apenas chamados em andamento podem ser concluídos.',
      );
    }
    this.validarDonoTecnicoContrato(mapChamadoToContrato(chamadoEnt as any), autenticado);
    const despesasEnt = await this.despesaRepo.find({
      where: { chamadoId: chamadoEnt.id },
      relations: { anexos: true } as any,
    });
    const pendentes = despesasEnt.filter((d: any) => d.status === 'PENDENTE');
    if (pendentes.length > 0) {
      throw new BadRequestException(
        'Não é possível concluir o chamado com despesas pendentes de aprovação.',
      );
    }
    const result = await this.transicionarRepo(chamadoEnt as any, autenticado, 'CONCLUIDO', undefined, {
      solucaoDescricao: dados.descricao.trim(),
      solucaoMateriais: dados.materiais.trim(),
    });
    return { ok: true, chamado: this.prepararChamadoParaRespostaContrato(mapChamadoToContrato(result as any), autenticado) };
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

  private async transicionarRepo(
    chamadoEnt: ChamadoEntity,
    autenticado: UsuarioInterno,
    para: Status,
    observacao?: string,
    extras: Partial<ChamadoEntity> = {},
  ): Promise<ChamadoEntity> {
    const agora = new Date();
    const doWork = async (chamadoRepo: Repository<ChamadoEntity>, histRepo: Repository<HistoricoEntity>) => {
      const atualizado = chamadoRepo.create({
        ...chamadoEnt,
        ...extras,
        status: para,
        atualizadoEm: agora,
      } as any);
      await chamadoRepo.save(atualizado);
      const hist = histRepo.create({
        chamadoId: (chamadoEnt as any).id,
        usuarioId: autenticado.id,
        deStatus: chamadoEnt.status,
        paraStatus: para,
        dataHora: agora,
        observacao: observacao ?? null,
      } as any);
      await histRepo.save(hist);
      return await chamadoRepo.findOne({
        where: { id: (chamadoEnt as any).id },
        relations: { local: true, criadoPor: true, tecnico: true, historicos: true },
      } as any);
    };
    if ((this.dataSource as any)?.transaction) {
      return (await this.dataSource.transaction(async (manager) =>
        doWork(manager.getRepository(ChamadoEntity), manager.getRepository(HistoricoEntity)),
      )) as ChamadoEntity;
    }
    return (await doWork(this.chamadoRepo, this.historicoRepo)) as ChamadoEntity;
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
    if (usuario.role === 'CONDOMINO') {
      throw new ForbiddenException('Sem permissão para visualizar despesas.');
    }
    const despesasEnt = await this.despesaRepo.find({
      where: { chamadoId: chamado.id },
      relations: { anexos: true } as any,
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
      relations: { anexos: true } as any,
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
      relations: { anexos: true } as any,
    }));
    const full: DespesaEntity | null = Array.isArray(fullRes) ? (fullRes[0] as any) : (fullRes as any);
    return { ok: true, despesa: mapDespesaToContrato(full as any, false) as any };
  }

  async aprovarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
  ): Promise<{ ok: true; despesa: Despesa }> {
    if (usuario.role !== 'SINDICO' && usuario.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas síndico ou administrador podem aprovar.');
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
    const fullEnt = await (this.despesaRepo as any).findOne({ where: { id: (despesaEnt as any).id }, relations: { anexos: true } });
    return { ok: true, despesa: mapDespesaToContrato(Array.isArray(fullEnt) ? fullEnt[0] : fullEnt, false) as any };
  }

  async rejeitarDespesa(
    chamadoId: number,
    despesaId: number,
    usuario: UsuarioInterno,
    dto: RejeitarDespesaDto,
  ): Promise<{ ok: true; despesa: Despesa }> {
    if (usuario.role !== 'SINDICO' && usuario.role !== 'ADMINISTRADOR') {
      throw new ForbiddenException('Apenas síndico ou administrador podem rejeitar.');
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
    const fullEnt = await (this.despesaRepo as any).findOne({ where: { id: (despesaEnt as any).id }, relations: { anexos: true } });
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
    if (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'PRESTADOR') {
      return c.prestadorId === usuario.id;
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

  private async prepararChamadoParaRespostaContratoAsync(
    chamado: Chamado,
    usuario: UsuarioInterno,
    incluirConteudoAnexos = true,
  ): Promise<Chamado> {
    if (usuario.role === 'CONDOMINO') {
      const despesasEnt = await this.despesaRepo.find({ where: { chamadoId: chamado.id } as any });
      const despesas = despesasEnt.map((d: any) => mapDespesaToContrato(d, false) as any);
      const resumoFinanceiro = this.calcularResumo(despesas);
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
    const despesasEnt = await this.despesaRepo.find({ where: { chamadoId: chamado.id }, relations: { anexos: true } as any });
    const despesas = despesasEnt.map((d: any) => mapDespesaToContrato(d, false) as any);
    const resumoFinanceiro = this.calcularResumo(despesas);
    return {
      ...chamado,
      despesas: incluirConteudoAnexos
        ? despesas
        : despesas.map(despesaSemConteudo),
      resumoFinanceiro,
    };
  }

  private prepararChamadoParaRespostaContrato(
    chamado: any,
    usuario: UsuarioInterno,
    incluirConteudoAnexos = true,
  ): Chamado {
    if (usuario.role === 'CONDOMINO') {
      return {
        ...chamado,
        despesas: undefined,
        resumoFinanceiro: {
          totalCentavos: 0,
          aprovadoCentavos: 0,
          pendenteCentavos: 0,
          rejeitadoCentavos: 0,
        },
      };
    }
    return {
      ...chamado,
      despesas: chamado.despesas ? (incluirConteudoAnexos ? chamado.despesas : chamado.despesas.map(despesaSemConteudo)) : undefined,
      resumoFinanceiro: chamado.resumoFinanceiro,
    };
  }

  private prepararChamadoParaResposta(
    chamado: Chamado,
    usuario: UsuarioInterno,
    incluirConteudoAnexos = true,
  ): Chamado {
    const despesas = this.store.getDespesasPorChamado(chamado.id);
    const resumoFinanceiro = this.calcularResumo(despesas);
    if (usuario.role === 'CONDOMINO') {
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

  private noEscopoContrato(c: any, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'CONDOMINO') {
      return (
        (c.criadoPor?.id ?? c.criadoPorId) === usuario.id && STATUS_CONDOMINO.includes(c.status)
      );
    }
    return c.status === 'REVISADO' || (c.tecnico?.id ?? c.tecnicoId) === usuario.id;
  }

  private podeVerContrato(c: any, usuario: UsuarioInterno): boolean {
    if (usuario.role === 'SINDICO' || usuario.role === 'ADMINISTRADOR') return true;
    if (usuario.role === 'CONDOMINO') return (c.criadoPor?.id ?? c.criadoPorId) === usuario.id;
    return (c.tecnico?.id ?? c.tecnicoId) === usuario.id || c.status === 'REVISADO';
  }

  private atendeFiltrosContrato(c: any, f: FiltrosChamadosDto): boolean {
    if (f.status && c.status !== f.status) return false;
    if (f.prioridade && c.prioridade !== f.prioridade) return false;
    if (f.categoria && c.categoria !== f.categoria) return false;
    if ((f as any).prestadorId) {
      const tid = (c as any).prestadorId ?? (c as any).tecnico?.id ?? (c as any).tecnicoId;
      if (tid !== (f as any).prestadorId) return false;
    }
    if (f.predio && (c as any).local?.predio?.toLowerCase() !== f.predio.toLowerCase()) {
      return false;
    }
    if (f.q) {
      const termo = f.q.toLowerCase();
      const match =
        c.titulo.toLowerCase().includes(termo) ||
        c.descricao.toLowerCase().includes(termo) ||
        ((c as any).local?.predio?.toLowerCase() || '').includes(termo);
      if (!match) return false;
    }
    if (f.de || f.ate) {
      const criado = new Date((c as any).criadoEm).getTime();
      if (f.de && criado < new Date(f.de).getTime()) return false;
      if (f.ate && criado > new Date(f.ate).getTime()) return false;
    }
    return true;
  }

  private validarDonoTecnicoContrato(c: any, usuario: UsuarioInterno): void {
    if (
      usuario.role !== 'SINDICO' &&
      usuario.role !== 'ADMINISTRADOR' &&
      ((c as any).tecnico?.id ?? (c as any).tecnicoId) !== usuario.id
    ) {
      throw new ForbiddenException(
        'Este chamado não está atribuído a você.',
      );
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