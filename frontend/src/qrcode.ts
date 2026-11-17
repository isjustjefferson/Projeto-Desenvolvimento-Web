// Leitura do QR Code de notas fiscais no próprio navegador. Só identifica a chave
// de acesso; buscar itens e valores da nota depende do backend (API da Fazenda/OCR).
import type { TipoDocumentoFiscal } from './types';

// A chave de acesso tem 44 dígitos; no QR da NFC-e ela vem dentro de um link
// (?p=CHAVE|... na versão 2 ou ?chNFe=CHAVE na versão 1). Espaços entre os
// blocos (chave digitada ou impressa) são ignorados.
export function extrairChaveNFe(texto: string): string | null {
  const semEspacos = texto.replace(/(\d)\s+(?=\d)/g, '$1');
  return semEspacos.match(/(?<!\d)\d{44}(?!\d)/)?.[0] ?? null;
}

// Os dígitos 21-22 da chave são o modelo do documento: 55 = NF-e, 65 = NFC-e
export function tipoDaChave(chave: string): TipoDocumentoFiscal | null {
  const modelo = chave.slice(20, 22);
  if (modelo === '55') return 'NFE';
  if (modelo === '65') return 'NFCE';
  return null;
}

type JsQR = typeof import('jsqr').default;
let jsqr: Promise<JsQR> | null = null;

// O leitor (~130 KB) só é baixado na primeira leitura, não no carregamento do app
function carregarJsQR(): Promise<JsQR> {
  jsqr ??= import('jsqr').then((m) => m.default);
  return jsqr;
}

// Fotos de celular são grandes; reduzir acelera a leitura sem perder o QR
const MAX_LADO = 1600;

async function lerDoCanvas(
  desenhar: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  largura: number,
  altura: number,
): Promise<string | null> {
  const escala = Math.min(1, MAX_LADO / Math.max(largura, altura));
  const w = Math.round(largura * escala);
  const h = Math.round(altura * escala);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  desenhar(ctx, w, h);
  const jsQR = await carregarJsQR();
  return jsQR(ctx.getImageData(0, 0, w, h).data, w, h)?.data ?? null;
}

// Lê o QR Code de uma foto (JPEG/PNG). Devolve null se não achar nenhum.
export async function lerQrCodeDeImagem(arquivo: Blob): Promise<string | null> {
  try {
    const imagem = await createImageBitmap(arquivo);
    try {
      return await lerDoCanvas(
        (ctx, w, h) => ctx.drawImage(imagem, 0, 0, w, h),
        imagem.width,
        imagem.height,
      );
    } finally {
      imagem.close();
    }
  } catch {
    return null;
  }
}

// Lê o quadro atual da câmera. Chamado em loop enquanto o leitor está aberto.
export async function lerQrCodeDeVideo(
  video: HTMLVideoElement,
): Promise<string | null> {
  if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) {
    return null;
  }
  return lerDoCanvas(
    (ctx, w, h) => ctx.drawImage(video, 0, 0, w, h),
    video.videoWidth,
    video.videoHeight,
  );
}
