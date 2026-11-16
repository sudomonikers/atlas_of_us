import { type CSSProperties, useState } from 'react';
import { gunmetal } from '../shared_components/palette';
import { testStyles } from './test_kit';

// Sizing the screen with a bank card, so the tests can draw things a true size.

//a bank card's short edge, which fits across a phone, in mm (ISO/IEC 7810 ID-1, the size of bank, credit and most ID
//cards)
const CARD_SHORT = 53.98;
//where the card's size on this screen is remembered, so it only needs measuring once
const CARD_KEY = 'atlas-card-px';

function rememberedCard(): number {
  try {
    const px = Number(localStorage.getItem(CARD_KEY));
    if (px > 0) return px;
  } catch {
    //no storage, so it's measured again
  }
  return 204; //53.98 mm on a 96 dpi screen
}

//the step that sizes the screen: the css px to a mm, once the box matches a card
export function CardSizing({ onSized }: { onSized: (pxPerMm: number) => void }) {
  const [cardPx, setCardPx] = useState(rememberedCard);
  const done = () => {
    try {
      localStorage.setItem(CARD_KEY, String(cardPx));
    } catch {
      //it's measured again next time
    }
    onSized(cardPx / CARD_SHORT);
  };
  return (
    <div style={styles.sizing}>
      <p style={testStyles.text}>
        First, size the screen so things come out true. Hold a bank card (or any card that size, like a driving license)
        upright and flat against the screen, and slide until the box is as wide as the card's short edge. Keep the page
        zoom as it is until you're done.
      </p>
      <div style={{ ...styles.card, width: cardPx }} />
      <input type="range" min={100} max={600} value={cardPx} aria-label="The box's width" style={styles.slider} onChange={(e) => setCardPx(Number(e.target.value))} />
      <button type="button" className="comic-lift" style={testStyles.primary} onClick={done}>
        It matches
      </button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  sizing: {
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    overflowX: 'auto',
  },
  card: {
    flexShrink: 0,
    height: 90,
    background: 'var(--pale-cinnamon)',
    border: `2px solid ${gunmetal}`,
    borderRadius: 8,
    boxSizing: 'border-box',
  },
  slider: {
    width: '100%',
    maxWidth: 520,
  },
};
