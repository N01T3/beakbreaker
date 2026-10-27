import { describe, expect, it } from 'vitest';
import {
  drawArena3v3Stage,
  drawClanBoardStage,
  drawIsoFarmStage,
  drawWoodcutBackdrop,
  type WoodcutCanvasContext2D,
} from '../src/canvas/stage/WoodcutCarver.js';
import { drawXiloStarburstStamp, XiloHitPopupPool } from '../src/canvas/scenes/arena/XiloHitPopup.js';

interface RecordedContext extends WoodcutCanvasContext2D {
  fills: string[];
  strokes: string[];
  texts: string[];
  rectCount: number;
  arcCount: number;
  closedPaths: number;
  lineCount: number;
}

function createMockContext(): RecordedContext {
  const ctx: RecordedContext = {
    fillStyle: '#000000', strokeStyle: '#000000', lineWidth: 1, font: '12px monospace',
    fills: [], strokes: [], texts: [], rectCount: 0, arcCount: 0, closedPaths: 0, lineCount: 0,
    fillRect() { ctx.fills.push(String(ctx.fillStyle)); ctx.rectCount += 1; },
    strokeRect() { ctx.strokes.push(String(ctx.strokeStyle)); },
    beginPath() {}, moveTo() {},
    lineTo() { ctx.lineCount += 1; },
    closePath() { ctx.closedPaths += 1; },
    fill() { ctx.fills.push(String(ctx.fillStyle)); },
    stroke() { ctx.strokes.push(String(ctx.strokeStyle)); },
    arc() { ctx.arcCount += 1; },
    fillText(text: string) { ctx.texts.push(text); },
  };
  return ctx;
}

describe('WoodcutCarver Visual Aesthetics & Cordel Pop Stages', () => {
  it('renders pergaminho backdrop, manual woodcut hatching, and celestial phases', () => {
    const ctxSol = createMockContext();
    drawWoodcutBackdrop(ctxSol, 880, 240, 'SOL_PLENO');
    expect(ctxSol.fills[0]).toBe('#F5E9D3');
    expect(ctxSol.strokeStyle).toBe('#1B1B1B');
    expect(ctxSol.lineWidth).toBe(3);
    expect(ctxSol.arcCount).toBe(1);
    expect(ctxSol.lineCount).toBeGreaterThan(20);

    const ctxCrep = createMockContext();
    drawWoodcutBackdrop(ctxCrep, 880, 240, 'CREPUSCULO');
    expect(ctxCrep.fills[0]).toBe('#F4B400');
    expect(ctxCrep.strokes).toContain('#C0652E');

    const ctxLuar = createMockContext();
    drawWoodcutBackdrop(ctxLuar, 880, 240, 'LUAR_DO_SERTAO');
    expect(ctxLuar.fills[0]).toBe('#1E3A8A');
    expect(ctxLuar.fills).toContain('#172554');
    expect(ctxLuar.strokes).toContain('#F5E9D3');
  });

  it('renders Arena de Arraial with arquibancada rustica, fogueira embers, and sawdust', () => {
    const ctx = createMockContext();
    drawArena3v3Stage(
      ctx,
      [
        { name: 'Trovao', vigor: 1200, maxVigor: 1500, canto: 80, team: 'A' },
        { name: 'Mandacaru', vigor: 1100, maxVigor: 1400, canto: 50, team: 'B' },
      ],
      ['PAH! -182'],
    );
    expect(ctx.closedPaths).toBeGreaterThanOrEqual(1);
    expect(ctx.fills).toContain('#1B1B1B');
    expect(ctx.fills).toContain('#C8232C');
    expect(ctx.strokes).toContain('#F4B400');
    expect(ctx.texts).toContain('Trovao');
    expect(ctx.texts.some((t) => t.includes('PAH! -182'))).toBe(true);
  });

  it('renders Fazenda Isométrica with beaten dirt paths and 6 elemental perches', () => {
    const ctx = createMockContext();
    drawIsoFarmStage(ctx, { sedeLevel: 3, storedMilho: 540, activeTowers: 2, roosterCount: 4 });
    expect(ctx.texts).toContain('SEDE NV.3 | MILHO:540');
    for (const el of ['TERRA', 'FOGO', 'AGUA', 'AR', 'SOL', 'LUA']) {
      expect(ctx.texts).toContain(el);
    }
    expect(ctx.closedPaths).toBe(7);
    expect(ctx.strokes).toContain('#C0652E');
    expect(ctx.arcCount).toBe(4);
  });

  it('renders Clan Board stage with oval race lap and territory diamonds', () => {
    const ctx = createMockContext();
    drawClanBoardStage(ctx, 5, 2);
    expect(ctx.arcCount).toBe(18);
    expect(ctx.closedPaths).toBe(6);
    expect(ctx.texts).toContain('VOLTA CORRIDA: 5/18 | VILAS: 2');
  });
});

