import type { CombatUnit, SlotIndex } from '../entities/CombatUnit.js';
import { SeededPRNG } from '../math/SeededPRNG.js';

export type RoomType = 'ENTRADA' | 'BAU_TESOURO' | 'EMBOSCADA_CANGACEIROS' | 'ALTAR_CURA' | 'SALA_VAZIA' | 'MINOTAURO_GUARDAO';
export interface TreasureReward { resource: 'milho' | 'penas' | 'orbes'; amount: number; }
export interface LabyrinthRoom {
  x: number; y: number; type: RoomType; revealed: boolean; visited: boolean;
  cleared: boolean; connections: string[]; treasureReward?: TreasureReward;
}
export interface LabyrinthEncounter {
  type: RoomType; reward?: TreasureReward; enemies?: CombatUnit[]; boss?: CombatUnit; folegoRestored?: number; cleared?: boolean;
}
export interface LabyrinthMap {
  seed: number; size: number; grid: LabyrinthRoom[][]; rooms: LabyrinthRoom[];
  currentX: number; currentY: number; folegoCostPerStep: number;
  bauDeOuroLiberado: boolean; cycleReset: boolean; semanalCycle: number;
}
export interface StepResult {
  success: boolean; reason?: 'COORDENADAS_INVALIDAS' | 'SALAS_NAO_CONECTADAS' | 'FOLEGO_INSUFICIENTE';
  folegoRemaining: number; folegoConsumed: number; currentRoom: LabyrinthRoom;
  revealedRooms: LabyrinthRoom[]; encounter?: LabyrinthEncounter;
}
export interface MinotauroVictoryResult {
  bauDeOuroDoArraial: { milho: number; penas: number; orbesCuringa: number; trofeu: string };
  cycleReset: boolean; semanalCycleNumber: number;
}

const DELTAS: readonly [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

export function createCangaceiroTrio(seed = 1): CombatUnit[] {
  const prng = new SeededPRNG(seed);
  const roles = [
    { n: 'Cangaceiro Vigia', row: 'Frente' as const, s: 0 as SlotIndex, c: 'Bruiser' as const },
    { n: 'Cangaceiro Atirador', row: 'Tras' as const, s: 1 as SlotIndex, c: 'Atirador' as const },
    { n: 'Cangaceiro Batedor', row: 'Frente' as const, s: 2 as SlotIndex, c: 'Bruiser' as const },
  ];
  return roles.map((r, i) => ({
    id: `cangaceiro_${seed}_${i}`, specId: 'cangaceiro_bando', name: r.n, team: 'B', slotIndex: r.s,
    row: r.row, roosterClass: r.c, primaryElement: 'Sol', maxVigor: 1200 + prng.nextPercent() * 5, currentVigor: 1200,
    forca: 140, defesa: 70, velocidade: 95 + i * 5, tecnica: 15, garra: 50, esquiva: 5, canto: 0,
    nextAttackTick: 1, castWindupRemainingTicks: 0, fenixUsed: false, reaperBlockedRevive: false,
    firstHitDone: false, stunImmuneTicks: 0, torcidaTicksRemaining: 0, synergyDamageVsControlledPermille: 0,
    isRaidBoss: false, raidDifficulty: 1, colossoFuriaStacks: 0, activeStatuses: [],
    specialAbility: {
      name: 'Emboscada do Sertão', multiplierPermille: 1100, targetScope: 'CurrentTarget', hitCount: 1,
      effectDurationTicks: 0, shieldPermille: 0, healPermille: 0, cantoBonus: 0, cleanseDebuffs: false,
      ignoreDefensePermille: 0, ignoreShield: false, description: 'Golpe em bando.',
    },
  }));
}

export function createMinotauroBoss(id = 'minotauro_guardiao'): CombatUnit {
  return {
    id, specId: 'minotauro_guardiao', name: 'Minotauro Guardião', team: 'B', slotIndex: 0, row: 'Frente',
    roosterClass: 'Tanque', primaryElement: 'Armorial', maxVigor: 18000, currentVigor: 18000, forca: 600, defesa: 350,
    velocidade: 85, tecnica: 20, garra: 100, esquiva: 0, canto: 0, nextAttackTick: 1, castWindupRemainingTicks: 0,
    fenixUsed: false, reaperBlockedRevive: false, firstHitDone: false, stunImmuneTicks: 9999, torcidaTicksRemaining: 0,
    synergyDamageVsControlledPermille: 0, isRaidBoss: true, raidDifficulty: 3, colossoFuriaStacks: 0, activeStatuses: [],
    specialAbility: {
      name: 'Fúria do Labirinto', multiplierPermille: 1800, targetScope: 'AllEnemies', hitCount: 1,
      effectDurationTicks: 0, shieldPermille: 0, healPermille: 0, cantoBonus: 0, cleanseDebuffs: true,
      ignoreDefensePermille: 150, ignoreShield: false, description: 'Impacto dos chifres míticos.',
    },
  };
}

export function generateLabyrinth(seed: number, size = 3): LabyrinthMap {
  const s = Math.max(3, Math.min(8, Math.floor(size)));
  const prng = new SeededPRNG(seed);
  const pool: RoomType[] = [];
  const baseTypes: RoomType[] = ['BAU_TESOURO', 'EMBOSCADA_CANGACEIROS', 'ALTAR_CURA', 'SALA_VAZIA'];
  while (pool.length < s * s - 2) pool.push(baseTypes[pool.length % baseTypes.length]!);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = prng.pickIndex(i + 1);
    const tmp = pool[i]!; pool[i] = pool[j]!; pool[j] = tmp;
  }
  const grid: LabyrinthRoom[][] = [], rooms: LabyrinthRoom[] = [];
  let pIdx = 0;
  for (let y = 0; y < s; y++) {
    grid[y] = [];
    for (let x = 0; x < s; x++) {
      const type: RoomType = (x === 0 && y === 0) ? 'ENTRADA' : (x === s - 1 && y === s - 1) ? 'MINOTAURO_GUARDAO' : pool[pIdx++]!;
      let treasureReward: TreasureReward | undefined;
      if (type === 'BAU_TESOURO') {
        const res = (['milho', 'penas', 'orbes'] as const)[prng.pickIndex(3)]!;
        const amt = res === 'milho' ? 500 + prng.nextPercent() * 10 : res === 'penas' ? 50 + prng.nextPercent() : 5 + Math.floor(prng.nextPercent() / 10);
        treasureReward = { resource: res, amount: amt };
      }
      const room: LabyrinthRoom = {
        x, y, type, revealed: x === 0 && y === 0, visited: x === 0 && y === 0,
        cleared: x === 0 && y === 0, connections: [], treasureReward,
      };
      grid[y]![x] = room; rooms.push(room);
    }
  }
  for (const r of rooms) {
    for (const [dx, dy] of DELTAS) {
      const nx = r.x + dx, ny = r.y + dy;
      if (nx >= 0 && nx < s && ny >= 0 && ny < s) r.connections.push(`${nx},${ny}`);
    }
  }
  for (const conn of grid[0]![0]!.connections) {
    const [cx, cy] = conn.split(',').map(Number);
    if (grid[cy!]?.[cx!]) grid[cy!]![cx!]!.revealed = true;
  }
  return { seed, size: s, grid, rooms, currentX: 0, currentY: 0, folegoCostPerStep: 2, bauDeOuroLiberado: false, cycleReset: false, semanalCycle: 1 };
}

