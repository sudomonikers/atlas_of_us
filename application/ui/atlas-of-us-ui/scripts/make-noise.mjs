// makes the noise Digits in Noise plays the digits in (src/physical/digits_in_noise), into public/voices/noise.mp3:
// noise shaped like Matthew's digits, with the same spectrum as his voice averaged over all of them, so it covers his
// speech evenly at every pitch. It's made by averaging the spectrum of his recordings, giving each frequency that
// strength with a random phase, and turning it back into sound, then set to -20 dB RMS like the recordings. Run by
// scripts/make-voices.sh once the recordings are made. Needs ffmpeg
//   node scripts/make-noise.mjs
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT = 'public/voices';
const RATE = 24000;
const DIGITS = [1, 2, 3, 4, 5, 6, 8, 9];
//the frames the spectrum is averaged over, and the noise's length, in samples: a power of two, about 11 s
const FRAME = 2048;
const LENGTH = 2 ** 18;
//how long the noise file is, in seconds, and its loudness as the RMS of its samples, -20 dB
const SECONDS = 8;
const RMS = 0.1;

//every one of Matthew's digits, one after another, as samples
const speech = DIGITS.flatMap((d) => {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', `${OUT}/matthew-${d}.mp3`, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-']);
  return Array.from(new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4));
});

//an in-place fast Fourier transform of a power-of-two length, backward when inverse
function fft(re, im, inverse = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const wr = Math.cos(angle * k);
        const wi = Math.sin(angle * k);
        const a = start + k;
        const b = a + size / 2;
        const tr = re[b] * wr - im[b] * wi;
        const ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}

//the power at each frequency, averaged over half-overlapping windowed frames of his speech
const power = new Float64Array(FRAME / 2 + 1);
for (let start = 0; start + FRAME <= speech.length; start += FRAME / 2) {
  const re = new Float64Array(FRAME);
  const im = new Float64Array(FRAME);
  for (let i = 0; i < FRAME; i++) re[i] = speech[start + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FRAME - 1)));
  fft(re, im);
  for (let k = 0; k <= FRAME / 2; k++) power[k] += re[k] * re[k] + im[k] * im[k];
}

//the noise: each frequency at the strength his speech has there, with a random phase
const re = new Float64Array(LENGTH);
const im = new Float64Array(LENGTH);
for (let k = 1; k < LENGTH / 2; k++) {
  const strength = Math.sqrt(power[Math.round((k * FRAME) / LENGTH)]);
  const phase = Math.random() * 2 * Math.PI;
  re[k] = strength * Math.cos(phase);
  im[k] = strength * Math.sin(phase);
  re[LENGTH - k] = re[k];
  im[LENGTH - k] = -im[k];
}
fft(re, im, true);
const noise = re.slice(0, SECONDS * RATE);
const rms = Math.sqrt(noise.reduce((s, x) => s + x * x, 0) / noise.length);

const wav = Buffer.alloc(44 + noise.length * 2);
wav.write('RIFF', 0);
wav.writeUInt32LE(36 + noise.length * 2, 4);
wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write('data', 36);
wav.writeUInt32LE(noise.length * 2, 40);
noise.forEach((x, i) => wav.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(((x * RMS) / rms) * 32767))), 44 + i * 2));

const tmp = mkdtempSync(join(tmpdir(), 'noise-'));
try {
  writeFileSync(join(tmp, 'noise.wav'), wav);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', join(tmp, 'noise.wav'), '-c:a', 'libmp3lame', '-b:a', '64k', `${OUT}/noise.mp3`]);
} finally {
  rmSync(tmp, { recursive: true });
}
console.log(`${OUT}/noise.mp3`);
