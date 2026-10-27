import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Player } from '../db/schema.js';
import { COMMERCIAL_LADDER_CATALOG, VIP_THRESHOLDS_BRL } from '../modules/billing.js';
import {
  createServerContainer,
  ensureDefaultPlayer,
  type ServerContainer,
} from './apiRoutes.js';

const vaultStorage = new Map<string, number>();
const farmerCardClaimStorage = new Map<string, number>();

export function getPlayerVault(playerId: string, player: Player): number {
  return (player as unknown as { goldenVaultCrowns?: number }).goldenVaultCrowns ?? vaultStorage.get(playerId) ?? 0;
}

export function setPlayerVault(playerId: string, player: Player, value: number): void {
  (player as unknown as { goldenVaultCrowns?: number }).goldenVaultCrowns = value;
  vaultStorage.set(playerId, value);
}

export function getFarmerClaim(playerId: string, player: Player): number {
  return (player as unknown as { lastFarmerClaimMs?: number }).lastFarmerClaimMs ?? farmerCardClaimStorage.get(playerId) ?? 0;
}

export function setFarmerClaim(playerId: string, player: Player, value: number): void {
  (player as unknown as { lastFarmerClaimMs?: number }).lastFarmerClaimMs = value;
  farmerCardClaimStorage.set(playerId, value);
}

export async function registerStoreRoutes(
  app: FastifyInstance,
  containerOrOpts?: ServerContainer | { container?: ServerContainer }
): Promise<void> {
  const container =
    containerOrOpts && 'db' in containerOrOpts
      ? containerOrOpts
      : containerOrOpts && 'container' in containerOrOpts && containerOrOpts.container
        ? containerOrOpts.container
        : createServerContainer();

  app.post('/api/store/golden-vault/accumulate', async (req: FastifyRequest, reply: FastifyReply) => {
    const { playerId, won } = (req.body as { playerId?: string; won?: boolean }) ?? {};
    if (!playerId) return reply.status(400).send({ error: 'PLAYER_ID_REQUIRED' });
    const player = ensureDefaultPlayer(container.db, playerId);
    const current = getPlayerVault(playerId, player);
    const accumulated = won ? Math.min(500, current + 10) : current;
    if (won) setPlayerVault(playerId, player, accumulated);
    return reply.status(200).send({
      success: true, playerId, won: Boolean(won), accumulated, maxCapacity: 500, isFull: accumulated >= 500,
    });
  });

  app.post('/api/store/golden-vault/smash', async (req: FastifyRequest, reply: FastifyReply) => {
    const { playerId, paymentConfirmed } = (req.body as { playerId?: string; paymentConfirmed?: boolean }) ?? {};
    if (!playerId) return reply.status(400).send({ error: 'PLAYER_ID_REQUIRED' });
    const player = ensureDefaultPlayer(container.db, playerId);
    const accumulated = getPlayerVault(playerId, player);
    if (accumulated < 500) return reply.status(400).send({ error: 'VAULT_NOT_FULL', accumulated, target: 500 });
    if (!paymentConfirmed) return reply.status(400).send({ error: 'PAYMENT_NOT_CONFIRMED' });

    player.crowns += accumulated;
    setPlayerVault(playerId, player, 0);
    return reply.status(200).send({
      success: true, playerId, creditedCrowns: accumulated, totalCrowns: player.crowns, vaultReset: 0,
    });
  });

  app.post('/api/store/farmer-card/claim-daily', async (req: FastifyRequest, reply: FastifyReply) => {
    const { playerId, nowMs } = (req.body as { playerId?: string; nowMs?: number }) ?? {};
    if (!playerId) return reply.status(400).send({ error: 'PLAYER_ID_REQUIRED' });
    const player = ensureDefaultPlayer(container.db, playerId);
    const now = nowMs ?? Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    if (player.farmerCardActiveUntil <= now) {
      return reply.status(400).send({ error: 'FARMER_CARD_NOT_ACTIVE' });
    }
    const lastClaim = getFarmerClaim(playerId, player);
    if (lastClaim > 0 && now - lastClaim < DAY_MS) {
      return reply.status(400).send({
        error: 'DAILY_REWARD_ALREADY_CLAIMED',
        cooldownRemainingMs: DAY_MS - (now - lastClaim),
      });
    }

    player.goldenFeathers += 100;
    setFarmerClaim(playerId, player, now);
    return reply.status(200).send({
      success: true, playerId, claimedFeathers: 100, goldenFeathers: player.goldenFeathers, nextClaimAvailableMs: now + DAY_MS,
    });
  });

  app.get('/api/store/vip-status/:playerId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { playerId } = (req.params as { playerId: string }) ?? {};
    const player = ensureDefaultPlayer(container.db, playerId);
    let vipLevel = 0;
    for (let i = 1; i < VIP_THRESHOLDS_BRL.length; i++) {
      if (player.totalSpentBrl >= VIP_THRESHOLDS_BRL[i]) vipLevel = i;
    }
    player.vipLevel = vipLevel;
    const nextTierPoints =
      vipLevel >= VIP_THRESHOLDS_BRL.length - 1
        ? VIP_THRESHOLDS_BRL[VIP_THRESHOLDS_BRL.length - 1]
        : VIP_THRESHOLDS_BRL[vipLevel + 1];

    return reply.status(200).send({
      vipLevel, totalSpentBrl: player.totalSpentBrl, vipPoints: player.totalSpentBrl, nextTierPoints,
    });
  });

  app.get('/api/store/flash-offer/:playerId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { playerId } = (req.params as { playerId: string }) ?? {};
    const player = ensureDefaultPlayer(container.db, playerId);
    const pityEligible = player.pityCounter >= 58 && player.pityCounter <= 65;
    const feathersEligible = player.goldenFeathers < 160;
    const eligible = pityEligible && feathersEligible;

    return reply.status(200).send({
      playerId: player.id,
      eligible,
      pityCounter: player.pityCounter,
      goldenFeathers: player.goldenFeathers,
      offer: eligible
        ? {
            id: COMMERCIAL_LADDER_CATALOG.FLASH_PITY_OFFER.id,
            name: COMMERCIAL_LADDER_CATALOG.FLASH_PITY_OFFER.name,
            priceBrl: COMMERCIAL_LADDER_CATALOG.FLASH_PITY_OFFER.priceBrl,
            pulls: 20,
            timerSeconds: 7200,
          }
        : null,
    });
  });
}
