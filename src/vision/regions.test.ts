import { describe, expect, it } from 'vitest';
import { REGION_ANCHORS, regionCenters } from './regions';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

describe('regionCenters', () => {
  it('maps real landmark indices to normalized region centers', () => {
    const landmarks = Array.from({ length: 478 }, (_, i) => ({ x: i / 500, y: i / 1000, z: 0 })) as NormalizedLandmark[];
    const centers = regionCenters(landmarks);
    const expected = REGION_ANCHORS.lips.reduce((sum, index) => sum + index / 500, 0) / REGION_ANCHORS.lips.length;
    expect(centers.lips.x).toBeCloseTo(expected);
    expect(Object.keys(centers)).toHaveLength(8);
  });
});
