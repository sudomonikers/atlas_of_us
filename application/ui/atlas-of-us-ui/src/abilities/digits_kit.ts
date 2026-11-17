import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { comic } from '../shared_components/palette';

// What the tests of hearing spoken digits share: the recordings in /voices, fetched and played at their own levels and
// times, and typing the digits heard, on ./digit_pad.tsx

//a level in dB as a gain
export const gainOf = (db: number) => 10 ** (db / 20);

//one recording to play: its name in /voices, its gain, when it starts, in seconds from now, and for a part of it, where
//in it to start and how long to play, in seconds, eased in and out so it doesn't click
export interface Part {
  name: string;
  gain: number;
  at: number;
  from?: number;
  lasts?: number;
}

//the recordings, fetched and decoded once, and playing them, with whether any is playing, to boom a speaker by. Timers
//set with later are cleared with the sound
export function useVoices(names: string[]) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const clips = useRef<Record<string, AudioBuffer>>({});
  const sources = useRef<AudioBufferSourceNode[]>([]);
  const timers = useRef<number[]>([]);
  const wanted = useRef(names);

  useEffect(() => {
    let gone = false;
    const decoder = new OfflineAudioContext(1, 1, 48000);
    Promise.all(
      wanted.current.map(async (name) => {
        const response = await fetch(`/voices/${name}.mp3`);
        if (!response.ok) throw new Error(`no recording ${name}`);
        clips.current[name] = await decoder.decodeAudioData(await response.arrayBuffer());
      }),
    ).then(
      () => !gone && setLoaded(true),
      () => !gone && setFailed(true),
    );
    return () => {
      gone = true;
    };
  }, []);

  const later = (ms: number, then: () => void) => timers.current.push(window.setTimeout(then, ms));

  const hush = () => {
    sources.current.forEach((s) => s.stop());
    sources.current = [];
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPlaying(false);
  };
  useEffect(
    () => () => {
      sources.current.forEach((s) => s.stop());
      timers.current.forEach(clearTimeout);
      if (audio.current?.state !== 'closed') void audio.current?.close();
    },
    [],
  );

  const play = (parts: Part[]) => {
    audio.current ??= new AudioContext();
    const a = audio.current;
    void a.resume();
    const now = a.currentTime + 0.05;
    let end = 0;
    for (const { name, gain, at, from = 0, lasts } of parts) {
      const clip = clips.current[name];
      const length = lasts ?? clip.duration - from;
      const source = a.createBufferSource();
      const level = a.createGain();
      source.buffer = clip;
      if (lasts === undefined) level.gain.value = gain;
      else {
        level.gain.setValueAtTime(0, now + at);
        level.gain.linearRampToValueAtTime(gain, now + at + 0.05);
        level.gain.setValueAtTime(gain, now + at + length - 0.05);
        level.gain.linearRampToValueAtTime(0, now + at + length);
      }
      source.connect(level).connect(a.destination);
      source.start(now + at, from, length);
      sources.current.push(source);
      end = Math.max(end, at + length);
    }
    setPlaying(true);
    later((end + 0.1) * 1000, () => setPlaying(false));
  };

  return { loaded, failed, playing, play, hush, later, duration: (name: string) => clips.current[name]?.duration ?? 0 };
}

//the typing of three digits for a round: what's typed, kept ahead of the render showing it, and whether typing goes to
//the round now. Typing a digit gives back all three once the third is in, which answers the round
export function useTyping() {
  const [typed, setTyped] = useState<number[]>([]);
  const entered = useRef<number[]>([]);
  const open = useRef(false);
  const type = (d: number | 'back'): number[] | null => {
    if (!open.current) return null;
    const digits = d === 'back' ? entered.current.slice(0, -1) : [...entered.current, d];
    entered.current = digits;
    setTyped(digits);
    if (digits.length < 3) return null;
    open.current = false;
    return digits;
  };
  //a new round, with nothing typed, taking typing
  const ask = () => {
    entered.current = [];
    setTyped([]);
    open.current = true;
  };
  return { typed, type, ask };
}

//the speaker with what's under it, as tall as the test's other screens
export const digitStyles: Record<string, CSSProperties> = {
  stage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 300,
  },
  small: {
    width: 'min(100%, 200px)',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  verdict: {
    fontFamily: comic,
    letterSpacing: 1,
  },
};
