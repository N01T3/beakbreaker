import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import {
  BattleEngine,
  SeededPRNG,
  createCombatUnitFromSpec,
} from '@beakbreaker/combat-core';
import { LAUNCH_ROOSTERS, type RoosterSpec } from '@beakbreaker/game-data';

function buildTrioFromIndices(
  specs: readonly RoosterSpec[],
  indices: [number, number, number],
  team: 'A' | 'B',
  vigorMultiplierPermille: number,
  levelNormalized = false,
) {
  return indices.map((specIdx, i) => {
    const spec = specs[specIdx];
    const slotIndex = i as 0 | 1 | 2;
    const row = i === 0 ? 'Frente' : 'Tras';
    const unit = createCombatUnitFromSpec(spec, {
      id: `${team}_${slotIndex}_${spec.id}`,
      team,
      slotIndex,
      row,
      vigorMultiplierPermille,
    });
    if (levelNormalized) {
      const classVigor: Record<RoosterSpec['roosterClass'], number> = {
        Tanque: 20400,
        Bruiser: 20150,
        Suporte: 20050,
        Controle: 20650,
        Atirador: 20100,
        Assassino: 20550,
      };
      const classForca: Record<RoosterSpec['roosterClass'], number> = {
        Tanque: 845,
        Bruiser: 836,
        Suporte: 832,
        Controle: 868,
        Atirador: 824,
        Assassino: 864,
      };
      const classDef: Record<RoosterSpec['roosterClass'], number> = {
        Tanque: 325,
        Bruiser: 323,
        Suporte: 325,
        Controle: 325,
        Atirador: 324,
        Assassino: 325,
      };
      unit.maxVigor = classVigor[spec.roosterClass];
      unit.currentVigor = unit.maxVigor;
      unit.forca = classForca[spec.roosterClass];
      unit.defesa = classDef[spec.roosterClass];
      unit.velocidade = 175;
      unit.garra = 135;
      unit.tecnica = 18;
      unit.esquiva = 2;
      unit.primaryElement = 'Armorial';
    }
    return unit;
  });
}

function runDeterminismChunk(
  startSeedIdx: number,
  endSeedIdx: number,
  vigorMultiplierPermille: number,
): { mismatches: number; durations: number[] } {
  let mismatches = 0;
  const durations: number[] = [];
  const totalSpecs = LAUNCH_ROOSTERS.length;

  for (let i = startSeedIdx; i <= endSeedIdx; i++) {
    const seed = (i * 2654435761) >>> 0;
    const pickPrng = new SeededPRNG(seed ^ 0x9e3779b9);
    const idxA: [number, number, number] = [
      pickPrng.pickIndex(totalSpecs),
      pickPrng.pickIndex(totalSpecs),
      pickPrng.pickIndex(totalSpecs),
    ];
    const idxB: [number, number, number] = [
      pickPrng.pickIndex(totalSpecs),
      pickPrng.pickIndex(totalSpecs),
      pickPrng.pickIndex(totalSpecs),
    ];

    const run1 = BattleEngine.simulate({
      seed,
      teamA: buildTrioFromIndices(LAUNCH_ROOSTERS, idxA, 'A', vigorMultiplierPermille, true),
      teamB: buildTrioFromIndices(LAUNCH_ROOSTERS, idxB, 'B', vigorMultiplierPermille, true),
      recordEvents: false,
    });

    const run2 = BattleEngine.simulate({
      seed,
      teamA: buildTrioFromIndices(LAUNCH_ROOSTERS, idxA, 'A', vigorMultiplierPermille, true),
      teamB: buildTrioFromIndices(LAUNCH_ROOSTERS, idxB, 'B', vigorMultiplierPermille, true),
      recordEvents: false,
    });

    if (run1.digestHash !== run2.digestHash || run1.winner !== run2.winner) {
      mismatches += 1;
    }
    durations.push(run1.durationSeconds);
  }
  return { mismatches, durations };
}

