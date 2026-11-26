import { lazy, Suspense, useEffect } from 'react';
import { setConfig, useSession } from '../../auth/api';
import { navigate } from '../../router';
import { StoryPlayer } from '../../shared_components/story/player';
import { preloadSkills } from '../../shared_components/story/atlas';
import { sameAnswer, type Choice, type Script, type Stage } from './script';
import { StageView } from './stage';
import { noteWatched } from './watched';

const Whiteboard = lazy(() => import('./whiteboard'));

//every skill the interludes show, and whether a step brings on what it links to
const shownIn = (script: Script) =>
  Object.values(script.sections).flatMap((section) =>
    section.steps.flatMap((step) => {
      const stage = 'stage' in step ? step.stage : undefined;
      if (stage?.kind === 'skill') return [{ name: stage.skill, expand: false }];
      if (stage?.kind === 'graph' || stage?.kind === 'fit') return stage.skills.map((name) => ({ name, expand: stage.kind === 'graph' && !!stage.expand }));
      return [];
    }),
  );

function Intro() {
  const session = useSession();
  //leaving the story, however the user leaves it, notes it as seen and opens the scenes, or what they picked
  const leave = (choice?: Choice) => {
    if (session.status === 'authenticated') setConfig({ personality_intro_seen: true }).catch(() => {});
    else noteWatched(true);
    navigate(choice?.scene ? `/personality?chapter=${choice.scene}` : choice?.view ? `/personality?view=${choice.view}` : '/personality');
  };

  //the interludes read the real Atlas, so start reading all of it while the story is still being told
  useEffect(() => preloadSkills(shownIn(sameAnswer)), []);

  return (
    <StoryPlayer<Stage, Choice>
      script={sameAnswer}
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