export function stepIntoRoom(
  map: LabyrinthMap, currentX: number, currentY: number, targetX: number, targetY: number, availableFolego: number,
): StepResult {
  const cur = map.grid[currentY]?.[currentX], tgt = map.grid[targetY]?.[targetX];
  if (!cur || !tgt) return { success: false, reason: 'COORDENADAS_INVALIDAS', folegoRemaining: availableFolego, folegoConsumed: 0, currentRoom: cur ?? map.grid[0]![0]!, revealedRooms: [] };
  if (!cur.connections.includes(`${targetX},${targetY}`)) return { success: false, reason: 'SALAS_NAO_CONECTADAS', folegoRemaining: availableFolego, folegoConsumed: 0, currentRoom: cur, revealedRooms: [] };
  const cost = map.folegoCostPerStep;
  if (availableFolego < cost) return { success: false, reason: 'FOLEGO_INSUFICIENTE', folegoRemaining: availableFolego, folegoConsumed: 0, currentRoom: cur, revealedRooms: [] };

  map.currentX = targetX; map.currentY = targetY;
  let remFolego = availableFolego - cost;
  tgt.visited = true; tgt.revealed = true;
  const revealedRooms: LabyrinthRoom[] = [];
  for (const [dx, dy] of DELTAS) {
    const n = map.grid[targetY + dy]?.[targetX + dx];
    if (n && !n.revealed) { n.revealed = true; revealedRooms.push(n); }
  }

  let encounter: LabyrinthEncounter;
  if (tgt.cleared) encounter = { type: tgt.type, cleared: true };
  else if (tgt.type === 'BAU_TESOURO') { encounter = { type: 'BAU_TESOURO', reward: tgt.treasureReward }; tgt.cleared = true; }
  else if (tgt.type === 'ALTAR_CURA') { encounter = { type: 'ALTAR_CURA', folegoRestored: 4 }; remFolego += 4; tgt.cleared = true; }
  else if (tgt.type === 'EMBOSCADA_CANGACEIROS') encounter = { type: 'EMBOSCADA_CANGACEIROS', enemies: createCangaceiroTrio(map.seed + targetX * 10 + targetY) };
  else if (tgt.type === 'MINOTAURO_GUARDAO') encounter = { type: 'MINOTAURO_GUARDAO', boss: createMinotauroBoss() };
  else { encounter = { type: tgt.type, cleared: true }; tgt.cleared = true; }

  return { success: true, folegoRemaining: remFolego, folegoConsumed: cost, currentRoom: tgt, revealedRooms, encounter };
}

export function resolveMinotauroVictory(map: LabyrinthMap): MinotauroVictoryResult {
  map.bauDeOuroLiberado = true; map.cycleReset = true; map.semanalCycle += 1;
  const exit = map.grid[map.size - 1]?.[map.size - 1];
  if (exit) exit.cleared = true;
  return {
    bauDeOuroDoArraial: { milho: 5000, penas: 500, orbesCuringa: 25, trofeu: 'Baú de Ouro do Arraial' },
    cycleReset: true, semanalCycleNumber: map.semanalCycle,
  };
}

export class LabyrinthDungeonEngine {
  public static readonly FOLEGO_PER_STEP = 2;
  public static generateLabyrinth = generateLabyrinth;
  public static stepIntoRoom = stepIntoRoom;
  public static resolveMinotauroVictory = resolveMinotauroVictory;
  public static createCangaceiroTrio = createCangaceiroTrio;
  public static createMinotauroBoss = createMinotauroBoss;
}
