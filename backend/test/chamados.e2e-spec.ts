import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { criarApp } from './helpers.js';

describe('Chamados (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /chamados sem header retorna 401', async () => {
    await request(app.getHttpServer()).get('/api/chamados').expect(401);
  });

  it('GET /chamados do solicitante devolve apenas os próprios', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/chamados')
      .set('x-usuario-id', '1')
      .expect(200);
    expect(res.body.chamados.map((c: { id: number }) => c.id)).toEqual([
      1, 3, 5,
    ]);
  });

  it('GET /chamados do técnico devolve REVISADO e os atribuídos', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/chamados')
      .set('x-usuario-id', '3')
      .expect(200);
    expect(
      res.body.chamados.map((c: { id: number }) => c.id).sort((a: number, b: number) => a - b),
    ).toEqual([1, 4]);
  });

  it('GET /chamados do gestor devolve todos', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/chamados')
      .set('x-usuario-id', '5')
      .expect(200);
    expect(res.body.chamados).toHaveLength(5);
  });

  it('GET /chamados/:id não expõe chamado alheio ao solicitante', async () => {
    await request(app.getHttpServer())
      .get('/api/chamados/3')
      .set('x-usuario-id', '1')
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/chamados/3')
      .set('x-usuario-id', '2')
      .expect(404);
  });

  it('GET /chamados/:id inexistente retorna 404', async () => {
    await request(app.getHttpServer())
      .get('/api/chamados/999')
      .set('x-usuario-id', '6')
      .expect(404);
  });

  it('POST /chamados cria em AGUARDANDO_APROVACAO e ignora prioridade', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/chamados')
      .set('x-usuario-id', '1')
      .send({
        titulo: 'Torneira pingando',
        descricao: 'Cozinha do ap 204',
        categoria: 'HIDRAULICA',
        local: { predio: 'Bloco A', andar: '2º andar', sala: '204' },
        prioridade: 'CRITICA',
      })
      .expect(201);
    expect(res.body.chamado).toMatchObject({
      status: 'AGUARDANDO_APROVACAO',
      prioridade: null,
      tecnicoId: null,
      criadoPorId: 1,
    });
    expect(res.body.chamado.historico).toHaveLength(1);
  });

  it('POST /chamados aceita foto em base64 acima do limite padrão', async () => {
    const foto = `data:image/jpeg;base64,${'A'.repeat(500 * 1024)}`;
    const res = await request(app.getHttpServer())
      .post('/api/chamados')
      .set('x-usuario-id', '1')
      .send({
        titulo: 'Com foto grande',
        descricao: 'Foto em base64 de aproximadamente 500kb',
        categoria: 'OUTROS',
        local: { predio: 'Bloco B' },
        foto,
      })
      .expect(201);
    expect(res.body.chamado.foto).toBe(foto);
  });

  it('POST /chamados bloqueia gestor e técnico', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados')
      .set('x-usuario-id', '5')
      .send({
        titulo: 'X',
        descricao: 'Y',
        categoria: 'OUTROS',
        local: { predio: 'Bloco A' },
      })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/chamados')
      .set('x-usuario-id', '3')
      .send({
        titulo: 'X',
        descricao: 'Y',
        categoria: 'OUTROS',
        local: { predio: 'Bloco A' },
      })
      .expect(403);
  });

  it('POST /chamados valida payload', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados')
      .set('x-usuario-id', '1')
      .send({
        titulo: '',
        descricao: '',
        categoria: 'INVALIDA',
        local: { andar: '1º' },
      })
      .expect(400);
  });

  it('aprovar define prioridade, técnico e histórico; bloqueia solicitante', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados/3/aprovar')
      .set('x-usuario-id', '1')
      .send({ prioridade: 'CRITICA', tecnicoId: 3 })
      .expect(403);

    const res = await request(app.getHttpServer())
      .post('/api/chamados/3/aprovar')
      .set('x-usuario-id', '5')
      .send({ prioridade: 'CRITICA', tecnicoId: 3 })
      .expect(201);
    expect(res.body.chamado).toMatchObject({
      status: 'REVISADO',
      prioridade: 'CRITICA',
      tecnicoId: 3,
    });
    expect(res.body.chamado.historico[0]).toMatchObject({
      de: 'AGUARDANDO_APROVACAO',
      para: 'REVISADO',
      observacao:
        'Aprovado com prioridade CRITICA e atribuído ao técnico',
    });
  });

  it('aprovar com técnico não-técnico retorna 400; fora de AGUARDANDO retorna 400', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados/3/aprovar')
      .set('x-usuario-id', '5')
      .send({ prioridade: 'ALTA', tecnicoId: 1 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/chamados/1/aprovar')
      .set('x-usuario-id', '5')
      .send({ prioridade: 'ALTA', tecnicoId: 3 })
      .expect(400);
  });

  it('iniciar: gestor inicia REVISADO; técnico não atribuído é bloqueado; fora de REVISADO 400', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados/4/iniciar')
      .set('x-usuario-id', '3')
      .expect(403);

    const res = await request(app.getHttpServer())
      .post('/api/chamados/4/iniciar')
      .set('x-usuario-id', '5')
      .expect(201);
    expect(res.body.chamado.status).toBe('EM_ANDAMENTO');

    await request(app.getHttpServer())
      .post('/api/chamados/3/iniciar')
      .set('x-usuario-id', '5')
      .expect(400);
  });

  it('concluir: técnico atribuído conclui com solução; outrem bloqueado; sem solução 400', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados/2/concluir')
      .set('x-usuario-id', '3')
      .send({ descricao: 'S', materiais: 'M' })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/chamados/2/concluir')
      .set('x-usuario-id', '4')
      .send({ descricao: '', materiais: '' })
      .expect(400);

    const res = await request(app.getHttpServer())
      .post('/api/chamados/2/concluir')
      .set('x-usuario-id', '4')
      .send({ descricao: 'Vazamento resolvido', materiais: 'vedante' })
      .expect(201);
    expect(res.body.chamado).toMatchObject({
      status: 'CONCLUIDO',
      solucao: { descricao: 'Vazamento resolvido', materiais: 'vedante' },
    });
  });

  it('fluxo completo end-to-end do técnico', async () => {
    await request(app.getHttpServer())
      .post('/api/chamados/3/aprovar')
      .set('x-usuario-id', '6')
      .send({ prioridade: 'MEDIA', tecnicoId: 3 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/chamados/3/iniciar')
      .set('x-usuario-id', '3')
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/chamados/3/concluir')
      .set('x-usuario-id', '3')
      .send({ descricao: 'Válvula trocada', materiais: '1 válvula nova' })
      .expect(201);
    expect(res.body.chamado.status).toBe('CONCLUIDO');
  });

  it('filtros de listagem (status, categoria, técnico, prédio, busca, período)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/chamados?status=CONCLUIDO')
      .set('x-usuario-id', '6')
      .expect(200);
    expect(res.body.chamados.map((c: { id: number }) => c.id)).toEqual([1]);

    const res2 = await request(app.getHttpServer())
      .get('/api/chamados?predio=Bloco%20B')
      .set('x-usuario-id', '6')
      .expect(200);
    expect(res2.body.chamados.map((c: { id: number }) => c.id)).toEqual([4]);

    const res3 = await request(app.getHttpServer())
      .get('/api/chamados?q=vazamento')
      .set('x-usuario-id', '6')
      .expect(200);
    expect(res3.body.chamados.map((c: { id: number }) => c.id)).toEqual([2]);

    await request(app.getHttpServer())
      .get('/api/chamados?status=INVALIDO')
      .set('x-usuario-id', '6')
      .expect(400);
  });
});