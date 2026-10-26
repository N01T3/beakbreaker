import type { FastifyInstance } from 'fastify';
import type { Clan, InMemoryDatabase, RaidBossState, TerritoryWarMap } from '../db/schema.js';
import { RedlockManager } from '../locks/RedlockManager.js';

export const CLAN_CAPACITY_BY_LEVEL: Record<number, number> = {
  1: 20, 2: 22, 3: 24, 4: 26, 5: 28, 6: 30, 7: 30, 8: 30, 9: 30, 10: 30,
};

export const COLOSSO_RAID_VIGOR_BY_DIFFICULTY: Record<number, number> = {
  1: 20_000_000,
  2: 45_000_000,
  3: 90_000_000,
  4: 160_000_000,
  5: 280_000_000,
  6: 450_000_000,
  7: 680_000_000,
  8: 920_000_000,
  9: 1_150_000_000,
  10: 1_370_000_000, // 1,37 Bilhão de Vigor
};

export const MAX_WAR_ATTACKS_PER_ROOSTER = 2;
export const MAX_WAR_DEFENSES_PER_ROOSTER = 1;

export class ClanAndWarService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly locks: RedlockManager
  ) {}

  getMaxUnlockedRaidDifficulty(clanLevel: number): number {
    if (clanLevel >= 8) return 10;
    if (clanLevel >= 5) return 6;
    return 2;
  }

  /** Loja do Bando: Joia da Fênix Sertaneja liberada no Bando Nível 6+. */
  buyPhoenixGemFromClanShop(playerId: string, roosterId: string): { success: true } {
    const player = this.db.players.get(playerId);
    const rooster = this.db.roosters.get(roosterId);
    if (!player || !rooster || !player.clanId) throw new Error('CLAN_OR_ROOSTER_NOT_FOUND');
    const clan = this.db.clans.get(player.clanId);
    if (!clan || clan.level < 6) throw new Error('CLAN_LEVEL_6_REQUIRED_FOR_PHOENIX_GEM');
    if (clan.medals < 500) throw new Error('INSUFFICIENT_CLAN_MEDALS');
    clan.medals -= 500;
    if (!rooster.perks.includes('fenix')) rooster.perks.push('fenix');
    return { success: true };
  }

  /** Inicializa a Raid Semanal do Galo Colosso (10 dificuldades: 20M a 1,37B Vigor). */
  spawnColossoRaid(clan: Clan, difficulty: number): RaidBossState {
    const maxAllowed = this.getMaxUnlockedRaidDifficulty(clan.level);
    if (difficulty < 1 || difficulty > 10 || difficulty > maxAllowed) throw new Error('RAID_DIFFICULTY_LOCKED');
    const maxVigor = COLOSSO_RAID_VIGOR_BY_DIFFICULTY[difficulty];
    const boss: RaidBossState = {
      clanId: clan.id,
      difficulty,
      maxVigor,
      currentVigor: maxVigor,
      activePhase: 1,
      activeLineage: 'Brasa',
      stacksFuria: 0,
    };
    this.db.raidBosses.set(clan.id, boss);
    return boss;
  }

  /**
   * Aplica dano na Raid do Galo Colosso e resolve transição das 3 fases de Vigor (Pág. 22 do GDD):
   * - Fase 1 (100% a 67%): Brasa | Fase 2 (67% a 33%): Lua (50% reflect crit) | Fase 3 (33% a 0%): Fúria Armorial
   */
  async attackColossoRaid(
    clanId: string,
    damageDealt: number,
    isCritHit = false
  ): Promise<{ boss: RaidBossState; reflectedCritDamage: number; immuneToStunAndTaunt: boolean }> {
    return this.locks.withLock(RedlockManager.clanLockKey(clanId), () => {
      const boss = this.db.raidBosses.get(clanId);
      if (!boss) throw new Error('RAID_BOSS_NOT_FOUND');

      boss.currentVigor = Math.max(0, boss.currentVigor - Math.max(0, damageDealt));
      const vigorRatio = boss.currentVigor / boss.maxVigor;

      if (vigorRatio > 0.67) {
        boss.activePhase = 1;
        boss.activeLineage = 'Brasa';
      } else if (vigorRatio > 0.33) {
        boss.activePhase = 2;
        boss.activeLineage = 'Lua';
      } else {
        boss.activePhase = 3;
        boss.activeLineage = 'Fúria Armorial';
        boss.stacksFuria += 1;
      }

      const reflectedCritDamage = boss.activePhase === 2 && isCritHit ? Math.floor(damageDealt * 0.5) : 0;
      return { boss, reflectedCritDamage, immuneToStunAndTaunt: boss.activePhase === 3 };
    });
  }

  /** Cria o Mapa da Guerra de Territórios Quinzenal (48h): Sede (300), 4 Vilarejos (100), Forte (200) e Açude (300). */
  createDefaultWarMap(warId: string, clanAId: string, clanBId: string, nowMs = Date.now()): TerritoryWarMap {
    const map: TerritoryWarMap = {
      warId,
      clanAId,
      clanBId,
      roosterFatigue: {},
      endsAtMs: nowMs + 48 * 60 * 60 * 1000,
      nodes: {
        sede_a: { id: 'sede_a', name: 'Sede Bando A', type: 'Sede', points: 300, ownerClanId: clanAId, connectedNodeIds: ['vil_a1', 'vil_a2'] },
        vil_a1: { id: 'vil_a1', name: 'Vilarejo A1', type: 'Vilarejo', points: 100, ownerClanId: clanAId, connectedNodeIds: ['sede_a', 'vil_a3', 'forte_cangaco'] },
        vil_a2: { id: 'vil_a2', name: 'Vilarejo A2', type: 'Vilarejo', points: 100, ownerClanId: clanAId, connectedNodeIds: ['sede_a', 'vil_a4', 'acude_real'] },
        vil_a3: { id: 'vil_a3', name: 'Vilarejo A3', type: 'Vilarejo', points: 100, ownerClanId: clanAId, connectedNodeIds: ['vil_a1', 'forte_cangaco'] },
        vil_a4: { id: 'vil_a4', name: 'Vilarejo A4', type: 'Vilarejo', points: 100, ownerClanId: clanAId, connectedNodeIds: ['vil_a2', 'acude_real'] },
        forte_cangaco: { id: 'forte_cangaco', name: 'Forte do Cangaço', type: 'Forte do Cangaço', points: 200, ownerClanId: null, connectedNodeIds: ['vil_a1', 'vil_a3', 'vil_b1', 'vil_b3'] },
        acude_real: { id: 'acude_real', name: 'Açude Real', type: 'Açude Real', points: 300, ownerClanId: null, connectedNodeIds: ['vil_a2', 'vil_a4', 'vil_b2', 'vil_b4'] },
        vil_b1: { id: 'vil_b1', name: 'Vilarejo B1', type: 'Vilarejo', points: 100, ownerClanId: clanBId, connectedNodeIds: ['sede_b', 'vil_b3', 'forte_cangaco'] },
        vil_b2: { id: 'vil_b2', name: 'Vilarejo B2', type: 'Vilarejo', points: 100, ownerClanId: clanBId, connectedNodeIds: ['sede_b', 'vil_b4', 'acude_real'] },
        vil_b3: { id: 'vil_b3', name: 'Vilarejo B3', type: 'Vilarejo', points: 100, ownerClanId: clanBId, connectedNodeIds: ['vil_b1', 'forte_cangaco'] },
        vil_b4: { id: 'vil_b4', name: 'Vilarejo B4', type: 'Vilarejo', points: 100, ownerClanId: clanBId, connectedNodeIds: ['vil_b2', 'acude_real'] },
        sede_b: { id: 'sede_b', name: 'Sede Bando B', type: 'Sede', points: 300, ownerClanId: clanBId, connectedNodeIds: ['vil_b1', 'vil_b2'] },
      },
    };
    this.db.territoryWars.set(warId, map);
    return map;
  }

  /** Valida Adjacência por Estrada e Fadiga por Ave (máx 2 ataques e 1 defesa por Guerra). */
  attackTerritoryNode(
    warId: string,
    attackingClanId: string,
    targetNodeId: string,
    trioRoosterIds: [string, string, string]
  ): TerritoryWarMap {
    const war = this.db.territoryWars.get(warId);
    if (!war) throw new Error('WAR_NOT_FOUND');
    const targetNode = war.nodes[targetNodeId];
    if (!targetNode) throw new Error('TERRITORY_NODE_NOT_FOUND');
    if (targetNode.ownerClanId === attackingClanId) throw new Error('TERRITORY_ALREADY_CONTROLLED');

    const hasRoadAdjacency = targetNode.connectedNodeIds.some(
      (neighborId) => war.nodes[neighborId]?.ownerClanId === attackingClanId
    );
    if (!hasRoadAdjacency) throw new Error('TERRITORY_NOT_ADJACENT_BY_ROAD');

    for (const rId of trioRoosterIds) {
      const fatigue = war.roosterFatigue[rId] ?? { attacks: 0, defenses: 0 };
      if (fatigue.attacks >= MAX_WAR_ATTACKS_PER_ROOSTER) throw new Error(`ROOSTER_ATTACK_FATIGUE_MAX_2:${rId}`);
    }
    for (const rId of trioRoosterIds) {
      const fatigue = war.roosterFatigue[rId] ?? { attacks: 0, defenses: 0 };
      fatigue.attacks += 1;
      war.roosterFatigue[rId] = fatigue;
    }
    targetNode.ownerClanId = attackingClanId;
    return war;
  }

  assignTerritoryDefense(warId: string, clanId: string, nodeId: string, trioRoosterIds: [string, string, string]): void {
    const war = this.db.territoryWars.get(warId);
    if (!war) throw new Error('WAR_NOT_FOUND');
    const node = war.nodes[nodeId];
    if (!node || node.ownerClanId !== clanId) throw new Error('TERRITORY_NOT_OWNED_BY_CLAN');
    for (const rId of trioRoosterIds) {
      const fatigue = war.roosterFatigue[rId] ?? { attacks: 0, defenses: 0 };
      if (fatigue.defenses >= MAX_WAR_DEFENSES_PER_ROOSTER) throw new Error(`ROOSTER_DEFENSE_FATIGUE_MAX_1:${rId}`);
    }
    for (const rId of trioRoosterIds) {
      const fatigue = war.roosterFatigue[rId] ?? { attacks: 0, defenses: 0 };
      fatigue.defenses += 1;
      war.roosterFatigue[rId] = fatigue;
    }
  }
}

export async function registerClanRoutes(app: FastifyInstance, service: ClanAndWarService): Promise<void> {
  app.post('/clan/raid/attack', async (req) => {
    const b = req.body as { clanId: string; damageDealt: number; isCritHit?: boolean };
    return service.attackColossoRaid(b.clanId, b.damageDealt, b.isCritHit);
  });
}
