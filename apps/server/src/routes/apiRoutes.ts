import Fastify, { type FastifyInstance } from 'fastify';
import { InMemoryDatabase, type Player } from '../db/schema.js';
import { LiveOpsWorkers } from '../jobs/LiveOpsWorkers.js';
import { InMemoryRedisStore, RedlockManager } from '../locks/RedlockManager.js';
import { RevengeGuard } from '../locks/RevengeGuard.js';
import { EcaComplianceService } from '../modules/auth-18plus.js';
import { BattleService } from '../modules/battle.js';
import { BillingService } from '../modules/billing.js';
import { ClanAndWarService } from '../modules/clan.js';
import { FarmService } from '../modules/farm.js';
import { GachaAndGeneticsService } from '../modules/gacha.js';
import { SocketHub } from '../ws/SocketHub.js';
import { registerStoreRoutes } from './storeRoutes.js';

export interface ServerContainer {
  db: InMemoryDatabase;
  redis: InMemoryRedisStore;
  locks: RedlockManager;
  revengeGuard: RevengeGuard;
  ecaService: EcaComplianceService;
  farmService: FarmService;
  battleService: BattleService;
  gachaService: GachaAndGeneticsService;
  clanService: ClanAndWarService;
  billingService: BillingService;
  socketHub: SocketHub;
  liveOps: LiveOpsWorkers;
  auth18Plus: {
    verifyAgeGate: EcaComplianceService['verifyAge18Plus'];
    deleteAccountImmediatelyLgpd: EcaComplianceService['deletePersonalDataLgpd'];
  };
  farm: { harvestPerch: FarmService['harvestPerchLazy'] };
  battle: { executePveBattle: BattleService['runCampaignStage'] };
  gacha: { pullChocadeira: GachaAndGeneticsService['pullChocadeira'] };
  billing: { handlePixWebhook: BillingService['processPixWebhook'] };
}

export function createServerContainer(db = new InMemoryDatabase()): ServerContainer {
  const redis = new InMemoryRedisStore();
  const locks = new RedlockManager(redis);
  const revengeGuard = new RevengeGuard(db, redis);
  const ecaService = new EcaComplianceService(db);
  const farmService = new FarmService(db, locks);
  const battleService = new BattleService(db);
  const gachaService = new GachaAndGeneticsService(db, locks);
  const clanService = new ClanAndWarService(db, locks);
  const billingService = new BillingService(db, locks, ecaService);
  const socketHub = new SocketHub(db);
  const liveOps = new LiveOpsWorkers(db);

  return {
    db, redis, locks, revengeGuard, ecaService, farmService,
    battleService, gachaService, clanService, billingService, socketHub, liveOps,
    auth18Plus: {
      verifyAgeGate: (input, nowMs) => ecaService.verifyAge18Plus(input, nowMs),
      deleteAccountImmediatelyLgpd: (playerId, nowMs) => ecaService.deletePersonalDataLgpd(playerId, nowMs),
    },
    farm: {
      harvestPerch: (playerId, perchId, nowMs) => farmService.harvestPerchLazy(playerId, perchId, nowMs),
    },
    battle: {
      executePveBattle: (playerId, stage, starsEarned, isSweep) =>
        battleService.runCampaignStage(playerId, stage, starsEarned, isSweep),
    },
    gacha: {
      pullChocadeira: (playerId, bannerId, featuredSpeciesId, rngRoll, fiftyFiftyRoll, nowMs) =>
        gachaService.pullChocadeira(playerId, bannerId, featuredSpeciesId, rngRoll, fiftyFiftyRoll, nowMs),
    },
    billing: {
      handlePixWebhook: (payload, nowMs) => billingService.processPixWebhook(payload, nowMs),
    },
  };
}

