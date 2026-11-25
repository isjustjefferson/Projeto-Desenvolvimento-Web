import { beforeEach, describe, expect, it } from 'vitest';
import { StoreService } from '../../../../backend/src/dados/store.service.js';
import type { UsuarioInterno } from '../../../../backend/src/dados/seed.js';
import { RelatoriosService } from '../../../../backend/src/relatorios/relatorios.service.js';

describe('RelatoriosService', () => {
  let store: StoreService;
  let service: RelatoriosService;
  let ricardo: UsuarioInterno;

  beforeEach(() => {
    store = new StoreService();
    service = new RelatoriosService(store);
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

  it('calcula resumo financeiro e agregações por categoria e registrante', () => {
    const res = service.despesas(ricardo, {});

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
    expect(res.despesas[0].anexos[0]).not.toHaveProperty('conteudo');
  });

  it('filtra por status, categoria, registrante e documento fiscal', () => {
    const apenasAprovadas = service.despesas(ricardo, { status: 'APROVADA' });
    expect(apenasAprovadas.despesas).toHaveLength(1);
    expect(apenasAprovadas.despesas[0].id).toBe(1);

    const semDoc = service.despesas(ricardo, { temDocumento: 'nao' });
    expect(semDoc.despesas).toHaveLength(2);

    const doJoao = service.despesas(ricardo, { registradoPorId: 3 });
    expect(doJoao.despesas).toHaveLength(2);
    expect(doJoao.resumo.totalCentavos).toBe(7000);
  });
});
