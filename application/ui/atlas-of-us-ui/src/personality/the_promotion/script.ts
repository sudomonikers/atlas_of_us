import type { Script } from '../personality';

// The Promotion: two designers, one job, and some easy ways to tip it
// You and Priya are up for the same promotion at a greeting card studio. Along the way there's credit to take that
// isn't yours, and a rival's file you could let slip. You prepare, you pitch, and then you don't get it.
// Written to the IPIP-NEO items in ../scene_grouping.md: using others for your own ends (A2.4), taking advantage of
// others (A2.9), obstructing others' plans (A2.10), misrepresenting the facts (C3.10), boasting (A5.9), seldom tooting
// your own horn (A5.4), excelling in what you do (C1.2), doing more than what's expected (C4.5), readily overcoming
// setbacks (N6.9), looking at the bright side (E6.6) and being very pleased with yourself (N3.10).

const JOAN = 'Joan';

export const thePromotion: Script = {
  id: 'the_promotion',
  title: 'The Promotion',
  facets: ['Depression', 'Vulnerability', 'Cheerfulness', 'Morality', 'Modesty', 'Self-Efficacy', 'Dutifulness', 'Achievement-Striving'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the job
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Promotion', animation: 'title_card' },
        { text: "It's Monday morning at Pemberton Cards. You've been designing birthday cards here for four years, and you're good at it.", animation: 'studio' },
        { text: 'Joan, who runs the studio, pins a notice up by the coffee machine: Senior Designer position open. Interviews a week from Monday.', animation: 'notice' },
        { text: "By lunchtime, everyone knows it's between you and Priya, who sits across from you. She started the same month you did. She's also really nice, which somehow makes it worse.", animation: 'rivals' },
      ],
      next: 'the_robins',
    },

    // -------------------------------------------------------------------------
    // the race
    // -------------------------------------------------------------------------
    the_robins: {
      steps: [
        { text: "On Wednesday, Joan calls you into her office. Your Christmas robin cards have been the studio's best sellers all year.", animation: 'robins' },
        { speaker: JOAN, text: 'These robins were your idea, weren\'t they? Corporate loves them.', animation: 'robins' },
        { text: 'They were actually Tom\'s idea. Tom is the junior designer you supervise. You approved them, but he drew every single one.', animation: 'tom' },
        {
          id: 'the_credit',
          prompt: 'What do you say to Joan? Pick the closest, and tell me why.',
          animation: 'tom',
          facets: ['Morality', 'Dutifulness'],
          choices: [
            { label: "Tell her they were Tom's idea, and he deserves the credit.", next: 'credit_tom' },
            { label: 'Say it was a team effort, and leave it there.', next: 'credit_team' },
            { label: 'Say yes. I did approve them, after all.', next: 'credit_mine' },
            { label: 'Say yes. Tom is junior, and I need this more than he does right now.', next: 'credit_ask' },
            { label: 'Something else.', next: 'friday', other: true },
          ],
        },
      ],
    },

    credit_tom: {
      steps: [{ text: '"They were Tom\'s idea," you say. Through the glass, Tom sees Joan waving at him, and turns pink.', animation: 'credit_tom' }],
      next: 'friday',
    },

    credit_team: {
      steps: [{ text: '"It was a team effort," you say. Joan nods, and writes your name down on her notepad.', animation: 'credit_team' }],
      next: 'friday',
    },

    credit_mine: {
      steps: [{ text: '"That was me," you say. Joan beams. Through the glass, you can see Tom drawing another robin.', animation: 'credit_mine' }],
      next: 'friday',
    },

    credit_ask: {
      steps: [{ text: '"That was me," you say. Later, by the coffee machine, you tell Tom. "Sure," he says, after a pause. "Of course."', animation: 'credit_ask' }],
      next: 'friday',
    },

    friday: {
      steps: [
        { text: "On Friday at four thirty, Priya is rushing out to her daughter's school play. She stops at your desk with her coat already on.", animation: 'priya_coat' },
        { text: '"Could you send my portfolio to the printer before six? It\'s for Monday. You\'re the best."', animation: 'priya_coat' },
        { text: 'You open her file. It\'s good. Really good. But it\'s set up at the wrong size, and the printer is going to cut the edges off every page.', animation: 'file' },
        {
          id: 'the_file',
          prompt: 'What do you do? Pick the closest, and tell me what goes through your head.',
          animation: 'file',
          facets: ['Morality'],
          choices: [
            { label: 'Fix the size, and send it. I want to win fair and square.', next: 'file_fix' },
            { label: "Send it as it is. Checking her work isn't my job.", next: 'file_send' },
            { label: 'Leave it until after six. She should have checked her own file.', next: 'file_slip' },
            { label: "Send it, and mention to Joan that Priya's been leaving early. It's true.", next: 'file_tell' },
            { label: 'Something else.', next: 'weekend', other: true },
          ],
        },
      ],
    },

    file_fix: {
      steps: [{ text: 'You fix it, send it, and email her: "Fixed your margins. Good luck on Monday!"', animation: 'file_fix' }],
      next: 'weekend',
    },

    file_send: {
      steps: [{ text: 'You click send and go home. On Monday, her pages come back with the edges cut off.', animation: 'file_send' }],
      next: 'weekend',
    },

    file_slip: {
      steps: [{ text: 'You go home at a quarter to six. On Monday morning, her file is still sitting in the print queue.', animation: 'file_slip' }],
      next: 'weekend',
    },

    file_tell: {
      steps: [{ text: 'You send it. Then, as you pass Joan\'s door, you say: "Looks like Priya left early again." Joan looks up, and says nothing.', animation: 'file_tell' }],
      next: 'weekend',
    },

    // -------------------------------------------------------------------------
    // the pitch
    // -------------------------------------------------------------------------
    weekend: {
      steps: [
        { text: 'It\'s the weekend before the interview. Your apartment is quiet, and your portfolio is sitting on the table.', animation: 'weekend' },
        {
          id: 'the_prep',
          prompt: 'How do you spend the weekend? Pick the closest, and tell me why.',
          animation: 'weekend',
          facets: ['Achievement-Striving', 'Self-Efficacy'],
          choices: [
            { label: 'Redo the whole portfolio, and design a new range nobody asked for.', next: 'prep_all' },
            { label: 'Pick my best work, print it nicely, and practice my answers.', next: 'prep_polish' },
            { label: 'Flick through my portfolio on Sunday night.', next: 'prep_sunday' },
            { label: 'Nothing. They know my work by now.', next: 'prep_none' },
            { label: 'Something else.', next: 'interview', other: true },
          ],
        },
      ],
    },

    prep_all: {
      steps: [{ text: 'You work all weekend on a new portfolio, plus twelve new cards for a line called "Sorry For Your Loss (Of Wi-Fi)." You go to bed at two in the morning.', animation: 'prep_all' }],
      next: 'interview',
    },

    prep_polish: {
      steps: [{ text: 'You pick your ten best pieces, print them on the good paper, and practice your answers out loud to the cat.', animation: 'prep_polish' }],
      next: 'interview',
    },

    prep_sunday: {
      steps: [{ text: 'On Sunday night, you flip through it on the couch with the TV on. It looks fine.', animation: 'prep_sunday' }],
      next: 'interview',
    },

    prep_none: {
      steps: [{ text: 'You spend the weekend doing anything but that. The portfolio stays on the table, with the cat asleep on top of it.', animation: 'prep_none' }],
      next: 'interview',
    },

    interview: {
      steps: [
        { text: "On Monday at ten o'clock, you're in Joan's office, with Dave from corporate taking notes.", animation: 'interview' },
        { speaker: JOAN, text: 'So. Why should it be you?', animation: 'why' },
        {
          id: 'the_pitch',
          prompt: 'What do you tell them? Pick the closest, then tell me what you\'d actually say.',
          animation: 'why',
          facets: ['Modesty', 'Self-Efficacy'],
          choices: [
            { label: "That I'm the best designer in the building, and everyone knows it.", next: 'pitch_boast' },
            { label: "My best work, plainly, and the extra I've taken on.", next: 'pitch_plain' },
            { label: "Not much. I'd rather let my work speak for itself.", next: 'pitch_quiet' },
            { label: "Honestly, I'm not sure I'm ready.", next: 'pitch_doubt' },
            { label: 'Something else.', next: 'announce', other: true },
          ],
        },
      ],
    },

    pitch_boast: {
      steps: [{ text: 'You tell them you\'re the best designer in the building, and list all the reasons why. Dave stops writing.', animation: 'pitch_boast' }],
      next: 'announce',
    },

    pitch_plain: {
      steps: [{ text: 'You walk them through your best work, and all the extra things you\'ve taken on. Joan keeps nodding.', animation: 'pitch_plain' }],
      next: 'announce',
    },

    pitch_quiet: {
      steps: [{ text: 'You slide your portfolio across the desk, and tell them they already know what you can do. There\'s a long pause.', animation: 'pitch_quiet' }],
      next: 'announce',
    },

    pitch_doubt: {
      steps: [{ text: '"I\'m not sure I\'m ready," you hear yourself say. Joan looks at you for a long moment.', animation: 'pitch_doubt' }],
      next: 'announce',
    },

    // -------------------------------------------------------------------------
    // you don't get it
    // -------------------------------------------------------------------------
    announce: {
      steps: [
        { text: 'On Friday afternoon, Joan calls the whole studio over. There\'s a cake.', animation: 'cake' },
        { speaker: JOAN, text: 'Please congratulate our new Senior Designer: Priya!', animation: 'announce' },
        { text: 'Everyone claps. Priya catches your eye, a little awkwardly. So does everyone else.', animation: 'eyes' },
        {
          id: 'the_news',
          prompt: "What goes through your head, and what do you do? Pick the closest, and be honest.",
          animation: 'eyes',
          facets: ['Vulnerability', 'Cheerfulness'],
          choices: [
            { label: "Clap, and mean it. There'll be other chances.", next: 'news_clap' },
            { label: 'Clap and smile, and feel sick until it\'s time to go home.', next: 'news_smile' },
            { label: 'Slip off to the restroom for a bit, to pull myself together.', next: 'news_loos' },
            { label: "Say well done, then go home early. I can't face anyone.", next: 'news_home' },
            { label: 'Something else.', next: 'bus', other: true },
          ],
        },
      ],
    },

    news_clap: {
      steps: [{ text: 'You give Priya a hug, and have two slices of cake. By five, you\'re laughing with Tom about something else entirely.', animation: 'news_clap' }],
      next: 'bus',
    },

    news_smile: {
      steps: [{ text: 'You smile until your face hurts. Back at your desk, you stare at the same robin for an hour.', animation: 'news_smile' }],
      next: 'bus',
    },

    news_loos: {
      steps: [{ text: 'You lock the stall door and sit there for ten minutes, reading the hand-washing sign over and over.', animation: 'news_loos' }],
      next: 'bus',
    },

    news_home: {
      steps: [{ text: 'You mumble something about a dentist appointment, and you\'re on the bus by three.', animation: 'news_home' }],
      next: 'bus',
    },

    bus: {
      steps: [
        { text: 'On the bus home, the rain runs down the window. Your phone buzzes. It\'s Joan: "It was close, honestly. In the end, corporate wanted someone who\'s already run a range on their own, and Priya ran the Easter line last spring."', animation: 'bus' },
        { text: 'Then it buzzes again. It\'s your mom, asking how it went.', animation: 'bus' },
        {
          id: 'the_mirror',
          prompt: "How do you feel about yourself, right now? Pick the closest, and tell me what you'd text her back.",
          animation: 'bus',
          facets: ['Depression', 'Cheerfulness'],
          choices: [
            { label: "Good, honestly. I did well, and I'm proud of how I went about it.", next: 'later' },
            { label: "Crushed. But it's one job, and something better will come along.", next: 'later' },
            { label: "Like I'm not as good as I thought I was.", next: 'later' },
            { label: "Like there's no point trying. It always goes this way.", next: 'later' },
          ],
        },
      ],
    },

    later: {
      steps: [
        { text: 'A month later, Priya runs her first studio meeting. At the end, she asks if you\'d like to lead the Easter line.', animation: 'later' },
        {
          id: 'looking_back',
          prompt: 'Looking back on those two weeks, are you happy with how you went after it? What would you do differently? And how long did losing it stay with you?',
          animation: 'later',
          facets: ['Depression', 'Vulnerability', 'Cheerfulness', 'Morality', 'Modesty', 'Self-Efficacy', 'Dutifulness', 'Achievement-Striving'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you, and your real working life.', animation: 'homework' },
        {
          id: 'last_edge',
          prompt: 'When did you last have the chance to get ahead at someone else\'s expense: take credit that wasn\'t yours, bend the truth, or let a rival trip up? What did you do?',
          animation: 'homework',
          facets: ['Morality', 'Dutifulness'],
        },
        {
          id: 'last_praise',
          prompt: 'When someone asks what you\'re good at, at work, a party or a family get-together, what do you tell them? And when did you last do far more than anyone asked of you?',
          animation: 'homework',
          facets: ['Modesty', 'Self-Efficacy', 'Achievement-Striving'],
        },
        {
          id: 'last_setback',
          prompt: 'Think of your last real setback: a job, a relationship, a plan that fell through. How long did it take you to get over it? And these days, how do you feel about yourself, on the whole?',
          animation: 'homework',
          facets: ['Depression', 'Vulnerability', 'Cheerfulness'],
        },
        { text: 'On Monday, there\'s a card on your desk. It\'s one of the robins. Inside, Priya has written: "Couldn\'t have done it without you. Drinks on Friday? -P"', animation: 'goodbye' },
      ],
    },
  },
};
