import type { CSSProperties } from 'react';

//the written part of a text, with the unwritten remainder holding its space so words don't jump between lines as they
//appear
export function Typed({ text, shown }: { text: string; shown: number }) {
  return (
    <>
      {text.slice(0, shown)}
      <span style={unwritten}>{text.slice(shown)}</span>
    </>
  );
}

const unwritten: CSSProperties = {
  visibility: 'hidden',
};
