import type { Request } from 'express';
import type { UsuarioInterno } from '../dados/seed.js';

export interface RequisicaoComUsuario extends Request {
  usuario?: UsuarioInterno;
}