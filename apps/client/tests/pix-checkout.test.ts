import { describe, expect, it } from 'vitest';
import { StoreController } from '../src/features/store/StoreController.js';
import { PIX_BUNDLES } from '../src/web/panels/PixCheckoutPanel.js';
import {
  buildPixEmvPayload,
  buildWoodcutQrSvg,
  crc16ccitt,
  pickSummonedRooster,
} from '../src/web/panels/pixPayload.js';

/** Lê os campos EMV de nível superior (ID + tamanho + valor). */
const parseEmv = (payload: string): Map<string, string> => {
  const fields = new Map<string, string>();
  let i = 0;
  while (i < payload.length) {
    const id = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    fields.set(id, payload.slice(i + 4, i + 4 + len));
    i += 4 + len;
  }
  return fields;
};

const ROOSTERS = [
  { number: 1, name: 'Galo de Lata', rarity: 'Comum' },
  { number: 2, name: 'Brisa do Rio', rarity: 'Raro' },
  { number: 3, name: 'Carcará Dourado', rarity: 'Lendário' },
  { number: 4, name: 'Mandacaru', rarity: 'Épico' },
];

describe('Checkout Pix Web (BR Code + QR xilogravura)', () => {
  it('calcula CRC16-CCITT pelo vetor conhecido', () => {
    expect(crc16ccitt('123456789')).toBe('29B1');
    expect(crc16ccitt('')).toBe('FFFF');
  });

  it('monta payload EMV válido com todos os campos', () => {
    const payload = buildPixEmvPayload({
      txId: 'BBPIX-TESTE-001',
      amountBrlCents: 8_990,
      merchantName: 'BeakBreaker Cordel',
      city: 'São Paulo',
    });
    expect(payload.startsWith('000201')).toBe(true);
    const fields = parseEmv(payload);
    expect(fields.get('00')).toBe('01');
    const account = parseEmv(fields.get('26')!);
    expect(account.get('00')).toBe('BR.GOV.BCB.PIX');
    expect(account.get('01')).toBeTruthy();
    expect(fields.get('52')).toBe('0000');
    expect(fields.get('53')).toBe('986');
    expect(fields.get('54')).toBe('89.90');
    expect(fields.get('58')).toBe('BR');
    expect(fields.get('59')).toBe('BEAKBREAKER CORDEL');
    expect(fields.get('60')).toBe('SAO PAULO');
    expect(parseEmv(fields.get('62')!).get('05')).toBe('BBPIXTESTE001');
    const crc = fields.get('63')!;
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
    expect(crc16ccitt(payload.slice(0, -4))).toBe(crc);
  });

  it('gera SVG decorativo determinístico com 3 quadrados localizadores', () => {
    const payload = buildPixEmvPayload({
      txId: 'A1',
      amountBrlCents: 2_990,
      merchantName: 'X',
      city: 'Recife',
    });
    const svgA = buildWoodcutQrSvg(payload);
    expect(svgA).toBe(buildWoodcutQrSvg(payload));
    expect(svgA).not.toBe(buildWoodcutQrSvg(`${payload}0`));
    expect(svgA.startsWith('<svg')).toBe(true);
    expect(svgA).toContain('#1B1B1B');
    expect(svgA).toContain('#F5E9D3');
    expect(svgA.match(/width="7" height="7"/g)).toHaveLength(3);
  });

  it('escolhe a ave invocada de forma determinística na Chocadeira', () => {
    const a = pickSummonedRooster(ROOSTERS, 37, 'chocadeira');
    expect(a).toBeDefined();
    expect(pickSummonedRooster(ROOSTERS, 37, 'chocadeira')).toBe(a);
    expect(pickSummonedRooster(ROOSTERS, 80, 'chocadeira')?.rarity).toBe('Lendário');
    expect(pickSummonedRooster([], 10, 'x')).toBeUndefined();
  });

  it('valida pacotes Pix (+15% Coroas) e limite mensal ECA Digital', () => {
    expect(PIX_BUNDLES).toHaveLength(2);
    const mestre = PIX_BUNDLES.find((b) => b.id === 'mestre')!;
    const cordel = PIX_BUNDLES.find((b) => b.id === 'cordel')!;
    expect(cordel.totalCoroas).toBe(345);
    expect(mestre.totalCoroas).toBe(1_150);

    const store = new StoreController();
    store.setMonthlyLimitBrlCents(5_000); // R$ 50,00
    const resCordel = store.purchaseCoroasPackage('tx_1', cordel.name, cordel.amountBrlCents, cordel.baseCoroas, true);
    expect(resCordel.ok).toBe(true);
    expect(resCordel.record?.coroasGranted).toBe(345);

    // Tentativa de compra do Baú Mestre (R$ 89,90) ultrapassa o limite restante
    const resMestre = store.purchaseCoroasPackage('tx_2', mestre.name, mestre.amountBrlCents, mestre.baseCoroas, true);
    expect(resMestre.ok).toBe(false);
    expect(resMestre.reason).toBe('ECA_DIGITAL_MONTHLY_LIMIT_EXCEEDED');
  });
});
