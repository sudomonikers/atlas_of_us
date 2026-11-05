import type { CSSProperties } from 'react';
import { EXTENTS, type AffectedBy } from '../physical/api';

//a list in words: "a", "a and b", "a, b and c"
function and(items: string[]) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

//the user's conditions and impairments that can affect an ability a level takes, as a line under it, once there are any
export function AffectedByNote({ affectedBy }: { affectedBy: AffectedBy | undefined }) {
  if (!affectedBy) return null;
  const what = [
    ...affectedBy.conditions.map((c) => `your ${c.name}`),
    ...affectedBy.impairments.map((i) => `your ${EXTENTS.find((e) => e.value === i.extent)?.label.toLowerCase() ?? ''} impairment in ${i.name.toLowerCase()}`),
  ];
  return <span style={styles.note}>This can be affected by {and(what)}.</span>;
}

const styles: Record<string, CSSProperties> = {
  note: {
    alignSelf: 'flex-start',
    padding: '2px 10px',
    background: 'var(--pale-cinnamon)',
    border: '2px dashed var(--gunmetal-black)',
    borderRadius: 10,
    fontSize: 14,
    lineHeight: 1.4,
  },
};
