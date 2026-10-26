export type RendererBackend = 'webgpu' | 'webgl2';

export interface PixiPerformanceBudget {
  maxDrawCalls: number;
  maxVramMb: number;
  targetFps: number;
}

export const OFFICIAL_RENDER_BUDGET: PixiPerformanceBudget = {
  maxDrawCalls: 25,
  maxVramMb: 120,
  targetFps: 60,
};

export interface RenderTelemetrySnapshot {
  backend: RendererBackend;
  drawCalls: number;
  vramMb: number;
  fps: number;
  isWithinDrawCallBudget: boolean;
  isWithinVramBudget: boolean;
  activeTexturesCount: number;
}

export interface PixiAppConfig {
  width: number;
  height: number;
  resolution?: number;
  preferWebGPU?: boolean;
  backgroundColor?: number;
}

export class PixiAppManager {
  private initialized = false;
  private backend: RendererBackend = 'webgpu';
  private width = 1280;
  private height = 720;
  private currentDrawCalls = 0;
  private currentVramMb = 0;
  private activeTextures = new Set<string>();
  private currentFps = 60;

  public async init(config: PixiAppConfig): Promise<void> {
    if (this.initialized) {
      this.destroy();
    }
    this.width = Math.max(320, config.width);
    this.height = Math.max(240, config.height);
    this.backend = config.preferWebGPU !== false ? 'webgpu' : 'webgl2';
    this.currentDrawCalls = 4;
    this.currentVramMb = 18;
    this.initialized = true;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public registerTexture(textureKey: string, estimatedVramMb: number): boolean {
    if (!this.initialized) return false;
    const projected = this.currentVramMb + Math.max(0, estimatedVramMb);
    if (projected >= OFFICIAL_RENDER_BUDGET.maxVramMb) {
      return false;
    }
    if (!this.activeTextures.has(textureKey)) {
      this.activeTextures.add(textureKey);
      this.currentVramMb = Number(projected.toFixed(2));
    }
    return true;
  }

  public releaseTexture(textureKey: string, estimatedVramMb: number): void {
    if (this.activeTextures.delete(textureKey)) {
      this.currentVramMb = Number(
        Math.max(0, this.currentVramMb - Math.max(0, estimatedVramMb)).toFixed(2),
      );
    }
  }

  public updateFrameMetrics(drawCalls: number, fps = 60): RenderTelemetrySnapshot {
    this.currentDrawCalls = Math.max(0, Math.floor(drawCalls));
    this.currentFps = Math.max(1, Math.min(120, Math.floor(fps)));
    return this.getTelemetry();
  }

  public getTelemetry(): RenderTelemetrySnapshot {
    return {
      backend: this.backend,
      drawCalls: this.currentDrawCalls,
      vramMb: this.currentVramMb,
      fps: this.currentFps,
      isWithinDrawCallBudget: this.currentDrawCalls < OFFICIAL_RENDER_BUDGET.maxDrawCalls,
      isWithinVramBudget: this.currentVramMb < OFFICIAL_RENDER_BUDGET.maxVramMb,
      activeTexturesCount: this.activeTextures.size,
    };
  }

  public getViewport(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public destroy(): void {
    this.activeTextures.clear();
    this.currentDrawCalls = 0;
    this.currentVramMb = 0;
    this.initialized = false;
  }
}
