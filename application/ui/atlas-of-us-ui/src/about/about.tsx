import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { useSession } from '../auth/api';
import { Feedback } from '../feedback/feedback';
import { navigate } from '../router';
import { Nav } from '../shared_components/nav';
import andrew from './andrew.png';
import { Interviewer } from './interviewer';

const gunmetal = 'var(--gunmetal-black)';
const blue = 'var(--air-force-blue)';
const brownRed = 'var(--brown-red)';
const ivory = 'var(--ivory-white)';
const comic = 'var(--font-comic)';

//the interview: Atlas asks, Andrew answers, Atlas sometimes can't help himself (retort), and some answers are
//followed by a pull quote
const INTERVIEW: { q: string; a: ReactNode; retort?: string; quote?: string }[] = [
  {
    q: 'So, who are you?',
    a: (
      <>
        I'm Andrew Link. I'm a software engineer, and right now I'm the whole team. Here's my{' '}
        <a href="https://www.linkedin.com/in/sudomoniker" target="_blank" rel="noreferrer" style={{ color: brownRed }}>
          LinkedIn
        </a>
        .
      </>
    ),
    retort: "That's it? A job title and a LinkedIn? Buddy, you should really try the site you built.",
  },
  {
    q: 'Fine. Then why build me?',
    a: "As a kid I loved games where you build your own character. I'd spend hours making mine as powerful as possible, and nothing beat finally getting them exactly how I wanted. I wished real life had that: a screen showing who I am, and a place where I could easily see everything I could become.",
    retort: "So I'm a character creator with extra steps. I've been called worse.",
    quote: 'I wanted to see the skill tree of life.',
  },
  {
    q: "Hasn't this been done? Personality tests, career quizzes, whatever your horoscope says this week?",
    a: "There are, and they're not bad, exactly. They just each look at one sliver of you, so none of them do the job very well. The Atlas tries to see the whole picture.",
    retort: "Bold of you to call horoscopes \"not bad, exactly.\"",
  },
  {
    q: 'Who is it actually for? Be honest.',
    a: "Me, honestly. It's what I wish I'd had. But it's also for anyone who wants to become the best version of themselves. It's just a tool to help you get there.",
    retort: 'An audience of one. Very exclusive.',
    quote: "I'm building the thing I wish I'd had.",
  },
  {
    q: 'Do people have to pay for all this?',
    a: "No. The Atlas is free. Some of the apps further down the roadmap might cost something one day, and you'll know before they do.",
    retort: 'Free. My favorite price.',
  },
  {
    q: "Okay, the big one. Are you going to sell everyone's data?",
    a: "Nothing is sold or shared today. I won't pretend that could never change, because given the chance, we might. If we ever do, you'll be told exactly what's available, and you'll be able to opt out.",
    quote: "The one thing I won't do is lie about what we're doing.",
  },
  {
    q: 'How do you know any of this is right? Be honest, did you just make it up?',
    a: "I make it as science-backed as I can, but for now that's mostly my own research, which is probably not enough. If this grows, I'd love to get real scientists involved and make it as true to life as possible.",
    retort: "So if I get someone wrong, I'm blaming your research.",
  },
  {
    q: 'Is this a real company, or just a guy with a laptop?',
    a: "Not yet. It's a side project. If other people are interested, I'd love to turn it into a real startup. Either way I'm going to keep building it, because I want it to exist.",
    retort: 'A guy with a laptop. Got it.',
  },
];

const LINKS = [
  ['Email', 'mailto:hello@atlas-of-us.com'],
  ['Reddit', 'https://www.reddit.com/r/Atlas_Of_Us/'],
  ['Discord', 'https://discord.com/mVSSTXPcr'],
];

const Question = ({ children }: { children: ReactNode }) => (
  <div style={styles.question}>
    <div style={styles.avatar}>
      <Interviewer size={90} />
    </div>
    <p style={styles.bubble} className="comic-bubble">
      {children}
    </p>
  </div>
);

const Answer = ({ children }: { children: ReactNode }) => (
  <div style={styles.answer}>
    <div style={styles.card} className="comic-panel">
      <span style={styles.speaker}>Andrew:</span> {children}
    </div>
    <div style={styles.avatar}>
      <img src={andrew} alt="Andrew Link and dog" width={64} height={64} style={styles.photo} />
    </div>
  </div>
);

