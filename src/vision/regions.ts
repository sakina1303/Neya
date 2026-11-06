import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type RegionName = 'leftEye' | 'rightEye' | 'lips' | 'nose' | 'leftCheek' | 'rightCheek' | 'forehead' | 'jaw';
export type Point = { x: number; y: number };

// MediaPipe's named landmark indices. These are anchors, not semantic makeup analysis.
export const REGION_ANCHORS: Record<RegionName, number[]> = {
  leftEye: [33, 133, 159, 145],
  rightEye: [362, 263, 386, 374],
  lips: [61, 291, 0, 17],
  nose: [1, 4, 168, 197],
  leftCheek: [50, 101, 205, 187],
  rightCheek: [280, 330, 425, 411],
  forehead: [10, 67, 297],
  jaw: [152, 172, 397],
};

export function regionCenters(landmarks: NormalizedLandmark[]): Record<RegionName, Point> {
  return Object.fromEntries(Object.entries(REGION_ANCHORS).map(([name, indices]) => {
    const points = indices.map(index => landmarks[index]).filter(Boolean);
    return [name, {
      x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
      y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
    }];
  })) as Record<RegionName, Point>;
}
