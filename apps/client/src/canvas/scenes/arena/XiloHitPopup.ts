import type { WoodcutCanvasContext2D } from '../../stage/WoodcutCarver.js';

export type XiloPopupKind = 'HIT' | 'CRIT' | 'INTERRUPT' | 'HEAL' | 'STATUS' | 'DODGE';

export interface XiloPopupInstance {
  readonly poolIndex: number;
  active: boolean;
  kind: XiloPopupKind;
  text: string;
  x: number;
  y: number;
  scale: number;
  alpha: number;
  ttlTicks: number;
  maxTicks: number;
  starburstPoints: number;
  stampBgColor: string;
}

export function drawXiloStarburstStamp(ctx: WoodcutCanvasContext2D, p: XiloPopupInstance): void {
  if (!p.active || p.alpha <= 0.01) return;
  const numSpikes = p.starburstPoints || 12;
  const rOut = 28 * p.scale;
  const rIn = 18 * p.scale;
  ctx.beginPath();
  for (let i = 0; i < numSpikes * 2; i++) {
    const angle = (i * Math.PI) / numSpikes;
    const r = i % 2 === 0 ? rOut : rIn;
    const px = p.x + Math.cos(angle) * r;
    const py = p.y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = p.stampBgColor;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1B1B1B';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(2, 14 * p.scale), 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#1B1B1B';
  ctx.stroke();
  ctx.fillStyle = '#1B1B1B';
  ctx.font = `bold ${Math.max(9, Math.round(11 * p.scale))}px monospace`;
  ctx.fillText(p.text, p.x - Math.round(p.text.length * 3.4), p.y + 4);
}

export class XiloHitPopupPool {
  private readonly pool: XiloPopupInstance[] = [];
  private readonly freeIndices: number[] = [];
  private dynamicAllocations = 0;

  constructor(private readonly capacity = 32) {
    for (let i = 0; i < capacity; i++) {
      this.pool.push({
        poolIndex: i, active: false, kind: 'HIT', text: '', x: 0, y: 0,
        scale: 1, alpha: 1, ttlTicks: 0, maxTicks: 14, starburstPoints: 12, stampBgColor: '#F4B400',
      });
      this.freeIndices.push(capacity - 1 - i);
    }
  }

  public formatXiloText(kind: XiloPopupKind, amount = 0, label = ''): string {
    if (kind === 'INTERRUPT') return 'CORTA-CANTO!';
    if (kind === 'DODGE') return 'ESQUIVA!';
    if (kind === 'CRIT') return `CRÍTICO! -${Math.abs(Math.floor(amount))}`;
    if (kind === 'HEAL') return `CURA! +${Math.abs(Math.floor(amount))}`;
    return kind === 'STATUS' ? (label || 'EFEITO!') : `PAH! -${Math.abs(Math.floor(amount))}`;
  }

  public spawn(
    kind: XiloPopupKind, amount: number, x: number, y: number,
    customLabel = '', durationTicks = 14,
  ): XiloPopupInstance {
    let idx = this.freeIndices.pop();
    if (idx === undefined) {
      let oldestIdx = 0;
      let minTtl = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < this.pool.length; i++) {
        if (this.pool[i]!.ttlTicks < minTtl) { minTtl = this.pool[i]!.ttlTicks; oldestIdx = i; }
      }
      idx = oldestIdx;
    }
    const inst = this.pool[idx]!;
    const dur = Math.max(1, durationTicks);
    inst.active = true; inst.kind = kind;
    inst.text = this.formatXiloText(kind, amount, customLabel);
    inst.x = x; inst.y = y; inst.maxTicks = dur; inst.ttlTicks = dur;
    inst.scale = 0.3; inst.alpha = 1.0;
    inst.starburstPoints = kind === 'CRIT' ? 16 : kind === 'INTERRUPT' ? 14 : 12;
    inst.stampBgColor = kind === 'CRIT' ? '#D7263D' : kind === 'INTERRUPT' ? '#1E3A8A' :
      kind === 'DODGE' ? '#1D7846' : kind === 'HEAL' ? '#2E7D32' : '#F4B400';
    return inst;
  }

  public tickAll(): void {
    for (let i = 0; i < this.pool.length; i++) {
      const item = this.pool[i]!;
      if (!item.active) continue;
      item.ttlTicks -= 1;
      item.y -= 2;
      const t = 1 - item.ttlTicks / item.maxTicks;
      if (t < 0.28) {
        item.scale = 0.3 + 1.05 * Math.sin((t / 0.28) * (Math.PI / 2));
      } else if (t < 0.52) {
        item.scale = 1.35 - 0.35 * Math.sin(((t - 0.28) / 0.24) * (Math.PI / 2));
      } else if (t < 0.72) {
        item.scale = 1.0;
      } else {
        item.scale = Math.max(0.7, 1.0 - (t - 0.72) * 0.7);
      }
      item.alpha = t < 0.65 ? 1.0 : Math.max(0, 1.0 - (t - 0.65) / 0.35);
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
