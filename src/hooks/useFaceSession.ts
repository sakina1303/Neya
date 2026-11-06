import { useCallback, useEffect, useRef, useState } from 'react';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { createLandmarkEngine, type LandmarkEngine } from '../vision/faceLandmarker';
import { drawFace, type OverlayMode } from '../vision/drawFace';

export type SessionStatus = 'idle' | 'requesting' | 'loading-model' | 'searching' | 'tracking' | 'error';
type SessionState = { status: SessionStatus; error?: string; framesPerSecond: number; landmarkCount: number };

function cameraError(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') return 'Camera access was blocked. Allow access in your browser settings, then try again.';
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') return 'No camera was found. Connect a webcam and try again.';
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') return 'Your camera is in use by another app. Close it there and try again.';
    if (error.name === 'OverconstrainedError') return 'This camera does not support the requested settings. Try another camera.';
  }
  return error instanceof Error ? error.message : 'The camera or face tracker could not start. Please try again.';
}

export function useFaceSession() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<LandmarkEngine | null>(null);
  const frameRef = useRef<number>(0);
  const runRef = useRef(0);
  const modeRef = useRef<OverlayMode>('mesh');
  const landmarksRef = useRef<NormalizedLandmark[] | undefined>(undefined);
  const [mode, setMode] = useState<OverlayMode>('mesh');
  const [state, setState] = useState<SessionState>({ status: 'idle', framesPerSecond: 0, landmarkCount: 0 });

  const stop = useCallback(() => {
    runRef.current += 1;
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    engineRef.current?.close();
    engineRef.current = null;
    landmarksRef.current = undefined;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setState({ status: 'idle', framesPerSecond: 0, landmarkCount: 0 });
  }, []);

  const start = useCallback(async () => {
    stop();
    const run = runRef.current;
    if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
      setState({ status: 'error', error: 'Camera access requires a secure HTTPS page or localhost.', framesPerSecond: 0, landmarkCount: 0 });
      return;
    }
    setState({ status: 'requesting', framesPerSecond: 0, landmarkCount: 0 });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
      });
      if (run !== runRef.current) { stream.getTracks().forEach(track => track.stop()); return; }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error('The camera preview is unavailable.');
      video.srcObject = stream;
      await video.play();
      if (run !== runRef.current) return;
      setState({ status: 'loading-model', framesPerSecond: 0, landmarkCount: 0 });
      const engine = await createLandmarkEngine();
      if (run !== runRef.current) { engine.close(); return; }
      engineRef.current = engine;
      setState({ status: 'searching', framesPerSecond: 0, landmarkCount: 0 });

      let lastVideoTime = -1;
      let lastDetectAt = 0;
      let samples = 0;
      let sampleStart = performance.now();
      let lastSeen = 0;
      const tick = (now: number) => {
        if (run !== runRef.current) return;
        frameRef.current = requestAnimationFrame(tick);
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastVideoTime || now - lastDetectAt < 33) return;
        lastVideoTime = video.currentTime;
        lastDetectAt = now;
        try {
          const result = engine.detect(video, now);
          const face = result.faceLandmarks[0];
          landmarksRef.current = face;
          if (face) lastSeen = now;
          const visible = !!face && now - lastSeen < 300;
          drawFace(canvasRef.current!, video, face, modeRef.current);
          samples += 1;
          if (now - sampleStart >= 1000) {
            const fps = Math.round(samples * 1000 / (now - sampleStart));
            samples = 0;
            sampleStart = now;
            setState({ status: visible ? 'tracking' : 'searching', framesPerSecond: fps, landmarkCount: face?.length ?? 0 });
          }
        } catch (error) {
          cancelAnimationFrame(frameRef.current);
          streamRef.current?.getTracks().forEach(track => track.stop());
          streamRef.current = null;
          engineRef.current?.close();
          engineRef.current = null;
          video.srcObject = null;
          setState({ status: 'error', error: cameraError(error), framesPerSecond: 0, landmarkCount: 0 });
        }
      };
      frameRef.current = requestAnimationFrame(tick);
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (run === runRef.current) {
          stop();
          setState({ status: 'error', error: 'The camera disconnected. Reconnect it and try again.', framesPerSecond: 0, landmarkCount: 0 });
        }
      }, { once: true });
    } catch (error) {
      if (run !== runRef.current) return;
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setState({ status: 'error', error: cameraError(error), framesPerSecond: 0, landmarkCount: 0 });
    }
  }, [stop]);

  const changeMode = useCallback((next: OverlayMode) => {
    modeRef.current = next;
    setMode(next);
    if (canvasRef.current && videoRef.current) drawFace(canvasRef.current, videoRef.current, landmarksRef.current, next);
  }, []);

  useEffect(() => () => {
    runRef.current += 1;
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach(track => track.stop());
    engineRef.current?.close();
  }, []);

  return { videoRef, canvasRef, state, mode, setMode: changeMode, start, stop };
}
