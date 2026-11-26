import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import {
  CriarDespesaDto,
  EditarDespesaDto,
} from "../../../../../backend/src/chamados/dto/chamados.dto.js";
import { validarCpfCnpj } from "../../../../../backend/src/common/validators/documento.validator.js";

async function errosCnpjCriar(cnpj: unknown): Promise<string[]> {
  const dto = plainToInstance(CriarDespesaDto, {
    categoria: "MATERIAL",
    descricao: "Tubo PVC",
    valorCentavos: 3500,
    cnpj,
  });
  const erros = await validate(dto);
  const erroCnpj = erros.find((e) => e.property === "cnpj");
  return erroCnpj?.constraints ? Object.values(erroCnpj.constraints) : [];
}

async function errosCnpjEditar(cnpj: unknown): Promise<string[]> {
  const dto = plainToInstance(EditarDespesaDto, { cnpj });
  const erros = await validate(dto);
  const erroCnpj = erros.find((e) => e.property === "cnpj");
  return erroCnpj?.constraints ? Object.values(erroCnpj.constraints) : [];
}

describe("validarCpfCnpj (backend)", () => {
  it("aceita CPF e CNPJ válidos com ou sem formatação", () => {
    expect(validarCpfCnpj("52998224725")).toBe(true);
    expect(validarCpfCnpj("529.982.247-25")).toBe(true);
    expect(validarCpfCnpj("12345678000195")).toBe(true);
    expect(validarCpfCnpj("12.345.678/0001-95")).toBe(true);
  });

  it("rejeita dígitos verificadores inválidos em CPF e CNPJ", () => {
    expect(validarCpfCnpj("529.982.247-35")).toBe(false);
    expect(validarCpfCnpj("529.982.247-26")).toBe(false);
    expect(validarCpfCnpj("12.345.678/0001-85")).toBe(false);
    expect(validarCpfCnpj("12.345.678/0001-90")).toBe(false);
  });

  it("rejeita sequências de dígitos repetidos", () => {
    expect(validarCpfCnpj("00000000000")).toBe(false);
    expect(validarCpfCnpj("111.111.111-11")).toBe(false);
    expect(validarCpfCnpj("00000000000000")).toBe(false);
    expect(validarCpfCnpj("11.111.111/1111-11")).toBe(false);
  });

  it("rejeita comprimento inválido e caracteres não permitidos", () => {
    expect(validarCpfCnpj("12345")).toBe(false);
    expect(validarCpfCnpj("52998224725x")).toBe(false);
  });
});

describe("@IsDocumentoValido nos DTOs de despesa", () => {
  it("permite omitir cnpj ou enviá-lo em branco", async () => {
    expect(await errosCnpjCriar(undefined)).toEqual([]);
    expect(await errosCnpjCriar("   ")).toEqual([]);
    expect(await errosCnpjEditar(undefined)).toEqual([]);
    expect(await errosCnpjEditar("")).toEqual([]);
  });

  it("aceita CPF e CNPJ válidos em CriarDespesaDto e EditarDespesaDto", async () => {
    expect(await errosCnpjCriar("529.982.247-25")).toEqual([]);
    expect(await errosCnpjCriar("12.345.678/0001-95")).toEqual([]);
    expect(await errosCnpjEditar("52998224725")).toEqual([]);
    expect(await errosCnpjEditar("12345678000195")).toEqual([]);
  });

  it("rejeita dígitos verificadores inválidos e sequências repetidas com mensagem padrão", async () => {
    for (const invalido of [
      "529.982.247-26",
      "12.345.678/0001-90",
      "111.111.111-11",
      "11.111.111/1111-11",
      "12345",
    ]) {
      expect(await errosCnpjCriar(invalido)).toContain("CPF/CNPJ inválido.");
      expect(await errosCnpjEditar(invalido)).toContain("CPF/CNPJ inválido.");
    }
  });
});
