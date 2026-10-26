import type { FastifyInstance } from 'fastify';
import type { InMemoryDatabase, PixOrder } from '../db/schema.js';
import { RedlockManager } from '../locks/RedlockManager.js';
import { EcaComplianceService } from './auth-18plus.js';

export interface CommercialProductSpec {
  id: string;
  name: string;
  priceBrl: number;
  baseCrowns: number;
  goldenFeathers: number;
  wildOrbs: number;
  description: string;
}

export const COMMERCIAL_LADDER_CATALOG: Record<string, CommercialProductSpec> = {
  STARTER_PACK: {
    id: 'STARTER_PACK', name: 'Pacote Iniciante do Arraial', priceBrl: 9.9,
    baseCrowns: 300, goldenFeathers: 1_600, wildOrbs: 0,
    description: '#11 Galo Cangaceiro (Épico) + 10 Tiros + 300 Coroas + Poleiro Nv. 2',
  },
  PIGGY_BANK_GOLD: {
    id: 'PIGGY_BANK_GOLD', name: 'Cofre do Galo de Ouro', priceBrl: 14.9,
    baseCrowns: 0, goldenFeathers: 1_200, wildOrbs: 0,
    description: 'Quebra o cofre acumulando +25 Penas/vitória até 1.200 Penas Douradas',
  },
  DIVINE_PASS_BASE: {
    id: 'DIVINE_PASS_BASE', name: 'Passe Divino 40 Níveis (Base)', priceBrl: 29.9,
    baseCrowns: 600, goldenFeathers: 400, wildOrbs: 320,
    description: 'Galo VIP no Nv 1 + 320 Orbes + Altar de Orbes Divinos por 28 dias',
  },
  DIVINE_PASS_ELITE: {
    id: 'DIVINE_PASS_ELITE', name: 'Passe Divino 40 Níveis (Elite)', priceBrl: 59.9,
    baseCrowns: 1_200, goldenFeathers: 800, wildOrbs: 760,
    description: '+15 níveis imediatos, 760 Orbes do Galo VIP (3★) e Visual Lendário',
  },
  FARMER_CARD: {
    id: 'FARMER_CARD', name: 'Cartão do Fazendeiro (Mensal)', priceBrl: 14.9,
    baseCrowns: 300, goldenFeathers: 3_000, wildOrbs: 0,
    description: '100 Penas/dia, Velocidade x3, Colher Tudo e +20% produção nos Poleiros',
  },
  ORB_CLUB: {
    id: 'ORB_CLUB', name: 'Clube de Orbes (Mensal)', priceBrl: 24.9,
    baseCrowns: 500, goldenFeathers: 0, wildOrbs: 300,
    description: '10 Orbes Curinga por dia durante 30 dias',
  },
  FLASH_PITY_OFFER: {
    id: 'FLASH_PITY_OFFER', name: 'Oferta Relâmpago de Pity (20 Tiros)', priceBrl: 34.9,
    baseCrowns: 400, goldenFeathers: 3_200, wildOrbs: 0,
    description: 'Disparada entre os tiros 58 e 65 da Chocadeira (timer de 2h)',
  },
  HERO_RACE_SKIP_PACK: {
    id: 'HERO_RACE_SKIP_PACK', name: 'Pacote Pulo da Corrida de Heróis', priceBrl: 19.9,
    baseCrowns: 500, goldenFeathers: 0, wildOrbs: 50,
    description: 'Itens de Nó + Giros da Roleta nas últimas 48h da Corrida',
  },
  HAPPY_HOUR_COMBO: {
    id: 'HAPPY_HOUR_COMBO', name: 'Combo Happy Hour de Orbes Curinga', priceBrl: 49.9,
    baseCrowns: 1_000, goldenFeathers: 0, wildOrbs: 200,
    description: 'Orbes Curinga + Essências Astrais (Quarta e Sexta-feira)',
  },
  PERK_GEM_CHEST: {
    id: 'PERK_GEM_CHEST', name: 'Baú de Joia da Fênix & Ceifador', priceBrl: 69.9,
    baseCrowns: 1_400, goldenFeathers: 500, wildOrbs: 0,
    description: '1 Joia da Fênix garantida + 1 Joia do Ceifador + 500 Penas Douradas',
  },
  SEDE_GROWTH_FUND: {
    id: 'SEDE_GROWTH_FUND', name: 'Fundo de Crescimento da Sede', priceBrl: 44.9,
    baseCrowns: 900, goldenFeathers: 6_500, wildOrbs: 0,
    description: 'Entrega 6.500 Penas Douradas escalonadas da Sede 2 à Sede 12',
  },
  WEB_PIX_CROWNS_1000: {
    id: 'WEB_PIX_CROWNS_1000', name: 'Pacote 1.000 Coroas (Loja Web Pix +15%)', priceBrl: 29.9,
    baseCrowns: 1_000, goldenFeathers: 0, wildOrbs: 0,
    description: 'Pacote oficial de Coroas com +15% de bônus via Pix',
  },
};

