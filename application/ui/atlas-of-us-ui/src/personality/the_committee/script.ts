import type { Script } from '../personality';

// The Committee: a street festival that nobody is running
// A flyer says the Larch Road street festival is coming back after twelve years, if the neighbors will run it. The first
// meeting in the church basement, the group chat and the bar, the programs at midnight, then the morning of the festival:
// ten things going wrong at once, a misspelt banner, and a neighbor's cakes all over the sidewalk.
// Written to the IPIP-NEO items in ../scene_grouping.md: taking charge (E3.1), trying to lead others (E3.2), taking
// control of things (E3.5), enjoying being part of a group (E2.3), managing many things at the same time (E4.4), knowing
// how to get things done (C1.6), demanding quality (C4.7), putting little time and effort into my work (C4.10) and
// taking no time for others (A3.10).

const PAT = 'Pat, from number 3';
const BARRY = 'Barry';
const KWAME = 'Kwame';

export const theCommittee: Script = {
  id: 'the_committee',
  title: 'The Committee',
  facets: ['Gregariousness', 'Assertiveness', 'Activity Level', 'Altruism', 'Self-Efficacy', 'Achievement-Striving'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the first meeting
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Committee', animation: 'title_card' },
        { text: 'A flyer comes through your mail slot. The Larch Road street festival is coming back after twelve years, as long as the neighbors are willing to run it.', animation: 'flyer' },
        { text: "The first meeting is on Tuesday at 7pm, in the basement of St. Anne's church. Fourteen neighbors sit on plastic chairs around a coffee urn and a plate of cookies that nobody has touched.", animation: 'hall' },
        { speaker: PAT, text: "Well, I printed the flyers, and I'm afraid that's all I've got in me. I'm eighty-one. So, who's going to run it?", animation: 'pat' },
        { text: 'Nobody says anything. Barry starts telling a long story about the 2013 festival. A chair creaks, and twelve people stare down into their coffee.', animation: 'silence' },
        {
          id: 'the_meeting',
          prompt: 'What do you do? Pick one, and tell me what you say to the room, if anything.',
          animation: 'silence',
          facets: ['Assertiveness'],
          choices: [
            { label: "Stand up and say I'll run it.", next: 'you_chair' },
            { label: 'Get things moving: a list on the whiteboard, and a name next to every job.', next: 'you_organise' },
            { label: 'Offer to do one job, and let someone else lead.', next: 'you_one_job' },
            { label: 'Keep quiet, and wait to see who steps up.', next: 'you_wait' },
            { label: 'Something else.', next: 'the_chat', other: true },
          ],
        },
      ],
    },

    you_chair: {
      steps: [{ text: "Pat hands you her clipboard like it's the Olympic torch. You're in charge now, and when nobody volunteers for the programs, you take those on too.", animation: 'clipboard' }],
      next: 'the_chat',
    },

    you_organise: {
      steps: [{ text: "By eight thirty, there's a list on the whiteboard with a name next to every job, and yours is next to the programs. People keep looking over at you to see what comes next.", animation: 'whiteboard' }],
      next: 'the_chat',
    },

    you_one_job: {
      steps: [{ text: "Denise says she'll run it. You put your name down to make the programs.", animation: 'denise' }],
      next: 'the_chat',
    },

    you_wait: {
      steps: [{ text: 'In the end, Barry says he\'ll do it, "unless anyone else is desperate to." Nobody is. On the way out, Pat asks if you\'d at least make the programs, and you say yes.', animation: 'barry_chair' }],
      next: 'the_chat',
    },

    // -------------------------------------------------------------------------
    // the group
    // -------------------------------------------------------------------------
    the_chat: {
      steps: [
        { text: 'By Thursday, there\'s a group chat. It\'s called LARCH RD FEST!!!, and it goes off about eighty times a day.', animation: 'chat' },
        { text: "After Friday's meeting, the whole committee is heading to the bar on the corner, and you're invited.", animation: 'pub' },
        {
          id: 'the_group',
          prompt: 'How do you feel about being part of all this: the chat, the bar, fourteen new people in your life? Pick one, and tell me honestly.',
          animation: 'pub',
          facets: ['Gregariousness'],
          choices: [
            { label: "Love it. I'm first to the bar and last to leave.", next: 'pub_late' },
            { label: "I'll come for one, and keep up with the chat.", next: 'pub_one' },
            { label: "I'll skip the bar, but read the chat and do my part.", next: 'pub_skip' },
            { label: "I'd mute the chat, and just get on with my part on my own.", next: 'pub_mute' },
          ],
        },
      ],
    },

    pub_late: {
      steps: [{ text: "By closing time, Barry is teaching everyone a song from 1987, and you know all the words now.", animation: 'pub_late' }],
      next: 'the_programmes',
    },

    pub_one: {
      steps: [{ text: 'You have one drink, learn a few names, and you\'re home by nine.', animation: 'pub' }],
      next: 'the_programmes',
    },

    pub_skip: {
      steps: [{ text: 'You go home, put the kettle on, and read sixty messages about the bounce house.', animation: 'chat_home' }],
      next: 'the_programmes',
    },

    pub_mute: {
      steps: [{ text: 'You mute the chat. The sixty messages about the bounce house can wait.', animation: 'chat_muted' }],
      next: 'the_programmes',
    },

    // -------------------------------------------------------------------------
    // the programmes
    // -------------------------------------------------------------------------
    the_programmes: {
      steps: [
        { text: 'It\'s midnight, the night before the festival, and the programs have to be at the printer by eight in the morning.', animation: 'desk' },
        { text: "They're fine. The times are right, and the map more or less works. But the layout is cramped, there's probably a typo in there somewhere, and doing them properly would take another two hours.", animation: 'desk_draft' },
        {
          id: 'the_programmes',
          prompt: 'What do you do? Pick one, and tell me why.',
          animation: 'desk_draft',
          facets: ['Achievement-Striving'],
          choices: [
            { label: "Two more hours. If it's got my name on it, it's done right.", next: 'prog_proper' },
            { label: 'Half an hour on the worst parts, then bed.', next: 'prog_half' },
            { label: 'Send them as they are. Nobody reads a program.', next: 'prog_send' },
            { label: 'Something else.', next: 'the_morning', other: true },
          ],
        },
      ],
    },

    prog_proper: {
      steps: [{ text: "At two in the morning, you finally send them off, with every line checked and the map redrawn. They look really good.", animation: 'desk_done' }],
      next: 'the_morning',
    },

    prog_half: {
      steps: [{ text: "You fix the map and the worst of the layout, and you're in bed by twelve thirty.", animation: 'desk_sent' }],
      next: 'the_morning',
    },

    prog_send: {
      steps: [{ text: "You hit send and go to bed. They're good enough.", animation: 'desk_sent' }],
      next: 'the_morning',
    },

    // -------------------------------------------------------------------------
    // the morning of the festival
    // -------------------------------------------------------------------------
    the_morning: {
      steps: [
        { text: 'It\'s Saturday, 8am, and the festival opens at eleven.', animation: 'street' },
        { text: "And then everything goes wrong at once. The generator won't start. The string of flags is one enormous knot. The canopy tents showed up without their poles. The band's van is lost somewhere on the highway.", animation: 'ten_things' },
        { text: "The raffle prizes are locked in somebody's car, and that somebody is at the gym. The road closed signs aren't up yet, and a delivery truck is trying to get through. And three different people want to know where the trash cans go.", animation: 'ten_things' },
        { text: 'Whoever is meant to be in charge, everyone is turning to whoever is nearest. Right now, that\'s you.', animation: 'ten_things' },
        {
          id: 'ten_things',
          prompt: "Ten things need doing, and you've got three hours. What do you do? Pick one, then walk me through the next hour.",
          animation: 'ten_things',
          facets: ['Activity Level', 'Self-Efficacy'],
          choices: [
            { label: 'Split the list, give everyone a job, and take the hardest one myself.', next: 'split_list' },
            { label: "Run between all of them myself. It's quicker than explaining.", next: 'do_it_all' },
            { label: 'Do the one thing I know how to do, and leave the rest to the others.', next: 'one_thing' },
            { label: 'Ask whoever is in charge what they need from me.', next: 'told_what' },
            { label: 'Something else.', next: 'the_banner', other: true },
          ],
        },
      ],
    },

    split_list: {
      steps: [{ text: "Ten minutes later, everyone has a job. The signs go up, the flags come untangled, and somebody talks the band's van in over the phone.", animation: 'sorted' }],
      next: 'the_banner',
    },

    do_it_all: {
      steps: [{ text: 'You run up and down Larch Road for two hours straight, and get most of it done yourself.', animation: 'sorted' }],
      next: 'the_banner',
    },

    one_thing: {
      steps: [{ text: 'You untangle the flags, slowly and carefully. Around you, the rest of it gets done, more or less.', animation: 'sorted' }],
      next: 'the_banner',
    },

    told_what: {
      steps: [{ text: 'Eventually, somebody puts you in charge of the trash cans. Around you, the rest of it gets done, more or less.', animation: 'sorted' }],
      next: 'the_banner',
    },

    // -------------------------------------------------------------------------
    // the banner
    // -------------------------------------------------------------------------
    the_banner: {
      steps: [
        { text: 'Then Barry unrolls the banner. He painted it in a hurry this morning, and he\'s the first to say so.', animation: 'banner' },
        { text: 'It says WELCOME TO THE LARCH ROAD STREET FESTIVLE. The letters slope downhill, and the paint has dripped everywhere.', animation: 'banner' },
        { speaker: BARRY, text: "It's rough, I know. Ten minutes, start to finish. Anyway, it goes up over the road at quarter to eleven.", animation: 'banner' },
        { text: "A proper one would mean you, on your knees in the church basement with a bedsheet and a paint roller, for the next forty minutes, while everyone else gets a coffee and watches the band's soundcheck.", animation: 'banner' },
        {
          id: 'the_banner',
          prompt: 'What do you do about it? Pick one, and tell me why.',
          animation: 'banner',
          facets: ['Achievement-Striving'],
          choices: [
            { label: "It can't go up like that. I'll redo it, properly.", next: 'banner_redo' },
            { label: 'Fix the spelling, and leave the rest.', next: 'banner_fix' },
            { label: "Leave it. Nobody reads a banner.", next: 'banner_leave' },
            { label: 'Something else.', next: 'the_cakes', other: true },
          ],
        },
      ],
    },

    banner_redo: {
      steps: [{ text: "Forty minutes later, you carry it up from the basement with paint on your knees and an ache in your back. Every letter is level. It goes up at quarter to eleven, and your coffee has gone cold.", animation: 'banner_redone' }],
      next: 'the_cakes',
    },

    banner_fix: {
      steps: [{ text: 'You and Barry spend ten minutes painting over the L and the E, and squeeze in an A and an L. It says FESTIVAL now, near enough. Then you grab a coffee, and catch the end of the soundcheck.', animation: 'banner_fixed' }],
      next: 'the_cakes',
    },

    banner_leave: {
      steps: [{ text: 'It goes up just as it is. You grab a coffee and watch the soundcheck from the curb. People take pictures of the banner all day long.', animation: 'banner' }],
      next: 'the_cakes',
    },

    // -------------------------------------------------------------------------
    // the cakes
    // -------------------------------------------------------------------------
    the_cakes: {
      steps: [
        { text: "It's quarter to eleven. The street is filling up, and the band has finally found the place.", animation: 'stalls' },
        { text: "Then there's a crash behind you. Kwame's folding table has collapsed in half, and forty homemade cakes are all over the sidewalk.", animation: 'cakes_down' },
        { speaker: KWAME, text: 'I was up all night baking these. All night!', animation: 'cakes_down' },
        { text: "The generator still isn't working right, and someone at the other end of the street is shouting your name.", animation: 'cakes_down' },
        {
          id: 'the_cakes',
          prompt: 'What do you do? Pick one, and tell me why.',
          animation: 'cakes_down',
          facets: ['Altruism'],
          choices: [
            { label: 'Drop everything and help Kwame.', next: 'help_ade' },
            { label: 'Help for five minutes, then find someone to take over.', next: 'help_some' },
            { label: "Send someone else to help Kwame. I'm needed elsewhere.", next: 'send_help' },
            { label: "Say sorry, and keep going. I can't stop now.", next: 'keep_going' },
            { label: 'Something else.', next: 'the_festival', other: true },
          ],
        },
      ],
    },

    help_ade: {
      steps: [{ text: 'You and Kwame rescue twenty-two of the cakes, and sell them as "rustic." They\'re all gone by noon.', animation: 'cakes_saved' }],
      next: 'the_festival',
    },

    help_some: {
      steps: [{ text: 'You get the table back up, and the kids from number 12 take over, selling the squashed ones at half price.', animation: 'cakes_saved' }],
      next: 'the_festival',
    },

    send_help: {
      steps: [{ text: 'You grab two teenagers, point them toward Kwame, and run for the generator.', animation: 'cakes_left' }],
      next: 'the_festival',
    },

    keep_going: {
      steps: [{ text: "You say sorry and run for the generator. When you look back, somebody is helping Kwame pick them up.", animation: 'cakes_left' }],
      next: 'the_festival',
    },

    // -------------------------------------------------------------------------
    // the festival
    // -------------------------------------------------------------------------
    the_festival: {
      steps: [
        { text: 'At eleven o\'clock, the road closes, the band starts playing, and Larch Road fills up with people.', animation: 'festival' },
        { text: 'By the evening, there\'s dancing in the street, a lost dog has found its owner, and the raffle has raised $1,140 for the local hospice.', animation: 'evening' },
        {
          id: 'the_day',
          prompt: "It's over. How did it go, for you? What are you proudest of? Would you do it again next year, and would you want to run it?",
          animation: 'evening',
          facets: ['Achievement-Striving', 'Assertiveness', 'Gregariousness'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Before the flags come down, I have a couple of questions about you. Your actual life, that is, not Larch Road.', animation: 'fridge' },
        {
          id: 'last_lead',
          prompt: 'Think of the groups you\'re part of: work, friends, family, a club or a team. The last time one of them needed someone to take charge, did you? What happened? And how much do you enjoy being part of a group like that?',
          animation: 'fridge',
          facets: ['Assertiveness', 'Gregariousness'],
        },
        {
          id: 'last_busy',
          prompt: 'Think back to your busiest day in the last month. How many things were you juggling, and how did you get through them? Did anyone need your help along the way, and what did you do?',
          animation: 'fridge',
          facets: ['Activity Level', 'Self-Efficacy', 'Altruism'],
        },
        { text: "Pat is already printing next year's flyers.", animation: 'goodbye' },
      ],
    },
  },
};
