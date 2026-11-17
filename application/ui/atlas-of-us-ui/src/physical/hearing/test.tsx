import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { brownRed, comic } from '../../shared_components/palette';
import type { TestProps } from '../self_tests';
import { Speaker } from '../speaker';
import { Frame } from '../test_frame';
import { chance, testStyles } from '../test_kit';

// A hearing test through headphones, estimating the hearing threshold a hearing test measures: the pure tone average
// of the better ear, over 500, 1000, 2000 and 4000 Hz, in dB HL. A browser can't know how loud a device plays, so it
// first has the person set their volume so a rushing noise sounds as loud as someone talking normally across a table,
// which is about 60 dB SPL, and works out every tone's loudness from that. Then for each ear and each pitch a pulsing
// tone fades away, and they press when they can't hear it any more. It's an estimate, as close as the volume is set

//the pitches a hearing test averages, in the order they're tested
const PITCHES = [1000, 2000, 4000, 500];
const EARS = [
  { name: 'Right', pan: 1 },
  { name: 'Left', pan: -1 },
];
//how loud a tone has to be in a headphone, in dB SPL, for someone with typical hearing to just hear it, which is 0 dB HL
//(ANSI S3.6, for supra-aural headphones)
const ZERO_HL: Record<number, number> = { 500: 13.5, 1000: 7.5, 2000: 11, 4000: 10.5 };
//the noise the volume is set by: how loud it's taken to be, in dB SPL, and how loud it's played, as the root mean square
//of its samples. It's played quietly enough that the loudest tone still fits under full volume
const SET_SPL = 60;
const SET_RMS = 0.03;
//where a tone starts, in dB HL, a louder start for one they couldn't hear, the quietest it fades to, and how fast, in dB
//a second
const START = 50;
const LOUDER = 70;
const FLOOR = -10;
const FADE = 4;
//how long people take to press once they notice it's gone, in seconds, so the tone was that much louder when it went
const NOTICE = 0.4;
//a tone pressed this soon after starting wasn't heard at all, in seconds
const UNHEARD = 1;
//each pulse of the tone, on and off, in seconds
const PULSE_ON = 0.45;
const PULSE_OFF = 0.25;

//how loud a sine wave's peak is for a tone at some dB HL
const peak = (hl: number, pitch: number) => SET_RMS * Math.SQRT2 * 10 ** ((hl + ZERO_HL[pitch] - SET_SPL) / 20);

//two seconds of pink noise, like rushing water, at SET_RMS, to loop
function pinkNoise(audio: AudioContext): AudioBuffer {
  const buffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
  const data = buffer.getChannelData(0);
  //Paul Kellet's filter, which shapes white noise to fall off by 3 dB an octave
  let [b0, b1, b2, b3, b4, b5, b6] = [0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    b6 = white * 0.115926;
  }
  const rms = Math.sqrt(data.reduce((s, x) => s + x * x, 0) / data.length);
  for (let i = 0; i < data.length; i++) data[i] *= SET_RMS / rms;
  return buffer;
}

interface Playing {
  stop: () => void;
  started: number; //the audio clock when it started, in seconds
  from: number; //the dB HL it started at
}

//a tone fading away in one ear from some dB HL to FLOOR, in pulses
function fade(audio: AudioContext, pitch: number, pan: number, from: number): Playing {
  const tone = audio.createOscillator();
  const level = audio.createGain();
  const pulses = audio.createGain();
  const side = audio.createStereoPanner();
  tone.frequency.value = pitch;
  side.pan.value = pan;
  const at = audio.currentTime + 0.05;
  const lasts = (from - FLOOR) / FADE;
  level.gain.setValueAtTime(peak(from, pitch), at);
  level.gain.exponentialRampToValueAtTime(peak(FLOOR, pitch), at + lasts);
  //each pulse eases on and off over 30 ms, as a sudden start or stop clicks
  pulses.gain.setValueAtTime(0, at);
  for (let t = at; t < at + lasts; t += PULSE_ON + PULSE_OFF) {
    pulses.gain.setTargetAtTime(1, t, 0.01);
    pulses.gain.setTargetAtTime(0, t + PULSE_ON, 0.01);
  }
  tone.connect(level).connect(pulses).connect(side).connect(audio.destination);
  tone.start(at);
  tone.stop(at + lasts + 0.1);
  return {
    started: at,
    from,
    stop: () => {
      pulses.gain.cancelScheduledValues(audio.currentTime);
      pulses.gain.setTargetAtTime(0, audio.currentTime, 0.01);
      tone.stop(audio.currentTime + 0.1);
    },
  };
}

type Phase = 'phones' | 'volume' | 'ready' | 'gap' | 'tone' | 'done';

