import { useState, type CSSProperties, type ReactNode } from 'react';

interface DisclosureProps {
  label: ReactNode; //shown on the toggle, with an arrow after it
  children: ReactNode; //shown once it's open
  defaultOpen?: boolean;
  style?: CSSProperties; //for the toggle
}

//text that's there if you want it: a toggle that reveals what's under it. Used to keep long reading off the page
//until someone asks for it
export function Disclosure({ label, children, defaultOpen = false, style }: DisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <>
      <button style={{ ...styles.toggle, ...style }} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {label} {open ? '▲' : '▼'}
      </button>
      {open && children}
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  //reset so it reads as a link-like label
  toggle: {
    alignSelf: 'flex-start',
    padding: 0,
    background: 'none',
    border: 'none',
    color: 'var(--cinnamon-wood)',
    font: 'inherit',
    fontSize: 17,
    textAlign: 'left',
    cursor: 'pointer',
  },
};
