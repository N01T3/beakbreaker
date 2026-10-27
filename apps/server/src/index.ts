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
import {
  buildFastifyApp,
  buildFastifyServer,
  createServerContainer,
  ensureDefaultPlayer,
  registerApiRoutes,
  type ServerContainer,
} from './routes/apiRoutes.js';
import { SocketHub } from './ws/SocketHub.js';

export interface ServerContext extends ServerContainer {
  app: FastifyInstance;
}

export async function buildServer(): Promise<ServerContext> {
  const app = Fastify({ logger: false });
  const container = createServerContainer();

  app.get('/health', async () => ({ status: 'ok', version: '5.0.0' }));

  await registerAuth18PlusRoutes(app, container.ecaService);
  await registerFarmRoutes(app, container.farmService);
  await registerBattleRoutes(app, container.battleService);
  await registerGachaRoutes(app, container.gachaService);
  await registerClanRoutes(app, container.clanService);
  await registerBillingRoutes(app, container.billingService);
  await registerApiRoutes(app, container);

  return {
    app,
    ...container,
  };
}

export {
  buildFastifyApp,
  buildFastifyServer,
  createServerContainer,
  ensureDefaultPlayer,
  registerApiRoutes,
  type ServerContainer,
};

export * from './db/schema.js';
export * from './jobs/LiveOpsWorkers.js';
export * from './locks/RedlockManager.js';
export * from './locks/RevengeGuard.js';
export * from './modules/auth-18plus.js';
export * from './modules/battle.js';
export * from './modules/billing.js';
export * from './modules/clan.js';
export * from './modules/clan-tech-market.js';
export * from './modules/farm.js';
export * from './modules/gacha.js';
export * from './modules/store-monetization.js';
export * from './routes/storeRoutes.js';
export * from './server.js';
export * from './ws/SocketHub.js';
