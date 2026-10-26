// Funções puras para o checkout Pix Web (BR Code EMV + QR decorativo em xilogravura).

export interface PixPayloadInput {
  txId: string;
  amountBrlCents: number;
  merchantName: string;
  city: string;
  pixKey?: string;
}

export interface SummonableRooster {
  number: number;
  name: string;
  rarity: string;
}

export const DEFAULT_PIX_KEY = 'pix@beakbreaker.com.br';
const QR_SIZE = 21;
const QR_INK = '#1B1B1B';
const QR_PAPER = '#F5E9D3';

/** Campo EMV no formato ID (2) + tamanho (2) + valor. */
const emvField = (id: string, value: string): string =>
  `${id}${value.length.toString().padStart(2, '0')}${value}`;

/** Remove acentos/caracteres especiais e limita o tamanho (exigência do BR Code). */
const sanitizeText = (value: string, maxLen: number): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, maxLen);

/** txid do Pix: apenas alfanuméricos, até 25 caracteres. */
const sanitizeTxId = (txId: string): string => {
  const clean = txId.replace(/[^A-Za-z0-9]/g, '').slice(0, 25);
  return clean.length > 0 ? clean : '***';
};

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), 4 dígitos hex maiúsculos. */
export function crc16ccitt(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i += 1) {
    crc ^= (str.charCodeAt(i) & 0xff) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/** Monta o payload BR Code (Pix estático com valor e txid). */
export function buildPixEmvPayload(input: PixPayloadInput): string {
  const amount = (Math.max(0, Math.round(input.amountBrlCents)) / 100).toFixed(2);
  const merchantAccount =
    emvField('00', 'BR.GOV.BCB.PIX') + emvField('01', input.pixKey ?? DEFAULT_PIX_KEY);
  const body =
    emvField('00', '01') +
    emvField('26', merchantAccount) +
    emvField('52', '0000') +
    emvField('53', '986') +
    emvField('54', amount) +
    emvField('58', 'BR') +
    emvField('59', sanitizeText(input.merchantName, 25) || 'BEAKBREAKER') +
    emvField('60', sanitizeText(input.city, 15) || 'SAO PAULO') +
    emvField('62', emvField('05', sanitizeTxId(input.txId))) +
    '6304';
  return body + crc16ccitt(body);
}

/** Hash FNV-1a de 32 bits com dispersão de bits. */
export function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x45d9f3b) >>> 0;
  hash ^= hash >>> 16;
  return hash >>> 0;
}

const isFinderZone = (x: number, y: number): boolean => {
  const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
  return inBox(0, 0) || inBox(QR_SIZE - 7, 0) || inBox(0, QR_SIZE - 7);
};

const finderSquare = (ox: number, oy: number): string =>
  `<rect x="${ox}" y="${oy}" width="7" height="7" fill="${QR_INK}"/>` +
  `<rect x="${ox + 1}" y="${oy + 1}" width="5" height="5" fill="${QR_PAPER}"/>` +
  `<rect x="${ox + 2}" y="${oy + 2}" width="3" height="3" fill="${QR_INK}"/>`;

/** SVG decorativo 21x21 em estilo xilogravura (não é um QR decodificável). */
export function buildWoodcutQrSvg(payload: string): string {
  const parts: string[] = [];
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (isFinderZone(x, y)) continue;
      if (fnv1a(`${payload}:${x}:${y}`) % 2 === 0) {
        parts.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${QR_INK}"/>`);
      }
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 ${QR_SIZE + 2} ${QR_SIZE + 2}" ` +
    `width="168" height="168" shape-rendering="crispEdges" data-qr-size="${QR_SIZE}">` +
    `<rect x="-1" y="-1" width="${QR_SIZE + 2}" height="${QR_SIZE + 2}" fill="${QR_PAPER}"/>` +
    finderSquare(0, 0) +
    finderSquare(QR_SIZE - 7, 0) +
    finderSquare(0, QR_SIZE - 7) +
    parts.join('') +
    '</svg>'
  );
}

/** Escolha determinística da ave invocada; no Hard Pity (80) prioriza lendários. */
export function pickSummonedRooster<T extends SummonableRooster>(
  roosters: readonly T[],
  pity: number,
  seed: string | number,
): T | undefined {
  if (roosters.length === 0) return undefined;
  const legendaries = roosters.filter((r) => /lend|legend/i.test(r.rarity));
  const pool = pity >= 80 && legendaries.length > 0 ? legendaries : roosters;
  const index = fnv1a(`${seed}|${Math.max(0, Math.floor(pity))}`) % pool.length;
  return pool[index];
}
