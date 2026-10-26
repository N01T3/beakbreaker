export interface RoamingBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface RoamingRoosterData {
  roosterId: string;
  name: string;
  element: string;
  level: number;
  stars: number;
  baseMilhoPerMin: number;
}

export class RoamingRooster {
  public readonly roosterId: string;
  public readonly name: string;
  public readonly element: string;
  public level: number;
  public stars: number;
  public baseMilhoPerMin: number;
  public x: number;
  public y: number;
  public facing: 'left' | 'right' = 'right';
  public anim: 'idle_peck' | 'walk' | 'crow' = 'idle_peck';
  private targetX: number;
  private targetY: number;

  constructor(
    data: RoamingRoosterData,
    private readonly bounds: RoamingBounds,
  ) {
    this.roosterId = data.roosterId;
    this.name = data.name;
    this.element = data.element;
    this.level = Math.max(1, Math.min(60, data.level));
    this.stars = Math.max(0, Math.min(10, data.stars));
    this.baseMilhoPerMin = Math.max(1, data.baseMilhoPerMin);
    this.x = (bounds.minX + bounds.maxX) / 2;
    this.y = (bounds.minY + bounds.maxY) / 2;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  public setWaypoint(nx: number, ny: number): void {
    this.targetX = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, nx));
    this.targetY = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, ny));
    this.facing = this.targetX >= this.x ? 'right' : 'left';
    this.anim = 'walk';
  }

  public update(deltaMs: number): void {
    const step = (deltaMs / 1000) * 32;
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= step || dist < 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.anim = 'idle_peck';
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
      this.anim = 'walk';
    }
  }

  public computeEffectiveMilhoPerMin(dayNightMultiplier = 1.0): number {
    const starBonus = 1 + this.stars * 0.15;
    return Math.floor(this.baseMilhoPerMin * starBonus * dayNightMultiplier);
  }
}
