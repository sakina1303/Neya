import { FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { regionCenters, type RegionName } from './regions';

export type OverlayMode = 'mesh' | 'regions' | 'off';

export function drawPreviewMesh(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number, mirrored = false) {
  ctx.save();
  ctx.strokeStyle = 'rgba(241, 255, 245, .13)';
  ctx.lineWidth = Math.max(.7, width * .0007);
  ctx.beginPath();
  for (const [index, connection] of FaceLandmarker.FACE_LANDMARKS_TESSELATION.entries()) {
    if (index % 2 || !landmarks[connection.start] || !landmarks[connection.end]) continue;
    const a = landmarks[connection.start], b = landmarks[connection.end];
    ctx.moveTo((mirrored ? 1 - a.x : a.x) * width, a.y * height);
    ctx.lineTo((mirrored ? 1 - b.x : b.x) * width, b.y * height);
  }
  ctx.stroke();
  ctx.restore();
}

const LABELS: Partial<Record<RegionName, string>> = {
  leftEye: 'EYE', rightEye: 'EYE', lips: 'LIPS',
  leftCheek: 'CHEEK', rightCheek: 'CHEEK', forehead: 'FOREHEAD', nose: 'NOSE', jaw: 'JAW',
};

export function drawFace(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[] | undefined,
  mode: OverlayMode,
) {
  const bounds = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.round(bounds.width * dpr);
  const height = Math.round(bounds.height * dpr);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  if (!landmarks || mode === 'off' || !video.videoWidth || !video.videoHeight) return;

  // The camera uses object-fit: cover. Apply the same crop to normalized landmarks.
  const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
  const offsetX = (width - video.videoWidth * scale) / 2;
  const offsetY = (height - video.videoHeight * scale) / 2;
  const point = (landmark: Pick<NormalizedLandmark, 'x' | 'y'>) => ({
    // Mirror coordinates to match the front-facing video, while keeping labels readable.
    x: width - (offsetX + landmark.x * video.videoWidth * scale),
    y: offsetY + landmark.y * video.videoHeight * scale,
  });

  if (mode === 'mesh') {
    // An airy technical mesh shows tracking without turning the face into a mask.
    ctx.lineWidth = Math.max(0.55, dpr * 0.45);
    ctx.strokeStyle = 'rgba(224, 248, 237, .26)';
    ctx.beginPath();
    for (const [index, connection] of FaceLandmarker.FACE_LANDMARKS_TESSELATION.entries()) {
      if (index % 2 === 1) continue;
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (!start || !end) continue;
      const a = point(start);
      const b = point(end);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(238, 247, 226, .62)';
    ctx.lineWidth = Math.max(0.9, dpr * 0.75);
    for (const connections of [FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, FaceLandmarker.FACE_LANDMARKS_LIPS, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE]) {
      ctx.beginPath();
      for (const connection of connections) {
        const a = point(landmarks[connection.start]);
        const b = point(landmarks[connection.end]);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(248, 255, 238, .8)';
    for (const index of [10, 1, 33, 133, 263, 362, 61, 291, 152]) {
      const landmark = landmarks[index];
      if (!landmark) continue;
      const { x, y } = point(landmark);
      ctx.beginPath();
      ctx.arc(x, y, 1.7 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (mode === 'regions') {
    const centers = regionCenters(landmarks);
    ctx.font = `600 ${Math.round(9 * dpr)}px "DM Sans", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (const [name, center] of Object.entries(centers) as [RegionName, { x: number; y: number }][]) {
      const label = LABELS[name];
      if (!label) continue;
      const { x, y } = point(center);
      const direction = x < width / 2 ? 1 : -1;
      const endX = x + direction * 14 * dpr;
      ctx.strokeStyle = 'rgba(240, 250, 237, .8)';
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.arc(x, y, 4 * dpr, 0, Math.PI * 2);
      ctx.moveTo(x + direction * 4 * dpr, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      ctx.fillStyle = '#f5f8ed';
      const textWidth = ctx.measureText(label).width;
      ctx.fillText(label, direction > 0 ? endX + 3 * dpr : endX - textWidth - 3 * dpr, y);
    }
  }
}
