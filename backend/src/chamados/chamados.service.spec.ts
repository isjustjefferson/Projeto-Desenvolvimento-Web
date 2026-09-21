import { beforeEach, describe, expect, it } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { StoreService } from '../dados/store.service.js';
import type { UsuarioInterno } from '../dados/seed.js';
import { ChamadosService } from './chamados.service.js';

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
    service = new ChamadosService(store);
    ana = store.getUsuarioInternoPorId(1)!;
    joao = store.getUsuarioInternoPorId(3)!;
    marta = store.getUsuarioInternoPorId(4)!;
    ricardo = store.getUsuarioInternoPorId(5)!;
    tiago = store.getUsuarioInternoPorId(6)!;
  });

  it('cria chamado em AGUARDANDO_APROVACAO sem prioridade/técnico', () => {
    const res = service.criar(ana, {
      titulo: 'Torneira pingando',
      descricao: 'Cozinha do ap 204',
      categoria: 'HIDRAULICA',
      local: { predio: 'Bloco A', andar: '2º andar', sala: '204' },
    });
    expect(res.chamado).toMatchObject({
      id: 6,
      status: 'AGUARDANDO_APROVACAO',
      prioridade: null,
      tecnicoId: null,
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

  it('solicitante vê apenas os próprios chamados e nunca REVISADO', () => {
    const res = service.listar(ana, {});
    expect(res.chamados.map((c) => c.id)).toEqual([1, 3, 5]);
  });

  it('técnico vê REVISADO e os próprios atribuídos', () => {
    const res = service.listar(joao, {});
    expect(res.chamados.map((c) => c.id).sort((a, b) => a - b)).toEqual([1, 4]);
  });

  it('gestor e administrador vêem todos os chamados', () => {
    expect(service.listar(ricardo, {}).chamados).toHaveLength(5);
    expect(service.listar(tiago, {}).chamados).toHaveLength(5);
  });

  it('obterPorId esconde chamado alheio do solicitante (404)', () => {
    expect(() => service.obterPorId(2, ana)).toThrow(NotFoundException);
    expect(() => service.obterPorId(999, ana)).toThrow(NotFoundException);
    expect(service.obterPorId(1, ana).chamado.id).toBe(1);
  });

  it('fluxo completo aprovar → iniciar → concluir', () => {
    const aprovado = service.aprovar(3, ricardo, {
      prioridade: 'ALTA',
      tecnicoId: 3,
    });
    expect(aprovado.chamado).toMatchObject({
      status: 'REVISADO',
      prioridade: 'ALTA',
      tecnicoId: 3,
    });
    expect(aprovado.chamado.historico[0]).toMatchObject({
      de: 'AGUARDANDO_APROVACAO',
      para: 'REVISADO',
      observacao:
        'Aprovado com prioridade ALTA e atribuído ao técnico',
    });

    const iniciado = service.iniciar(3, joao);
    expect(iniciado.chamado.status).toBe('EM_ANDAMENTO');

    const concluido = service.concluir(3, joao, {
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

  it('aprovar com técnico inexistente ou não-técnico retorna 400', () => {
    expect(() =>
      service.aprovar(3, ricardo, { prioridade: 'ALTA', tecnicoId: 1 }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.aprovar(3, ricardo, { prioridade: 'ALTA', tecnicoId: 999 }),
    ).toThrow(BadRequestException);
  });

  it('aprovar fora do estado AGUARDANDO_APROVACAO retorna 400', () => {
    expect(() =>
      service.aprovar(1, ricardo, { prioridade: 'ALTA', tecnicoId: 3 }),
    ).toThrow(BadRequestException);
  });

  it('iniciar fora de REVISADO retorna 400', () => {
    expect(() => service.iniciar(3, ricardo)).toThrow(BadRequestException);
  });

  it('técnico não atribuído não pode iniciar REVISADO sem dono', () => {
    expect(() => service.iniciar(4, marta)).toThrow(ForbiddenException);
  });

  it('gestor/admin pode iniciar REVISADO sem dono', () => {
    expect(service.iniciar(4, ricardo).chamado.status).toBe('EM_ANDAMENTO');
    expect(service.listar(tiago, {}).chamados).toHaveLength(5);
    const revisado = service.aprovar(5, ricardo, {
      prioridade: 'BAIXA',
      tecnicoId: 3,
    });
    expect(revisado.chamado.status).toBe('REVISADO');
    expect(service.iniciar(5, tiago).chamado.status).toBe('EM_ANDAMENTO');
  });

  it('concluir de outro (não atribuído) retorna 403', () => {
    expect(() =>
      service.concluir(2, joao, { descricao: 'x', materiais: 'y' }),
    ).toThrow(ForbiddenException);
  });

  it('administrador pode concluir qualquer EM_ANDAMENTO', () => {
    const res = service.concluir(2, tiago, {
      descricao: 'Vazamento resolvido',
      materiais: 'vedante',
    });
    expect(res.chamado.status).toBe('CONCLUIDO');
  });

  it('filtra por status, categoria, técnico, prédio, busca e período', () => {
    expect(service.listar(tiago, { status: 'CONCLUIDO' }).chamados.map((c) => c.id)).toEqual([1]);
    expect(service.listar(tiago, { categoria: 'ELETRICA' }).chamados.map((c) => c.id)).toEqual([1]);
    expect(service.listar(tiago, { tecnicoId: 4 }).chamados.map((c) => c.id)).toEqual([2]);
    expect(service.listar(tiago, { predio: 'Bloco B' }).chamados.map((c) => c.id)).toEqual([4]);
    expect(service.listar(tiago, { q: 'vazamento' }).chamados.map((c) => c.id)).toEqual([2]);
    expect(service.listar(tiago, { q: 'recepção' }).chamados.map((c) => c.id)).toEqual([4]);
    const de = new Date(Date.now() - 6 * 3_600_000).toISOString();
    const ate = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(service.listar(tiago, { de, ate }).chamados.map((c) => c.id)).toEqual([5]);
  });
});