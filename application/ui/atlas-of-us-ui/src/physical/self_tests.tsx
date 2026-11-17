import type { ComponentType } from 'react';
import type { Recorded, Test } from './api';
import type { Scored } from './scored';
import { BrickUses } from './brick_uses/test';
import { BrokenWords } from './broken_words/test';
import { CardSorting } from './card_sorting/test';
import { ChoiceReaction } from './choice_reaction/test';
import { CompetingVoices } from './competing_voices/test';
import { DesignFluency } from './design_fluency/test';
import { DigitSpan } from './digit_span/test';
import { DistractingArrows } from './distracting_arrows/test';
import { FarChart, NearChart } from './eye_chart/test';
import { HearingTest } from './hearing/test';
import { HiddenShapes } from './hidden_shapes/test';
import { Matrices } from './matrix_puzzles/test';
import { Series } from './number_series/test';
import { OddColorOut } from './odd_color_out/test';
import { PaperFolding } from './paper_folding/test';
import { PerspectiveTaking } from './perspective_taking/test';
import { SimpleReaction } from './reaction_time/test';
import { Rotation } from './shape_rotation/test';
import { SideVision } from './side_vision/test';
import { Syllogisms } from './syllogisms/test';
import { SpotTheProblem } from './spot_the_problem/test';
import { SymbolMatching } from './symbol_matching/test';
import { Tapping } from './tapping/test';
import { Timing } from './timing/test';
import { TrackAndCount } from './track_and_count/test';
import { Tracking } from './tracking/test';
import { TrailMaking } from './trail_making/test';
import { TwoHandSteering } from './two_hand_steering/test';

export interface TestProps {
  measurement: string; //the measurement's id, for a test scored by the api
  onDone: (value: number, scored?: Scored) => void; //the score, in the measurement's unit, for the card to record, and how it was worked out
  onSaved: (recorded: Recorded) => void; //a reading the api scored and recorded itself, with the user's abilities
  onCancel: () => void;
}

//one of the tests the app runs, by the measurement's test
export function SelfTest({ test, ...props }: TestProps & { test: Exclude<Test, 'home' | 'camera'> }) {
  const Run = TESTS[test];
  return <Run {...props} />;
}

//the tests the app runs, by the measurement's test
const TESTS: Record<Exclude<Test, 'home' | 'camera'>, ComponentType<TestProps>> = {
  simple_reaction: SimpleReaction,
  choice_reaction: ChoiceReaction,
  digit_span: DigitSpan,
  trail_making: TrailMaking,
  eye_chart: FarChart,
  hearing: HearingTest,
  voices: CompetingVoices,
  matrices: Matrices,
  series: Series,
  rotation: Rotation,
  paper_folding: PaperFolding,
  perspective: PerspectiveTaking,
  syllogisms: Syllogisms,
  symbols: SymbolMatching,
  flanker: DistractingArrows,
  cards: CardSorting,
  broken_words: BrokenWords,
  hidden_shapes: HiddenShapes,
  tapping: Tapping,
  tracking: Tracking,
  timing: Timing,
  steering: TwoHandSteering,
  track_count: TrackAndCount,
  near_chart: NearChart,
  colors: OddColorOut,
  side_vision: SideVision,
  designs: DesignFluency,
  uses: BrickUses,
  problems: SpotTheProblem,
};
