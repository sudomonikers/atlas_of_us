import { HandLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import wasmLoaderPath from '@mediapipe/tasks-vision/vision_wasm_internal.js?url';
import wasmBinaryPath from '@mediapipe/tasks-vision/vision_wasm_internal.wasm?url';

// Where someone's body or hands are in a camera frame, from MediaPipe's pose and hand landmarkers, which run in the
// browser: the video never leaves the device. This file is only loaded when a camera test starts, so the models and
// their runtime are only downloaded then, and each model only when a test needs it.

//a point on the body in the frame, in pixels with y down, and how sure the model is that it can be seen, 0 to 1
export interface Point {
  x: number;
  y: number;
  seen: number;
}

//the lines between points that draw the body, without the face
export const BONES: [number, number][] = PoseLandmarker.POSE_CONNECTIONS.map((c): [number, number] => [c.start, c.end]).filter(([a, b]) => a >= 11 && b >= 11);

//the lines between a hand's points: its wrist, the knuckles and each finger
export const HAND_BONES: [number, number][] = HandLandmarker.HAND_CONNECTIONS.map((c): [number, number] => [c.start, c.end]);

//a model, made once. The graphics card does the work where it can, and the processor where it can't
function once<T>(make: (delegate: 'GPU' | 'CPU') => Promise<T>) {
  let loading: Promise<T> | undefined;
  return () => {
    loading ??= make('GPU').catch(() => make('CPU'));
    loading.catch(() => (loading = undefined));
    return loading;
  };
}

//the body model. It keeps following someone it has found even when it's less sure of them, so a fast movement like a
//jump doesn't lose them
export const loadPose = once((delegate) =>
  PoseLandmarker.createFromOptions(
    { wasmLoaderPath, wasmBinaryPath },
    { baseOptions: { modelAssetPath: '/pose/pose_landmarker_lite.task', delegate }, runningMode: 'VIDEO', numPoses: 1, minPosePresenceConfidence: 0.3, minTrackingConfidence: 0.3 },
  ),
);

//the hand model, for both hands close up, as it's sure enough of a hand to follow it while it moves fast
export const loadHands = once((delegate) =>
  HandLandmarker.createFromOptions(
    { wasmLoaderPath, wasmBinaryPath },
    {
      baseOptions: { modelAssetPath: '/pose/hand_landmarker.task', delegate },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.3,
      minHandPresenceConfidence: 0.3,
      minTrackingConfidence: 0.3,
    },
  ),
);

//the body in the video's current frame, or null when there's no one in it
export function findBody(model: PoseLandmarker, video: HTMLVideoElement, at: number): Point[] | null {
  let body: Point[] | null = null;
  model.detectForVideo(video, at, (result) => {
    const found = result.landmarks[0];
    if (found) body = found.map((l) => ({ x: l.x * video.videoWidth, y: l.y * video.videoHeight, seen: l.visibility ?? 1 }));
  });
  return body;
}

//the hands in the video's current frame, each its 21 points, none when there are none
export function findHands(model: HandLandmarker, video: HTMLVideoElement, at: number): Point[][] {
  return model.detectForVideo(video, at).landmarks.map((hand) => hand.map((l) => ({ x: l.x * video.videoWidth, y: l.y * video.videoHeight, seen: 1 })));
}
