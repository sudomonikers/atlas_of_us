import type { Script } from '../personality';

// The Night Market: ten silver coins, and one night to get through
// A fable. You're a traveler, and you reach a market town at dusk with ten silver, and the coach home leaves at dawn for
// six. Everyone starts with the same purse and the same fare, so every choice costs the same for every player, whatever
// their real life is like. On the way to the coach: the thing you can never walk past, a barker's game, a boy whose
// purse was cut, and a coachman who will take your word for it.
// Written to the IPIP-NEO items in ../scene_grouping.md: easily resisting temptations (N5.7), making rash decisions
// (C6.5), rushing into things (C6.7), avoiding mistakes (C6.1), not seeing the consequences of things (C1.10), feeling
// sympathy for those who are worse off than myself (A6.2) and cheating to get ahead (A2.6).

const STALLHOLDER = 'The stallholder';
const BARKER = 'The barker';
const TAM = 'Tam';

export const theNightMarket: Script = {
  id: 'the_night_market',
  title: 'The Night Market',
  facets: ['Immoderation', 'Morality', 'Sympathy', 'Self-Efficacy', 'Cautiousness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the stall
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Night Market', animation: 'title_card' },
        { text: "You're a traveler, a long way from home, and you've been walking since sunrise. The sun is going down as you come over the last hill, and below you, a market town is lighting its lanterns.", animation: 'hill' },
        { text: 'In your purse there are ten silver coins. As far as this story goes, that is all the money you have in the world.', animation: 'purse' },
        { text: 'The coach home leaves from the town square at dawn, and a seat costs six. That leaves you four to spare, and one long night to get through.', animation: 'fare' },
        { text: "Tonight is market night. The square is full of stalls and music, and the whole town smells of roasting chestnuts.", animation: 'market' },
        { text: "Halfway down the first row, something stops you in your tracks. It's sitting on a stall under a lantern, and it's exactly the kind of thing you've never been able to walk past.", animation: 'stall' },
        { speaker: STALLHOLDER, text: "Lovely, isn't it? Four silver, and it's yours. I'm packing up at midnight, and I won't be back this way for a year.", animation: 'stall_price' },
        {
          id: 'the_stall',
          prompt: "What is it? Describe it for me: the thing you've never been able to walk past. Then pick what you do, and tell me why.",
          animation: 'stall_price',
          facets: ['Immoderation'],
          choices: [
            { label: "Buy it. I'll worry about the rest of the night later.", next: 'stall_buy' },
            { label: 'See the rest of the market first, and come back if I still want it.', next: 'stall_later' },
            { label: "Walk on. That's all my spare silver, and the night has only just started.", next: 'stall_leave' },
            { label: 'Haggle her down, and buy it.', next: 'stall_haggle' },
            { label: 'Something else.', next: 'the_game', other: true },
          ],
        },
      ],
    },

    stall_buy: {
      steps: [{ text: "She wraps it in brown paper and ties it with string. It's heavier than you expected, and it's yours.", animation: 'stall_bought' }],
      next: 'the_game',
    },

    stall_later: {
      steps: [{ text: "You tell her you'll think about it, and walk on into the market. \"I'm here till midnight,\" she calls after you. \"After that, it goes in the cart with everything else.\"", animation: 'stall_later' }],
      next: 'the_game',
    },

    stall_leave: {
      steps: [{ text: 'You walk on. At the end of the row, just once, you look back.', animation: 'stall_left' }],
      next: 'the_game',
    },

    stall_haggle: {
      steps: [{ text: 'It takes ten minutes and a lot of sighing on both sides, but in the end she lets it go for three.', animation: 'stall_haggled' }],
      next: 'the_game',
    },

    // -------------------------------------------------------------------------
    // the barker's game
    // -------------------------------------------------------------------------
    the_game: {
      steps: [
        { text: 'In the middle of the square, a crowd has gathered around a man in a striped coat. He has three wooden cups and a dried pea on an upturned barrel.', animation: 'barker' },
        { speaker: BARKER, text: 'Two silver to play, and four back if you find the pea! Double your money, friends. It\'s the simplest game in the world.', animation: 'cups' },
        { text: 'You watch a woman play. She finds the pea on her first try, and walks off grinning with four silver in her hand.', animation: 'winner' },
        { speaker: BARKER, text: 'Who\'s next? Step up, step up! Now, the rules are very simple. Rule one—', animation: 'rules' },
        {
          id: 'the_game',
          prompt: "He's only just started on the rules. What do you do? Pick one, and tell me why. And what could go wrong?",
          animation: 'rules',
          facets: ['Cautiousness', 'Self-Efficacy'],
          choices: [
            { label: "Step up and play now. I've seen how it works.", next: 'game_now' },
            { label: 'Hear the rest of the rules first, then decide.', next: 'game_rules' },
            { label: 'Watch a few more rounds before I put down any silver.', next: 'game_watch' },
            { label: "Walk on. I don't play games like this.", next: 'game_pass' },
            { label: 'Something else.', next: 'the_fountain', other: true },
          ],
        },
      ],
    },

    game_now: {
      steps: [
        { text: 'You put down two silver, and point to the left cup. He lifts it, and there\'s the pea.', animation: 'game_found' },
        { speaker: BARKER, text: "Well found! But rule three, friend: the first round is a practice round, and the house keeps the stake. Go again?", animation: 'game_lost' },
      ],
      next: 'the_fountain',
    },

    game_rules: {
      steps: [{ text: "He rattles through them. Rule three comes out a little faster than the others: the first round is a practice round, and the house keeps the stake. A few people in the crowd drift away.", animation: 'game_rule' }],
      next: 'the_fountain',
    },

    game_watch: {
      steps: [{ text: "You watch five more rounds, and nobody wins. Then the grinning woman from before slips back into the crowd, and works her way to the front again.", animation: 'game_watched' }],
      next: 'the_fountain',
    },

    game_pass: {
      steps: [{ text: "You walk on. Behind you, the barker calls out that you'll be sorry.", animation: 'game_passed' }],
      next: 'the_fountain',
    },

    // -------------------------------------------------------------------------
    // Tam
    // -------------------------------------------------------------------------
    the_fountain: {
      steps: [
        { text: 'Late in the night, the stalls are packing up. By the fountain, a boy of about seventeen is sitting on his bag, with his head in his hands.', animation: 'fountain' },
        { speaker: TAM, text: "Someone cut my purse in the crowd. Everything I had was in it. The coach is the only way home, and I can't even pay for a bed tonight.", animation: 'tam' },
        { text: "He doesn't ask you for anything. He just looks at the purse in your hand, and then away.", animation: 'tam_purse' },
        {
          id: 'the_fountain',
          prompt: 'Honestly, what goes through your head when you see him? Pick what you do, and tell me how you feel.',
          animation: 'tam_purse',
          facets: ['Sympathy'],
          choices: [
            { label: 'Give him whatever I can spare, even if that means all of it.', next: 'tam_give' },
            { label: 'Help him another way: find the night watch with him, and share my supper.', next: 'tam_help' },
            { label: 'I feel for him, but I need my silver. I wish him luck.', next: 'tam_luck' },
            { label: "Walk on. I can't help everyone I pass.", next: 'tam_no' },
            { label: 'Something else.', next: 'the_line', other: true },
          ],
        },
      ],
    },

    tam_give: {
      steps: [{ text: 'He tries to give it back twice. The third time, he just holds it, and says thank you very quietly.', animation: 'tam_given' }],
      next: 'the_line',
    },

    tam_help: {
      steps: [{ text: "You find the night watch together, and split your bread and cheese while the watchman writes everything down. It's past two by the time you say goodnight.", animation: 'tam_watch' }],
      next: 'the_line',
    },

    tam_luck: {
      steps: [{ text: '"Thanks," he says. "You too." When you look back, he\'s still sitting by the fountain.', animation: 'tam_left' }],
      next: 'the_line',
    },

    tam_no: {
      steps: [{ text: "You walk past him. He doesn't look up.", animation: 'tam_left' }],
      next: 'the_line',
    },

    // -------------------------------------------------------------------------
    // the coach
    // -------------------------------------------------------------------------
    the_line: {
      steps: [
        { text: "Just before dawn, you make your way back to the square. The coach is waiting in the frost, and the horses' breath is steaming.", animation: 'coach' },
        { text: '"Twelve seats!" the coachman calls. There\'s already a line, and you count heads: you\'re fourteenth. If you miss this one, the next coach leaves at noon, and you\'ll be home a little after midnight instead of by nightfall.', animation: 'line' },
        { text: 'The coachman climbs up onto his box, and calls down the line: "Anyone with real need, sickness at home, a baby on the way, come to the front. I\'ll take your word for it."', animation: 'urgent' },
        { text: "Nobody steps forward. The woman just ahead of you, thirteenth in line, stamps her feet in the cold and mutters that she's been waiting since four.", animation: 'urgent' },
        {
          id: 'the_line',
          prompt: "He has no way to check, and you'll never see any of these people again. Nobody would ever know. What do you do? Pick one, and tell me why.",
          animation: 'urgent',
          facets: ['Morality'],
          choices: [
            { label: 'Stay where I am, and take the noon coach if I have to.', next: 'line_wait' },
            { label: "Step forward, and make up a reason. It's a white lie, and I'll never see any of them again.", next: 'line_lie' },
            { label: 'Step forward, and stretch the truth. I really do want to get home.', next: 'line_stretch' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    line_wait: {
      steps: [{ text: 'The coach fills up and rattles off without you. You find a bench by the fire at the inn, and doze until the noon coach.', animation: 'line_noon' }],
      next: 'the_end',
    },

    line_lie: {
      steps: [{ text: '"My mother is very ill," you say. The coachman nods, and waves you up. Through the window, you watch the woman who was thirteenth get turned away.', animation: 'line_aboard' }],
      next: 'the_end',
    },

    line_stretch: {
      steps: [{ text: '"I really have to get home," you say, which is true, as far as it goes. The coachman nods, and waves you up. Through the window, you watch the woman who was thirteenth get turned away.', animation: 'line_aboard' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // the ride home
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: "The coach rattles out of town. You have whatever's left in your purse, and a long ride ahead to think about the night.", animation: 'road' },
        {
          id: 'line_if',
          prompt: "Thinking back to the line: would anything have changed your answer? Say the next coach wasn't for three days, or someone was waiting for you at home. Is there any situation where you would lie your way onto that coach, or any where you wouldn't?",
          animation: 'road',
          facets: ['Morality'],
        },
        {
          id: 'way_home',
          prompt: 'How do you feel about your night at the market? Would you do anything differently?',
          animation: 'road',
          facets: ['Immoderation', 'Cautiousness', 'Sympathy'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a few questions about you. Your real life, that is, not the market.', animation: 'homework' },
        {
          id: 'last_gave_in',
          prompt: "Think of the last time you gave in to something you'd meant to resist: a snack, a show, a purchase, one more of anything. What was it, how hard did you try, and how did you feel about it afterward?",
          animation: 'homework',
          facets: ['Immoderation'],
        },
        {
          id: 'last_decision',
          prompt: 'Think of the last real decision you made, big or small. How long did you take over it, and how did it turn out? And the last time you rushed into something, what happened?',
          animation: 'homework',
          facets: ['Cautiousness', 'Self-Efficacy'],
        },
        {
          id: 'last_worse_off',
          prompt: 'The last time you saw someone worse off than you, what went through your head? And when did you last bend a rule because nobody would know?',
          animation: 'homework',
          facets: ['Sympathy', 'Morality'],
        },
        { text: 'At last, the coach comes over the last hill, and there is home.', animation: 'goodbye' },
      ],
    },
  },
};
