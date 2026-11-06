# Phase 1 architecture

The repository was empty at the start of implementation. There was no existing frontend, backend, configuration, or working feature to preserve. Phase 1 therefore uses a small Vite, React, and TypeScript frontend. A backend is deferred because camera tracking runs in the browser and Phase 1 has no account, catalog, or AI services.

## Data flow

1. The user explicitly starts camera access in the Face Studio.
2. `useFaceSession` calls `getUserMedia` and attaches the stream to a muted, inline video element.
3. `faceLandmarker.ts` loads the MediaPipe WASM runtime and Face Landmarker model, then configures one-face `VIDEO` mode with confidence thresholds.
4. The frame loop calls `detectForVideo` only for new video frames and throttles requests to approximately 30 per second.
5. `drawFace.ts` draws the MediaPipe tessellation or approximate region anchors on a canvas aligned to the `object-fit: cover` video crop. The video and canvas share the same mirrored container.
6. Stopping the session closes the engine, stops media tracks, and clears the overlay.

## Boundaries

Camera lifecycle, model initialization, region mapping, and canvas drawing are independent of the dashboard. Future makeup rendering can consume landmark results without changing the camera permission flow. Future AI orchestration and persistence should be separate services; no backend is needed in this phase.

## Dependencies

Runtime: React, React DOM, MediaPipe Tasks Vision, Lucide icons. Development: Vite, TypeScript, Vitest, React plugin, React type packages.

MediaPipe runtime and model URLs are fixed in `src/vision/faceLandmarker.ts`. Production deployment should serve versioned, self-hosted copies when offline operation, content security policy, or third-party asset availability becomes a requirement.
