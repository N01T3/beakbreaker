export type CordelSkyPhase = 'SOL_PLENO' | 'CREPUSCULO' | 'LUAR_DO_SERTAO';

export interface WoodcutCanvasContext2D {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void; moveTo(x: number, y: number): void; lineTo(x: number, y: number): void;
  closePath(): void; fill(): void; stroke(): void;
  arc(x: number, y: number, r: number, startAngle: number, endAngle: number): void;
  fillText(text: string, x: number, y: number): void;
}

export interface IsoFarmStageState {
  sedeLevel: number; storedMilho: number; activeTowers: number; roosterCount?: number;
}

export interface ArenaStageUnit {
  name: string; vigor: number; maxVigor: number; canto: number; team?: 'A' | 'B';
}

function drawIsoDiamond(ctx: WoodcutCanvasContext2D, cx: number, cy: number, rx: number, ry: number, fillHex: string): void {
  ctx.beginPath(); ctx.moveTo(cx, cy - ry); ctx.lineTo(cx + rx, cy); ctx.lineTo(cx, cy + ry); ctx.lineTo(cx - rx, cy);
  ctx.closePath(); ctx.fillStyle = fillHex; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1B1B1B'; ctx.stroke();
}

export function drawWoodcutBackdrop(ctx: WoodcutCanvasContext2D, width: number, height: number, phase: CordelSkyPhase): void {
  ctx.fillStyle = phase === 'SOL_PLENO' ? '#F5E9D3' : phase === 'CREPUSCULO' ? '#F4B400' : '#1E3A8A';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = phase === 'LUAR_DO_SERTAO' ? '#172554' : '#E5D3B3';
  ctx.fillRect(0, Math.floor(height * 0.52), width, Math.ceil(height * 0.48));
  ctx.strokeStyle = phase === 'LUAR_DO_SERTAO' ? '#22386E' : '#E2D1B3';
  ctx.lineWidth = 1;
  for (let x = 16; x < width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x + 18, 24); ctx.stroke();
  }
  const cx = width - 70, cy = 44;
  if (phase === 'SOL_PLENO') {
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a - 0.2) * 22, cy + Math.sin(a - 0.2) * 22);
      ctx.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34);
      ctx.lineTo(cx + Math.cos(a + 0.2) * 22, cy + Math.sin(a + 0.2) * 22);
      ctx.fillStyle = '#F4B400'; ctx.fill();
      ctx.strokeStyle = '#1B1B1B'; ctx.lineWidth = 2; ctx.stroke();
    }
  } else if (phase === 'CREPUSCULO') {
    ctx.strokeStyle = '#C0652E'; ctx.lineWidth = 3;
    for (let y = 68; y <= 116; y += 16) {
      ctx.beginPath(); ctx.moveTo(24, y); ctx.lineTo(width - 24, y); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = '#F5E9D3'; ctx.lineWidth = 2;
    for (const [sx, sy] of [[120, 32], [280, 48], [470, 28], [630, 56], [730, 32]]) {
      ctx.beginPath();
      ctx.moveTo(sx - 6, sy); ctx.lineTo(sx + 6, sy);
      ctx.moveTo(sx, sy - 6); ctx.lineTo(sx, sy + 6);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = phase === 'LUAR_DO_SERTAO' ? '#F5E9D3' : '#F4B400';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1B1B1B';
  ctx.stroke();
  ctx.strokeRect(2, 2, width - 4, height - 4);
}

export function drawIsoFarmStage(ctx: WoodcutCanvasContext2D, state: IsoFarmStageState): void {
  const perches: Array<[number, number, string, string]> = [
    [210, 95, '#C0652E', 'TERRA'], [670, 95, '#C8232C', 'FOGO'],
    [230, 175, '#1E3A8A', 'AGUA'], [650, 175, '#1D7846', 'AR'],
    [440, 54, '#F4B400', 'SOL'], [440, 192, '#4338CA', 'LUA'],
  ];
  ctx.strokeStyle = '#C0652E';
  ctx.lineWidth = 4;
  for (const [px, py] of perches) {
    ctx.beginPath(); ctx.moveTo(440, 120); ctx.lineTo(px, py); ctx.stroke();
  }
  drawIsoDiamond(ctx, 440, 120, 95, 42, '#D95D1E');
  ctx.fillStyle = '#1B1B1B'; ctx.font = 'bold 13px monospace';
  ctx.fillText(`SEDE NV.${state.sedeLevel} | MILHO:${state.storedMilho}`, 365, 124);
  for (const [px, py, hex, label] of perches) {
    drawIsoDiamond(ctx, px, py, 52, 22, hex);
    ctx.beginPath(); ctx.moveTo(px + 28, py); ctx.lineTo(px + 44, py - 9); ctx.lineTo(px + 28, py - 18); ctx.lineTo(px + 28, py);
    ctx.fillStyle = hex; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1B1B1B'; ctx.stroke();
    ctx.fillStyle = '#F5E9D3'; ctx.fillText(label, px - 18, py + 4);
  }
  for (let i = 0; i < Math.min(4, state.activeTowers); i++) {
    ctx.fillStyle = '#F4B400'; ctx.fillRect(90 + i * 32, 50, 18, 36);
    ctx.lineWidth = 3; ctx.strokeStyle = '#1B1B1B'; ctx.strokeRect(90 + i * 32, 50, 18, 36);
  }
  for (let r = 0; r < Math.min(8, state.roosterCount ?? 4); r++) {
    ctx.beginPath(); ctx.arc(330 + r * 30, 182, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#C8232C'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#1B1B1B'; ctx.stroke();
  }
}

export function drawArena3v3Stage(ctx: WoodcutCanvasContext2D, units: ArenaStageUnit[], popups: string[]): void {
  ctx.strokeStyle = '#1B1B1B'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(60, 48); ctx.lineTo(820, 48); ctx.moveTo(60, 58); ctx.lineTo(820, 58);
  for (let p = 90; p < 820; p += 55) { ctx.moveTo(p, 42); ctx.lineTo(p, 64); }
  ctx.stroke();
  drawIsoDiamond(ctx, 440, 136, 280, 74, '#F5E9D3');
  ctx.strokeStyle = '#F4B400'; ctx.lineWidth = 1;
  for (let s = 0; s < 12; s++) {
    ctx.beginPath(); ctx.moveTo(320 + s * 20, 128 + (s % 3) * 6);
    ctx.lineTo(328 + s * 20, 131 + (s % 3) * 6); ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(440, 136, 14, 0, Math.PI * 2); ctx.fillStyle = '#1B1B1B'; ctx.fill();
  ctx.beginPath(); ctx.arc(440, 136, 6, 0, Math.PI * 2); ctx.fillStyle = '#C8232C'; ctx.fill();
  units.slice(0, 6).forEach((u, idx) => {
    const isLeft = u.team ? u.team === 'A' : idx < 3;
    const slot = idx % 3, x = isLeft ? 190 + slot * 45 : 640 - slot * 45, y = 92 + slot * 38;
    ctx.fillStyle = isLeft ? '#D95D1E' : '#1E3A8A';
    ctx.fillRect(x - 16, y - 16, 32, 28); ctx.lineWidth = 3; ctx.strokeStyle = '#1B1B1B'; ctx.strokeRect(x - 16, y - 16, 32, 28);
    const ratio = Math.max(0, Math.min(1, u.vigor / Math.max(1, u.maxVigor)));
    ctx.fillStyle = '#1D7846'; ctx.fillRect(x - 22, y - 26, Math.round(44 * ratio), 5);
    ctx.fillStyle = '#F4B400'; ctx.fillRect(x - 22, y - 20, Math.round(44 * (Math.min(100, u.canto) / 100)), 4);
    ctx.fillStyle = '#1B1B1B'; ctx.fillText(u.name.slice(0, 10), x - 24, y + 24);
  });
  const banner = popups[0] ?? 'PAH! XILOGRAVURA';
  ctx.fillStyle = '#F4B400'; ctx.fillRect(340, 18, 200, 28);
  ctx.lineWidth = 3; ctx.strokeStyle = '#1B1B1B'; ctx.strokeRect(340, 18, 200, 28);
  ctx.fillStyle = '#1B1B1B';
  ctx.fillText(banner.startsWith('PAH!') ? banner.slice(0, 24) : `PAH! ${banner.slice(0, 18)}`, 352, 36);
}

export function drawClanBoardStage(ctx: WoodcutCanvasContext2D, lap: number, controlledTerritories: number): void {
  for (let node = 0; node < 18; node++) {
    const angle = (node / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.round(310 + Math.cos(angle) * 170), Math.round(125 + Math.sin(angle) * 68), 10, 0, Math.PI * 2);
    ctx.fillStyle = node < lap ? '#F4B400' : '#F5E9D3';
    ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = '#1B1B1B'; ctx.stroke();
  }
  for (let t = 0; t < 6; t++) {
    drawIsoDiamond(ctx, 600 + (t % 3) * 74, 85 + Math.floor(t / 3) * 68, 30, 18, t < controlledTerritories ? '#1D7846' : '#C8232C');
  }
  ctx.fillStyle = '#1B1B1B';
  ctx.fillText(`VOLTA CORRIDA: ${lap}/18 | VILAS: ${controlledTerritories}`, 210, 224);
}
