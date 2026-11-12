import { lazy, Suspense, useEffect } from 'react';
import { setConfig, useSession } from '../../auth/api';
import { navigate } from '../../router';
import { StoryPlayer } from '../../shared_components/story/player';
import { preloadSkills } from '../../shared_components/story/atlas';
import { twoPlayers, type Choice, type Script, type Stage } from './script';
import { StageView } from './stage';
import { noteWatched } from './watched';

// The story that opens Physical Traits: Andrew and Daniel told across the whole screen, a step at a time, with the
// whiteboard behind it and the real Atlas over it during the interludes. It ends on where the user wants to start, and
// opens that chapter. Anyone can watch it; the chapters take an account.

const Whiteboard = lazy(() => import('./whiteboard'));

//every skill the interludes show, and whether a step brings on what it links to
const shownIn = (script: Script) =>
  Object.values(script.sections).flatMap((section) =>
    section.steps.flatMap((step) => {
      const stage = 'stage' in step ? step.stage : undefined;
      if (!stage) return [];
      const names = stage.kind === 'skill' ? [stage.skill] : stage.skills;
      return names.map((name) => ({ name, expand: stage.kind === 'graph' && !!stage.expand }));
    }),
  );

function Intro() {
  const session = useSession();
  //leaving the story, however the user leaves it, notes it as seen and opens the chapters or the one they picked
  const leave = (choice?: Choice) => {
    if (session.status === 'authenticated') setConfig({ physical_intro_seen: true }).catch(() => {});
    else noteWatched(true);
    navigate(choice?.chapter ? `/physical?chapter=${choice.chapter}` : '/physical');
  };

  //the interludes read the real Atlas, so start reading all of it while the story is still being told
  useEffect(() => preloadSkills(shownIn(twoPlayers)), []);

  return (
    <StoryPlayer<Stage, Choice>
      script={twoPlayers}
      board={(animation) => (
        <Suspense fallback={null}>
          <Whiteboard animation={animation} />
        </Suspense>
      )}
      stage={(stage) => <StageView stage={stage} />}
      onLeave={leave}
      exitLabel="Skip to the chapters"
    />
  );
}

export default Intro;
