import type { FarmDefenseState, InMemoryDatabase, Player, RevengeLog } from '../db/schema.js';
import type { InMemoryRedisStore } from './RedlockManager.js';

export const REVENGE_PAIR_TTL_SECONDS = 259_200; // 72h exact
export const DEFENDER_SHIELD_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
export const MAX_LOOT_EXCESS_RATIO = 0.2; // 20% above Barn protection
export const SYSTEM_REVENGE_BONUS_RATIO = 0.5; // +50% system bonus on Revenge

export interface RaidWaveResult {
  wave1RuralDefensesCleared: boolean;
  wave2GuardianTrioCleared: boolean;
}

export interface LootExecutionResult {
  log: RevengeLog;
  stolenCorn: number;
  defenderShieldUntilMs: number;
  redisPairKey: string;
  ttlSeconds: number;
}

export interface RevengeExecutionResult {
  log: RevengeLog;
  recoveredCorn: number;
  systemBonusCorn: number;
  totalAwardedCorn: number;
  canCounterRevenge: false;
  redisPairKey: string;
  ttlSeconds: number;
}

export class RevengeGuard {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly redis: InMemoryRedisStore
  ) {}

  static pairKey(idA: string, idB: string): string {
    const [minId, maxId] = [idA, idB].sort();
    return `revenge:pair:${minId}:${maxId}`;
  }

  /**
   * Regra C: Bloqueio imediato por mesmo IP hash ou mesmo deviceFingerprint
   * Regra B: Bloqueio de 72h (259.200s) se a chave revenge:pair:{minId}:{maxId} estiver ativa
   */
  assertAntiCollusion(attacker: Player, defender: Player, nowMs = Date.now()): string {
    if (attacker.id === defender.id) {
      throw new Error('COLLUSION_BLOCKED:SELF_ATTACK');
    }
    if (
      attacker.lastIpHash === defender.lastIpHash ||
      attacker.deviceFingerprint === defender.deviceFingerprint
    ) {
      throw new Error('COLLUSION_BLOCKED');
    }
    const key = RevengeGuard.pairKey(attacker.id, defender.id);
    const activePairState = this.redis.get(key, nowMs);
    if (activePairState !== null) {
      throw new Error('PAIR_COOLDOWN_72H_ACTIVE');
    }
    return key;
  }

  /**
   * Executa o Saque de Fazenda em 2 Ondas:
   * - Onda 1: 4 defesas rurais (Cerca de Mandacaru, Estilingue de Sabugo, Espantalho Assombrado, Cata-Vento de Alerta)
   * - Onda 2: Trio Guardião
   * - Rouba até 20% do Milho excedente (acima da faixa protegida pelo Celeiro)
   * - Ativa Escudo de 8h no defensor
   */
  executeTwoWaveLoot(
    attacker: Player,
    defender: Player,
    defenses: FarmDefenseState,
    waves: RaidWaveResult,
    lockPairImmediately = false,
    nowMs = Date.now()
  ): LootExecutionResult {
    const redisPairKey = this.assertAntiCollusion(attacker, defender, nowMs);

    if (defender.shieldActiveUntil > nowMs) {
      throw new Error('DEFENDER_SHIELD_ACTIVE');
    }

    if (!waves.wave1RuralDefensesCleared || !waves.wave2GuardianTrioCleared) {
      throw new Error('TWO_WAVE_DEFENSE_HELD');
    }

    const totalDefenseLevels =
      defenses.cercaMandacaruLevel +
      defenses.estilingueSabugoLevel +
      defenses.espantalhoAssombradoLevel +
      defenses.cataVentoAlertaLevel;

    const excessCorn = Math.max(0, defender.corn - defender.barnProtectedCorn);
    const rawLoot = Math.floor(excessCorn * MAX_LOOT_EXCESS_RATIO);
    // Cata-Vento e defesas rurais nunca permitem ultrapassar o teto de 20%
    const stolenCorn = Math.max(0, rawLoot - Math.min(0, totalDefenseLevels));

    defender.corn -= stolenCorn;
    attacker.corn += stolenCorn;
    defender.shieldActiveUntil = nowMs + DEFENDER_SHIELD_DURATION_MS;

    const logId = `loot_${attacker.id}_${defender.id}_${nowMs}`;
    const log: RevengeLog = {
      id: logId,
      attackerId: attacker.id,
      defenderId: defender.id,
      stolenCorn,
      isRevenge: false,
      canCounterRevenge: true,
      revengeClaimed: false,
      timestampMs: nowMs,
    };
    this.db.revengeLogs.set(logId, log);

    if (lockPairImmediately) {
      this.redis.setEx(redisPairKey, logId, REVENGE_PAIR_TTL_SECONDS, nowMs);
    }

    return {
      log,
      stolenCorn,
      defenderShieldUntilMs: defender.shieldActiveUntil,
      redisPairKey,
      ttlSeconds: REVENGE_PAIR_TTL_SECONDS,
    };
  }

  /**
   * Executa a Revanche Anticonluio (Módulo 2.2):
   * - Regra A: isRevenge = true NUNCA gera botão de contra-revanche (canCounterRevenge = false)
   * - Regra B: Grava chave Redis revenge:pair:{minId}:{maxId} com TTL exato de 259.200s (72h)
   * - Regra C: Verifica IP e deviceFingerprint antes de permitir a revanche
   * - Prêmio: 100% do Milho roubado recuperado + 50% de bônus gerado pelo sistema
   */
  executeRevenge(
    originalLogId: string,
    revengePlayer: Player,
    originalAttacker: Player,
    nowMs = Date.now()
  ): RevengeExecutionResult {
    const originalLog = this.db.revengeLogs.get(originalLogId);
    if (!originalLog) {
      throw new Error('REVENGE_LOG_NOT_FOUND');
    }
    if (originalLog.isRevenge || !originalLog.canCounterRevenge) {
      throw new Error('COUNTER_REVENGE_FORBIDDEN_RULE_A');
    }
    if (originalLog.revengeClaimed) {
      throw new Error('REVENGE_ALREADY_CLAIMED');
    }
    if (originalLog.defenderId !== revengePlayer.id || originalLog.attackerId !== originalAttacker.id) {
      throw new Error('INVALID_REVENGE_PARTICIPANTS');
    }

    const redisPairKey = this.assertAntiCollusion(revengePlayer, originalAttacker, nowMs);

    const recoveredCorn = originalLog.stolenCorn;
    const systemBonusCorn = Math.floor(recoveredCorn * SYSTEM_REVENGE_BONUS_RATIO);
    const totalAwardedCorn = recoveredCorn + systemBonusCorn;

    originalAttacker.corn = Math.max(0, originalAttacker.corn - recoveredCorn);
    revengePlayer.corn += totalAwardedCorn;
    originalLog.revengeClaimed = true;
    originalLog.canCounterRevenge = false;

    const revengeLogId = `rev_${revengePlayer.id}_${originalAttacker.id}_${nowMs}`;
    const revengeLog: RevengeLog = {
      id: revengeLogId,
      attackerId: revengePlayer.id,
      defenderId: originalAttacker.id,
      stolenCorn: recoveredCorn,
      isRevenge: true,
      canCounterRevenge: false, // Regra A: NUNCA gera contra-revanche
      revengeClaimed: true,
      timestampMs: nowMs,
    };
    this.db.revengeLogs.set(revengeLogId, revengeLog);

    // Regra B: Trava o par no Redis por exatamente 72 horas (259.200 segundos)
    this.redis.setEx(redisPairKey, revengeLogId, REVENGE_PAIR_TTL_SECONDS, nowMs);

    return {
      log: revengeLog,
      recoveredCorn,
      systemBonusCorn,
      totalAwardedCorn,
      canCounterRevenge: false,
      redisPairKey,
      ttlSeconds: this.redis.ttlSeconds(redisPairKey, nowMs),
    };
  }
}
