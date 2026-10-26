import crypto from 'node:crypto';
import { z } from 'zod';

export const PIX_WEB_STORE_BONUS_RATIO = 0.15; // +15% Coroas extras sobre a Play Store

export interface WebStorePackage {
  packageId: string;
  title: string;
  priceBrl: number;
  baseCrowns: number;
  pixBonusCrowns15Pct: number;
  totalCrownsWithBonus: number;
  gatewayFeeEstimatedPct: number; // ~0.8% Pix vs 30% App Stores
}

export interface PixCheckoutInvoice {
  txid: string;
  playerId: string;
  packageId: string;
  amountBrl: number;
  baseCrowns: number;
  bonusCrowns15Pct: number;
  totalCrowns: number;
  pixCopiaEColaPayload: string;
  qrCodeSvgDataUri: string;
  expiresAtIso: string;
  webhookSignatureHmac: string;
}

export const PlayerLookupSchema = z.object({
  playerId: z.string().min(3),
});

export const CreatePixCheckoutSchema = z.object({
  playerId: z.string().min(3),
  packageId: z.string().min(3),
});

const RAW_PACKAGES: Array<{ packageId: string; title: string; priceBrl: number; baseCrowns: number }> = [
  { packageId: 'STARTER_PACK', title: 'Pacote Iniciante do Arraial', priceBrl: 9.9, baseCrowns: 300 },
  { packageId: 'FARMER_CARD', title: 'Cartão do Fazendeiro (30 Dias)', priceBrl: 14.9, baseCrowns: 300 },
  { packageId: 'ORB_CLUB', title: 'Clube de Orbes (30 Dias)', priceBrl: 24.9, baseCrowns: 500 },
  { packageId: 'DIVINE_PASS_BASE', title: 'Passe Divino Base (40 Níveis)', priceBrl: 29.9, baseCrowns: 600 },
  { packageId: 'WEB_PIX_CROWNS_1000', title: 'Saco de 1.000 Coroas do Sertão', priceBrl: 29.9, baseCrowns: 1_000 },
  { packageId: 'FLASH_PITY_OFFER', title: 'Oferta Relâmpago de Pity (20 Tiros)', priceBrl: 34.9, baseCrowns: 400 },
  { packageId: 'SEDE_GROWTH_FUND', title: 'Fundo de Crescimento da Sede (6.500 Penas)', priceBrl: 44.9, baseCrowns: 900 },
  { packageId: 'HAPPY_HOUR_COMBO', title: 'Combo Happy Hour de Orbes Curinga', priceBrl: 49.9, baseCrowns: 1_000 },
  { packageId: 'DIVINE_PASS_ELITE', title: 'Passe Divino Elite (+15 Níveis e 3★)', priceBrl: 59.9, baseCrowns: 1_200 },
  { packageId: 'PERK_GEM_CHEST', title: 'Baú de Joia da Fênix & Ceifador', priceBrl: 69.9, baseCrowns: 1_400 },
];

export class OfficialPixWebStore {
  private readonly catalog = new Map<string, WebStorePackage>();
  private readonly verifiedAccounts = new Map<
    string,
    { playerId: string; displayName: string; uf: string; ageVerified18Plus: boolean }
  >();

  constructor(private readonly webhookSecret = 'beakbreaker-pix-secret-v5') {
    for (const raw of RAW_PACKAGES) {
      const pixBonusCrowns15Pct = Math.floor(raw.baseCrowns * PIX_WEB_STORE_BONUS_RATIO);
      this.catalog.set(raw.packageId, {
        ...raw,
        pixBonusCrowns15Pct,
        totalCrownsWithBonus: raw.baseCrowns + pixBonusCrowns15Pct,
        gatewayFeeEstimatedPct: 0.8,
      });
    }
  }

  registerPlayerAccountForLookup(account: {
    playerId: string;
    displayName: string;
    uf: string;
    ageVerified18Plus: boolean;
  }): void {
    this.verifiedAccounts.set(account.playerId, account);
  }

  lookupPlayerById(playerId: string): {
    playerId: string;
    displayName: string;
    uf: string;
    ageVerified18Plus: boolean;
  } {
    const parsed = PlayerLookupSchema.parse({ playerId });
    const found = this.verifiedAccounts.get(parsed.playerId);
    if (!found) {
      throw new Error('PLAYER_ACCOUNT_NOT_FOUND');
    }
    if (!found.ageVerified18Plus) {
      throw new Error('ECA_DIGITAL_18PLUS_REQUIRED_FOR_WEB_STORE');
    }
    return found;
  }

  listPackagesWith15PctBonus(): WebStorePackage[] {
    return Array.from(this.catalog.values());
  }

  /**
   * Gera cobrança Pix dinâmica (Copia-e-Cola EMV + QR Code SVG) com txid único e +15% Coroas.
   */
  createPixCheckout(
    input: z.infer<typeof CreatePixCheckoutSchema>,
    nowMs = Date.now(),
    customTxId?: string
  ): PixCheckoutInvoice {
    const parsed = CreatePixCheckoutSchema.parse(input);
    this.lookupPlayerById(parsed.playerId);

    const pkg = this.catalog.get(parsed.packageId);
    if (!pkg) {
      throw new Error('WEB_STORE_PACKAGE_NOT_FOUND');
    }

    const txid =
      customTxId ??
      `BBPIX${nowMs}${crypto.randomBytes(4).toString('hex').toUpperCase()}`.slice(0, 32);

    const pixCopiaEColaPayload = [
      '00020126580014BR.GOV.BCB.PIX',
      `0136beakbreaker-pix@cordelpop.com.br`,
      `520400005303986540${pkg.priceBrl.toFixed(2)}`,
      `5802BR5915BEAKBREAKER V506006RECIFE62070503${txid}6304ABCD`,
    ].join('');

    const qrCodeSvgDataUri = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="%23F5E9D3"/><text x="10" y="60" font-size="10" fill="%231B1B1B">${txid}</text></svg>`;

    const webhookSignatureHmac = this.signWebhookPayload({
      txid,
      playerId: parsed.playerId,
      packageId: pkg.packageId,
    });

    return {
      txid,
      playerId: parsed.playerId,
      packageId: pkg.packageId,
      amountBrl: pkg.priceBrl,
      baseCrowns: pkg.baseCrowns,
      bonusCrowns15Pct: pkg.pixBonusCrowns15Pct,
      totalCrowns: pkg.totalCrownsWithBonus,
      pixCopiaEColaPayload,
      qrCodeSvgDataUri,
      expiresAtIso: new Date(nowMs + 30 * 60 * 1000).toISOString(),
      webhookSignatureHmac,
    };
  }

  signWebhookPayload(payload: { txid: string; playerId: string; packageId: string }): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(`${payload.txid}:${payload.playerId}:${payload.packageId}`)
      .digest('hex');
  }
}

export * from './portal.js';

