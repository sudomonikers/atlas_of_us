import { useEffect, useState, type CSSProperties } from 'react';

//the match, opened like a gift: sealed, then torn open, then who they are and why they fit, one piece at a time.
//Matching isn't built yet, so it's always the same mocked person
const MATCH = {
  first_name: 'Maya',
  age: 27,
  city: 'Brooklyn',
  headline: 'Warm, curious and quietly stubborn about the things that matter',
  compatibility: 94,
  fits: [
    { area: 'Personality', score: 91, note: "You're both open to anything new, and she's steady where you run hot" },
    { area: 'Values', score: 96, note: 'Family close by, honesty over comfort, and work that means something' },
    { area: 'Lifestyle', score: 88, note: 'Early mornings, a few close friends, rarely out past midnight' },
    { area: 'Interests', score: 93, note: 'Climbing, film photography and cooking for too many people' },
  ],
  shared: ['Rock Climbing', 'Film Photography', 'Italian Cooking', 'Early riser', 'Jazz'],
};

const OPENING_MS = 1600;

export default function Match() {
  const [stage, setStage] = useState<'sealed' | 'opening' | 'open'>('sealed');

  useEffect(() => {
    if (stage !== 'opening') return;
    const timer = setTimeout(() => setStage('open'), OPENING_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  if (stage !== 'open')
    return (
      <div className="page match">
        <button
          className={`gift ${stage}`}
          onClick={() => setStage('opening')}
          disabled={stage === 'opening'}
          aria-label="Open your match"
        >
          <span className="gift-lid" />
          <span className="gift-burst" />
        </button>
        <h1>
          {stage === 'sealed' ? (
            <>
              Your person <em>is here.</em>
            </>
          ) : (
            <em>Here they are...</em>
          )}
        </h1>
        <p className="lead">{stage === 'sealed' ? 'Tap to open when you’re ready.' : ' '}</p>
      </div>
    );

  //each piece fades in after the one before it
  let step = 0;
  const next = () => ({ '--step': step++ }) as CSSProperties;

  return (
    <div className="page match open">
      <div className="reveal portrait" style={next()} aria-hidden="true">
        {MATCH.first_name[0]}
      </div>
      <h1 className="reveal" style={next()}>
        {MATCH.first_name}, {MATCH.age}
      </h1>
      <p className="reveal muted" style={next()}>
        {MATCH.city}
      </p>
      <p className="reveal lead" style={next()}>
        “{MATCH.headline}”
      </p>

      <div className="reveal score" style={next()}>
        <span className="score-value">
          <CountUp to={MATCH.compatibility} />%
        </span>
        <span className="muted">compatible, from everything the Atlas knows about you both</span>
      </div>

      <h2 className="reveal" style={next()}>
        Why you fit
      </h2>
      <ul className="fits">
        {MATCH.fits.map((f) => (
          <li key={f.area} className="reveal card" style={next()}>
            <div className="fit-head">
              <span>{f.area}</span>
              <span>{f.score}%</span>
            </div>
            <span className="bar">
              <span style={{ width: `${f.score}%` }} />
            </span>
            <p>{f.note}</p>
          </li>
        ))}
      </ul>

      <h2 className="reveal" style={next()}>
        You both
      </h2>
      <ul className="reveal shared" style={next()}>
        {MATCH.shared.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <button className="reveal button" style={next()} disabled>
        Say hello
      </button>
    </div>
  );
}

//a number counting up from 0, after the pieces before it have shown
function CountUp({ to }: { to: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = performance.now() + 2000;
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min(1, Math.max(0, (now - start) / 1200));
      setValue(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [to]);
  return value;
}
