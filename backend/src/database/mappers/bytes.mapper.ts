export function bufferToBase64(buf: Buffer | null): string | undefined {
  if (!buf) return undefined;
  return buf.toString('base64');
}

export function base64ToBuffer(b64: string | undefined | null): Buffer | null {
  if (!b64) return null;
  return Buffer.from(b64, 'base64');
}
