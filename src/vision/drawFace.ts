import { FaceLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import { regionCenters, type RegionName } from './regions';

export type OverlayMode = 'mesh' | 'regions' | 'off';

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
    x: offsetX + landmark.x * video.videoWidth * scale,
    y: offsetY + landmark.y * video.videoHeight * scale,
  });

  if (mode === 'mesh') {
    ctx.lineWidth = Math.max(0.7, dpr * 0.65);
    ctx.strokeStyle = 'rgba(236, 255, 231, .43)';
    ctx.beginPath();
    for (const connection of FaceLandmarker.FACE_LANDMARKS_TESSELATION) {
      const start = landmarks[connection.start];
      const end = landmarks[connection.end];
      if (!start || !end) continue;
      const a = point(start);
      const b = point(end);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(246, 229, 188, .95)';
    ctx.lineWidth = 2 * dpr;
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
  }

  if (mode === 'regions') {
    const centers = regionCenters(landmarks);
    ctx.font = `${Math.round(10 * dpr)}px "DM Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [name, center] of Object.entries(centers) as [RegionName, { x: number; y: number }][]) {
      const label = LABELS[name];
      if (!label) continue;
      const { x, y } = point(center);
      const textWidth = ctx.measureText(label).width;
      const pillWidth = textWidth + 20 * dpr;
      const pillHeight = 24 * dpr;
      ctx.fillStyle = 'rgba(37, 53, 45, .83)';
      ctx.beginPath();
      ctx.roundRect(x - pillWidth / 2, y - pillHeight / 2, pillWidth, pillHeight, pillHeight / 2);
      ctx.fill();
      ctx.fillStyle = '#f8f5e9';
      ctx.fillText(label, x, y + dpr);
    }
  }
}