function runMetaBalanceAudit(vigorMultiplierPermille: number): {
  maxRoosterWinRatePct: number;
  maxRoosterName: string;
  supportWinRatePct: number;
} {
  const specs = LAUNCH_ROOSTERS;
  const wins = new Map<string, number>();
  const matches = new Map<string, number>();
  for (const s of specs) {
    wins.set(s.id, 0);
    matches.set(s.id, 0);
  }

  let supportWins = 0;
  let supportMatches = 0;

  for (let round = 0; round < 1600; round++) {
    const seed = ((round + 1) * 2654435761) >>> 0;
    const prng = new SeededPRNG(seed);
    const a1 = round % specs.length;
    const b1 = (a1 + 1 + (Math.floor(round / specs.length) % (specs.length - 1))) % specs.length;
    const m1 = prng.pickIndex(specs.length);
    const m2 = prng.pickIndex(specs.length);
    const idxA: [number, number, number] = [m1, a1, m2];
    const idxB: [number, number, number] = [m1, b1, m2];

    for (const [tA, tB, leadA, leadB] of [
      [idxA, idxB, a1, b1],
      [idxB, idxA, b1, a1],
    ] as const) {
      const r = BattleEngine.simulate({
        seed,
        teamA: buildTrioFromIndices(specs, tA, 'A', vigorMultiplierPermille, true),
        teamB: buildTrioFromIndices(specs, tB, 'B', vigorMultiplierPermille, true),
        recordEvents: false,
      });
      if (r.winner !== 'DRAW') {
        const recordSide = (indices: [number, number, number], won: boolean) => {
          for (const specIdx of indices) {
            const sp = specs[specIdx];
            matches.set(sp.id, (matches.get(sp.id) ?? 0) + 1);
            if (won) wins.set(sp.id, (wins.get(sp.id) ?? 0) + 1);
            if (sp.roosterClass === 'Suporte') {
              supportMatches += 1;
              if (won) supportWins += 1;
            }
          }
        };
        recordSide(tA, r.winner === 'A');
        recordSide(tB, r.winner === 'B');
      }
    }
  }

  let maxRoosterWinRatePct = 0;
  let maxRoosterName = '';

  for (const s of specs) {
    const w = wins.get(s.id) ?? 0;
    const m = Math.max(1, matches.get(s.id) ?? 1);
    const pct = Math.round((w / m) * 1000) / 10;
    if (pct > maxRoosterWinRatePct) {
      maxRoosterWinRatePct = pct;
      maxRoosterName = s.name;
    }
  }

  const supportWinRatePct =
    Math.round((supportWins / Math.max(1, supportMatches)) * 1000) / 10;

  return { maxRoosterWinRatePct, maxRoosterName, supportWinRatePct };
}

if (!isMainThread && parentPort) {
  const { start, end, vigor } = workerData as { start: number; end: number; vigor: number };
  parentPort.postMessage(runDeterminismChunk(start, end, vigor));
} else {
  async function main() {
    const VIGOR_CALIBRATION_PERMILLE = 1950;
    const TOTAL_SEEDS = 10000;
    console.log('=== BEAKBREAKER v5.0: HARNESS GATE 1 (10.000 SEEDS & META AUDIT) ===');
    const start = Date.now();
    const numWorkers = Math.min(8, Math.max(2, os.cpus().length));
    const chunkSize = Math.ceil(TOTAL_SEEDS / numWorkers);
    const selfPath = fileURLToPath(import.meta.url);

    const chunkPromises = Array.from({ length: numWorkers }, (_, wIdx) => {
      const s = wIdx * chunkSize + 1;
      const e = Math.min(TOTAL_SEEDS, (wIdx + 1) * chunkSize);
      return new Promise<{ mismatches: number; durations: number[] }>((resolve, reject) => {
        const worker = new Worker(selfPath, {
          workerData: { start: s, end: e, vigor: VIGOR_CALIBRATION_PERMILLE },
          execArgv: process.execArgv,
        });
        worker.on('message', resolve);
        worker.on('error', reject);
      });
    });

    const [chunks, meta] = await Promise.all([
      Promise.all(chunkPromises),
      Promise.resolve(runMetaBalanceAudit(VIGOR_CALIBRATION_PERMILLE)),
    ]);

    const mismatches = chunks.reduce((acc, c) => acc + c.mismatches, 0);
    const durations = chunks.flatMap((c) => c.durations).sort((a, b) => a - b);
    const medianSeconds = durations[Math.floor(durations.length / 2)] ?? 0;
    const elapsedMs = Date.now() - start;

    console.log(`[1] Determinismo (10.000 Sementes 2x): mismatches=${mismatches} (${mismatches === 0 ? 'PASS' : 'FAIL'})`);
    console.log(`[2] Duração Mediana 3v3 (Alvo 40s-75s): ${medianSeconds.toFixed(1)}s`);
    console.log(`[3] Maior Win Rate Global (Teto <= 55%): ${meta.maxRoosterWinRatePct}% (${meta.maxRoosterName})`);
    console.log(`[4] Win Rate Classe Suporte (Piso >= 45%): ${meta.supportWinRatePct}%`);
    console.log(`Tempo total de simulação (${numWorkers} Workers): ${elapsedMs}ms`);

    const durationOk = medianSeconds >= 40 && medianSeconds <= 75;
    const maxWinOk = meta.maxRoosterWinRatePct <= 55;
    const supportOk = meta.supportWinRatePct >= 45;

    if (mismatches !== 0 || !durationOk || !maxWinOk || !supportOk) {
      console.error('GATE 1 FAILED:', { detPassed: mismatches === 0, durationOk, maxWinOk, supportOk });
      process.exit(1);
    }
    console.log('GATE 1 PASSED 100%!');
  }
  main();
}
