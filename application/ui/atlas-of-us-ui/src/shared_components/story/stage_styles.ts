import type { CSSProperties } from 'react';
import { brownRed, comic, gunmetal, ivory } from '../palette';

const paleRed = 'var(--pale-red)';

//the look the stages share: a panel over the drawing, its heading, and the list it scrolls through
export const stageStyles: Record<string, CSSProperties> = {
  waiting: {
    alignSelf: 'center',
    fontSize: 22,
  },
  graphTitle: {
    margin: 0,
    padding: '4px 14px',
    background: ivory,
    border: `3px solid ${gunmetal}`,
    borderRadius: 12,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 26,
    letterSpacing: 1,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '100%',
    minHeight: 0,
    boxSizing: 'border-box',
    padding: '18px 8px 18px 24px',
    background: ivory,
    borderRadius: 'var(--wobbly)',
    textAlign: 'left',
    '--panel-fill': paleRed,
    '--tilt': '0.3deg',
  } as CSSProperties,
  //the panel's border and fill are drawn behind it, so the scrolling happens on a layer inside
  scroll: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 16px 6px 0', //room for picked items' shadows inside the scrolling layer
  },
  head: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    margin: 0,
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 38,
    letterSpacing: 1,
    lineHeight: 1,
  },
  who: {
    fontSize: 18,
    color: brownRed,
  },
  description: {
    margin: '10px 0 0',
    fontSize: 18,
    lineHeight: 1.3,
  },
  subheading: {
    margin: '14px 0 8px',
    fontFamily: comic,
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: 1,
  },
  fitColumn: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    paddingRight: 16,
  },
};
