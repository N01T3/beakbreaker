export interface VillageBuildingRenderData {
  id: string; name: string; isoX: number; isoY: number;
  width: number; height: number; level: number; icon: string; isSelected?: boolean;
}
export interface RoamingRoosterRenderData {
  id: string; x: number; y: number; facing: 'left' | 'right'; isPecking?: boolean;
}

export function drawVillageTerrain(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number): void {
  const grad = ctx.createRadialGradient(w / 2, h * 0.4, 30, w / 2, h * 0.4, w * 0.7);
  grad.addColorStop(0, '#426829');
  grad.addColorStop(0.5, '#2D481C');
  grad.addColorStop(1, '#18290E');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = '#7C5230';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.35);
  ctx.quadraticCurveTo(w * 0.4, h * 0.55, w * 0.25, h * 0.7);
  ctx.moveTo(w * 0.5, h * 0.35);
  ctx.quadraticCurveTo(w * 0.6, h * 0.55, w * 0.75, h * 0.7);
  ctx.stroke();

  ctx.strokeStyle = '#94663E';
  ctx.lineWidth = 12;
  ctx.stroke();
  ctx.strokeStyle = '#5A3517';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.restore();
}

export function drawBuildingShadowAndCursor(ctx: CanvasRenderingContext2D, b: VillageBuildingRenderData): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(b.isoX, b.isoY + b.height * 0.4, b.width * 0.45, b.height * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  if (b.isSelected) {
    ctx.strokeStyle = '#FFE066';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.ellipse(b.isoX, b.isoY + b.height * 0.4, b.width * 0.52, b.height * 0.26, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawVectorBuilding(ctx: CanvasRenderingContext2D, b: VillageBuildingRenderData, img?: HTMLImageElement | null): void {
  ctx.save();
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, b.isoX - b.width / 2, b.isoY - b.height / 2, b.width, b.height);
  } else {
    ctx.fillStyle = '#45230F';
    ctx.fillRect(b.isoX - b.width * 0.4, b.isoY - b.height * 0.3, b.width * 0.8, b.height * 0.6);
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.moveTo(b.isoX, b.isoY - b.height * 0.5);
    ctx.lineTo(b.isoX + b.width * 0.48, b.isoY - b.height * 0.25);
    ctx.lineTo(b.isoX - b.width * 0.48, b.isoY - b.height * 0.25);
    ctx.closePath();
    ctx.fill();
  }

  const bx = b.isoX - 22;
  const by = b.isoY + b.height * 0.25;
  ctx.fillStyle = '#3B82F6';
  ctx.strokeStyle = '#FFE066';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, 44, 18, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Nv. ${b.level}`, b.isoX, by + 9);
  ctx.restore();
}

export function drawRoamingRooster(ctx: CanvasRenderingContext2D, r: RoamingRoosterRenderData, t: number, img?: HTMLImageElement | null): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(r.x, r.y + 12, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const bob = Math.sin(t * 0.008) * 3;
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    ctx.translate(r.x, r.y + bob);
    if (r.facing === 'left') ctx.scale(-1, 1);
    ctx.drawImage(img, -14, -20, 28, 28);
    ctx.restore();
  } else {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(r.x, r.y + bob, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawHarvestBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, t: number): void {
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 0.004) * 5);
  const pulse = 1.0 + Math.sin(t * 0.006) * 0.05;
  ctx.scale(pulse, pulse);

  ctx.fillStyle = '#16A34A';
  ctx.strokeStyle = '#86EFAC';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-45, -13, 90, 26, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#FFF';
  ctx.font = '900 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 1);
  ctx.restore();
}