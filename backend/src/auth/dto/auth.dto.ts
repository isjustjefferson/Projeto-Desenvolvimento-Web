import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'Informe o e-mail.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha.' })
  senha!: string;
}

export class RegistrarDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe seu nome completo.' })
  nome!: string;

  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'Informe o e-mail.' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe sua unidade/bloco.' })
  unidade!: string;

  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres.' })
  senha!: string;
}

export class EsqueciSenhaDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  @IsNotEmpty({ message: 'Informe o e-mail.' })
  email!: string;
}

export class RedefinirSenhaDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o token de redefinição.' })
  token!: string;

  @IsString()
  @MinLength(6, { message: 'A nova senha deve ter pelo menos 6 caracteres.' })
  novaSenha!: string;
}

export class AtualizarContaDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Informe um nome válido.' })
  nome?: string;

  @IsOptional()
  @IsString()
  foto?: string;
}