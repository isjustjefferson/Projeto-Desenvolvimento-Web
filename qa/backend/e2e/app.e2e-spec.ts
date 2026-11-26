import { Test } from "@nestjs/testing";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { getDataSourceToken } from "@nestjs/typeorm";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { configurarApp } from "../../../backend/src/app.config.js";
import { HealthController } from "../../../backend/src/health/health.controller.js";
import { criarApp } from "./helpers.js";

async function criarAppHealth(dataSource: unknown) {
  const moduleFixture = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [{ provide: getDataSourceToken(), useValue: dataSource }],
  }).compile();

  const app = moduleFixture.createNestApplication<NestExpressApplication>({
    bodyParser: false,
  });
  configurarApp(app);
  await app.init();
  return app;
}

describe("Health (e2e)", () => {
  it("GET /api/health responde 200 com database disabled sem DataSource (modo teste)", async () => {
    const app = await criarApp();
    const res = await request(app.getHttpServer())
      .get("/api/health")
      .expect(200);

    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("database", "disabled");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
    await app.close();
  });

  it("GET /api/health executa SELECT 1 e responde 200 com database up", async () => {
    const query = vi.fn().mockResolvedValue([{ "?column?": 1 }]);
    const app = await criarAppHealth({ isInitialized: true, query });

    const res = await request(app.getHttpServer())
      .get("/api/health")
      .expect(200);

    expect(query).toHaveBeenCalledWith("SELECT 1");
    expect(res.body).toMatchObject({
      status: "ok",
      database: "up",
    });
    expect(res.body).toHaveProperty("timestamp");
    await app.close();
  });

  it("GET /api/health responde 503 com database down quando SELECT 1 falha", async () => {
    const query = vi.fn().mockRejectedValue(new Error("connection refused"));
    const app = await criarAppHealth({ isInitialized: true, query });

    const res = await request(app.getHttpServer())
      .get("/api/health")
      .expect(503);

    expect(query).toHaveBeenCalledWith("SELECT 1");
    expect(res.body).toMatchObject({
      status: "error",
      database: "down",
    });
    expect(res.body).toHaveProperty("timestamp");
    await app.close();
  });
});
