import type { Script } from '../personality';

// Proven Wrong: The Hive
// The player keeps bees on an allotment. For months they've blamed their dying hives on Walt's rose spray, loudly and
// publicly, and the vote to ban spraying is next week. Then the lab results come back: it was mites, in their own
// hive. What they do with that branches; every path meets for Pru doubling down, the vote, Walt, and an evening
// spent working out how they got so sure.

const WALT = 'Walt';
const PRU = 'Pru';
const DUNMORE = 'Mrs. Dunmore';

export const provenWrong: Script = {
  id: 'proven_wrong',
  title: 'Proven Wrong',
  facets: ['Intellect', 'Stubbornness', 'Introspection', 'Modesty', 'Fairness', 'Self-Consciousness', 'Assertiveness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the letter
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'Proven Wrong', animation: 'title_card' },
        { text: 'You keep two beehives at the back of plot 9 on the Fenwick Lane allotments.', animation: 'allotment_you' },
        { text: 'Last spring, one of them died. In August, the other one started to go the same way.', animation: 'allotment_dead' },
        { text: 'You knew straight away whose fault it was. Walt Ashby, on the next plot, sprays his prize roses every Sunday morning.', animation: 'allotment_walt' },
        { text: 'You said so at the July meeting, and again in August.', animation: 'hall_history' },
        { text: 'You said so in the allotment group chat, more or less every week. Pru from plot 14 helped you get forty signatures.', animation: 'phone_history' },
        { text: "Next Thursday, the committee votes on banning spraying across the whole site. Walt hasn't said a word to you since July.", animation: 'allotment_walt' },
        { text: 'To make your case airtight, you posted a jar of dead bees off to the National Bee Unit to be tested.', animation: 'allotment_dead' },
        { text: 'This morning, the results came.', animation: 'letter' },
        { text: 'Varroa mites: severe. Deformed wing virus: present. Pesticide residues: none detected.', animation: 'letter' },
        { text: 'And a note in biro at the bottom: "Losses typical of untreated varroa. Was this colony treated for mites this year?"', animation: 'letter' },
        { text: "It wasn't. You meant to do it in the spring, and never got round to it.", animation: 'letter' },
        {
          id: 'the_letter',
          prompt: 'You read it twice. What goes through your head, and what do you make of the result?',
          animation: 'letter',
          facets: ['Intellect', 'Stubbornness', 'Self-Consciousness'],
        },
      ],
      next: 'what_now',
    },

    what_now: {
      steps: [
        { text: 'The vote is in six days. Forty people signed because you asked them to.', animation: 'phone_history' },
        {
          id: 'what_now',
          prompt: 'What do you do with the letter?',
          animation: 'phone_history',
          facets: ['Fairness', 'Stubbornness', 'Modesty'],
          choices: [
            { label: 'Tell the group chat now, before the vote.', next: 'tell_now' },
            { label: 'Send off another sample before I say anything.', next: 'second_test' },
            { label: 'Keep it to myself for now.', next: 'keep_quiet' },
          ],
        },
      ],
    },

    tell_now: {
      steps: [
        { text: 'You type it out three times before you send it.', animation: 'phone_confess' },
        { text: "Twelve people see it. Nobody replies. Walt doesn't reply.", animation: 'phone_confess' },
        { text: 'On Thursday afternoon, the gate squeaks. Pru, with a box of flyers she printed before you posted.', animation: 'allotment_pru' },
      ],
      next: 'pru',
    },

    second_test: {
      steps: [
        { text: "You scrape up what's left of the colony and post it off, first class, with a note: please test again.", animation: 'allotment_dead' },
        { text: 'The second letter comes on Thursday morning, the day of the vote.', animation: 'letter_second' },
        { text: 'Varroa mites: severe. Pesticide residues: none detected. "Consistent with the first sample."', animation: 'letter_second' },
        { text: "You're still holding it when the gate squeaks. Pru, with a box of flyers for tonight.", animation: 'allotment_pru' },
      ],
      next: 'pru',
    },

    keep_quiet: {
      steps: [
        { text: 'You fold the letter in four and put it in the drawer with the seed packets.', animation: 'letter' },
        { text: 'On Wednesday night you take it out and read it again. Then you put it back.', animation: 'letter' },
        { text: 'On Thursday afternoon the gate squeaks. Pru, with a box of flyers. The letter is in your coat pocket, and she sees it before you can stop her.', animation: 'allotment_pru' },
      ],
      next: 'pru',
    },

    // -------------------------------------------------------------------------
    // Pru, and the vote
    // -------------------------------------------------------------------------
    pru: {
      steps: [
        { speaker: PRU, text: "One test? Oh, come off it. He's been spraying that muck for years.", animation: 'allotment_pru' },
        { speaker: PRU, text: 'Mites, viruses, fine. But what do you think weakened them in the first place?', animation: 'allotment_pru' },
        { speaker: PRU, text: "Forty people signed because of you. Me included. Don't you dare go soft on me now.", animation: 'allotment_pru' },
        {
          id: 'pru_pushes',
          prompt: 'Pru has half a point, or thinks she does. What do you say to her?',
          animation: 'allotment_pru',
          facets: ['Stubbornness', 'Intellect', 'Assertiveness'],
        },
      ],
      next: 'meeting',
    },

    meeting: {
      steps: [
        { text: "Thursday, seven o'clock. The village hall smells of floor polish and urn tea.", animation: 'hall_seated' },
        { text: "Walt's in the back row with his arms folded. He's put on a tie.", animation: 'hall_walt' },
        { speaker: DUNMORE, text: 'Motion four: a ban on chemical spraying across the site.', animation: 'hall_seated' },
        { speaker: DUNMORE, text: "It's your motion. Would you like to say a few words before we vote?", animation: 'hall_standing' },
        {
          id: 'the_motion',
          prompt: 'Fifty faces turn round to look at you. What do you stand up and say?',
          animation: 'hall_standing',
          facets: ['Modesty', 'Self-Consciousness', 'Fairness'],
        },
      ],
      next: 'walt',
    },

    walt: {
      steps: [
        { text: 'Afterwards, Walt is waiting by the bike rack outside.', animation: 'outside_walt' },
        { speaker: WALT, text: "Thirty-one years I've had that plot. Never had a word said against me.", animation: 'outside_walt' },
        { speaker: WALT, text: 'Then you stand up in there and as good as call me a poisoner. In front of everybody.', animation: 'outside_walt' },
        { speaker: WALT, text: "So go on, then. What've you got to say to me?", animation: 'outside_walt' },
        {
          id: 'walt',
          prompt: "Walt's waiting, and he isn't going to make it easy. What do you say to him?",
          animation: 'outside_walt',
          facets: ['Fairness', 'Modesty', 'Stubbornness'],
        },
        { speaker: WALT, text: 'Hm.', animation: 'outside_walt' },
        { text: 'He gets on his bike and wobbles off up the lane without looking back.', animation: 'outside_empty' },
      ],
      next: 'dusk',
    },

    // -------------------------------------------------------------------------
    // the empty hives
    // -------------------------------------------------------------------------
    dusk: {
      steps: [
        { text: 'That evening, you sit on an upturned crate by the empty hives.', animation: 'dusk' },
        { text: "Six months ago you'd have bet your plot on it. You were so sure.", animation: 'dusk' },
        {
          id: 'how_you_got_sure',
          prompt: 'Looking back, how did you get so sure? What did you see that convinced you, and what do you think you skipped past?',
          animation: 'dusk',
          facets: ['Introspection', 'Intellect'],
        },
        { text: 'The light goes. Somewhere, a blackbird is still singing.', animation: 'dusk_late' },
        {
          id: 'changed_mind',
          prompt: 'Away from the allotment now. Think of something in your own life you were certain about and turned out to be wrong. How long did it take you to change your mind, and what finally did it?',
          animation: 'dusk_late',
          facets: ['Introspection', 'Stubbornness', 'Intellect'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'Next spring you buy a new colony, and you treat it for mites in March.', animation: 'allotment_spring' },
        { text: 'On the first warm Sunday, Walt leans over the fence with something wrapped in newspaper.', animation: 'allotment_spring_walt' },
        { speaker: WALT, text: "Climbing rose. Bees go mad for it, apparently. And I've stopped spraying. Not because you said.", animation: 'allotment_spring_walt' },
        { text: 'The End', animation: 'the_end' },
      ],
    },
  },
};
