import { brickUses } from './brick_uses/motion';
import { brokenWords } from './broken_words/motion';
import { cardSorting } from './card_sorting/motion';
import { designs } from './design_fluency/motion';
import { digitSpan } from './digit_span/motion';
import { flanker } from './distracting_arrows/motion';
import { hiddenShapes } from './hidden_shapes/motion';
import { matrices } from './matrix_puzzles/motion';
import { type Motion } from './motion_kit';
import { numberSeries } from './number_series/motion';
import { paperFolding } from './paper_folding/motion';
import { perspective } from './perspective_taking/motion';
import { problems } from './spot_the_problem/motion';
import { rotation } from './shape_rotation/motion';
import { syllogisms } from './syllogisms/motion';
import { symbols } from './symbol_matching/motion';
import { trackCount } from './track_and_count/motion';
import { trailMaking } from './trail_making/motion';

// Animations of the tests that are played on a screen, each showing what happens in it: a screen, close up, with the
// test going on in it, and a pointer or the keys being pressed. Each one is in its test's folder.

export const SCREEN_MOTIONS = {
  digitSpan,
  trailMaking,
  matrices,
  numberSeries,
  rotation,
  paperFolding,
  perspective,
  syllogisms,
  symbols,
  flanker,
  cardSorting,
  brokenWords,
  hiddenShapes,
  trackCount,
  designs,
  brickUses,
  problems,
} satisfies Record<string, Motion>;
