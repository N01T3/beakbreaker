import type { AssetBundleId, AssetLoader } from './AssetLoader.js';
import type { PixiAppManager } from './PixiAppManager.js';

export type SceneKey = 'farm' | 'arena' | 'hero-race' | 'labyrinth' | 'war-map';

export interface GameScene {
  readonly key: SceneKey;
  readonly requiredBundle: AssetBundleId;
  mount(): void;
  update(deltaMs: number): void;
  unmount(): void;
  getDrawCallEstimate(): number;
}

export class SceneRouter {
  private scenes = new Map<SceneKey, GameScene>();
  private activeScene: GameScene | null = null;

  constructor(
    private readonly appManager: PixiAppManager,
    private readonly assetLoader: AssetLoader,
  ) {}

  public registerScene(scene: GameScene): void {
    this.scenes.set(scene.key, scene);
  }

  public async transitionTo(key: SceneKey): Promise<GameScene> {
    const nextScene = this.scenes.get(key);
    if (!nextScene) {
      throw new Error(`Scene not registered: ${key}`);
    }

    if (this.activeScene) {
      const prevBundle = this.activeScene.requiredBundle;
      this.activeScene.unmount();
      if (prevBundle !== nextScene.requiredBundle) {
        this.assetLoader.unloadBundle(prevBundle);
      }
    }

    await this.assetLoader.loadBundle('core-cordel');
    await this.assetLoader.loadBundle('rooster-master-rig');
    const loaded = await this.assetLoader.loadBundle(nextScene.requiredBundle);
    if (!loaded) {
      throw new Error(`VRAM budget exceeded when loading bundle ${nextScene.requiredBundle}`);
    }

    nextScene.mount();
    this.activeScene = nextScene;
    this.appManager.updateFrameMetrics(nextScene.getDrawCallEstimate(), 60);
    return nextScene;
  }

  public tick(deltaMs: number): void {
    if (!this.activeScene) return;
    this.activeScene.update(deltaMs);
    this.appManager.updateFrameMetrics(this.activeScene.getDrawCallEstimate(), 60);
  }

  public getActiveScene(): GameScene | null {
    return this.activeScene;
  }

  public disposeAll(): void {
    if (this.activeScene) {
      this.activeScene.unmount();
      this.activeScene = null;
    }
    this.assetLoader.unloadAllExceptCore();
  }
}