describe('XiloHitPopup Starburst Woodcut Stamps & Elastic Animation', () => {
  it('formats cordel pop stamps: PAH! -182, CRÍTICO! -355, CORTA-CANTO!, and ESQUIVA!', () => {
    const pool = new XiloHitPopupPool(8);
    const hit = pool.spawn('HIT', 182, 100, 100);
    expect(hit.text).toBe('PAH! -182');
    expect(hit.stampBgColor).toBe('#F4B400');
    expect(hit.starburstPoints).toBe(12);

    const crit = pool.spawn('CRIT', 355, 120, 100);
    expect(crit.text).toBe('CRÍTICO! -355');
    expect(crit.stampBgColor).toBe('#D7263D');
    expect(crit.starburstPoints).toBe(16);

    const interrupt = pool.spawn('INTERRUPT', 0, 140, 100);
    expect(interrupt.text).toBe('CORTA-CANTO!');
    expect(interrupt.stampBgColor).toBe('#1E3A8A');

    const dodge = pool.spawn('DODGE', 0, 160, 100);
    expect(dodge.text).toBe('ESQUIVA!');
    expect(dodge.stampBgColor).toBe('#1D7846');
  });

  it('animates scale with pop-in elastic overshoot and fades out with rising Y', () => {
    const pool = new XiloHitPopupPool(4);
    const p = pool.spawn('CRIT', 355, 200, 150, '', 14);
    const initialY = p.y;
    expect(p.scale).toBeCloseTo(0.3, 1);
    expect(p.alpha).toBe(1.0);

    let maxScaleReached = p.scale;
    for (let tick = 0; tick < 4; tick++) {
      pool.tickAll();
      if (p.scale > maxScaleReached) maxScaleReached = p.scale;
    }
    expect(maxScaleReached).toBeGreaterThan(1.2);

    for (let tick = 4; tick < 8; tick++) {
      pool.tickAll();
    }
    expect(p.scale).toBeCloseTo(1.0, 1);

    for (let tick = 8; tick < 14; tick++) {
      pool.tickAll();
    }
    expect(p.active).toBe(false);
    expect(p.y).toBeLessThan(initialY);
  });

  it('draws starburst woodcut stamp onto 2D canvas context', () => {
    const pool = new XiloHitPopupPool(2);
    const p = pool.spawn('CRIT', 355, 300, 120);
    const ctx = createMockContext();
    drawXiloStarburstStamp(ctx, p);
    expect(ctx.closedPaths).toBe(1);
    expect(ctx.fills).toContain('#D7263D');
    expect(ctx.strokes).toContain('#1B1B1B');
    expect(ctx.texts).toContain('CRÍTICO! -355');
  });

  it('preserves zero GC allocations across continuous recycling', () => {
    const pool = new XiloHitPopupPool(8);
    for (let i = 0; i < 500; i++) {
      pool.spawn(i % 2 === 0 ? 'HIT' : 'DODGE', i * 10, 50, 50);
      pool.tickAll();
    }
    expect(pool.getGcAllocationsCount()).toBe(0);
  });
});
