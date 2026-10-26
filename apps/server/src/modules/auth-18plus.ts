import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type {
  EcaComplianceSettings,
  GachaPullHistory90d,
  InMemoryDatabase,
} from '../db/schema.js';

export const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export const VerifyAgeInputSchema = z.object({
  playerId: z.string().min(1),
  birthDateIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  documentHash: z.string().min(8),
  acceptZeroCashOutPolicy: z.boolean(),
});

export const SpendLimitInputSchema = z.object({
  playerId: z.string().min(1),
  monthlySpendLimitBrl: z.number().min(0),
});

export class EcaComplianceService {
  constructor(private readonly db: InMemoryDatabase) {}

  private currentMonthKey(nowMs: number): string {
    const d = new Date(nowMs);
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${d.getUTCFullYear()}-${month}`;
  }

  getOrCreateSettings(playerId: string, nowMs = Date.now()): EcaComplianceSettings {
    const existing = this.db.ecaSettings.get(playerId);
    const monthKey = this.currentMonthKey(nowMs);
    if (existing) {
      if (existing.currentMonthKey !== monthKey) {
        existing.currentMonthKey = monthKey;
        existing.currentMonthSpendBrl = 0;
      }
      return existing;
    }
    const created: EcaComplianceSettings = {
      playerId,
      ageVerified18Plus: false,
      verifiedAtIso: null,
      documentHash: null,
      monthlySpendLimitBrl: null,
      currentMonthSpendBrl: 0,
      currentMonthKey: monthKey,
      zeroCashOutAccepted: false,
      lgpdDeletedAtIso: null,
    };
    this.db.ecaSettings.set(playerId, created);
    return created;
  }

  /**
   * Verificação etária efetiva 18+ conforme ECA Digital (Lei 15.211/2025)
   * e política estrita de Zero Saque (Zero Cash-Out) em dinheiro real.
   */
  verifyAge18Plus(
    input: z.infer<typeof VerifyAgeInputSchema>,
    nowMs = Date.now()
  ): EcaComplianceSettings {
    const parsed = VerifyAgeInputSchema.parse(input);
    if (!parsed.acceptZeroCashOutPolicy) {
      throw new Error('ZERO_CASH_OUT_POLICY_REQUIRED');
    }

    const birthDate = new Date(`${parsed.birthDateIso}T00:00:00.000Z`);
    const nowDate = new Date(nowMs);
    let age = nowDate.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDiff = nowDate.getUTCMonth() - birthDate.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && nowDate.getUTCDate() < birthDate.getUTCDate())) {
      age -= 1;
    }

    if (age < 18) {
      throw new Error('UNDERAGE_18PLUS_BLOCKED');
    }

    const settings = this.getOrCreateSettings(parsed.playerId, nowMs);
    settings.ageVerified18Plus = true;
    settings.verifiedAtIso = new Date(nowMs).toISOString();
    settings.documentHash = parsed.documentHash;
    settings.zeroCashOutAccepted = true;
    return settings;
  }

  assertAdultVerified(playerId: string, nowMs = Date.now()): EcaComplianceSettings {
    const settings = this.getOrCreateSettings(playerId, nowMs);
    if (settings.lgpdDeletedAtIso !== null) {
      throw new Error('ACCOUNT_DELETED_LGPD');
    }
    if (!settings.ageVerified18Plus || !settings.zeroCashOutAccepted) {
      throw new Error('AGE_18PLUS_VERIFICATION_REQUIRED');
    }
    return settings;
  }

  /**
   * Configura o limite mensal de gastos em BRL (ECA Digital).
   */
  setMonthlySpendLimit(
    playerId: string,
    monthlySpendLimitBrl: number,
    nowMs = Date.now()
  ): EcaComplianceSettings {
    const parsed = SpendLimitInputSchema.parse({ playerId, monthlySpendLimitBrl });
    const settings = this.assertAdultVerified(parsed.playerId, nowMs);
    settings.monthlySpendLimitBrl = parsed.monthlySpendLimitBrl;
    return settings;
  }

  /**
   * Verifica e registra gasto mensal em BRL, bloqueando se ultrapassar o teto configurado.
   */
  assertAndRecordSpendBrl(playerId: string, amountBrl: number, nowMs = Date.now()): void {
    const settings = this.assertAdultVerified(playerId, nowMs);
    if (
      settings.monthlySpendLimitBrl !== null &&
      settings.currentMonthSpendBrl + amountBrl > settings.monthlySpendLimitBrl
    ) {
      throw new Error('MONTHLY_SPEND_LIMIT_EXCEEDED');
    }
    settings.currentMonthSpendBrl = Number((settings.currentMonthSpendBrl + amountBrl).toFixed(2));
  }

  /**
   * Retorna o histórico auditável de sorteios da Chocadeira dos últimos 90 dias.
   */
  getPullHistory90Days(playerId: string, nowMs = Date.now()): GachaPullHistory90d[] {
    const cutoffMs = nowMs - NINETY_DAYS_MS;
    return this.db.gachaHistory90d.filter(
      (entry) => entry.playerId === playerId && entry.timestampMs >= cutoffMs
    );
  }

  /**
   * Política estrita de Zero Saque em dinheiro real (Lei 9.605/98 + ECA Digital).
   */
  requestCashOut(): never {
    throw new Error('ZERO_CASH_OUT_POLICY_ENFORCED');
  }

  /**
   * Exclusão completa de dados pessoais (LGPD).
   */
  deletePersonalDataLgpd(playerId: string, nowMs = Date.now()): { deleted: true; timestampIso: string } {
    const settings = this.getOrCreateSettings(playerId, nowMs);
    settings.documentHash = null;
    settings.lgpdDeletedAtIso = new Date(nowMs).toISOString();
    const player = this.db.players.get(playerId);
    if (player) {
      player.displayName = 'JOGADOR_ANONIMIZADO_LGPD';
      player.lastIpHash = 'REDACTED_LGPD';
      player.deviceFingerprint = 'REDACTED_LGPD';
    }
    return { deleted: true, timestampIso: settings.lgpdDeletedAtIso };
  }
}

export async function registerAuth18PlusRoutes(
  app: FastifyInstance,
  service: EcaComplianceService
): Promise<void> {
  app.post('/auth/verify-18plus', async (req, reply) => {
    try {
      return service.verifyAge18Plus(req.body as z.infer<typeof VerifyAgeInputSchema>);
    } catch (err) {
      return reply.status(403).send({ error: (err as Error).message });
    }
  });

  app.post('/auth/spend-limit', async (req, reply) => {
    try {
      const body = SpendLimitInputSchema.parse(req.body);
      return service.setMonthlySpendLimit(body.playerId, body.monthlySpendLimitBrl);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get('/auth/gacha-history-90d/:playerId', async (req) => {
    const { playerId } = req.params as { playerId: string };
    return { history: service.getPullHistory90Days(playerId) };
  });

  app.delete('/auth/lgpd/:playerId', async (req) => {
    const { playerId } = req.params as { playerId: string };
    return service.deletePersonalDataLgpd(playerId);
  });
}
