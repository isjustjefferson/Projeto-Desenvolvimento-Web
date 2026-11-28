import { beforeEach, describe, expect, it } from "vitest";
import bcrypt from "bcrypt";
import { StoreService } from "../../../../backend/src/dados/store.service.js";
import { UsuariosService } from "../../../../backend/src/usuarios/usuarios.service.js";

describe("UsuariosService", () => {
  let store: StoreService;
  let service: UsuariosService;

  beforeEach(() => {
    store = new StoreService();
    const repo = { find: async () => [], findOne: async () => null } as any;
    service = new UsuariosService(store, repo);
  });

  it("lista usuarios publicos sem senha/hash", async () => {
    const res = await service.listar();
    expect(res.usuarios).toHaveLength(10);
    expect(res.usuarios[0]).not.toHaveProperty("senha");
    expect(res.usuarios[0]).not.toHaveProperty("senhaHash");
  });

  it("cria usuário PRESTADOR com especialidade e hash da senha inicial", async () => {
    const senha = "fixture-Fabio-2026";
    const res = await service.criar({
      nome: "Fábio Manutenção",
      email: "fabio@predial.com",
      senha,
      role: "PRESTADOR",
      especialidade: "Climatização",
    });
    expect(res.usuario).toMatchObject({
      id: 11,
      role: "PRESTADOR",
      especialidade: "Climatização",
      ativo: true,
    });
    const interno = store.getUsuarioInternoPorId(11);
    expect(bcrypt.compareSync(senha, interno!.senhaHash)).toBe(true);
  });

  it("cria usuário CONDOMINO por padrão e guarda setor", async () => {
    const res = await service.criar({
      nome: "Denise",
      email: "denise@predial.com",
      senha: "fixture-Denise-2026",
      setor: "Administracao",
    });
    expect(res.usuario.role).toBe("CONDOMINO");
    expect(res.usuario.especialidade).toBeUndefined();
    expect(res.usuario.setor).toBe("Administracao");
  });

  it("rejeita e-mail duplicado (case-insensitive)", async () => {
    await expect(
      service.criar({ nome: "X", email: "ANA@PREDIAL.COM", senha: "fixture-senha-2026" }),
    ).rejects.toThrow("Este e-mail já está cadastrado.");
  });

  it("promove e rebaixa um usuário", async () => {
    const promovido = await service.alterarRole(1, { role: "SINDICO" }, 6);
    expect(promovido.usuario.role).toBe("SINDICO");
    const rebaixado = await service.alterarRole(1, { role: "CONDOMINO" }, 6);
    expect(rebaixado.usuario.role).toBe("CONDOMINO");
  });

  it("bloqueia alterar cargo de usuário inexistente", async () => {
    await expect(
      service.alterarRole(999, { role: "SINDICO" }, 6),
    ).rejects.toThrow("Usuário não encontrado.");
  });

  it("bloqueia ação sobre a própria conta", async () => {
    await expect(
      service.alterarRole(6, { role: "SINDICO" }, 6),
    ).rejects.toThrow("Você não pode realizar esta ação na própria conta.");
  });

  it("bloqueia rebaixar/excluir o último administrador", async () => {
    await expect(
      service.alterarRole(6, { role: "SINDICO" }, 5),
    ).rejects.toThrow("Não é possível remover o último administrador.");
    await expect(service.excluir(6, 5)).rejects.toThrow(
      "Não é possível excluir o último administrador.",
    );
  });

  it("permite rebaixar um administrador quando ha outro", async () => {
    const segundo = await service.criar({
      nome: "Segundo Admin",
      email: "admin2@predial.com",
      senha: "fixture-admin-2026",
      role: "ADMINISTRADOR",
    });
    const res = await service.alterarRole(
      6,
      { role: "SINDICO" },
      segundo.usuario.id,
    );
    expect(res.usuario.role).toBe("SINDICO");
  });

  it("exclui usuario e impede auto-exclusao", async () => {
    await expect(service.excluir(6, 6)).rejects.toThrow(
      "Você não pode realizar esta ação na própria conta.",
    );
    const res = await service.excluir(2, 6);
    expect(res.ok).toBe(true);
    expect(store.getUsuarioInternoPorId(2)).toBeUndefined();
  });
});
