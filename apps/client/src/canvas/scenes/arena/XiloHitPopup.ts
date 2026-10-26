export type XiloPopupKind = 'HIT' | 'CRIT' | 'INTERRUPT' | 'HEAL' | 'STATUS';

export interface XiloPopupInstance {
  readonly poolIndex: number;
  active: boolean;
  kind: XiloPopupKind;
  text: string;
  x: number;
  y: number;
  ttlTicks: number;
}

export class XiloHitPopupPool {
  private readonly pool: XiloPopupInstance[] = [];
  private readonly freeIndices: number[] = [];
  private dynamicAllocations = 0;

  constructor(private readonly capacity = 32) {
    for (let i = 0; i < capacity; i++) {
      this.pool.push({
        poolIndex: i,
        active: false,
        kind: 'HIT',
        text: '',
        x: 0,
        y: 0,
        ttlTicks: 0,
      });
      this.freeIndices.push(capacity - 1 - i);
    }
  }

  public formatXiloText(kind: XiloPopupKind, amount = 0, label = ''): string {
    if (kind === 'INTERRUPT') return 'CORTA-CANTO!';
    if (kind === 'CRIT') return `CRÍTICO! -${Math.abs(Math.floor(amount))}`;
    if (kind === 'HEAL') return `CURA! +${Math.abs(Math.floor(amount))}`;
    if (kind === 'STATUS') return label || 'EFEITO!';
    return `PAH! -${Math.abs(Math.floor(amount))}`;
  }

  public spawn(
    kind: XiloPopupKind,
    amount: number,
    x: number,
    y: number,
    customLabel = '',
    durationTicks = 12,
  ): XiloPopupInstance {
    let idx = this.freeIndices.pop();
    if (idx === undefined) {
      // Recicla o balão ativo mais antigo sem alocar novo objeto no GC
      let oldestIdx = 0;
      let minTtl = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < this.pool.length; i++) {
        const candidate = this.pool[i]!;
        if (candidate.ttlTicks < minTtl) {
          minTtl = candidate.ttlTicks;
          oldestIdx = i;
        }
      }
      idx = oldestIdx;
    }

    const instance = this.pool[idx]!;
    instance.active = true;
    instance.kind = kind;
    instance.text = this.formatXiloText(kind, amount, customLabel);
    instance.x = x;
    instance.y = y;
    instance.ttlTicks = Math.max(1, durationTicks);
    return instance;
  }

  public tickAll(): void {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i]!;
      if (!item.active) continue;
      item.ttlTicks -= 1;
      item.y -= 2;
      if (item.ttlTicks <= 0) {
        item.active = false;
        item.text = '';
        this.freeIndices.push(item.poolIndex);
      }
    }
  }

  public releaseAll(): void {
    this.freeIndices.length = 0;
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const item = this.pool[i]!;
      item.active = false;
      item.text = '';
      item.ttlTicks = 0;
      this.freeIndices.push(item.poolIndex);
    }
  }

  public getActivePopups(): XiloPopupInstance[] {
    return this.pool.filter((p) => p.active);
  }

  public getGcAllocationsCount(): number {
    return this.dynamicAllocations;
  }

  public getCapacity(): number {
    return this.capacity;
  }
}
