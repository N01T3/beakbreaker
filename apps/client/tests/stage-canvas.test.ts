import { describe, expect, it } from 'vitest';
import {
  drawArena3v3Stage,
  drawClanBoardStage,
  drawIsoFarmStage,
  drawWoodcutBackdrop,
  type CordelSkyPhase,
  type WoodcutCanvasContext2D,
} from '../src/canvas/stage/WoodcutCarver.js';
import { CordelStageCanvas } from '../src/canvas/stage/CordelStageCanvas.js';

interface RecordedMockCtx extends WoodcutCanvasContext2D {
  fills: string[];
  strokes: string[];
  texts: string[];
  rects: number;
  arcs: number;
  diamonds: number;
}

function createMockWoodcutContext(): RecordedMockCtx {
  const ctx: RecordedMockCtx = {
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '12px monospace',
    fills: [],
    strokes: [],
    texts: [],
    rects: 0,
    arcs: 0,
    diamonds: 0,
    fillRect() {
      ctx.fills.push(String(ctx.fillStyle));
      ctx.rects += 1;
    },
    strokeRect() {
      ctx.strokes.push(String(ctx.strokeStyle));
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {
      ctx.diamonds += 1;
    },
    fill() {
      ctx.fills.push(String(ctx.fillStyle));
    },
    stroke() {
      ctx.strokes.push(String(ctx.strokeStyle));
    },
    arc() {
      ctx.arcs += 1;
    },
    fillText(text: string) {
      ctx.texts.push(text);
    },
  };
  return ctx;
}

describe('WoodcutCarver & CordelStageCanvas 2D Stage', () => {
  it('draws Cordel Pop backdrop across all 3 Day/Night phases with #1B1B1B 3px border', () => {
    const phases: Array<[CordelSkyPhase, string]> = [
      ['SOL_PLENO', '#F5E9D3'],
      ['CREPUSCULO', '#F4B400'],
      ['LUAR_DO_SERTAO', '#1E3A8A'],
    ];

    for (const [phase, expectedSkyHex] of phases) {
      const ctx = createMockWoodcutContext();
      drawWoodcutBackdrop(ctx, 880, 240, phase);
      expect(ctx.fills[0]).toBe(expectedSkyHex);
      expect(ctx.lineWidth).toBe(3);
      expect(ctx.strokeStyle).toBe('#1B1B1B');
      expect(ctx.arcs).toBe(1);
      expect(ctx.rects).toBe(2);
    }
  });

  it('draws Fazenda isometric stage with Sede, 4 elemental perches, towers and roosters', () => {
    const ctx = createMockWoodcutContext();
    drawWoodcutBackdrop(ctx, 880, 240, 'SOL_PLENO');
    drawIsoFarmStage(ctx, {
      sedeLevel: 3,
      storedMilho: 480,
      activeTowers: 3,
      roosterCount: 5,
    });

    expect(ctx.diamonds).toBe(7);
    expect(ctx.texts).toContain('SEDE NV.3 | MILHO:480');
    expect(ctx.texts).toEqual(expect.arrayContaining(['TERRA', 'FOGO', 'AGUA', 'AR', 'SOL', 'LUA']));
    expect(ctx.arcs).toBe(1 + 5);
  });

  it('draws Lutar 3v3 arena stage with left/right roosters, Vigor/Canto bars and PAH! banner', () => {
    const ctx = createMockWoodcutContext();
    drawWoodcutBackdrop(ctx, 880, 240, 'CREPUSCULO');
    drawArena3v3Stage(
      ctx,
      [
        { name: 'Trovao', vigor: 1200, maxVigor: 1500, canto: 90, team: 'A' },
        { name: 'Brisa', vigor: 900, maxVigor: 1100, canto: 60, team: 'A' },
        { name: 'Brasa', vigor: 1000, maxVigor: 1200, canto: 100, team: 'A' },
        { name: 'Carcara', vigor: 950, maxVigor: 1300, canto: 40, team: 'B' },
        { name: 'Sereno', vigor: 800, maxVigor: 1100, canto: 50, team: 'B' },
        { name: 'Mandacaru', vigor: 1100, maxVigor: 1400, canto: 75, team: 'B' },
      ],
      ['CORTA-CANTO! -355'],
    );

    expect(ctx.diamonds).toBe(1);
    expect(ctx.texts).toContain('Trovao');
    expect(ctx.texts).toContain('Mandacaru');
    expect(ctx.texts.some((t) => t.startsWith('PAH! CORTA-CANTO!'))).toBe(true);
    expect(ctx.fills).toContain('#1D7846');
    expect(ctx.fills).toContain('#F4B400');
  });

  it('draws Bando clan board stage with 18-lap Hero Race oval track and Territory War nodes', () => {
    const ctx = createMockWoodcutContext();
    drawWoodcutBackdrop(ctx, 880, 240, 'LUAR_DO_SERTAO');
    drawClanBoardStage(ctx, 7, 4);

    expect(ctx.arcs).toBe(1 + 18);
    expect(ctx.diamonds).toBe(6);
    expect(ctx.texts).toContain('VOLTA CORRIDA: 7/18 | VILAS: 4');
  });

  it('exports CordelStageCanvas Vue component with expected props and setup function', () => {
    expect(CordelStageCanvas.name).toBe('CordelStageCanvas');
    expect(typeof CordelStageCanvas.setup).toBe('function');
  });
});
