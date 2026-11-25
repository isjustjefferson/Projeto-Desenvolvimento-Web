export interface ResultadoOcr {
  valorCentavos: number | null;
  textoOcr: string;
  ocrExtraidoEm: string;
}

type TesseractModule = typeof import('tesseract.js');
let tesseract: Promise<TesseractModule> | null = null;

function carregarTesseract(): Promise<TesseractModule> {
  tesseract ??= import('tesseract.js');
  return tesseract;
}

const MAX_LADO = 2000;

async function prepararImagem(arquivo: Blob): Promise<HTMLCanvasElement> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('OCR disponível apenas para imagens.');
  }
  const imagem = await createImageBitmap(arquivo);
  try {
    const escala = Math.min(1, MAX_LADO / Math.max(imagem.width, imagem.height));
    const largura = Math.max(1, Math.round(imagem.width * escala));
    const altura = Math.max(1, Math.round(imagem.height * escala));
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Não foi possível preparar a imagem para OCR.');
    ctx.drawImage(imagem, 0, 0, largura, altura);
    const dados = ctx.getImageData(0, 0, largura, altura);
    for (let i = 0; i < dados.data.length; i += 4) {
      const cinza = Math.round(
        dados.data[i] * 0.299 + dados.data[i + 1] * 0.587 + dados.data[i + 2] * 0.114,
      );
      const valor = cinza < 170 ? 0 : 255;
      dados.data[i] = valor;
      dados.data[i + 1] = valor;
      dados.data[i + 2] = valor;
    }
    ctx.putImageData(dados, 0, 0);
    return canvas;
  } finally {
    imagem.close();
  }
}

function paraCentavos(valor: string): number | null {
  let limpo = valor.replace(/\s/g, '');
  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');
  if (temVirgula && temPonto) {
    limpo = limpo.replace(/\./g, '').replace(',', '.');
  } else if (temVirgula) {
    limpo = limpo.replace(',', '.');
  } else if (temPonto) {
    const partes = limpo.split('.');
    if (partes.length !== 2 || partes[1].length !== 2) {
      limpo = limpo.replace(/\./g, '');
    }
  }
  const numero = Number(limpo);
  if (!Number.isFinite(numero) || numero <= 0 || numero > 10_000_000) return null;
  return Math.round(numero * 100);
}

export function extrairValorCentavos(texto: string): number | null {
  const total = texto.match(/(?:total|total\s*geral|valor\s*total)[\s\S]{0,60}?r\$\s*([\d.,]+)/i);
  if (total) {
    const valor = paraCentavos(total[1]);
    if (valor !== null) return valor;
  }
  const comMoeda = [...texto.matchAll(/r\$\s*([\d.,]+)/gi)].map((m) => m[1]);
  for (let i = comMoeda.length - 1; i >= 0; i -= 1) {
    const valor = paraCentavos(comMoeda[i]);
    if (valor !== null) return valor;
  }
  const soltos = [...texto.matchAll(/(?<![\d.,])\d{1,6}(?:[.,]\d{2})(?!\d)/g)].map((m) => m[0]);
  for (let i = soltos.length - 1; i >= 0; i -= 1) {
    const valor = paraCentavos(soltos[i]);
    if (valor !== null) return valor;
  }
  return null;
}

export async function extrairDadosOcr(arquivo: Blob): Promise<ResultadoOcr> {
  const canvas = await prepararImagem(arquivo);
  const { createWorker } = await carregarTesseract();
  const worker = await createWorker('por');
  try {
    await worker.setParameters({ preserve_interword_spaces: '1' });
    const { data } = await worker.recognize(canvas);
    const textoOcr = data.text.trim();
    return {
      valorCentavos: extrairValorCentavos(textoOcr),
      textoOcr,
      ocrExtraidoEm: new Date().toISOString(),
    };
  } finally {
    await worker.terminate();
  }
}
