# Development plan and status

## Phase 1 — camera and face intelligence

Implemented in source:

- React and TypeScript application with responsive dashboard
- Explicit camera permission request and error states
- Webcam preview and camera stop lifecycle
- MediaPipe Face Landmarker in video mode
- Live mesh drawing and approximate eyes, lips, cheeks, nose, forehead, and jaw region anchors
- Tracking status, landmark count, and observed processing rate
- Model loading, face searching, permission denial, camera unavailable, and disconnect states

Verification status is recorded in `testing.md`. Physical webcam verification is a required acceptance gate, not inferred from code or simulated frames.

## Later phases, deferred

2. Virtual makeup engine and independent makeup layers
3. Face mapping guidance and techniques
4. Collection and product data
5. Voice and AI assistance
6. Alternatives, exploration, and saved looks

The dashboard labels later capabilities as coming soon. The current region overlay is a foundation for guidance, not a finished makeup placement recommendation.
