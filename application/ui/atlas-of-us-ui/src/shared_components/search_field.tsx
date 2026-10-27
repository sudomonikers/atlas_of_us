import { useRef, type CSSProperties } from 'react';

//STYLE_GUIDE.md palette, defined as variables in App.css
const brownRed = 'var(--brown-red)';
const gunmetal = 'var(--gunmetal-black)';
const ivory = 'var(--ivory-white)';
const corners = '14px 8px 16px 10px / 8px 16px 10px 14px';

interface SearchFieldProps {
  id: string;
  query: string;
  onQuery: (query: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  compact?: boolean; //the smaller one that sits over a graph board
}

//a search input with a hand-drawn button inside its right edge that clears it, as Escape does
export function SearchField({ id, query, onQuery, placeholder, autoFocus, compact }: SearchFieldProps) {
  const input = useRef<HTMLInputElement>(null);
  const clear = () => {
    onQuery('');
    input.current?.focus();
  };
  return (
    <div style={styles.field}>
      <input
        ref={input}
        id={id}
        style={compact ? { ...styles.input, ...styles.inputCompact } : styles.input}
        type="text"
        role="searchbox"
        enterKeyHint="search"
        autoComplete="off"
        placeholder={placeholder}
        value={query}
        maxLength={200}
        autoFocus={autoFocus}
        onChange={(e) => onQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && clear()}
      />
      {query && (
        <button className="comic-lift" style={styles.clear} aria-label="Clear the search" onClick={clear}>
          {/* two hand-drawn strokes, slightly uneven */}
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
            <path d="M4 4.5 C8 8 12 12.5 16 15.5" fill="none" style={{ stroke: ivory }} strokeWidth="3.2" strokeLinecap="round" />
            <path d="M15.5 4 C12 7.5 8.5 11.5 4.5 16" fill="none" style={{ stroke: ivory }} strokeWidth="3.2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  //the input with its clear button sitting inside its right edge
  field: {
    position: 'relative',
  },
  input: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: '10px 56px 10px 14px',
    fontFamily: 'inherit',
    fontSize: 22,
    background: ivory,
    color: gunmetal,
    border: `3px solid ${gunmetal}`,
    borderRadius: corners,
    outlineColor: brownRed,
  },
  inputCompact: {
    padding: '6px 50px 6px 12px',
    fontSize: 18,
    boxShadow: `3px 3px 0 ${gunmetal}`,
  },
  clear: {
    position: 'absolute',
    top: '50%',
    right: 10,
    width: 34,
    height: 34,
    marginTop: -17,
    display: 'grid',
    placeItems: 'center',
    padding: 0,
    background: brownRed,
    border: `3px solid ${gunmetal}`,
    borderRadius: '50% 44% 54% 46%',
    boxShadow: `2px 2px 0 ${gunmetal}`,
    cursor: 'pointer',
  },
};