//who's behind the Atlas and why, as a magazine interview: Atlas sits down with the person who made him
export default function About() {
  const loggedIn = useSession().status === 'authenticated';

  return (
    <div style={styles.page} className="comic-page">
      <Nav />

      <header style={styles.masthead}>
        <p style={styles.issue}>Issue No. 1 · The About Page</p>
        <h1 style={styles.title} className="comic-title">
          The Atlas Interview
        </h1>
        <p style={styles.deck}>In which our mascot finally sits down with the person who made him.</p>
      </header>

      <div style={styles.cover}>
        <figure style={styles.sitter}>
          <Interviewer size={190} />
          <figcaption style={styles.caption}>Atlas, mascot</figcaption>
        </figure>
        <span style={styles.vs}>&</span>
        <figure style={styles.sitter}>
          <div style={styles.frame}>
            <img src={andrew} alt="Andrew Link and dog" width={170} height={170} style={styles.photo} />
          </div>
          <figcaption style={styles.caption}>Andrew Link, builder</figcaption>
        </figure>
      </div>

      <article style={styles.article}>
        {INTERVIEW.map(({ q, a, retort, quote }) => (
          <Fragment key={q}>
            <Question>{q}</Question>
            <Answer>{a}</Answer>
            {retort && <Question>{retort}</Question>}
            {quote && <blockquote style={styles.quote}>“{quote}”</blockquote>}
          </Fragment>
        ))}

        <Question>Say people actually like this. How do they get involved?</Question>
        <Answer>
          Ideas, bugs, or you'd like to help build it? I'd love to hear from you.
          {loggedIn ? ' Use the feedback button, or find me here:' : ' Email me, or find me here:'}
          <span style={styles.links}>
            {loggedIn && <Feedback buttonStyle={styles.primary} />}
            {LINKS.map(([name, href]) => (
              <a key={name} className="comic-lift" style={styles.secondary} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                {name}
              </a>
            ))}
          </span>
        </Answer>

        <Question>Any last words before I take over the site?</Question>
        <Answer>Go find out who you are. Then let's figure out who you could become.</Answer>
      </article>

      <footer style={styles.footer}>
        <button className="comic-lift" style={styles.primary} onClick={() => navigate(loggedIn ? '/personality' : '/create-account?next=/personality')}>
          Map my personality ▶
        </button>
      </footer>
    </div>
  );
}

const button: CSSProperties = {
  padding: '6px 18px',
  border: `3px solid ${gunmetal}`,
  borderRadius: '14px 8px 12px 6px / 8px 12px 6px 14px',
  boxShadow: `3px 4px 0 ${gunmetal}`,
  fontFamily: comic,
  fontSize: 22,
  letterSpacing: 1.5,
  textDecoration: 'none',
};

const styles: Record<string, CSSProperties> = {
  page: {
    position: 'fixed',
    inset: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '32px 16px 64px',
    boxSizing: 'border-box',
    textAlign: 'left',
  },
  //a magazine masthead between a thick rule and a double rule
  masthead: {
    maxWidth: 860,
    margin: '16px auto 0',
    padding: '14px 0 22px',
    borderTop: `6px solid ${gunmetal}`,
    borderBottom: `8px double ${gunmetal}`,
    textAlign: 'center',
  },
  issue: {
    margin: '0 0 12px',
    fontFamily: comic,
    fontSize: 18,
    letterSpacing: 2,
    color: brownRed,
  },
  title: {
    fontSize: 'clamp(44px, 9vw, 92px)',
  },
  deck: {
    margin: '14px 0 0',
    fontSize: 22,
    fontStyle: 'italic',
  },
  cover: {
    margin: '36px auto 0',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 'clamp(12px, 4vw, 36px)',
  },
  sitter: {
    minWidth: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  frame: {
    padding: 8,
    background: '#fff',
    border: `4px solid ${gunmetal}`,
    borderRadius: 18,
    boxShadow: `5px 6px 0 ${brownRed}`,
  },
  caption: {
    fontFamily: comic,
    fontSize: 20,
    letterSpacing: 1,
    color: blue,
    textAlign: 'center',
  },
  vs: {
    alignSelf: 'center',
    fontFamily: comic,
    fontSize: 56,
    color: brownRed,
  },
  article: {
    maxWidth: 760,
    margin: '48px auto 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  question: {
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    marginTop: 14,
  },
  bubble: {
    margin: 0,
    fontFamily: comic,
    fontSize: 24,
    letterSpacing: 1,
    color: blue,
  },
  answer: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 12,
    paddingLeft: 'clamp(0px, 8vw, 80px)',
  },
  card: {
    flex: '1 1 auto',
    padding: '16px 20px',
    fontSize: 21,
    lineHeight: 1.45,
    borderRadius: '22px 22px 4px 22px',
    '--panel-fill': ivory,
  } as CSSProperties,
  speaker: {
    fontFamily: comic,
    letterSpacing: 1,
    color: brownRed,
  },
  avatar: {
    flex: '0 0 auto',
  },
  photo: {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: 10,
  },
  //a pull quote, set big between rules
  quote: {
    margin: '22px 0',
    padding: '18px 8px',
    borderTop: `4px solid ${gunmetal}`,
    borderBottom: `4px solid ${gunmetal}`,
    fontFamily: comic,
    fontSize: 'clamp(30px, 5.5vw, 46px)',
    letterSpacing: 1,
    lineHeight: 1.1,
    color: brownRed,
    textAlign: 'center',
  },
  links: {
    marginTop: 14,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  footer: {
    margin: '56px auto 0',
    textAlign: 'center',
  },
  primary: { ...button, background: brownRed, color: ivory },
  secondary: { ...button, background: ivory, color: gunmetal },
};
