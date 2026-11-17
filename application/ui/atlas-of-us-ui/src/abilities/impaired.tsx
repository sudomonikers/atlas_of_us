import { type CSSProperties } from 'react';
import { EXTENTS, type Basis } from './api';
import { brownRed } from '../shared_components/palette';

//the impairments noted on an ability, in what it needs: noted beside where the user stands, which they leave as it is
export function Impaired({ basis }: { basis: Basis[] }) {
  const noted = basis.filter((b) => b.kind === 'impairment');
  if (!noted.length) return null;
  return (
    <p style={styles.note}>
      Noted: {noted.map((b) => `a ${EXTENTS.find((e) => e.value === b.extent)?.label.toLowerCase() ?? ''} impairment in ${b.name.toLowerCase()}`).join(', and ')}, which this
      needs.
    </p>
  );
}

const styles: Record<string, CSSProperties> = {
  note: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.4,
    color: brownRed,
  },
};
