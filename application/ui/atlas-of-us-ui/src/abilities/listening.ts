import type { SpeechCommandRecognizer } from '@tensorflow-models/speech-commands';

// Hearing a few words said out loud, for answering a test from across the room. TensorFlow's speech commands model
// knows 18 short words, among them up, down, left, right, yes and no, and runs in the browser: what the microphone
// hears never leaves the device. The model and its runtime are only downloaded when someone chooses to answer out loud.

//the model, made once
let loading: Promise<SpeechCommandRecognizer> | undefined;
function load(): Promise<SpeechCommandRecognizer> {
  loading ??= (async () => {
    //the model, the graphics card to run it on, and the tensor methods the model calls, which are added separately
    const [{ create }] = await Promise.all([
      import('@tensorflow-models/speech-commands'),
      import('@tensorflow/tfjs-backend-webgl'),
      import('@tensorflow/tfjs-core/dist/public/chained_ops/register_all_chained_ops'),
    ]);
    const recognizer = create('BROWSER_FFT', undefined, `${location.origin}/speech/model.json`, `${location.origin}/speech/metadata.json`);
    await recognizer.ensureModelLoaded();
    return recognizer;
  })();
  loading.catch(() => (loading = undefined));
  return loading;
}

//listens for the words, calling heard with each one it's sure of, until the returned function stops it. A word
//said once is only heard once
export async function listen(words: string[], heard: (word: string) => void): Promise<() => void> {
  const recognizer = await load();
  const labels = recognizer.wordLabels();
  await recognizer.listen(
    async ({ scores }) => {
      const all = scores as Float32Array;
      let best = 0;
      for (let i = 1; i < all.length; i++) if (all[i] > all[best]) best = i;
      if (words.includes(labels[best])) heard(labels[best]);
    },
    { probabilityThreshold: 0.8, overlapFactor: 0.5, suppressionTimeMillis: 800, invokeCallbackOnNoiseAndUnknown: false },
  );
  return () => {
    if (recognizer.isListening()) void recognizer.stopListening();
  };
}

//why listening couldn't start, as the person reads it
export function notListening(e: unknown): string {
  const name = e instanceof DOMException ? e.name : '';
  return name === 'NotAllowedError'
    ? "Your microphone is blocked. Allow it in your browser's settings, or answer by tapping instead."
    : name === 'NotFoundError'
      ? "I couldn't find a microphone on this device. You can answer by tapping instead."
      : "I couldn't get your microphone going. You can answer by tapping instead.";
}
