import { describe, expect, it } from 'vitest';
import { extrairChaveNFe, tipoDaChave } from '../../frontend/src/qrcode';

// Chave de NFC-e (modelo 65): UF 35, 11/2026, CNPJ, modelo 65, série 001, nº 123
const CHAVE_NFCE = '35261112345678000190650010000001231000012345';
// Mesma chave como NF-e (modelo 55)
const CHAVE_NFE = '35261112345678000190550010000001231000012345';

describe('extrairChaveNFe', () => {
  it('lê a chave do QR Code da NFC-e versão 2 (parâmetro p=)', () => {
    const qr = `https://www.nfce.fazenda.sp.gov.br/qrcode?p=${CHAVE_NFCE}|2|1|1|ABCDEF0123456789`;
    expect(extrairChaveNFe(qr)).toBe(CHAVE_NFCE);
  });

  it('lê a chave do QR Code da versão 1 (parâmetro chNFe=)', () => {
    const qr = `http://nfce.sefaz.pe.gov.br/nfce/consulta?chNFe=${CHAVE_NFCE}&nVersao=100&tpAmb=1`;
    expect(extrairChaveNFe(qr)).toBe(CHAVE_NFCE);
  });

  it('aceita a chave pura, inclusive com espaços entre os blocos', () => {
    expect(extrairChaveNFe(CHAVE_NFE)).toBe(CHAVE_NFE);
    expect(extrairChaveNFe(CHAVE_NFE.replace(/(\d{4})(?=\d)/g, '$1 '))).toBe(
      CHAVE_NFE,
    );
  });

  it('devolve null quando o QR não traz uma chave de 44 dígitos', () => {
    expect(extrairChaveNFe('https://exemplo.com.br/promocao')).toBeNull();
    expect(extrairChaveNFe('123456')).toBeNull();
    // 45 dígitos seguidos não é uma chave válida
    expect(extrairChaveNFe(`${CHAVE_NFE}9`)).toBeNull();
    expect(extrairChaveNFe('')).toBeNull();
  });
});

describe('tipoDaChave', () => {
  it('identifica o modelo pelos dígitos 21-22 da chave', () => {
    expect(tipoDaChave(CHAVE_NFCE)).toBe('NFCE');
    expect(tipoDaChave(CHAVE_NFE)).toBe('NFE');
  });

  it('devolve null para outros modelos', () => {
    expect(
      tipoDaChave(CHAVE_NFE.slice(0, 20) + '57' + CHAVE_NFE.slice(22)),
    ).toBeNull();
  });
});
