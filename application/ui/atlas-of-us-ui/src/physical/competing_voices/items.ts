import { seeded } from '../test_kit';

//the digits the voices say: one to nine but seven, the only one of two syllables, so every digit is as quick to say
export const VOICE_DIGITS = [1, 2, 3, 4, 5, 6, 8, 9];
//the voice to follow and the two talking over it, by the names of their recordings in /voices
export const FOLLOW_VOICE = 'matthew';
export const OTHER_VOICES = ['joanna', 'gregory'];
export const VOICE_ROUNDS = 16;
export const VOICE_PRACTICE_ROUNDS = 3;
//the level of the other voices against the voice to follow, in dB: where it starts, how far a round moves it and how
//far it can go. Until the first miss each round moves it 4, to find their level quickly. After that a round with all
//three right makes them 1 louder and a miss 3 quieter, so the level settles where they get about 3 rounds in 4 right
export const VOICE_START = -10;
export const VOICE_FIRST_STEP = 4;
export const VOICE_UP = 1;
export const VOICE_DOWN = 3;
export const VOICE_LOWEST = -20;
export const VOICE_HIGHEST = 10;

//one round: the three digits the voice to follow says, the three each other voice says over it, and how late each
//voice starts each digit, in seconds, so they overlap without starting together
export interface VoiceRound {
  follow: number[];
  others: number[][];
  lags: number[][]; //for each voice, the voice to follow first
}

//rounds where every voice says a different digit at each moment, and the voice to follow never says the same digit
//twice in a row
function rounds(seed: number, count: number): VoiceRound[] {
  const random = seeded(seed);
  const pickFrom = (xs: number[]) => xs[Math.floor(random() * xs.length)];
  return Array.from({ length: count }, () => {
    const said: number[][] = [[], [], []];
    for (let slot = 0; slot < 3; slot++) {
      const taken = new Set<number>();
      said.forEach((voice, v) => {
        const before = v === 0 ? voice[slot - 1] : undefined;
        const d = pickFrom(VOICE_DIGITS.filter((x) => !taken.has(x) && x !== before));
        taken.add(d);
        voice.push(d);
      });
    }
    const lags = said.map(() => [0, 1, 2].map(() => Math.round(random() * 120) / 1000));
    return { follow: said[0], others: said.slice(1), lags };
  });
}

export const VOICE_PRACTICE = rounds(7, VOICE_PRACTICE_ROUNDS);
export const VOICE_ITEMS = rounds(2026, VOICE_ROUNDS);
