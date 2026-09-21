const STORAGE_KEY = 'predial.usuarioId';

// Enviado pelo backend (ValidationPipe) quando a validação falha: message pode
// ser string (erro de regra) ou um array de mensagens (erros de validação).
interface CorpoErro {
  message?: string | string[];
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let aoPerderSessao: (() => void) | null = null;

export function registrarPerdaSessao(handler: () => void): void {
  aoPerderSessao = handler;
}

async function extrairMensagem(res: Response): Promise<string> {
  try {
    const corpo = (await res.json()) as CorpoErro;
    const { message } = corpo;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  } catch {
    // corpo vazio ou não-JSON
  }
  return `Falha na requisição (${res.status}).`;
}

async function requisicao<T>(
  caminho: string,
  opcoes: RequestInit = {},
): Promise<T> {
  const headers = new Headers(opcoes.headers);
  if (opcoes.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const id = localStorage.getItem(STORAGE_KEY);
  if (id) headers.set('x-usuario-id', id);

  const res = await fetch(`/api${caminho}`, { ...opcoes, headers });

  if (!res.ok) {
    if (res.status === 401) aoPerderSessao?.();
    throw new ApiError(await extrairMensagem(res), res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function get<T>(caminho: string): Promise<T> {
  return requisicao<T>(caminho);
}

export function post<T>(caminho: string, corpo?: unknown): Promise<T> {
  return requisicao<T>(caminho, {
    method: 'POST',
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
}

export function patch<T>(caminho: string, corpo?: unknown): Promise<T> {
  return requisicao<T>(caminho, {
    method: 'PATCH',
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
}

export function del<T>(caminho: string): Promise<T> {
  return requisicao<T>(caminho, { method: 'DELETE' });
}