//the hearing test: headphones on, the volume set by a noise, then each ear's tones fading out one by one. Space, or
//the big button, says a tone's gone. The score is the pure tone average of the better ear
export function HearingTest({ onDone, onCancel }: TestProps) {
  const [phase, setPhase] = useState<Phase>('phones');
  const [at, setAt] = useState(0); //which tone, through both ears
  const audio = useRef<AudioContext | null>(null);
  const noise = useRef<AudioBufferSourceNode | null>(null);
  const playing = useRef<Playing | null>(null);
  const timer = useRef(0);
  const heard = useRef<number[]>([]); //each tone's threshold, in dB HL, in the order played
  const [noisy, setNoisy] = useState(false);

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      playing.current?.stop();
      void audio.current?.close();
    },
    [],
  );

  const sound = () => {
    audio.current ??= new AudioContext();
    void audio.current.resume();
    return audio.current;
  };

  const quiet = () => {
    noise.current?.stop();
    noise.current = null;
    setNoisy(false);
  };
  const toggleNoise = () => {
    if (noise.current) return quiet();
    const a = sound();
    const source = a.createBufferSource();
    source.buffer = pinkNoise(a);
    source.loop = true;
    source.connect(a.destination);
    source.start();
    noise.current = source;
    setNoisy(true);
  };

  //the tone at, after a quiet moment of a random length, so its start can't be guessed
  const play = (which: number, from = START) => {
    setAt(which);
    setPhase('gap');
    timer.current = window.setTimeout(
      () => {
        const ear = EARS[Math.floor(which / PITCHES.length)];
        const pitch = PITCHES[which % PITCHES.length];
        const tone = fade(sound(), pitch, ear.pan, from);
        playing.current = tone;
        setPhase('tone');
        //faded all the way without a press, so they can hear the quietest
        timer.current = window.setTimeout(() => record(which, FLOOR), ((from - FLOOR) / FADE) * 1000 + 300);
      },
      1200 + chance() * 1500,
    );
  };

  const record = (which: number, hl: number) => {
    playing.current?.stop();
    playing.current = null;
    heard.current[which] = hl;
    if (which + 1 < EARS.length * PITCHES.length) return play(which + 1);
    setPhase('done');
    const ears = EARS.map((_, e) => heard.current.slice(e * PITCHES.length, (e + 1) * PITCHES.length));
    const average = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const each = ears.map(average);
    const score = Math.round(Math.min(...each));
    const better = each.indexOf(Math.min(...each));
    onDone(score, {
      how: `Each tone fades until you can't hear it, and that level is your threshold for it, in dB HL, so lower is better. Your score is the average over the ${PITCHES.length} pitches in your better ear, the ${EARS[better].name.toLowerCase()}: ${score} dB HL.`,
      parts: EARS.flatMap((ear, e) =>
        PITCHES.map((pitch, p) => ({ label: `${ear.name} ${pitch} Hz`, note: `${Math.round(heard.current[e * PITCHES.length + p])} dB HL` })),
      ),
    });
  };

  //they can't hear it any more: the tone's level a moment before, as they took a moment to press. Pressed straight
  //away, they didn't hear it at all, so it plays again louder, and if they still can't, that's as loud as it goes
  const gone = () => {
    const tone = playing.current;
    if (phase !== 'tone' || !tone || !audio.current) return;
    clearTimeout(timer.current);
    const after = audio.current.currentTime - tone.started;
    if (after < UNHEARD) {
      tone.stop();
      playing.current = null;
      return tone.from === START ? play(at, LOUDER) : record(at, LOUDER);
    }
    record(at, Math.max(FLOOR, tone.from - FADE * Math.max(0, after - NOTICE)));
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (!e.repeat) gone();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const ear = EARS[Math.floor(at / PITCHES.length)];
  return (
    <Frame
      onCancel={onCancel}
      intro={
        <p style={testStyles.text}>
          {phase === 'phones'
            ? 'Find a quiet room and put on headphones or earbuds – the right way around. The test plays tones in one ear at a time.'
            : phase === 'volume'
              ? "Play the sound and set your device's volume so it's about as loud as someone talking to you normally from across a table. Then leave the volume there until the test is done."
              : 'A beeping tone will fade away. Press the space bar or the button the moment you can no longer hear it. Some are high and some are low, and each ear has four.'}
        </p>
      }
    >
      {(phase === 'phones' || phase === 'volume' || phase === 'ready') && (
        <div style={styles.stage}>
          <Speaker booming={noisy} />
          {phase === 'phones' && (
            <button type="button" className="comic-lift" style={styles.centered} onClick={() => setPhase('volume')}>
              My headphones are on
            </button>
          )}
          {phase === 'volume' && (
            <div style={styles.row}>
              <button type="button" className="comic-lift" style={testStyles.secondary} onClick={toggleNoise}>
                {noisy ? 'Stop the sound' : 'Play the sound'}
              </button>
              <button
                type="button"
                className="comic-lift"
                style={testStyles.primary}
                onClick={() => {
                  quiet();
                  setPhase('ready');
                }}
              >
                The volume's set
              </button>
            </div>
          )}
          {phase === 'ready' && (
            <button type="button" className="comic-lift" style={styles.centered} onClick={() => play(0)}>
              Start the tones
            </button>
          )}
        </div>
      )}
      {(phase === 'gap' || phase === 'tone') && (
        <button type="button" style={{ ...testStyles.arena, ...styles.tall, ...styles.listening }} onPointerDown={gone} aria-label="I can't hear it any more">
          {/* booming the whole time, gaps included, so it never shows when a tone starts or fades away */}
          <Speaker booming side={ear.pan} />
          <span style={styles.big}>I can't hear it</span>
          <span style={styles.ear}>
            {ear.name} ear · tone {(at % PITCHES.length) + 1} of {PITCHES.length}
          </span>
        </button>
      )}
      {phase === 'done' && (
        <div style={{ ...testStyles.arena, ...styles.tall }}>
          <span style={testStyles.prompt}>Done</span>
        </div>
      )}
    </Frame>
  );
}

const styles: Record<string, CSSProperties> = {
  //the speaker with the buttons under it, as tall as the place the tones are heard
  stage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 300,
  },
  centered: {
    ...testStyles.primary,
    alignSelf: 'center',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  tall: {
    minHeight: 300,
  },
  listening: {
    flexDirection: 'column',
    gap: 12,
  },
  big: {
    fontFamily: comic,
    fontSize: 36,
    letterSpacing: 1,
  },
  ear: {
    position: 'absolute',
    top: 10,
    right: 14,
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 1,
    color: brownRed,
  },
};
