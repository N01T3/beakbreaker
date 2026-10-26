import type { AssetBundleId } from '../../core/AssetLoader.js';
import type { GameScene } from '../../core/SceneRouter.js';

export interface HeroRaceCompetitor {
  playerId: string;
  name: string;
  lap: number;
  node: number;
}

export class HeroRaceTrackScene implements GameScene {
  public readonly key = 'hero-race' as const;
  public readonly requiredBundle: AssetBundleId = 'liveops-boards';
  public readonly totalLaps = 18;
  public readonly nodesPerLap = 5;
  public readonly maxCompetitors = 8;
  private competitors: HeroRaceCompetitor[] = [];

  public mount(): void {
    if (this.competitors.length === 0) {
      for (let i = 1; i <= this.maxCompetitors; i++) {
        this.competitors.push({
          playerId: `p_${i}`,
          name: i === 1 ? 'Você' : `Criador #${i}`,
          lap: 1,
          node: 1,
        });
      }
    }
  }

  public unmount(): void {}

  public setCompetitors(list: readonly HeroRaceCompetitor[]): void {
    this.competitors = list.slice(0, this.maxCompetitors).map((c) => ({
      ...c,
      lap: Math.max(1, Math.min(this.totalLaps, c.lap)),
      node: Math.max(1, Math.min(this.nodesPerLap, c.node)),
    }));
  }

  public advanceNode(playerId: string, steps = 1): HeroRaceCompetitor | undefined {
    const target = this.competitors.find((c) => c.playerId === playerId);
    if (!target) return undefined;
    for (let s = 0; s < steps; s++) {
      if (target.lap >= this.totalLaps && target.node >= this.nodesPerLap) break;
      target.node += 1;
      if (target.node > this.nodesPerLap) {
        target.lap = Math.min(this.totalLaps, target.lap + 1);
        target.node = 1;
      }
    }
    return target;
  }

  public getStandings(): HeroRaceCompetitor[] {
    return [...this.competitors].sort((a, b) => {
      if (b.lap !== a.lap) return b.lap - a.lap;
      return b.node - a.node;
    });
  }

  public qualifiesForHeroicRooster(playerId: string): boolean {
    const standings = this.getStandings();
    const index = standings.findIndex((c) => c.playerId === playerId);
    if (index === -1) return false;
    const comp = standings[index]!;
    if (comp.lap >= 15) return true;
    if (index === 0 && comp.lap >= 5) return true;
    return false;
  }

  public update(_deltaMs: number): void {}

  public getDrawCallEstimate(): number {
    return 9;
  }
}
