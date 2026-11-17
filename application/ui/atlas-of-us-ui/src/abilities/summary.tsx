import { askForSummary, CATEGORIES, getSummary, type AbilitiesSummary } from './api';
import { WrittenReport } from '../shared_components/written_report';
import { WriteUpPanel } from '../shared_components/write_up_panel';

//the summary Atlas writes of everything someone has added to Abilities, on Your results and their profile
export function SummaryText({ summary }: { summary: AbilitiesSummary }) {
  const sections = CATEGORIES.flatMap((c) => summary.areas.filter((a) => a.key === c.id).map((a) => ({ key: a.key, label: c.label, text: a.text })));
  const lists = [
    { title: 'Strengths', items: summary.strengths },
    { title: 'Worth working on', items: summary.work_on },
    { title: 'Working around', items: summary.working_around },
  ];
  return <WrittenReport headline={summary.headline} overview={summary.overview} sections={sections} lists={lists} />;
}

//the user's summary at the top of Your results: written on their asking, once there's enough to write about, and
//written again when they ask after their results change
export function SummaryPanel() {
  return (
    <WriteUpPanel
      get={getSummary}
      ask={askForSummary}
      render={(summary) => <SummaryText summary={summary} />}
      words={{
        label: 'Your summary',
        finding: 'Finding your summary',
        writing: 'Writing up your summary',
        rewriting: 'Rewriting it with your latest results',
        enough: 'I have enough to write up what your results say about you as a whole.',
        notEnough: "Add a few more results and I'll write up the whole picture. The chapters below are a good place to start.",
        changed: 'Your results have changed since I wrote this.',
      }}
    />
  );
}
