import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { BONES, HAND_BONES, findBody, findHands, loadHands, loadPose, type Point } from './pose';
import { watcher, WATCHED, type Cue, type Seen, type Watched, type Watcher } from './pose_tests';
import { beep, testStyles } from './test_kit';
import { inYourHands, type Measurement } from './api';
import { brownRed, comic, gunmetal, ivory } from '../shared_components/palette';

interface CameraTestProps {
  measurement: Measurement;
  hand: string | null; //the hand they use most, left or right, to name in what to do
  onDone: (value: number) => void; //their best try, to record
  onCancel: () => void;
}

//a home test watched through the camera: the person sees themselves with their body traced over them, the time or
//count big in the corner, and what to do next. It beeps as it starts and stops and says the result out loud, so they
//can do it alone with their eyes closed. They can go again, and their best try is the one recorded
export default function CameraTest({ measurement, hand, onDone, onCancel }: CameraTestProps) {
  const { test, records, looks, setup } = WATCHED[measurement.name];
  const make = useCallback(() => watcher(test, measurement.max, measurement.timer), [test, measurement.max, measurement.timer]);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const watching = useRef<Watcher>(make());
  const audio = useRef<AudioContext | null>(null);
  const [status, setStatus] = useState<'loading' | 'running' | string>('loading'); //anything else is what went wrong
  const [watched, setWatched] = useState<Watched>({ phase: 'setup', value: 0, message: '' });
  const [best, setBest] = useState<number | null>(null);

  const [voice] = useState(speaker);

  //a beep, and words said aloud once what's being said has finished. A count is a short one that can be passed over
  //for a newer one, and anything else is news that always gets said
  const cue = useCallback(
    (c: Cue) => {
      if (c.beep) {
        audio.current ??= new AudioContext();
        void audio.current.resume();
        beep(audio.current, c.beep !== 'rep');
      }
      if (c.say) voice.say(c.say, c.beep === 'rep' ? 'count' : 'news');
    },
    [voice],
  );

  //the camera and the model, then the body or hands in every new frame, fed to the test and traced over the video
  useEffect(() => {
    let alive = true;
    let frame = 0;
    let stream: MediaStream | undefined;
    const run = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        const v = video.current;
        if (!alive || !v) return;
        v.srcObject = stream;
        await v.play();
        //what the camera sees in a frame, by the model the test needs
        const look: (at: number) => Seen =
          looks === 'hands'
            ? await loadHands().then((model) => (at) => ({ hands: findHands(model, v, at), width: v.videoWidth }))
            : await loadPose().then((model) => (at) => ({ body: findBody(model, v, at), width: v.videoWidth }));
        if (!alive) return;
        setStatus('running');
        let shown = -1;
        const tick = () => {
          if (!alive) return;
          if (v.readyState >= 2 && v.currentTime !== shown) {
            shown = v.currentTime;
            const seen = look(performance.now());
            trace(canvas.current, v, seen);
            //timed by when the camera caught the frame, not when the model got to it
            const now = watching.current.feed(seen, v.currentTime * 1000);
            mark(canvas.current, now.marks);
            if (now.cue) cue(now.cue);
            if (now.cue?.beep === 'stop') setBest((b) => (b === null ? now.value : measurement.better === 'lower' ? Math.min(b, now.value) : Math.max(b, now.value)));
            setWatched((was) => (was.phase === now.phase && was.message === now.message && was.value === now.value && was.corner === now.corner && was.countIn === now.countIn ? was : now));
          }
          frame = requestAnimationFrame(tick);
        };
        tick();
      } catch (e) {
        if (!alive) return;
        const name = e instanceof DOMException ? e.name : '';
        setStatus(
          name === 'NotAllowedError'
            ? "Your camera is blocked. Allow it in your browser's settings, or use the stopwatch instead."
            : name === 'NotFoundError'
              ? "I couldn't find a camera on this device. You can use the stopwatch instead."
              : "I couldn't get your camera going. You can use the stopwatch instead.",
        );
      }
    };
    void run();
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      voice.stop();
      void audio.current?.close();
    };
  }, [cue, voice, looks, measurement.better]);

  //what to do next, said out loud as well as shown, since they're standing too far away to read it. It waits until the
  //instruction has settled, so a flicker in what the camera sees doesn't set it chattering, and says it again now and
  //then until they do it
  const instruction = (watched.phase === 'setup' || watched.phase === 'ready') && watched.countIn === undefined ? watched.message : '';
  useEffect(() => {
    if (status !== 'running' || !instruction) return;
    let timer = window.setTimeout(function speak() {
      voice.say(instruction, 'instruction');
      timer = window.setTimeout(speak, 10000);
    }, 800);
    return () => clearTimeout(timer);
  }, [status, instruction, voice]);

  const again = () => {
    watching.current = make();
    setWatched({ phase: 'setup', value: 0, message: '' });
  };

  const shown = (v: number) => (records === 'count' ? String(v) : records === 's' ? `${v.toFixed(1)} s` : `${v.toFixed(1)} ${records}`);

  return (
    <div style={testStyles.frame}>
      <p style={testStyles.text}>{inYourHands(setup, hand)}</p>
      <div style={styles.view}>
        <div style={styles.mirror}>
          <video ref={video} style={styles.video} muted playsInline />
          <canvas ref={canvas} style={styles.trace} />
        </div>
        {status === 'running' && (
          <>
            <span style={styles.readout} aria-live="off">
              {watched.countIn ?? shown(watched.value)}
            </span>
            {watched.phase === 'going' && watched.corner && <span style={styles.corner}>{watched.corner}</span>}
            {watched.message && (
              <p style={styles.message} aria-live="polite">
                {watched.message}
              </p>
            )}
          </>
        )}
        {status === 'loading' && <p style={styles.cover}>Getting your camera ready...</p>}
        {status !== 'loading' && status !== 'running' && <p style={styles.cover}>{status}</p>}
      </div>

      {best !== null && <p style={testStyles.text}>Your best this time: {shown(best)}</p>}
      <div style={styles.buttons}>
        {watched.phase === 'done' && (
          <>
            {best !== null && (
              <button type="button" className="comic-lift" style={testStyles.primary} onClick={() => onDone(best)}>
                Save {shown(best)}
              </button>
            )}
            <button type="button" className="comic-lift" style={testStyles.secondary} onClick={again}>
              Go again
            </button>
          </>
        )}
        <button type="button" className="comic-lift" style={testStyles.secondary} onClick={onCancel}>
          {status === 'running' || status === 'loading' ? 'Cancel' : 'Back'}
        </button>
      </div>
    </div>
  );
}

