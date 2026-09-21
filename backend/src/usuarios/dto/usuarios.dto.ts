import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import type { Role } from '../../contrato.js';

const ROLES: Role[] = ['SOLICITANTE', 'TECNICO', 'GESTOR', 'ADMINISTRADOR'];

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome do usuário.' })
  nome!: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'Informe o e-mail.' })
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha?: string;

  @IsOptional()
  @IsIn(ROLES, { message: 'Perfil inválido.' })
  role?: Role;

  @IsOptional()
  @IsString()
  especialidade?: string;

  @IsOptional()
  @IsString()
  setor?: string;
}

export class AlterarRoleDto {
  @IsIn(ROLES, { message: 'Perfil inválido.' })
  role!: Role;
}