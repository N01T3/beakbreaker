import { OFFICIAL_RENDER_BUDGET, PixiAppManager } from './PixiAppManager.js';

export type AssetBundleId =
  | 'core-cordel'
  | 'rooster-master-rig'
  | 'iso-farm'
  | 'arena-sertaneja'
  | 'liveops-boards';

export interface AssetBundleManifest {
  id: AssetBundleId;
  textures: readonly string[];
  estimatedVramMb: number;
  atlasDrawCalls: number;
}

export const BUNDLE_MANIFESTS: Record<AssetBundleId, AssetBundleManifest> = {
  'core-cordel': {
    id: 'core-cordel',
    textures: ['ui_xilo_frame.ktx2', 'sao_joao_flags.ktx2'],
    estimatedVramMb: 8,
    atlasDrawCalls: 2,
  },
  'rooster-master-rig': {
    id: 'rooster-master-rig',
    textures: ['rooster_master.skel', 'rooster_parts_atlas_01.ktx2', 'rooster_equip_15.ktx2'],
    estimatedVramMb: 28,
    atlasDrawCalls: 4,
  },
  'iso-farm': {
    id: 'iso-farm',
    textures: ['iso_farm_tiles.ktx2', 'perches_atlas.ktx2', 'saint_towers.ktx2'],
    estimatedVramMb: 34,
    atlasDrawCalls: 6,
  },
  'arena-sertaneja': {
    id: 'arena-sertaneja',
    textures: ['arena_stage.ktx2', 'xilo_popups.ktx2', 'vfx_elements.ktx2'],
    estimatedVramMb: 26,
    atlasDrawCalls: 5,
  },
  'liveops-boards': {
    id: 'liveops-boards',
    textures: ['hero_race_track.ktx2', 'labyrinth_fog.ktx2', 'war_map_12_villages.ktx2'],
    estimatedVramMb: 22,
    atlasDrawCalls: 4,
  },
};

export class AssetLoader {
  private loadedBundles = new Set<AssetBundleId>();

  constructor(private readonly appManager: PixiAppManager) {}

  public async loadBundle(bundleId: AssetBundleId): Promise<boolean> {
    if (this.loadedBundles.has(bundleId)) {
      return true;
    }
    const manifest = BUNDLE_MANIFESTS[bundleId];
    const currentTelemetry = this.appManager.getTelemetry();
    if (currentTelemetry.vramMb + manifest.estimatedVramMb >= OFFICIAL_RENDER_BUDGET.maxVramMb) {
      return false;
    }

    const perTextureVram = manifest.estimatedVramMb / Math.max(1, manifest.textures.length);
    for (const tex of manifest.textures) {
      const ok = this.appManager.registerTexture(`${bundleId}:${tex}`, perTextureVram);
      if (!ok) return false;
    }

    this.loadedBundles.add(bundleId);
    return true;
  }

  public unloadBundle(bundleId: AssetBundleId): void {
    if (!this.loadedBundles.has(bundleId)) return;
    const manifest = BUNDLE_MANIFESTS[bundleId];
    const perTextureVram = manifest.estimatedVramMb / Math.max(1, manifest.textures.length);
    for (const tex of manifest.textures) {
      this.appManager.releaseTexture(`${bundleId}:${tex}`, perTextureVram);
    }
    this.loadedBundles.delete(bundleId);
  }

  public isBundleLoaded(bundleId: AssetBundleId): boolean {
    return this.loadedBundles.has(bundleId);
  }

  public getLoadedBundles(): AssetBundleId[] {
    return Array.from(this.loadedBundles);
  }

  public unloadAllExceptCore(): void {
    for (const id of Array.from(this.loadedBundles)) {
      if (id !== 'core-cordel' && id !== 'rooster-master-rig') {
        this.unloadBundle(id);
      }
    }
  }
}