type Said = 'instruction' | 'count' | 'news';

//says one line at a time, each finishing before the next starts. An instruction or a count still waiting is replaced
//by a newer one of its kind, so they never fall behind what's happening, and news clears any instruction still waiting,
//since that's out of date once something has happened. An instruction already being said isn't queued again
function speaker() {
  const waiting: { text: string; kind: Said }[] = [];
  let saying: SpeechSynthesisUtterance | null = null; //held on to, as some browsers drop one before it finishes otherwise
  const next = () => {
    if (saying || !waiting.length) return;
    const line = waiting.shift()!;
    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.onend = utterance.onerror = () => {
      if (saying !== utterance) return;
      saying = null;
      next();
    };
    saying = utterance;
    window.speechSynthesis.speak(utterance);
  };
  return {
    say(text: string, kind: Said) {
      if (!('speechSynthesis' in window)) return;
      if (kind === 'instruction' && saying?.text === text) return;
      for (let i = waiting.length - 1; i >= 0; i--) {
        if (waiting[i].kind === kind && kind !== 'news') waiting.splice(i, 1);
        else if (kind === 'news' && waiting[i].kind === 'instruction') waiting.splice(i, 1);
      }
      waiting.push({ text, kind });
      next();
    },
    stop() {
      waiting.length = 0;
      saying = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
  };
}

//the body or hands traced over the video, in the comic's ink
function trace(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, { body, hands }: Seen) {
  if (!canvas) return;
  if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
  if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, canvas.width, canvas.height);
  const width = Math.max(4, canvas.width / 160);
  if (body) draw(g, body, BONES, body.slice(11), width);
  for (const hand of hands ?? []) draw(g, hand, HAND_BONES, hand, width / 2);
}

//lines down the picture, for where the person has to reach, drawn over the trace
function mark(canvas: HTMLCanvasElement | null, marks: number[] | undefined) {
  const g = canvas?.getContext('2d');
  if (!canvas || !g || !marks) return;
  g.save();
  g.strokeStyle = ivory;
  g.lineWidth = Math.max(3, canvas.width / 320);
  g.setLineDash([g.lineWidth * 4, g.lineWidth * 3]);
  for (const x of marks) {
    g.beginPath();
    g.moveTo(x * canvas.width, 0);
    g.lineTo(x * canvas.width, canvas.height);
    g.stroke();
  }
  g.restore();
}

//points joined by lines, skipping any the model isn't sure it can see
function draw(g: CanvasRenderingContext2D, points: Point[], bones: [number, number][], joints: Point[], width: number) {
  g.lineCap = 'round';
  g.strokeStyle = brownRed;
  g.lineWidth = width;
  for (const [a, b] of bones) {
    if (points[a].seen < 0.4 || points[b].seen < 0.4) continue;
    g.beginPath();
    g.moveTo(points[a].x, points[a].y);
    g.lineTo(points[b].x, points[b].y);
    g.stroke();
  }
  g.fillStyle = ivory;
  g.strokeStyle = gunmetal;
  g.lineWidth = width / 2;
  for (const p of joints) {
    if (p.seen < 0.4) continue;
    g.beginPath();
    g.arc(p.x, p.y, width * 0.9, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }
}

const styles: Record<string, CSSProperties> = {
  view: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 200,
    background: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: 14,
  },
  //the video is shown as a mirror, as people expect to see themselves
  mirror: {
    position: 'relative',
    transform: 'scaleX(-1)',
  },
  video: {
    display: 'block',
    width: '100%',
    maxHeight: '58vh',
    objectFit: 'contain',
  },
  trace: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    pointerEvents: 'none',
  },
  readout: {
    position: 'absolute',
    top: 10,
    left: 14,
    padding: '0 12px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 12,
    fontFamily: comic,
    fontSize: 44,
    letterSpacing: 1,
    color: brownRed,
    fontVariantNumeric: 'tabular-nums',
  },
  corner: {
    position: 'absolute',
    top: 16,
    right: 14,
    padding: '2px 10px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 999,
    fontSize: 16,
  },
  message: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    margin: 0,
    padding: '6px 12px',
    background: ivory,
    border: `2px solid ${gunmetal}`,
    borderRadius: 10,
    fontSize: 17,
    textAlign: 'center',
  },
  cover: {
    position: 'absolute',
    inset: 0,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    color: ivory,
    fontSize: 17,
    textAlign: 'center',
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
};
