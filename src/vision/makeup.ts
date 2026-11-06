import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { LookLayers } from '../data/beauty';

type Point = { x: number; y: number };
const outerLip = [61, 40, 37, 0, 267, 270, 291, 321, 314, 17, 84, 91];
const innerLip = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 317, 14, 87, 86, 85, 84];
const oval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];

function colorWithAlpha(hex: string, alpha: number) {
  const value = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#9b6f68';
  const r = parseInt(value.slice(1, 3), 16), g = parseInt(value.slice(3, 5), 16), b = parseInt(value.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, alpha))})`;
}

export function drawMakeup(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number, layers: LookLayers, mirrored = false) {
  if (landmarks.length < 400) return;
  const point = (index: number): Point => ({ x: (mirrored ? 1 - landmarks[index].x : landmarks[index].x) * width, y: landmarks[index].y * height });
  const path = (indices: number[]) => {
    const first = point(indices[0]); ctx.moveTo(first.x, first.y);
    for (const index of indices.slice(1)) { const p = point(index); ctx.lineTo(p.x, p.y); }
    ctx.closePath();
  };
  const radial = (center: Point, radiusX: number, radiusY: number, color: string, opacity: number) => {
    ctx.save(); ctx.translate(center.x, center.y); ctx.scale(radiusX, radiusY);
    const gradient = ctx.createRadialGradient(0, 0, .05, 0, 0, 1);
    gradient.addColorStop(0, colorWithAlpha(color, opacity));
    gradient.addColorStop(.58, colorWithAlpha(color, opacity * .45));
    gradient.addColorStop(1, colorWithAlpha(color, 0));
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  const faceWidth = Math.abs(point(234).x - point(454).x);
  const faceHeight = Math.abs(point(10).y - point(152).y);

  const foundation = layers.Foundation;
  if (foundation) {
    ctx.save(); ctx.beginPath(); path(oval); ctx.clip(); ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = colorWithAlpha(foundation.color, foundation.intensity * .24); ctx.fillRect(0, 0, width, height); ctx.restore();
  }
  const concealer = layers.Concealer;
  if (concealer) {
    for (const index of [117, 346]) radial(point(index), faceWidth * .18, faceHeight * .07, concealer.color, concealer.intensity * .14);
  }
  const contour = layers.Contour;
  if (contour) {
    for (const index of contour.technique === 'Cheekbone lift' ? [117, 346] : [123, 352]) radial(point(index), faceWidth * .24, faceHeight * .13, contour.color, contour.intensity * .19);
  }
  const blush = layers.Blush;
  if (blush) {
    const points = blush.technique === 'Apples' ? [205, 425] : blush.technique === 'Sun-kissed' ? [50, 280] : [117, 346];
    for (const index of points) radial(point(index), faceWidth * .26, faceHeight * .15, blush.color, blush.intensity * .44);
    if (blush.technique === 'Sun-kissed') radial(point(1), faceWidth * .13, faceHeight * .07, blush.color, blush.intensity * .12);
  }
  const highlighter = layers.Highlighter;
  if (highlighter) {
    for (const index of [116, 345]) radial(point(index), faceWidth * .13, faceHeight * .07, highlighter.color, highlighter.intensity * .22);
    radial(point(1), faceWidth * .06, faceHeight * .1, highlighter.color, highlighter.intensity * .18);
  }
  const shadow = layers.Eyeshadow;
  if (shadow) {
    for (const [a, b, top] of [[33, 133, 159], [362, 263, 386]]) {
      const left = point(a), right = point(b), upper = point(top);
      const centerX = shadow.technique === 'Outer corner' ? left.x * .68 + right.x * .32 : (left.x + right.x) / 2;
      radial({ x: centerX, y: upper.y - faceHeight * .025 }, Math.abs(left.x - right.x) * (shadow.technique === 'Halo' ? .46 : .68), faceHeight * .075, shadow.color, shadow.intensity * .38);
    }
  }
  const eyeliner = layers.Eyeliner;
  if (eyeliner) {
    ctx.save(); ctx.strokeStyle = colorWithAlpha(eyeliner.color, eyeliner.intensity * .85);
    ctx.lineWidth = Math.max(1.2, faceWidth * .008); ctx.lineCap = 'round';
    for (const indices of [[33, 160, 158, 133], [362, 385, 387, 263]]) {
      ctx.beginPath(); const first = point(indices[0]); ctx.moveTo(first.x, first.y);
      for (const index of indices.slice(1)) { const p = point(index); ctx.lineTo(p.x, p.y); }
      ctx.stroke();
      if (eyeliner.technique === 'Soft wing' || eyeliner.technique === 'Extended wing') {
        const outer = first, mid = point(indices[1]);
        const direction = Math.sign(outer.x - mid.x) || 1;
        ctx.beginPath(); ctx.moveTo(outer.x, outer.y); ctx.lineTo(outer.x + direction * faceWidth * (eyeliner.technique === 'Extended wing' ? .09 : .055), outer.y - faceHeight * .045); ctx.stroke();
      }
    }
    ctx.restore();
  }
  const mascara = layers.Mascara;
  if (mascara) {
    ctx.save(); ctx.strokeStyle = colorWithAlpha(mascara.color, mascara.intensity * .55); ctx.lineWidth = Math.max(1, faceWidth * .005);
    for (const indices of [[33, 160, 158, 133], [362, 385, 387, 263]]) {
      ctx.beginPath(); const p = point(indices[0]); ctx.moveTo(p.x, p.y);
      for (const index of indices.slice(1)) { const q = point(index); ctx.lineTo(q.x, q.y); } ctx.stroke();
    } ctx.restore();
  }
  const lip = layers.Lipstick;
  if (lip) {
    ctx.save(); ctx.beginPath(); path(outerLip); path(innerLip); ctx.clip('evenodd');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = colorWithAlpha(lip.color, lip.intensity * (lip.technique === 'Soft blur' ? .42 : lip.finish === 'Glossy' ? .55 : .68));
    ctx.fillRect(0, 0, width, height); ctx.restore();
  }
  const liner = layers['Lip liner'];
  if (liner) {
    ctx.save(); ctx.beginPath(); path(outerLip);
    ctx.strokeStyle = colorWithAlpha(liner.color, liner.intensity * .72);
    ctx.lineWidth = Math.max(1, faceWidth * .007); ctx.stroke(); ctx.restore();
  }
  const gloss = layers['Lip gloss'];
  if (gloss) {
    ctx.save(); ctx.beginPath(); path(outerLip); path(innerLip); ctx.clip('evenodd');
    ctx.fillStyle = colorWithAlpha(gloss.color, gloss.intensity * .22);
    ctx.fillRect(0, 0, width, height); ctx.restore();
  }
  if (gloss || lip?.finish === 'Glossy') {
    const p = point(17); radial({ x: p.x, y: p.y - faceHeight * .018 }, faceWidth * .1, faceHeight * .018, '#ffffff', (gloss?.intensity ?? lip?.intensity ?? 0) * .25);
  }
}
