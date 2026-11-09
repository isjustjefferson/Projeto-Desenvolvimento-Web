import { beforeEach, describe, expect, it } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../dados/store.service.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { ChamadosService } from './chamados.service.js';

function despesaEntidade(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    chamadoId: 2,
    registradoPorId: 4,
    categoria: 'MATERIAL',
    descricao: 'Torneira nova',
    fornecedor: null,
    cnpj: null,
    numeroNota: null,
    serie: null,
    dataEmissao: null,
    valorCentavos: 5000,
    formaPagamento: null,
    pagoPor: null,
    status: 'PENDENTE',
    motivoRejeicao: null,
    aprovadoPorId: null,
    aprovadoEm: null,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    anexos: [],
    ...overrides,
  };
}

function repoComDespesa(despesa: Record<string, unknown>) {
  return {
    find: async () => [],
    findOne: async () => despesa,
    save: async (e: Record<string, unknown>) => e,
    create: async (e: Record<string, unknown>) => e,
    delete: async () => ({ affected: 1 }),
  } as any;
}

describe('ChamadosService', () => {
  let store: StoreService;
  let service: ChamadosService;
  let ana: UsuarioInterno;
  let joao: UsuarioInterno;
  let marta: UsuarioInterno;
  let ricardo: UsuarioInterno;
  let tiago: UsuarioInterno;

  beforeEach(() => {
    store = new StoreService();
    const repo = { find: async () => [], findOne: async () => null, save: async (x: any) => x, create: (x: any) => x } as any;
    const dataSource = { transaction: async (fn: any) => fn({ getRepository: () => repo }) } as any;
    service = new ChamadosService(store, repo, repo, repo, repo, repo, repo, dataSource);
    ana = store.getUsuarioInternoPorId(1)!;
    joao = store.getUsuarioInternoPorId(3)!;
    marta = store.getUsuarioInternoPorId(4)!;
    ricardo = store.getUsuarioInternoPorId(5)!;
    tiago = store.getUsuarioInternoPorId(6)!;
  });

  it('cria chamado em AGUARDANDO_APROVACAO sem prioridade/prestador', async () => {
    const res = await service.criar(ana, {
      titulo: 'Torneira pingando',
      descricao: 'Cozinha do ap 204',
      categoria: 'HIDRAULICA',
      local: { predio: 'Bloco A', andar: '2º andar', sala: '204' },
    });
    expect(res.chamado).toMatchObject({
      id: 6,
      status: 'AGUARDANDO_APROVACAO',
      prioridade: null,
      prestadorId: null,
      criadoPorId: 1,
      solucao: null,
    });
    expect(res.chamado.historico).toHaveLength(1);
    expect(res.chamado.historico[0]).toMatchObject({
      de: null,
      para: 'AGUARDANDO_APROVACAO',
      usuarioId: 1,
    });
  });

  it('condômino vê apenas os próprios chamados e nunca REVISADO', async () => {
    const res = await service.listar(ana, {});
    expect(res.chamados.map((c: any) => c.id)).toEqual([1, 3, 5]);
  });

  it('prestador vê REVISADO e os próprios atribuídos', async () => {
    const res = await service.listar(joao, {});
    expect(res.chamados.map((c: any) => c.id).sort((a: number, b: number) => a - b)).toEqual([1, 4]);
  });

  it('síndico e administrador vêem todos os chamados', async () => {
    expect((await service.listar(ricardo, {})).chamados).toHaveLength(5);
    expect((await service.listar(tiago, {})).chamados).toHaveLength(5);
  });

  it('obterPorId esconde chamado alheio do condômino (404)', async () => {
    await expect(service.obterPorId(2, ana)).rejects.toThrow(NotFoundException);
    await expect(service.obterPorId(999, ana)).rejects.toThrow(NotFoundException);
    expect((await service.obterPorId(1, ana)).chamado.id).toBe(1);
  });

  it('fluxo completo aprovar → iniciar → concluir', async () => {
    const aprovado = await service.aprovar(3, ricardo, {
      prioridade: 'ALTA',
      prestadorId: 3,
    });
    expect(aprovado.chamado).toMatchObject({
      status: 'REVISADO',
      prioridade: 'ALTA',
      prestadorId: 3,
    });
    expect(aprovado.chamado.historico[0]).toMatchObject({
      de: 'AGUARDANDO_APROVACAO',
      para: 'REVISADO',
      observacao:
        'Aprovado com prioridade ALTA e atribuído ao prestador',
    });

    const iniciado = await service.iniciar(3, joao);
    expect(iniciado.chamado.status).toBe('EM_ANDAMENTO');

    const concluido = await service.concluir(3, joao, {
      descricao: 'Peça trocada',
      materiais: '1 válvula',
    });
    expect(concluido.chamado.status).toBe('CONCLUIDO');
    expect(concluido.chamado.solucao).toEqual({
      descricao: 'Peça trocada',
      materiais: '1 válvula',
    });
    expect(concluido.chamado.historico).toHaveLength(4);
  });

  it('aprovar com prestador inexistente ou não-prestador retorna 400', async () => {
    await expect(
      service.aprovar(3, ricardo, { prioridade: 'ALTA', prestadorId: 1 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.aprovar(3, ricardo, { prioridade: 'ALTA', prestadorId: 999 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('aprovar fora do estado AGUARDANDO_APROVACAO retorna 400', async () => {
    await expect(
      service.aprovar(1, ricardo, { prioridade: 'ALTA', prestadorId: 3 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('iniciar fora de REVISADO retorna 400', async () => {
    await expect(service.iniciar(3, ricardo)).rejects.toThrow(BadRequestException);
  });

  it('prestador não atribuído não pode iniciar REVISADO sem dono', async () => {
    await expect(service.iniciar(4, marta)).rejects.toThrow(ForbiddenException);
  });

  it('síndico/admin pode iniciar REVISADO sem dono', async () => {
    expect((await service.iniciar(4, ricardo)).chamado.status).toBe('EM_ANDAMENTO');
    expect((await service.listar(tiago, {})).chamados).toHaveLength(5);
    const revisado = await service.aprovar(5, ricardo, {
      prioridade: 'BAIXA',
      prestadorId: 3,
    });
    expect(revisado.chamado.status).toBe('REVISADO');
    expect((await service.iniciar(5, tiago)).chamado.status).toBe('EM_ANDAMENTO');
  });

  it('concluir de outro (não atribuído) retorna 403', async () => {
    await expect(
      service.concluir(2, joao, { descricao: 'x', materiais: 'y' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('administrador pode concluir qualquer EM_ANDAMENTO', async () => {
    const res = await service.concluir(2, tiago, {
      descricao: 'Vazamento resolvido',
      materiais: 'vedante',
    });
    expect(res.chamado.status).toBe('CONCLUIDO');
  });

  it('filtra por status, categoria, prestador, prédio, busca e período', async () => {
    expect((await service.listar(tiago, { status: 'CONCLUIDO' })).chamados.map((c: any) => c.id)).toEqual([1]);
    expect((await service.listar(tiago, { categoria: 'ELETRICA' })).chamados.map((c: any) => c.id)).toEqual([1]);
    expect((await service.listar(tiago, { prestadorId: 4 })).chamados.map((c: any) => c.id)).toEqual([2]);
    expect((await service.listar(tiago, { predio: 'Bloco B' })).chamados.map((c: any) => c.id)).toEqual([4]);
    expect((await service.listar(tiago, { q: 'vazamento' })).chamados.map((c: any) => c.id)).toEqual([2]);
    expect((await service.listar(tiago, { q: 'recepção' })).chamados.map((c: any) => c.id)).toEqual([4]);
    const de = new Date(Date.now() - 6 * 3_600_000).toISOString();
    const ate = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect((await service.listar(tiago, { de, ate })).chamados.map((c: any) => c.id)).toEqual([5]);
  });

  it('bloqueia conclusão com despesa pendente de aprovação', async () => {
    store.salvarDespesa({
      id: 1,
      chamadoId: 2,
      registradoPorId: 4,
      categoria: 'MATERIAL',
      descricao: 'Torneira nova',
      valorCentavos: 5000,
      status: 'PENDENTE',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      anexos: [],
    });

    await expect(
      service.concluir(2, marta, { descricao: 'Feito', materiais: 'Torneira' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('permite conclusão direta quando não há despesas', async () => {
    const res = await service.concluir(2, marta, {
      descricao: 'Vazamento resolvido',
      materiais: 'vedante',
    });
    expect(res.chamado.status).toBe('CONCLUIDO');
  });

  it('permite conclusão quando as despesas já foram aprovadas ou rejeitadas', async () => {
    store.salvarDespesa({
      id: 1,
      chamadoId: 2,
      registradoPorId: 4,
      categoria: 'MATERIAL',
      descricao: 'Torneira nova',
      valorCentavos: 5000,
      status: 'APROVADA',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      anexos: [],
    });

    const res = await service.concluir(2, marta, {
      descricao: 'Vazamento resolvido',
      materiais: 'vedante',
    });
    expect(res.chamado.status).toBe('CONCLUIDO');
  });

  it('síndico aprova despesa pendente', async () => {
    const despesa = despesaEntidade();
    const repo = repoComDespesa(despesa);
    const svc = new ChamadosService(store, repo, repo, repo, repo, repo, repo, {} as any);

    const res = await svc.aprovarDespesa(2, 1, ricardo);

    expect(res.despesa).toMatchObject({
      id: 1,
      status: 'APROVADA',
      aprovadoPorId: ricardo.id,
    });
  });

  it('administrador rejeita despesa pendente com motivo', async () => {
    const despesa = despesaEntidade();
    const repo = repoComDespesa(despesa);
    const svc = new ChamadosService(store, repo, repo, repo, repo, repo, repo, {} as any);

    const res = await svc.rejeitarDespesa(2, 1, tiago, {
      motivo: 'Valor divergente da nota fiscal',
    });

    expect(res.despesa).toMatchObject({
      id: 1,
      status: 'REJEITADA',
      aprovadoPorId: tiago.id,
      motivoRejeicao: 'Valor divergente da nota fiscal',
    });
  });

  it('administrador remove despesa pendente', async () => {
    const despesa = despesaEntidade();
    const repo = repoComDespesa(despesa);
    const svc = new ChamadosService(store, repo, repo, repo, repo, repo, repo, {} as any);

    await expect(svc.removerDespesa(2, 1, tiago)).resolves.toEqual({ ok: true });
  });

  it('condômino não pode aprovar despesa', async () => {
    const despesa = despesaEntidade();
    const repo = repoComDespesa(despesa);
    const svc = new ChamadosService(store, repo, repo, repo, repo, repo, repo, {} as any);

    await expect(svc.aprovarDespesa(2, 1, ana)).rejects.toThrow(ForbiddenException);
  });

  it('prestador não pode rejeitar despesa', async () => {
    const despesa = despesaEntidade();
    const repo = repoComDespesa(despesa);
    const svc = new ChamadosService(store, repo, repo, repo, repo, repo, repo, {} as any);

    await expect(
      svc.rejeitarDespesa(2, 1, joao, { motivo: 'x' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('não aprova despesa que não está pendente', async () => {
    const despesa = despesaEntidade({ status: 'APROVADA' });
    const repo = repoComDespesa(despesa);
    const svc = new ChamadosService(store, repo, repo, repo, repo, repo, repo, {} as any);

    await expect(svc.aprovarDespesa(2, 1, ricardo)).rejects.toThrow(
      BadRequestException,
    );
  });
});