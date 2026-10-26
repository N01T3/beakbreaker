import type { AssetBundleId } from '../../core/AssetLoader.js';
import type { GameScene } from '../../core/SceneRouter.js';

export type LabyrinthMode = 'LABIRINTO_SAO_JOAO' | 'CACA_NA_NEBLINA';

export interface LabyrinthTile {
  tileId: string;
  gridX: number;
  gridY: number;
  revealed: boolean;
  stepCostTokens: number;
  rewardType?: 'ORBES' | 'PENAS' | 'BAU_EPICO' | 'CHAVE_TRILHA';
  rewardAmount?: number;
}

export class LabyrinthBoardScene implements GameScene {
  public readonly key = 'labyrinth' as const;
  public readonly requiredBundle: AssetBundleId = 'liveops-boards';
  private mode: LabyrinthMode = 'LABIRINTO_SAO_JOAO';
  private tokensBalance = 200;
  private tiles = new Map<string, LabyrinthTile>();

  public mount(): void {
    if (this.tiles.size === 0) {
      this.initializeDefaultGrid(5, 5);
    }
  }

  public unmount(): void {}

  public setMode(mode: LabyrinthMode): void {
    this.mode = mode;
  }

  public getMode(): LabyrinthMode {
    return this.mode;
  }

  public setTokensBalance(tokens: number): void {
    this.tokensBalance = Math.max(0, Math.floor(tokens));
  }

  public getTokensBalance(): number {
    return this.tokensBalance;
  }

  public initializeDefaultGrid(cols: number, rows: number): void {
    this.tiles.clear();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tileId = `${x}_${y}`;
        this.tiles.set(tileId, {
          tileId,
          gridX: x,
          gridY: y,
          revealed: x === 0 && y === 0,
          stepCostTokens: 25,
          rewardType: (x + y) % 3 === 0 ? 'ORBES' : 'PENAS',
          rewardAmount: 20,
        });
      }
    }
  }

  public revealAndStep(tileId: string): { ok: boolean; tile?: LabyrinthTile } {
    const tile = this.tiles.get(tileId);
    if (!tile) return { ok: false };
    if (this.tokensBalance < tile.stepCostTokens) return { ok: false };
    this.tokensBalance -= tile.stepCostTokens;
    tile.revealed = true;
    return { ok: true, tile };
  }

  public getRevealedCount(): number {
    let count = 0;
    for (const t of this.tiles.values()) {
      if (t.revealed) count += 1;
    }
    return count;
  }

  public update(_deltaMs: number): void {}

  public getDrawCallEstimate(): number {
    return 8;
  }
}
