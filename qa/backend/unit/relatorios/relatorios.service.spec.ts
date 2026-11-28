import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { StoreService } from '../../../../backend/src/dados/store.service.js';
import type { UsuarioInterno } from '../../../../backend/src/dados/seed.js';
import { RelatoriosService } from '../../../../backend/src/relatorios/relatorios.service.js';
import type { DespesaEntity } from '../../../../backend/src/database/entities/despesa.entity.js';

describe('RelatoriosService', () => {
  let store: StoreService;
  let service: RelatoriosService;
  let ricardo: UsuarioInterno;

  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    store = new StoreService();
    service = new RelatoriosService(store, {} as Repository<DespesaEntity>);
    ricardo = store.getUsuarioInternoPorId(5)!;

    store.salvarDespesa({
      id: 1,
      chamadoId: 2,
      registradoPorId: 4,
      categoria: 'MATERIAL',
      descricao: 'Registro de pressão',
      fornecedor: 'Casa Hidráulica',
      valorCentavos: 10000,
      status: 'APROVADA',
      criadoEm: '2026-10-10T12:00:00.000Z',
      atualizadoEm: '2026-10-10T12:00:00.000Z',
      anexos: [
        {
          id: 1,
          despesaId: 1,
          tipo: 'NOTA_FISCAL',
          tipoDocumentoFiscal: 'NFE',
          nomeArquivo: 'nf1.pdf',
          mimeType: 'application/pdf',
          tamanhoBytes: 1200,
          conteudo: 'abc',
          enviadoPorId: 4,
          criadoEm: '2026-10-10T12:00:00.000Z',
        },
      ],
    });

    store.salvarDespesa({
      id: 2,
      chamadoId: 2,
      registradoPorId: 3,
      categoria: 'MAO_DE_OBRA',
      descricao: 'Visita técnica',
      valorCentavos: 5000,
      status: 'PENDENTE',
      criadoEm: '2026-10-12T12:00:00.000Z',
      atualizadoEm: '2026-10-12T12:00:00.000Z',
      anexos: [],
    });

    store.salvarDespesa({
      id: 3,
      chamadoId: 1,
      registradoPorId: 3,
      categoria: 'DESLOCAMENTO',
      descricao: 'Estacionamento',
      valorCentavos: 2000,
      status: 'REJEITADA',
      motivoRejeicao: 'Sem comprovante',
      criadoEm: '2026-10-15T12:00:00.000Z',
      atualizadoEm: '2026-10-15T12:00:00.000Z',
      anexos: [],
    });
  });

  it('calcula resumo financeiro e agregações por categoria e registrante', async () => {
    const res = await service.despesas(ricardo, {});

    expect(res.ok).toBe(true);
    expect(res.resumo).toEqual({
      totalCentavos: 17000,
      aprovadoCentavos: 10000,
      pendenteCentavos: 5000,
      rejeitadoCentavos: 2000,
      quantidade: 3,
      aprovadas: 1,
      comDocumento: 1,
      pctComDocumento: 100,
    });
    expect(res.porCategoria).toEqual({
      MATERIAL: 10000,
      MAO_DE_OBRA: 5000,
      DESLOCAMENTO: 2000,
    });
    expect(res.porFornecedor).toEqual({ 'Casa Hidráulica': 10000 });
    const comprovante = res.despesas.find((despesa) => despesa.id === 1)?.anexos[0];
    expect(comprovante).toBeDefined();
    expect(comprovante).not.toHaveProperty('conteudo');
  });

  it('filtra por status, categoria, registrante e documento fiscal', async () => {
    const apenasAprovadas = await service.despesas(ricardo, { status: 'APROVADA' });
    expect(apenasAprovadas.despesas).toHaveLength(1);
    expect(apenasAprovadas.despesas[0].id).toBe(1);

    const semDoc = await service.despesas(ricardo, { temDocumento: 'nao' });
    expect(semDoc.despesas).toHaveLength(2);

    const doJoao = await service.despesas(ricardo, { registradoPorId: 3 });
    expect(doJoao.despesas).toHaveLength(2);
    expect(doJoao.resumo.totalCentavos).toBe(7000);
  });

  it('consulta o repositório e usa o título do chamado fora do modo em memória', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VITEST', undefined);
    const momento = new Date('2026-10-10T12:00:00.000Z');
    const consulta = {
      leftJoinAndSelect: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      addSelect: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([{
        id: 99,
        chamadoId: 100,
        chamado: { id: 100, titulo: 'Chamado persistido' },
        registradoPorId: 3,
        categoria: 'MATERIAL',
        descricao: 'Nota fictícia',
        status: 'APROVADA',
        valorCentavos: 3750,
        criadoEm: momento,
        atualizadoEm: momento,
        anexos: [],
      }]),
    };
    const repo = { createQueryBuilder: vi.fn().mockReturnValue(consulta) };
    const relatorio = new RelatoriosService(store, repo as unknown as Repository<DespesaEntity>);
    const resultado = await relatorio.despesas(ricardo, {});
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('despesa');
    expect(resultado.resumo.aprovadoCentavos).toBe(3750);
    expect(resultado.despesas).toMatchObject([{ id: 99, chamadoTitulo: 'Chamado persistido' }]);
  });
});
