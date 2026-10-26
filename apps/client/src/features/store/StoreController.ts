export interface StoreTransactionRecord {
  txId: string;
  itemName: string;
  amountBrlCents: number;
  coroasGranted: number;
  viaWebPix: boolean;
  timestampMs: number;
}

export interface FlashOfferSpec {
  active: boolean;
  triggerPullRange: readonly [58, 65];
  bundleTitle: string;
  pullsIncluded: number;
  priceBrlCents: number;
}

export class StoreController {
  public readonly historyRetentionDays = 90;
  public readonly pixWebBonusPct = 15;
  private monthlyLimitBrlCents = 50_000; // R$ 500,00 padrão configurável
  private currentMonthSpentBrlCents = 0;
  private goldenRoosterVaultCoroas = 0;
  private transactions: StoreTransactionRecord[] = [];

  public setMonthlyLimitBrlCents(limitCents: number): number {
    this.monthlyLimitBrlCents = Math.max(1_000, Math.floor(limitCents));
    return this.monthlyLimitBrlCents;
  }

  public getRemainingMonthlyBudgetBrlCents(): number {
    return Math.max(0, this.monthlyLimitBrlCents - this.currentMonthSpentBrlCents);
  }

  public evaluateFlashOffer(currentPity: number): FlashOfferSpec {
    const active = currentPity >= 58 && currentPity <= 65;
    return {
      active,
      triggerPullRange: [58, 65],
      bundleTitle: 'Socorro do Arraial: Rumo ao Pity 80',
      pullsIncluded: 15,
      priceBrlCents: 2_990,
    };
  }

  public accumulateGoldenVault(coroasFromBattle: number): number {
    this.goldenRoosterVaultCoroas = Math.min(
      600,
      this.goldenRoosterVaultCoroas + Math.max(0, Math.floor(coroasFromBattle)),
    );
    return this.goldenRoosterVaultCoroas;
  }

  public purchaseCoroasPackage(
    txId: string,
    itemName: string,
    amountBrlCents: number,
    baseCoroas: number,
    viaWebPix = false,
    nowMs = Date.now(),
  ): { ok: boolean; reason?: string; record?: StoreTransactionRecord } {
    if (this.currentMonthSpentBrlCents + amountBrlCents > this.monthlyLimitBrlCents) {
      return { ok: false, reason: 'ECA_DIGITAL_MONTHLY_LIMIT_EXCEEDED' };
    }
    const bonusMultiplier = viaWebPix ? 1 + this.pixWebBonusPct / 100 : 1.0;
    const coroasGranted = Math.floor(baseCoroas * bonusMultiplier);
    this.currentMonthSpentBrlCents += amountBrlCents;

    const record: StoreTransactionRecord = {
      txId,
      itemName,
      amountBrlCents,
      coroasGranted,
      viaWebPix,
      timestampMs: nowMs,
    };
    this.transactions.push(record);
    return { ok: true, record };
  }

  public getTransactionsLast90Days(nowMs = Date.now()): StoreTransactionRecord[] {
    const cutoff = nowMs - this.historyRetentionDays * 24 * 60 * 60 * 1000;
    return this.transactions.filter((tx) => tx.timestampMs >= cutoff);
  }
}
