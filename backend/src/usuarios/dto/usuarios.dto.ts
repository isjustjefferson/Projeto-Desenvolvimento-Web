import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import type { Role } from '../../contrato.js';

const ROLES: Role[] = ['CONDOMINO', 'PRESTADOR', 'SINDICO', 'ADMINISTRADOR'];

export class CriarUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome do usuário.' })
  nome!: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'Informe o e-mail.' })
  email!: string;

  @IsString()
  @MinLength(12, { message: 'A senha inicial deve ter pelo menos 12 caracteres.' })
  @Matches(/\S/, { message: 'Informe uma senha inicial.' })
  senha!: string;

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