export function ensureDefaultPlayer(db: InMemoryDatabase, playerId: string): Player {
  const existing = db.players.get(playerId);
  if (existing) return existing;
  const created: Player = {
    id: playerId, displayName: `Criador_${playerId}`, uf: 'PE', accountLevel: 30, sedeLevel: 8,
    corn: 50_000, barnProtectedCorn: 10_000, goldenFeathers: 1_600, crowns: 0, trophies: 1_200,
    stamina: 60, pityCounter: 0, guaranteedFeaturedNext: false, wildOrbs: 200, astralEssences: 5,
    piggyBankFeathers: 0, farmerCardActiveUntil: 0, orbClubActiveUntil: 0, shieldActiveUntil: 0,
    vipLevel: 0, totalSpentBrl: 0, lastIpHash: `ip_${playerId}`, deviceFingerprint: `fp_${playerId}`,
    clanId: null, towerProgressFloor: 0, campaignStars: {}, lapidarySlots: 1, primordialGems: {},
    lastLapidaryClaimMs: 0, towerCooldowns: {}, activeBuffs: {},
  };
  db.players.set(playerId, created);
  return created;
}

export async function registerApiRoutes(
  app: FastifyInstance,
  container: ServerContainer = createServerContainer()
): Promise<void> {
  app.get('/api/health', async () => ({
    status: 'ok', version: '5.0.0', engine: 'deterministic-20tps',
  }));

  app.post('/api/auth/verify-18plus', async (req, reply) => {
    try {
      const body = req.body as {
        playerId: string; birthDateIso: string; documentHash?: string; acceptZeroCashOutPolicy?: boolean;
      };
      ensureDefaultPlayer(container.db, body.playerId);
      return container.auth18Plus.verifyAgeGate({
        playerId: body.playerId,
        birthDateIso: body.birthDateIso,
        documentHash: body.documentHash ?? 'DOC_HASH_VERIFIED_18PLUS',
        acceptZeroCashOutPolicy: body.acceptZeroCashOutPolicy ?? true,
      });
    } catch (err) {
      return reply.status(403).send({ error: (err as Error).message });
    }
  });

  app.post('/api/farm/harvest', async (req, reply) => {
    try {
      const body = req.body as { playerId: string; perchId: string; nowMs?: number };
      const harvested = await container.farm.harvestPerch(body.playerId, body.perchId, body.nowMs);
      return { playerId: body.playerId, perchId: body.perchId, harvested };
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post('/api/battle/pve', async (req, reply) => {
    try {
      const b = req.body as { playerId: string; stage?: number; starsEarned?: 1 | 2 | 3; isSweep?: boolean };
      ensureDefaultPlayer(container.db, b.playerId);
      return container.battle.executePveBattle(b.playerId, b.stage ?? 1, b.starsEarned ?? 3, b.isSweep ?? false);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post('/api/gacha/pull', async (req, reply) => {
    try {
      const b = req.body as {
        playerId: string; bannerId?: string; featuredSpeciesId?: string;
        rngRoll?: number; fiftyFiftyRoll?: number; nowMs?: number;
      };
      ensureDefaultPlayer(container.db, b.playerId);
      return await container.gacha.pullChocadeira(
        b.playerId, b.bannerId ?? 'banner_trovao', b.featuredSpeciesId ?? '#18 Trovão do Sertão',
        b.rngRoll ?? 0.5, b.fiftyFiftyRoll ?? 0.5, b.nowMs
      );
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post('/api/billing/pix-webhook', async (req, reply) => {
    try {
      const b = req.body as { txid: string; playerId: string; packageId: string; nowMs?: number };
      ensureDefaultPlayer(container.db, b.playerId);
      return await container.billing.handlePixWebhook(
        { txid: b.txid, playerId: b.playerId, packageId: b.packageId }, b.nowMs
      );
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.delete('/api/lgpd/account/:playerId', async (req) => {
    const { playerId } = req.params as { playerId: string };
    ensureDefaultPlayer(container.db, playerId);
    return { ...container.auth18Plus.deleteAccountImmediatelyLgpd(playerId), playerId };
  });

  await registerStoreRoutes(app, container);
}

export async function buildFastifyServer(
  container: ServerContainer = createServerContainer()
): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  await registerApiRoutes(app, container);
  return app;
}

export const buildFastifyApp = buildFastifyServer;
