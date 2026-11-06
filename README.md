# NEYA — Phase 1

This repository implements the first milestone of the NEYA PRD: a responsive React dashboard and a live face studio using the webcam and MediaPipe Face Landmarker. It does not yet detect makeup or provide virtual try-on, product recommendations, or voice guidance.

## Run locally

Requirements: Node.js 20+, a webcam, and a current browser with camera support.

```bash
npm install
npm run dev
```

Open the localhost URL printed by Vite. Choose **Open face studio**, then **Enable camera**. Allow access in the browser prompt. Switch between **Face mesh**, **Regions**, and **No overlay**. Move your head gently to check that the overlay follows. **End camera** stops the camera track.

Camera access requires localhost or HTTPS. The MediaPipe WASM runtime loads from jsDelivr and the model loads from Google Storage, so the first use needs an internet connection. No raw video is stored or sent to a NEYA backend. Browser requests for the model and runtime are separate asset downloads.

## Commands

```bash
npm run build
npm test
npm run preview
```

## Project layout

- `src/App.tsx`: dashboard and face studio interface
- `src/hooks/useFaceSession.ts`: camera lifecycle and frame processing
- `src/vision/faceLandmarker.ts`: MediaPipe model initialization
- `src/vision/drawFace.ts`: mesh and region overlays
- `src/vision/regions.ts`: facial landmark anchor mapping
- `docs/`: architecture, development plan, and test instructions

## Current limitations

- Face regions are approximate landmark anchors; they are not semantic segmentation or makeup detection.
- Detection runs on the browser main thread. A worker or GPU path should be evaluated if supported device benchmarks show dropped frames.
- Camera and tracking behavior must be verified with a physical webcam on each target browser/device. Automated build and unit tests alone cannot prove live tracking quality.