export const VIP_THRESHOLDS_BRL: number[] = [
  0, 15, 45, 100, 200, 350, 550, 800, 1_100, 1_500, 2_000, 2_600, 3_300, 4_100, 5_000,
];

export class BillingService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly locks: RedlockManager,
    private readonly ecaService: EcaComplianceService
  ) {}

  calculateVipLevel(totalSpentBrl: number): number {
    let level = 0;
    for (let i = 1; i < VIP_THRESHOLDS_BRL.length; i++) {
      if (totalSpentBrl >= VIP_THRESHOLDS_BRL[i]) level = i;
    }
    return level;
  }

  /**
   * Processa Webhook Pix Idempotente (+15% de Coroas sobre o pacote base):
   * - Verifica chave única txid (rejeita duplicatas de forma idempotente).
   * - Respeita a verificação 18+ e o limite mensal de gastos do ECA Digital.
   */
  async processPixWebhook(
    payload: { txid: string; playerId: string; packageId: string },
    nowMs = Date.now()
  ): Promise<{ order: PixOrder; idempotentDuplicate: boolean }> {
    return this.locks.withLock(
      RedlockManager.pixLockKey(payload.txid),
      () => {
        const existingOrder = this.db.pixOrders.get(payload.txid);
        if (existingOrder && existingOrder.status === 'PAID') {
          return { order: existingOrder, idempotentDuplicate: true };
        }
        const player = this.db.players.get(payload.playerId);
        if (!player) throw new Error('PLAYER_NOT_FOUND');
        const product = COMMERCIAL_LADDER_CATALOG[payload.packageId];
        if (!product) throw new Error('PRODUCT_NOT_FOUND');

        this.ecaService.assertAndRecordSpendBrl(player.id, product.priceBrl, nowMs);

        const baseCrowns = product.baseCrowns;
        const bonusCrowns15Pct = Math.floor(baseCrowns * 0.15);
        const totalCrownsCredited = baseCrowns + bonusCrowns15Pct;

        player.crowns += totalCrownsCredited;
        player.goldenFeathers += product.goldenFeathers;
        player.wildOrbs += product.wildOrbs;
        player.totalSpentBrl = Number((player.totalSpentBrl + product.priceBrl).toFixed(2));
        player.vipLevel = this.calculateVipLevel(player.totalSpentBrl);

        if (payload.packageId === 'FARMER_CARD') {
          player.farmerCardActiveUntil = Math.max(nowMs, player.farmerCardActiveUntil) + 30 * 86_400_000;
        } else if (payload.packageId === 'ORB_CLUB') {
          player.orbClubActiveUntil = Math.max(nowMs, player.orbClubActiveUntil) + 30 * 86_400_000;
        }

        const order: PixOrder = {
          txid: payload.txid,
          playerId: player.id,
          packageId: product.id,
          amountBrl: product.priceBrl,
          baseCrowns,
          bonusCrowns15Pct,
          totalCrownsCredited,
          status: 'PAID',
          createdAtMs: existingOrder?.createdAtMs ?? nowMs,
          processedAtMs: nowMs,
        };
        this.db.pixOrders.set(payload.txid, order);
        return { order, idempotentDuplicate: false };
      },
      10,
      nowMs
    );
  }
}

export async function registerBillingRoutes(app: FastifyInstance, service: BillingService): Promise<void> {
  app.get('/billing/catalog', async () => ({ catalog: Object.values(COMMERCIAL_LADDER_CATALOG) }));
  app.post('/billing/pix/webhook', async (req, reply) => {
    try {
      return await service.processPixWebhook(req.body as { txid: string; playerId: string; packageId: string });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
}
