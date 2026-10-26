export class SeededPRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  public getState(): number {
    return this.state >>> 0;
  }

  public nextUint32(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  }

  public nextPermille(): number {
    return Math.floor((this.nextUint32() * 1000) / 4294967296);
  }

  public nextPercent(): number {
    return Math.floor((this.nextUint32() * 100) / 4294967296);
  }

  public chancePermille(thresholdPermille: number): boolean {
    if (thresholdPermille <= 0) return false;
    if (thresholdPermille >= 1000) return true;
    return this.nextPermille() < thresholdPermille;
  }

  public chancePercent(thresholdPct: number): boolean {
    if (thresholdPct <= 0) return false;
    if (thresholdPct >= 100) return true;
    return this.nextPercent() < thresholdPct;
  }

  public pickIndex(len: number): number {
    if (len <= 1) return 0;
    return Math.floor((this.nextUint32() * len) / 4294967296);
  }
}
