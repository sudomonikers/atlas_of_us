import { useEffect, useRef } from 'react';
import { now, since } from './test_kit';

//calls onFrame with the seconds since it started, every frame while running
export function useFrames(running: boolean, onFrame: (seconds: number) => void) {
  const frame = useRef(onFrame);
  useEffect(() => {
    frame.current = onFrame;
  });
  useEffect(() => {
    if (!running) return;
    const start = now();
    let id = requestAnimationFrame(function tick() {
      frame.current(since(start) / 1000);
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [running]);
}
