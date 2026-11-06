import { FaceLandmarker, FilesetResolver, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';

// Keep the remote WASM runtime in lockstep with the bundled JS package.
const VERSION = '0.10.35';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export type LandmarkEngine = {
  detect(video: HTMLVideoElement, timestampMs: number): FaceLandmarkerResult;
  close(): void;
};

export async function createLandmarkEngine(): Promise<LandmarkEngine> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
    runningMode: 'VIDEO',
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
  return {
    detect: (video, timestampMs) => landmarker.detectForVideo(video, timestampMs),
    close: () => landmarker.close(),
  };
}

export async function detectImageFace(image: HTMLImageElement) {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const landmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' }, runningMode: 'IMAGE', numFaces: 1,
  });
  try { return landmarker.detect(image).faceLandmarks[0]; }
  finally { landmarker.close(); }
}
