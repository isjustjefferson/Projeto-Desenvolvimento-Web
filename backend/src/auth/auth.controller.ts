import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, ServiceUnavailableException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, RegistrarDto } from './dto/auth.dto.js';
import { COOKIE_SESSAO, lerCookieSessao, opcoesCookieSessao } from './sessao-cookie.js';
import { DURACAO_SESSAO_MS, SessoesService } from './sessoes.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly sessoes: SessoesService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const resultado = await this.auth.login(dto);
    await this.iniciarSessao(resultado.usuario.id, req, res);
    return resultado;
  }

  @Post('register')
  async registrar(@Body() dto: RegistrarDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const resultado = await this.auth.registrar(dto);
    await this.iniciarSessao(resultado.usuario.id, req, res);
    return resultado;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sair(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.sessoes.revogar(lerCookieSessao(req.headers.cookie));
    res.clearCookie(COOKIE_SESSAO, opcoesCookieSessao());
  }

  @Post(['forgot-password', 'reset-password'])
  recuperarSenha() {
    throw new ServiceUnavailableException('Recuperação de senha indisponível. Procure a administração.');
  }

  private async iniciarSessao(usuarioId: number, req: Request, res: Response) {
    await this.sessoes.revogar(lerCookieSessao(req.headers.cookie));
    const token = await this.sessoes.criar(usuarioId);
    res.cookie(COOKIE_SESSAO, token, { ...opcoesCookieSessao(), maxAge: DURACAO_SESSAO_MS });
  }
}
