import Fastify, { type FastifyInstance } from 'fastify';
import { InMemoryDatabase } from './db/schema.js';
import { LiveOpsWorkers } from './jobs/LiveOpsWorkers.js';
import { InMemoryRedisStore, RedlockManager } from './locks/RedlockManager.js';
import { RevengeGuard } from './locks/RevengeGuard.js';
import { EcaComplianceService, registerAuth18PlusRoutes } from './modules/auth-18plus.js';
import { BattleService, registerBattleRoutes } from './modules/battle.js';
import { BillingService, registerBillingRoutes } from './modules/billing.js';
import { ClanAndWarService, registerClanRoutes } from './modules/clan.js';
import { FarmService, registerFarmRoutes } from './modules/farm.js';
import { GachaAndGeneticsService, registerGachaRoutes } from './modules/gacha.js';
import { SocketHub } from './ws/SocketHub.js';

export interface ServerContext {
  app: FastifyInstance;
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
}

export async function buildServer(): Promise<ServerContext> {
  const app = Fastify({ logger: false });
  const db = new InMemoryDatabase();
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

  app.get('/health', async () => ({ status: 'ok', version: '5.0.0' }));

  await registerAuth18PlusRoutes(app, ecaService);
  await registerFarmRoutes(app, farmService);
  await registerBattleRoutes(app, battleService);
  await registerGachaRoutes(app, gachaService);
  await registerClanRoutes(app, clanService);
  await registerBillingRoutes(app, billingService);

  return {
    app,
    db,
    redis,
    locks,
    revengeGuard,
    ecaService,
    farmService,
    battleService,
    gachaService,
    clanService,
    billingService,
    socketHub,
    liveOps,
  };
}

export * from './db/schema.js';
export * from './jobs/LiveOpsWorkers.js';
export * from './locks/RedlockManager.js';
export * from './locks/RevengeGuard.js';
export * from './modules/auth-18plus.js';
export * from './modules/battle.js';
export * from './modules/billing.js';
export * from './modules/clan.js';
export * from './modules/farm.js';
export * from './modules/gacha.js';
export * from './ws/SocketHub.js';
