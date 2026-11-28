import {
  BadRequestException, ConflictException, Inject, Injectable,
  ServiceUnavailableException, UnauthorizedException,
} from '@nestjs/common';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { ChamadosService } from '../chamados/chamados.service.js';
import type { UsuarioInterno } from '../dados/seed.js';

const tiposImagem = ['image/jpeg', 'image/jpg', 'image/png'];
const tentativasMaximas = 3;

interface ItemOcr {
  descricao: string;
  quantidade?: string | null;
  unitario?: string | null;
  valor?: string | null;
}

export interface ResultadoOcr {
  itens: ItemOcr[];
  texto: string;
}

export interface TrabalhoOcr {
  id: number;
  estado: 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'FALHOU';
  resultado: ResultadoOcr | null;
}

@Injectable()
export class OcrTrabalhosService {
  constructor(
    @Inject('DATA_SOURCE') private readonly db: DataSource,
    private readonly chamados: ChamadosService,
  ) {}

  async solicitar(chamadoId: number, despesaId: number, anexoId: number, usuario: UsuarioInterno) {
    this.tokenConfigurado();
    const { anexo } = await this.chamados.obterConteudoAnexoDespesa(chamadoId, despesaId, anexoId, usuario);
    if (!tiposImagem.includes(anexo.mimeType)) {
      throw new BadRequestException('O OCR do computador aceita imagens JPEG e PNG.');
    }
    await this.db.query(
      `INSERT INTO trabalhos_ocr (anexo_id) VALUES ($1)
       ON CONFLICT (anexo_id) DO UPDATE SET estado = 'PENDENTE', tentativas = 0,
         reserva = NULL, reserva_ate = NULL, resultado = NULL, atualizado_em = now()
       WHERE trabalhos_ocr.estado = 'FALHOU'`,
      [anexoId],
    );
    return this.consultar(chamadoId, despesaId, anexoId, usuario);
  }

  async consultar(chamadoId: number, despesaId: number, anexoId: number, usuario: UsuarioInterno) {
    await this.chamados.validarAcessoFinanceiro(chamadoId, usuario);
    if (!process.env.OCR_WORKER_TOKEN?.trim()) return { habilitado: false, trabalho: null };
    const [trabalho] = await this.db.query<TrabalhoOcr[]>(
      `SELECT t.id, t.estado, t.resultado
         FROM trabalhos_ocr t
         JOIN anexos_despesa a ON a.id = t.anexo_id
         JOIN despesas d ON d.id = a.despesa_id
        WHERE t.anexo_id = $1 AND a.despesa_id = $2 AND d.chamado_id = $3`,
      [anexoId, despesaId, chamadoId],
    );
    return { habilitado: true, trabalho: trabalho ?? null };
  }

  async reservar(token: string | undefined) {
    this.autenticarWorker(token);
    await this.db.query(
      `UPDATE trabalhos_ocr
          SET estado = 'FALHOU', reserva = NULL, reserva_ate = NULL, atualizado_em = now()
        WHERE estado = 'PROCESSANDO' AND reserva_ate <= now() AND tentativas >= $1`,
      [tentativasMaximas],
    );
    const [trabalho] = await this.db.query<{
      id: number; reserva: string; mimeType: string; conteudo: string;
    }[]>(
      `WITH candidato AS (
         SELECT t.id FROM trabalhos_ocr t
          WHERE (t.estado = 'PENDENTE' OR (t.estado = 'PROCESSANDO' AND t.reserva_ate <= now()))
            AND t.tentativas < $2
          ORDER BY t.criado_em, t.id LIMIT 1 FOR UPDATE SKIP LOCKED
       ), reservado AS (
         UPDATE trabalhos_ocr t SET estado = 'PROCESSANDO', reserva = $1,
           reserva_ate = now() + interval '5 minutes', tentativas = tentativas + 1, atualizado_em = now()
         FROM candidato c WHERE t.id = c.id RETURNING t.id, t.anexo_id, t.reserva
       )
       SELECT r.id, r.reserva, a.mime_type AS "mimeType", encode(a.conteudo, 'base64') AS conteudo
       FROM reservado r JOIN anexos_despesa a ON a.id = r.anexo_id`,
      [randomUUID(), tentativasMaximas],
    );
    return { trabalho: trabalho ?? null };
  }

  async finalizar(token: string | undefined, id: number, reserva: string, resultado: ResultadoOcr | null) {
    this.autenticarWorker(token);
    const [atualizado] = await this.db.query<{ id: number }[]>(
      `WITH atualizado AS (
         UPDATE trabalhos_ocr SET estado = $3, resultado = $4::jsonb, reserva = NULL,
           reserva_ate = NULL, atualizado_em = now()
         WHERE id = $1 AND reserva = $2::uuid AND estado = 'PROCESSANDO' AND reserva_ate > now()
         RETURNING id
       ) SELECT id FROM atualizado`,
      [id, reserva, resultado ? 'CONCLUIDO' : 'FALHOU', resultado ? JSON.stringify(resultado) : null],
    );
    if (!atualizado) throw new ConflictException('A reserva expirou ou já foi usada.');
    return { ok: true };
  }

  private tokenConfigurado(): string {
    const token = process.env.OCR_WORKER_TOKEN?.trim();
    if (!token) throw new ServiceUnavailableException('O worker de OCR ainda não está configurado.');
    return token;
  }

  private autenticarWorker(token: string | undefined): void {
    const esperado = Buffer.from(this.tokenConfigurado());
    const recebido = Buffer.from(token ?? '');
    if (esperado.length !== recebido.length || !timingSafeEqual(esperado, recebido)) {
      throw new UnauthorizedException('Credencial do worker inválida.');
    }
  }
}
