import { describe, expect, it } from 'vitest';
import {
  LabyrinthDungeonEngine,
  generateLabyrinth,
  resolveMinotauroVictory,
  stepIntoRoom,
} from '../src/index.js';

describe('LabyrinthDungeonEngine - Labirinto de São João', () => {
  it('gera labirinto determinístico com a mesma seed', () => {
    const map1 = generateLabyrinth(42, 3);
    const map2 = generateLabyrinth(42, 3);
    const mapDiff = generateLabyrinth(999, 3);

    expect(map1.size).toBe(3);
    expect(map1.rooms).toHaveLength(9);
    expect(map1.grid[0]![0]!.type).toBe('ENTRADA');
    expect(map1.grid[2]![2]!.type).toBe('MINOTAURO_GUARDAO');

    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        expect(map1.grid[y]![x]!.type).toBe(map2.grid[y]![x]!.type);
        expect(map1.grid[y]![x]!.treasureReward).toEqual(map2.grid[y]![x]!.treasureReward);
      }
    }

    const diffTypes = map1.rooms.some((r, i) => r.type !== mapDiff.rooms[i]!.type);
    expect(diffTypes).toBe(true);
  });

  it('suporta grade customizada 4x4 com dimensões corretas', () => {
    const map = generateLabyrinth(12345, 4);
    expect(map.size).toBe(4);
    expect(map.rooms).toHaveLength(16);
    expect(map.grid[0]![0]!.type).toBe('ENTRADA');
    expect(map.grid[3]![3]!.type).toBe('MINOTAURO_GUARDAO');
  });

  it('valida conectividade das salas e rejeita saltos não conectados ou inválidos', () => {
    const map = generateLabyrinth(100, 3);
    const entrance = map.grid[0]![0]!;
    expect(entrance.connections).toContain('1,0');
    expect(entrance.connections).toContain('0,1');
    expect(entrance.connections).not.toContain('1,1');

    const diagMove = stepIntoRoom(map, 0, 0, 1, 1, 10);
    expect(diagMove.success).toBe(false);
    expect(diagMove.reason).toBe('SALAS_NAO_CONECTADAS');

    const invalidMove = stepIntoRoom(map, 0, 0, -1, 0, 10);
    expect(invalidMove.success).toBe(false);
    expect(invalidMove.reason).toBe('COORDENADAS_INVALIDAS');
  });

  it('consome exatamente 2 de fôlego por passo e bloqueia se fôlego insuficiente', () => {
    const map = generateLabyrinth(777, 3);

    const res1 = stepIntoRoom(map, 0, 0, 1, 0, 6);
    expect(res1.success).toBe(true);
    expect(res1.folegoConsumed).toBe(LabyrinthDungeonEngine.FOLEGO_PER_STEP);
    expect(res1.folegoConsumed).toBe(2);

    const resFalta = stepIntoRoom(map, 1, 0, 2, 0, 1);
    expect(resFalta.success).toBe(false);
    expect(resFalta.reason).toBe('FOLEGO_INSUFICIENTE');
    expect(resFalta.folegoRemaining).toBe(1);
  });

  it('revela salas e remove névoa de guerra ao avançar', () => {
    const map = generateLabyrinth(555, 3);
    expect(map.grid[0]![0]!.revealed).toBe(true);
    expect(map.grid[1]![0]!.revealed).toBe(true);
    expect(map.grid[0]![1]!.revealed).toBe(true);
    expect(map.grid[2]![2]!.revealed).toBe(false);

    const res = stepIntoRoom(map, 0, 0, 1, 0, 10);
    expect(res.success).toBe(true);
    expect(res.currentRoom.revealed).toBe(true);
    expect(res.currentRoom.visited).toBe(true);

    expect(map.grid[0]![2]!.revealed).toBe(true);
  });

  it('gerencia encontros de Baú de Tesouro, Emboscada e Altar de Cura', () => {
    const map = generateLabyrinth(888, 3);
    const chestRoom = map.rooms.find((r) => r.type === 'BAU_TESOURO')!;
    chestRoom.connections.push('0,0');
    map.grid[0]![0]!.connections.push(`${chestRoom.x},${chestRoom.y}`);

    const resChest = stepIntoRoom(map, 0, 0, chestRoom.x, chestRoom.y, 10);
    expect(resChest.success).toBe(true);
    expect(resChest.encounter?.type).toBe('BAU_TESOURO');
    expect(['milho', 'penas', 'orbes']).toContain(resChest.encounter?.reward?.resource);
    expect(resChest.encounter?.reward?.amount).toBeGreaterThan(0);

    const ambRoom = map.rooms.find((r) => r.type === 'EMBOSCADA_CANGACEIROS')!;
    ambRoom.cleared = false;
    ambRoom.connections.push(`${chestRoom.x},${chestRoom.y}`);
    chestRoom.connections.push(`${ambRoom.x},${ambRoom.y}`);

    const resAmb = stepIntoRoom(map, chestRoom.x, chestRoom.y, ambRoom.x, ambRoom.y, 10);
    expect(resAmb.success).toBe(true);
    expect(resAmb.encounter?.type).toBe('EMBOSCADA_CANGACEIROS');
    expect(resAmb.encounter?.enemies).toHaveLength(3);
    expect(resAmb.encounter?.enemies?.[0]!.team).toBe('B');

    const altarRoom = map.rooms.find((r) => r.type === 'ALTAR_CURA')!;
    altarRoom.cleared = false;
    altarRoom.connections.push(`${ambRoom.x},${ambRoom.y}`);
    ambRoom.connections.push(`${altarRoom.x},${altarRoom.y}`);

    const resAltar = stepIntoRoom(map, ambRoom.x, ambRoom.y, altarRoom.x, altarRoom.y, 6);
    expect(resAltar.success).toBe(true);
    expect(resAltar.encounter?.type).toBe('ALTAR_CURA');
    expect(resAltar.folegoRemaining).toBe(8);
  });

  it('encontra e derrota o Minotauro Guardião liberando Baú de Ouro e reiniciando ciclo semanal', () => {
    const map = generateLabyrinth(999, 3);
    const minotaurRoom = map.grid[2]![2]!;
    minotaurRoom.connections.push('0,0');
    map.grid[0]![0]!.connections.push('2,2');

    const res = stepIntoRoom(map, 0, 0, 2, 2, 10);
    expect(res.success).toBe(true);
    expect(res.encounter?.type).toBe('MINOTAURO_GUARDAO');
    expect(res.encounter?.boss?.isRaidBoss).toBe(true);
    expect(res.encounter?.boss?.name).toContain('Minotauro Guardião');

    const victory = resolveMinotauroVictory(map);
    expect(victory.cycleReset).toBe(true);
    expect(map.cycleReset).toBe(true);
    expect(map.bauDeOuroLiberado).toBe(true);
    expect(victory.semanalCycleNumber).toBe(2);
    expect(victory.bauDeOuroDoArraial.trofeu).toBe('Baú de Ouro do Arraial');
    expect(victory.bauDeOuroDoArraial.milho).toBeGreaterThan(0);
    expect(victory.bauDeOuroDoArraial.penas).toBeGreaterThan(0);
    expect(victory.bauDeOuroDoArraial.orbesCuringa).toBeGreaterThan(0);
    expect(minotaurRoom.cleared).toBe(true);
  });
});
