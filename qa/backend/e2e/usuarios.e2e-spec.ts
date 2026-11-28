import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { INestApplication } from "@nestjs/common";
import { cookieDeUsuario, criarApp, type App } from "./helpers.js";

describe("Usuários (admin) (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    app = await criarApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /usuarios sem header retorna 401", async () => {
    await request(app.getHttpServer()).get("/api/usuarios").expect(401);
  });

  it("GET /usuarios para não-admin retorna 403", async () => {
    await request(app.getHttpServer())
      .get("/api/usuarios")
      .set('Cookie', await cookieDeUsuario(app, 1))
      .expect(403);
    await request(app.getHttpServer())
      .get("/api/usuarios")
      .set('Cookie', await cookieDeUsuario(app, 5))
      .expect(403);
  });

  it("GET /usuarios para admin lista usuários sem senha", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/usuarios")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .expect(200);
    expect(res.body.usuarios).toHaveLength(10);
    expect(res.body.usuarios[0]).not.toHaveProperty("senha");
    expect(res.body.usuarios[0]).not.toHaveProperty("senhaHash");
  });

  it("GET /usuarios/resumo sem header retorna 401", async () => {
    await request(app.getHttpServer()).get("/api/usuarios/resumo").expect(401);
  });

  it("GET /usuarios/resumo para não-admin retorna resumo sem dados sensíveis", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/usuarios/resumo")
      .set('Cookie', await cookieDeUsuario(app, 1))
      .expect(200);
    expect(res.body.usuarios).toHaveLength(10);
    expect(res.body.usuarios[0]).not.toHaveProperty("email");
    expect(res.body.usuarios[0]).not.toHaveProperty("senha");
    expect(res.body.usuarios[0]).not.toHaveProperty("setor");
    expect(res.body.usuarios[0]).toMatchObject({
      id: 1,
      nome: "Ana Souza",
      role: "CONDOMINO",
    });
  });

  it("POST cria PRESTADOR com especialidade e a senha inicial informada", async () => {
    const criar = await request(app.getHttpServer())
      .post("/api/usuarios")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({
        nome: "Fábio Manutenção",
        email: "fabio@predial.com",
        senha: "fixture-Fabio-2026",
        role: "PRESTADOR",
        especialidade: "Climatização",
      })
      .expect(201);
    expect(criar.body.usuario).toMatchObject({
      id: 11,
      role: "PRESTADOR",
      especialidade: "Climatização",
    });

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "fabio@predial.com", senha: "fixture-Fabio-2026" })
      .expect(200);
    expect(login.body.usuario.role).toBe("PRESTADOR");
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "fabio@predial.com", senha: "123456" })
      .expect(401);
  });

  it("POST rejeita cadastro administrativo sem senha inicial ou com a senha pública", async () => {
    const cookie = await cookieDeUsuario(app, 6);
    for (const senha of [undefined, "123456", "🟦".repeat(19)]) {
      await request(app.getHttpServer())
        .post("/api/usuarios")
        .set("Cookie", cookie)
        .send({ nome: "Novo", email: "novo@predial.com", senha })
        .expect(400);
    }
  });

  it("POST com e-mail duplicado retorna 409", async () => {
    await request(app.getHttpServer())
      .post("/api/usuarios")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ nome: "Duplicado", email: "ana@predial.com", senha: "fixture-senha-2026" })
      .expect(409);
  });

  it("POST com role inválida retorna 400", async () => {
    await request(app.getHttpServer())
      .post("/api/usuarios")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ nome: "X", email: "x@predial.com", senha: "fixture-senha-2026", role: "SUPER" })
      .expect(400);
  });

  it("PATCH promove para SINDICO e rebaixa para CONDOMINO", async () => {
    await request(app.getHttpServer())
      .patch("/api/usuarios/1/role")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ role: "SINDICO" })
      .expect(200);

    const login = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "ana@predial.com", senha: "123456" })
      .expect(200);
    expect(login.body.usuario.role).toBe("SINDICO");

    const rebaixa = await request(app.getHttpServer())
      .patch("/api/usuarios/1/role")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ role: "CONDOMINO" })
      .expect(200);
    expect(rebaixa.body.usuario.role).toBe("CONDOMINO");
  });

  it("PATCH com role inválida retorna 400", async () => {
    await request(app.getHttpServer())
      .patch("/api/usuarios/1/role")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ role: "INEXISTENTE" })
      .expect(400);
  });

  it("PATCH/DELETE em id inexistente retorna 404", async () => {
    await request(app.getHttpServer())
      .patch("/api/usuarios/999/role")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ role: "SINDICO" })
      .expect(404);
    await request(app.getHttpServer())
      .delete("/api/usuarios/999")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .expect(404);
  });

  it("PATCH/DELETE sobre a própria conta retorna 400", async () => {
    await request(app.getHttpServer())
      .patch("/api/usuarios/6/role")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .send({ role: "SINDICO" })
      .expect(400);
    await request(app.getHttpServer())
      .delete("/api/usuarios/6")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .expect(400);
  });

  it("DELETE exclui a conta e o login passa a falhar", async () => {
    await request(app.getHttpServer())
      .delete("/api/usuarios/2")
      .set('Cookie', await cookieDeUsuario(app, 6))
      .expect(200);

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "carlos@predial.com", senha: "123456" })
      .expect(401);
  });
});
