import { useEffect, useState } from 'react';

const TYPE_SPEED_MS = 28; //delay between each character as the text writes out

//text that writes itself out a character at a time. `shown` is how many characters are written so far: set it to 0 to
//write a new text out from the start, or to Infinity to show it in full
export function useTypewriter(text: string) {
  const [shown, setShown] = useState(0);
  const typed = shown >= text.length;

  useEffect(() => {
    if (typed) return;
    const timer = setTimeout(() => setShown((s) => s + 1), TYPE_SPEED_MS);
    return () => clearTimeout(timer);
  }, [shown, typed]);

  return { shown, typed, setShown };
}
