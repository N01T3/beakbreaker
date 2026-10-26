export type CordelSkyPhase = 'SOL_PLENO' | 'CREPUSCULO' | 'LUAR_DO_SERTAO';

export interface WoodcutCanvasContext2D {
  fillStyle: string | CanvasGradient | CanvasPattern;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  fillRect(x: number, y: number, w: number, h: number): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  fill(): void;
  stroke(): void;
  arc(x: number, y: number, r: number, startAngle: number, endAngle: number): void;
  fillText(text: string, x: number, y: number): void;
}

export interface IsoFarmStageState {
  sedeLevel: number;
  storedMilho: number;
  activeTowers: number;
  roosterCount?: number;
}

export interface ArenaStageUnit {
  name: string;
  vigor: number;
  maxVigor: number;
  canto: number;
  team?: 'A' | 'B';
}

function drawIsoDiamond(ctx: WoodcutCanvasContext2D, cx: number, cy: number, rx: number, ry: number, fillHex: string): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - ry);
  ctx.lineTo(cx + rx, cy);
  ctx.lineTo(cx, cy + ry);
  ctx.lineTo(cx - rx, cy);
  ctx.closePath();
  ctx.fillStyle = fillHex;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1B1B1B';
  ctx.stroke();
}

export function drawWoodcutBackdrop(ctx: WoodcutCanvasContext2D, width: number, height: number, phase: CordelSkyPhase): void {
  ctx.fillStyle = phase === 'SOL_PLENO' ? '#F5E9D3' : phase === 'CREPUSCULO' ? '#F4B400' : '#1E3A8A';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = phase === 'LUAR_DO_SERTAO' ? '#172554' : '#E5D3B3';
  ctx.fillRect(0, Math.floor(height * 0.52), width, Math.ceil(height * 0.48));
  ctx.beginPath();
  ctx.arc(width - 70, 44, 20, 0, Math.PI * 2);
  ctx.fillStyle = phase === 'LUAR_DO_SERTAO' ? '#F5E9D3' : '#F4B400';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1B1B1B';
  ctx.stroke();
  ctx.strokeRect(2, 2, width - 4, height - 4);
}

export function drawIsoFarmStage(ctx: WoodcutCanvasContext2D, state: IsoFarmStageState): void {
  drawIsoDiamond(ctx, 440, 120, 95, 42, '#D95D1E');
  ctx.fillStyle = '#1B1B1B';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`SEDE NV.${state.sedeLevel} | MILHO:${state.storedMilho}`, 365, 124);
  const perches: Array<[number, number, string, string]> = [
    [220, 95, '#D95D1E', 'TERRA'],
    [660, 95, '#C8232C', 'FOGO'],
    [240, 175, '#1E3A8A', 'AGUA'],
    [640, 175, '#1D7846', 'AR'],
  ];
  for (const [px, py, hex, label] of perches) {
    drawIsoDiamond(ctx, px, py, 56, 24, hex);
    ctx.fillStyle = '#F5E9D3';
    ctx.fillText(label, px - 18, py + 4);
  }
  for (let i = 0; i < Math.min(4, state.activeTowers); i++) {
    ctx.fillStyle = '#F4B400';
    ctx.fillRect(90 + i * 32, 50, 18, 36);
    ctx.strokeRect(90 + i * 32, 50, 18, 36);
  }
  for (let r = 0; r < Math.min(8, state.roosterCount ?? 4); r++) {
    ctx.beginPath();
    ctx.arc(330 + r * 30, 182, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#C8232C';
    ctx.fill();
    ctx.stroke();
  }
}

export function drawArena3v3Stage(ctx: WoodcutCanvasContext2D, units: ArenaStageUnit[], popups: string[]): void {
  drawIsoDiamond(ctx, 440, 136, 280, 74, '#F5E9D3');
  units.slice(0, 6).forEach((u, idx) => {
    const isLeft = u.team ? u.team === 'A' : idx < 3;
    const slot = idx % 3;
    const x = isLeft ? 190 + slot * 45 : 640 - slot * 45;
    const y = 92 + slot * 38;
    ctx.fillStyle = isLeft ? '#D95D1E' : '#1E3A8A';
    ctx.fillRect(x - 16, y - 16, 32, 28);
    ctx.strokeRect(x - 16, y - 16, 32, 28);
    const ratio = Math.max(0, Math.min(1, u.vigor / Math.max(1, u.maxVigor)));
    ctx.fillStyle = '#1D7846';
    ctx.fillRect(x - 22, y - 26, Math.round(44 * ratio), 5);
    ctx.fillStyle = '#F4B400';
    ctx.fillRect(x - 22, y - 20, Math.round(44 * (Math.min(100, u.canto) / 100)), 4);
    ctx.fillStyle = '#1B1B1B';
    ctx.fillText(u.name.slice(0, 10), x - 24, y + 24);
  });
  const banner = popups[0] ?? 'PAH! XILOGRAVURA';
  ctx.fillStyle = '#F4B400';
  ctx.fillRect(340, 18, 200, 28);
  ctx.strokeRect(340, 18, 200, 28);
  ctx.fillStyle = '#1B1B1B';
  ctx.fillText(`PAH! ${banner.slice(0, 18)}`, 352, 36);
}

export function drawClanBoardStage(ctx: WoodcutCanvasContext2D, lap: number, controlledTerritories: number): void {
  for (let node = 0; node < 18; node++) {
    const angle = (node / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.round(310 + Math.cos(angle) * 170), Math.round(125 + Math.sin(angle) * 68), 10, 0, Math.PI * 2);
    ctx.fillStyle = node < lap ? '#F4B400' : '#F5E9D3';
    ctx.fill();
    ctx.stroke();
  }
  for (let t = 0; t < 6; t++) {
    drawIsoDiamond(ctx, 600 + (t % 3) * 74, 85 + Math.floor(t / 3) * 68, 30, 18, t < controlledTerritories ? '#1D7846' : '#C8232C');
  }
  ctx.fillStyle = '#1B1B1B';
  ctx.fillText(`VOLTA CORRIDA: ${lap}/18 | VILAS: ${controlledTerritories}`, 210, 224);
}
