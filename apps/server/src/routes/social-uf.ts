import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { BrazilianStateUFSchema, type BrazilianStateUF, InMemoryDatabase } from '../db/schema.js';
import { ensureDefaultPlayer, type ServerContainer } from './apiRoutes.js';

const UF_LIST = BrazilianStateUFSchema.options;
const UF_NAMES: Record<BrazilianStateUF, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão',
  MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará',
  PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima',
  SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

const BASELINE_POINTS: Record<string, number> = {
  PE: 12500, CE: 11800, BA: 11200, SP: 10900, MG: 9800, PB: 9500, RN: 8700,
  RJ: 8500, AL: 8100, SE: 7900, MA: 7600, PI: 7400, PR: 6900, RS: 6800,
};

const farmVisitsStorage = new Map<string, number>();

export async function registerSocialUfRoutes(
  app: FastifyInstance,
  containerOrOpts?: ServerContainer | { db?: InMemoryDatabase }
): Promise<void> {
  const db =
    containerOrOpts && 'db' in containerOrOpts && containerOrOpts.db
      ? containerOrOpts.db
      : new InMemoryDatabase();

  app.get('/api/social/uf-ranking', async (req: FastifyRequest, reply: FastifyReply) => {
    const { uf } = (req.query as { uf?: BrazilianStateUF }) ?? {};
    const stateMap = new Map<BrazilianStateUF, { trophies: number; players: any[] }>();

    for (const stateUf of UF_LIST) {
      stateMap.set(stateUf, { trophies: BASELINE_POINTS[stateUf] ?? 5000, players: [] });
    }

    for (const p of db.players.values()) {
      const entry = stateMap.get(p.uf);
      if (entry) {
        entry.trophies += p.trophies;
        entry.players.push({
          id: p.id, playerId: p.id, displayName: p.displayName, trophies: p.trophies,
          accountLevel: p.accountLevel, sedeLevel: p.sedeLevel, uf: p.uf,
        });
      }
    }

    const states = UF_LIST.map((stateUf) => {
      const entry = stateMap.get(stateUf)!;
      entry.players.sort((a, b) => b.trophies - a.trophies);
      return {
        uf: stateUf, name: UF_NAMES[stateUf], totalTrophies: entry.trophies,
        playerCount: entry.players.length,
      };
    }).sort((a, b) => b.totalTrophies - a.totalTrophies).map((s, idx) => ({ rank: idx + 1, ...s }));

    const topPlayersByUf: Record<string, any[]> = {};
    for (const stateUf of UF_LIST) {
      if (!uf || uf === stateUf) {
        topPlayersByUf[stateUf] = (stateMap.get(stateUf)?.players || []).slice(0, 5);
      }
    }

    return reply.status(200).send({
      success: true, seasonId: 'temporada_sertao_1', seasonDaysRemaining: 14,
      totalStates: 27, states, topPlayersByUf,
    });
  });

  app.get('/api/social/profile/:userId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { userId } = req.params as { userId: string };
    if (!userId) return reply.status(400).send({ error: 'USER_ID_REQUIRED' });

    const p = ensureDefaultPlayer(db, userId);
    let title = 'Retirante Valente';
    if (p.trophies >= 2800) title = 'Supremo Sertão';
    else if (p.trophies >= 1800) title = 'Lenda do Terreiro';
    else if (p.trophies >= 1200) title = 'Coronel do Cariri';
    else if (p.trophies >= 600) title = 'Capataz da Caatinga';

    const ownedRoosters = Array.from(db.roosters.values()).filter((r) => r.ownerId === p.id);
    let showcase: any[];

    if (ownedRoosters.length >= 3) {
      showcase = ownedRoosters.slice(0, 3).map((r) => ({
        id: r.id, speciesId: r.speciesId, rarity: r.rarity, primaryElement: r.primaryElement,
        tacticalClass: r.tacticalClass, ng: r.ng, stars: r.stars, power: r.ng * 60 + r.stars * 150,
      }));
    } else {
      showcase = [
        { id: `showcase_${userId}_1`, speciesId: '#18 Trovão do Sertão', rarity: 'Lendário', primaryElement: 'Raio', tacticalClass: 'Atirador', ng: 45, stars: 4, power: 3300 },
        { id: `showcase_${userId}_2`, speciesId: '#11 Galo Cangaceiro', rarity: 'Épico', primaryElement: 'Fogo', tacticalClass: 'Assassino', ng: 40, stars: 3, power: 2850 },
        { id: `showcase_${userId}_3`, speciesId: '#01 Galo de Campina', rarity: 'Raro', primaryElement: 'Vento', tacticalClass: 'Bruiser', ng: 35, stars: 2, power: 2400 },
      ];
    }

    const totalTrioPower = showcase.reduce((acc, r) => acc + (r.power || 0), 0);
    const decorationPrestige = p.sedeLevel * 120 + 80;

    return reply.status(200).send({
      success: true,
      profile: {
        userId: p.id, playerId: p.id, displayName: p.displayName, uf: p.uf,
        accountLevel: p.accountLevel, sedeLevel: p.sedeLevel, trophies: p.trophies,
        clanId: p.clanId, clanName: p.clanId ? (db.clans.get(p.clanId)?.name ?? null) : null,
        title, activeTitle: title, frame: 'Moldura de Cordel Dourada', activeFrame: 'Moldura de Cordel Dourada',
        decorationPrestige, totalTrioPower, showcaseRoosters: showcase, favoriteRoosters: showcase,
      },
    });
  });

  app.post('/api/social/visit-farm/:targetId', async (req: FastifyRequest, reply: FastifyReply) => {
    const { targetId } = req.params as { targetId: string };
    const { visitorId, nowMs } = (req.body as { visitorId?: string; nowMs?: number }) ?? {};

    if (!visitorId) return reply.status(400).send({ error: 'VISITOR_ID_REQUIRED' });
    if (visitorId === targetId) return reply.status(400).send({ error: 'CANNOT_VISIT_SELF' });

    const visitor = ensureDefaultPlayer(db, visitorId);
    const target = ensureDefaultPlayer(db, targetId);

    const now = nowMs ?? Date.now();
    const DAY_MS = 86_400_000;
    const visitKey = `${visitorId}:${targetId}`;
    const lastVisit = farmVisitsStorage.get(visitKey) ?? 0;

    if (now - lastVisit < DAY_MS) {
      return reply.status(200).send({
        success: true, targetId, bonusClaimed: false,
        message: 'VISIT_RECORDED_BONUS_ALREADY_CLAIMED',
        cooldownRemainingMs: DAY_MS - (now - lastVisit),
      });
    }

    farmVisitsStorage.set(visitKey, now);
    visitor.corn += 5_000;
    visitor.goldenFeathers += 20;

    return reply.status(200).send({
      success: true, targetId, visitorId, bonusClaimed: true,
      rewards: { corn: 5_000, goldenFeathers: 20 },
      collectedCorn: 5_000, collectedFeathers: 20,
      farmPrestige: target.sedeLevel * 120 + 80,
      updatedBalances: { corn: visitor.corn, goldenFeathers: visitor.goldenFeathers },
    });
  });
}
