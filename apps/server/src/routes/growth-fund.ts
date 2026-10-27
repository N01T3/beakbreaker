import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { InMemoryDatabase } from '../db/schema.js';
import { GrowthFundService } from '../modules/monetization/GrowthFundService.js';
import { ensureDefaultPlayer, type ServerContainer } from './apiRoutes.js';

export async function registerGrowthFundRoutes(
  app: FastifyInstance,
  containerOrOpts?: ServerContainer | { db?: InMemoryDatabase; growthFundService?: GrowthFundService }
): Promise<void> {
  const db =
    containerOrOpts && 'db' in containerOrOpts && containerOrOpts.db
      ? containerOrOpts.db
      : new InMemoryDatabase();

  const service =
    containerOrOpts && 'growthFundService' in containerOrOpts && containerOrOpts.growthFundService
      ? containerOrOpts.growthFundService
      : new GrowthFundService(db);

  app.get('/api/store/growth-fund', async (req: FastifyRequest, reply: FastifyReply) => {
    const query = req.query as { playerId?: string };
    const playerId = query?.playerId;
    if (!playerId) return reply.status(400).send({ error: 'PLAYER_ID_REQUIRED' });

    ensureDefaultPlayer(db, playerId);
    try {
      const progress = service.getFundProgress(playerId);
      return reply.status(200).send({ success: true, ...progress });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post('/api/store/growth-fund/claim', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as {
      playerId?: string;
      sedeLevel?: number;
      track?: 'free' | 'premium' | 'all';
    }) ?? {};

    if (!body.playerId) return reply.status(400).send({ error: 'PLAYER_ID_REQUIRED' });
    if (typeof body.sedeLevel !== 'number') {
      return reply.status(400).send({ error: 'SEDE_LEVEL_REQUIRED' });
    }

    ensureDefaultPlayer(db, body.playerId);
    try {
      const res = service.claimReward(body.playerId, body.sedeLevel, body.track ?? 'all');
      return reply.status(200).send(res);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post('/api/store/growth-fund/unlock-premium', async (req: FastifyRequest, reply: FastifyReply) => {
    const body = (req.body as { playerId?: string; paymentConfirmed?: boolean }) ?? {};
    if (!body.playerId) return reply.status(400).send({ error: 'PLAYER_ID_REQUIRED' });

    ensureDefaultPlayer(db, body.playerId);
    try {
      const res = service.unlockPremium(body.playerId, body.paymentConfirmed ?? true);
      return reply.status(200).send(res);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });
}
