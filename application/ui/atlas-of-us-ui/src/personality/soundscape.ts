//the looping ambience and one-shot sounds every scene plays, shared so each scene only declares its sounds and mix

export interface OneShot {
  src: string;
  volume: number;
  delay?: number; //seconds after the cue starts
}

interface Options {
  volume: number; //master volume, 0 to 1
  crossfade: number; //seconds a bed takes to fade to a new level
}

//beds stream lazily: one only downloads once a mix first turns it up, and is paused again once it has faded out,
//so a scene with six beds doesn't pull every file the moment it opens.
//browsers only allow audio after the user has interacted with the page, so playback starts on the first key or click
export function createSoundscape<Bed extends string>(sources: Record<Bed, string>, { volume, crossfade }: Options) {
  const context = new AudioContext();
  const beds = (Object.entries(sources) as [Bed, string][]).map(([bed, src]) => {
    const element = new Audio(src);
    element.loop = true;
    element.preload = 'none';
    const gain = context.createGain();
    gain.gain.value = 0;
    context.createMediaElementSource(element).connect(gain).connect(context.destination);
    return { bed, element, gain, level: 0, pauseTimer: 0 };
  });

  let unlocked = false;
  const listen = () => {
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  };
  const stopListening = () => {
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('pointerdown', unlock);
  };
  const audible = () => beds.filter(({ level }) => level > 0);
  function unlock() {
    context
      .resume()
      .then(() => {
        if (context.state !== 'running') throw new Error('still locked');
        return Promise.all(audible().map(({ element }) => element.play()));
      })
      .then(() => {
        unlocked = true;
        stopListening();
      })
      .catch(() => {}); //still locked; the next key or click tries again
  }
  listen();
  unlock();

  const timers = new Set<number>();
  return {
    mix(levels: Partial<Record<Bed, number>>) {
      for (const bed of beds) {
        bed.level = levels[bed.bed] ?? 0;
        bed.gain.gain.setTargetAtTime(bed.level * volume, context.currentTime, crossfade / 3);
        window.clearTimeout(bed.pauseTimer);
        if (bed.level > 0) {
          //a bed coming in after the unlock starts streaming now. if the browser refuses, the next key or click retries
          if (unlocked && bed.element.paused)
            bed.element.play().catch(() => {
              unlocked = false;
              listen();
            });
        } else if (!bed.element.paused) {
          //setTargetAtTime is within a fraction of a percent of silence after two crossfades
          bed.pauseTimer = window.setTimeout(() => bed.element.pause(), crossfade * 2000);
        }
      }
    },
    play({ src, volume: shotVolume, delay = 0 }: OneShot) {
      if (!unlocked) return;
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        const element = new Audio(src);
        element.volume = shotVolume * volume;
        element.play().catch(() => {});
      }, delay * 1000);
      timers.add(timer);
    },
    dispose() {
      stopListening();
      timers.forEach((timer) => window.clearTimeout(timer));
      beds.forEach(({ element, pauseTimer }) => {
        window.clearTimeout(pauseTimer);
        element.pause();
      });
      void context.close();
    },
  };
}

export type Soundscape<Bed extends string> = ReturnType<typeof createSoundscape<Bed>>;
