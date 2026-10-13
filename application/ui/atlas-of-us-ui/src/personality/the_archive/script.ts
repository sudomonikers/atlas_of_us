import type { Script } from '../personality';

// The Archive: The Night Observatory
// The player has one night to crate up their late great-aunt's observatory before the buyers arrive at dawn.
// A real clock runs from the moment they start. Along the way her letter, her sketchbook and her orrery tempt them off task.
// Stopping costs real time, and running out jumps straight to dawn_late, so the prompts in between can go unanswered.
// the_night has different choices at dawn_done and dawn_late, so the answer tells the scorer how the night went.

const HALE = 'Mr. Hale';

export const theArchive: Script = {
  id: 'the_archive',
  title: 'The Archive',
  facets: ['Imagination', 'Artistic Interests', 'Intellect', 'Orderliness', 'Achievement-Striving', 'Self-Discipline'],
  start: 'arrival',
  clock: { seconds: 300, from: 'sorting', until: 'dawn_done', late: 'dawn_late' },
  sections: {
    // -------------------------------------------------------------------------
    // the job, before the clock starts
    // -------------------------------------------------------------------------
    arrival: {
      steps: [
        { text: 'The Archive', animation: 'title_card' },
        { text: 'Your great-aunt Ottilie spent forty years in an observatory on a hill above town, looking up.', animation: 'hill_wide' },
        { text: 'She died in the spring. The observatory is sold, and the buyers take the keys at dawn.', animation: 'hill_wide' },
        { text: 'The estate agent, Mr. Hale, is waiting at the door with a torch and a ring of keys.', animation: 'hill_door' },
        { speaker: HALE, text: 'The university will take her glass plates and logbooks. Forty years of the night sky. But only if they\'re catalogued and crated.', animation: 'hill_door' },
        { speaker: HALE, text: 'Anything that isn\'t in a labelled crate by sunrise goes in the skip. The buyers were very clear.', animation: 'hill_door' },
        { speaker: HALE, text: 'Sunrise is a little before six. I\'ll be back then. Good luck.', animation: 'hill_door' },
        { text: 'Inside, the dome is cold and full. Shelves of logbooks, boxes of glass plates, instruments, papers, and an old brass telescope pointed at the slit in the roof.', animation: 'dome_wide' },
        { text: 'The clock starts now. Watch the sky.', animation: 'dome_wide' },
      ],
      next: 'sorting',
    },

    // -------------------------------------------------------------------------
    // the clock is running
    // -------------------------------------------------------------------------
    sorting: {
      steps: [
        {
          id: 'plan',
          prompt: 'Where do you start?',
          animation: 'dome_wide',
          facets: ['Orderliness', 'Self-Discipline', 'Achievement-Striving'],
          choices: [
            { label: 'Make a plan first. Label the crates, then sort everything by date.', next: 'plan_crates' },
            { label: 'Logbooks and plates first. That\'s what the university wants.', next: 'plan_logbooks' },
            { label: 'Just dive in and sort things as they come to hand.', next: 'plan_dive' },
          ],
        },
      ],
    },

    plan_crates: {
      steps: [
        { text: 'You line the empty crates up along the wall and chalk a decade on each one. 1980s. 1990s. 2000s.', animation: 'crates_labelled' },
        { text: 'It takes a while, but after that every logbook has somewhere to go.', animation: 'crates_filling' },
      ],
      next: 'letter_found',
    },

    plan_logbooks: {
      steps: [
        { text: 'You pull the logbooks off the shelves in armfuls and stack them by the crates.', animation: 'crates_filling' },
        { text: 'The rest of the dome can wait. If nothing else gets done, at least her work survives.', animation: 'crates_filling' },
      ],
      next: 'letter_found',
    },

    plan_dive: {
      steps: [
        { text: 'You start with the nearest shelf and work outward. A logbook here, a box of plates there.', animation: 'crates_filling' },
        { text: 'It isn\'t tidy, but the crates start filling fast.', animation: 'crates_filling' },
      ],
      next: 'letter_found',
    },

    // -------------------------------------------------------------------------
    // the letter
    // -------------------------------------------------------------------------
    letter_found: {
      steps: [
        { text: 'Tucked inside the logbook for 1986 is an envelope, soft with handling. It\'s addressed to Ottilie, in handwriting you don\'t know.', animation: 'letter_found' },
        { text: 'It\'s signed only "M." No one in the family ever mentioned an M.', animation: 'letter_found' },
        {
          id: 'the_letter',
          prompt: 'The sky hasn\'t changed yet, but it will. What do you do with the letter?',
          animation: 'letter_found',
          facets: ['Imagination', 'Self-Discipline'],
          choices: [
            { label: 'Read it now.', next: 'letter_read' },
            { label: 'Put it in my pocket for later.', next: 'letter_pocket' },
            { label: 'File it with her papers and keep going.', next: 'letter_filed' },
          ],
        },
      ],
    },

    letter_read: {
      steps: [
        { speaker: 'M.', text: 'Ottie. I\'m writing this on the train, so forgive the hand. I keep thinking about the hill.', animation: 'letter_open' },
        { speaker: 'M.', text: 'The whole town asleep, and the two of us on the roof of that ridiculous dome, passing the eyepiece back and forth.', animation: 'letter_open' },
        { speaker: 'M.', text: 'You said it looked like a smudge of chalk. I said it looked like the best thing I\'d ever seen. I wasn\'t talking about the comet.', animation: 'letter_open' },
        { speaker: 'M.', text: 'I can\'t stay, and you can\'t leave. I know that. So here\'s a promise neither of us has to keep for a long time.', animation: 'letter_open' },
        { speaker: 'M.', text: 'I\'ll meet you on the hill when it comes back.', animation: 'letter_open' },
        { text: 'You fold it back along its old creases.', animation: 'letter_found' },
      ],
      next: 'sketches',
    },

    letter_pocket: {
      steps: [{ text: 'You slip it into your coat. It can wait until there\'s time.', animation: 'crates_filling' }],
      next: 'sketches',
    },

    letter_filed: {
      steps: [{ text: 'You drop it into the folder marked correspondence and reach for the next logbook.', animation: 'crates_filling' }],
      next: 'sketches',
    },

    // -------------------------------------------------------------------------
    // the sketchbook
    // -------------------------------------------------------------------------
    sketches: {
      steps: [
        { text: 'On the bottom shelf is a fat sketchbook with a cracked leather cover. It falls open in your hands.', animation: 'sketchbook_closed' },
        { text: 'Every page is a constellation. None of them are real.', animation: 'sketchbook_open' },
        {
          id: 'the_sketches',
          prompt: 'Her sketchbook is full of stars she made up. How long do you give it?',
          animation: 'sketchbook_open',
          facets: ['Artistic Interests', 'Self-Discipline'],
          choices: [
            { label: 'Look through it properly.', next: 'sketches_look' },
            { label: 'Flip through a few pages, then pack it.', next: 'sketches_flip' },
            { label: 'Close it and crate it. There isn\'t time.', next: 'sketches_crate' },
          ],
        },
      ],
    },

    sketches_look: {
      steps: [
        { text: 'The Lantern-Bearer: a stooped figure walking east, a lamp held out in front of her. Under it she\'s written, "for the walk home."', animation: 'sketch_lantern' },
        { text: 'The Heron Asleep: one leg tucked up, its long neck folded into a question mark of nine stars.', animation: 'sketch_heron' },
        { text: 'The Two Chairs: just that. Two stars close together, and a little gap, and two more.', animation: 'sketch_chairs' },
        { text: 'The last page is unfinished. A tail of faint dots trailing off the edge, with no name yet.', animation: 'sketch_comet' },
      ],
      next: 'orrery',
    },

    sketches_flip: {
      steps: [
        { text: 'A woman with a lamp. A sleeping heron. Two chairs. You catch the names more than the pictures.', animation: 'sketch_heron' },
        { text: 'You close it and lay it in a crate on top of the logbooks.', animation: 'crates_filling' },
      ],
      next: 'orrery',
    },

    sketches_crate: {
      steps: [{ text: 'You close the cover and lay it in a crate. Maybe someone at the university will want it.', animation: 'crates_filling' }],
      next: 'orrery',
    },

    // -------------------------------------------------------------------------
    // the orrery
    // -------------------------------------------------------------------------
    orrery: {
      steps: [
        { text: 'On her desk is an orrery, a clockwork model of the planets in brass rings. It\'s been wound and stopped on purpose.', animation: 'orrery' },
        { text: 'The date dials don\'t read today. They read a day in July, decades from now.', animation: 'orrery' },
        {
          id: 'the_orrery',
          prompt: 'Why would she set it to a date so far away?',
          animation: 'orrery',
          facets: ['Intellect', 'Achievement-Striving'],
          choices: [
            { label: 'Try to work it out.', next: 'orrery_solve' },
            { label: 'Write the date on a label and move on.', next: 'orrery_note' },
            { label: 'Leave it. It\'s just an ornament.', next: 'orrery_leave' },
          ],
        },
      ],
    },

    orrery_solve: {
      steps: [
        { text: 'The year dial reads 2061. Taped to the base, in her hand: "76 years. Same as before."', animation: 'orrery_close' },
        { text: 'Seventy-six years before 2061 is 1985. That winter, and into 1986, something came close enough to see from a hill like this one.', animation: 'orrery_close' },
        { text: 'Halley\'s comet. It comes around once every seventy-six years. She set the orrery to the night it comes back.', animation: 'orrery_comet' },
        { text: 'She would have been a hundred and three.', animation: 'orrery_comet' },
      ],
      next: 'last_crate',
    },

    orrery_note: {
      steps: [{ text: 'You write "28 July 2061" on a tag, tie it to the orrery, and pack it in straw.', animation: 'crates_filling' }],
      next: 'last_crate',
    },

    orrery_leave: {
      steps: [{ text: 'You leave it on the desk. The buyers can decide what to do with it.', animation: 'crates_filling' }],
      next: 'last_crate',
    },

    // -------------------------------------------------------------------------
    // the last crate
    // -------------------------------------------------------------------------
    last_crate: {
      steps: [
        { text: 'The logbooks are in. One crate is left: two hundred glass plates, each a photograph of a patch of sky, none of them labelled.', animation: 'plates' },
        { text: 'The university wants each one catalogued. Labelling them all properly would take the rest of the night.', animation: 'plates' },
        {
          id: 'last_crate',
          prompt: 'What do you do with the last crate?',
          animation: 'plates',
          facets: ['Orderliness', 'Achievement-Striving', 'Self-Discipline'],
          choices: [
            { label: 'Label every plate properly, however long it takes.', next: 'crate_every' },
            { label: 'Label the crate "Glass plates, unsorted" and call it done.', next: 'crate_rough' },
            { label: 'Leave it. I\'ve done enough.', next: 'crate_leave' },
          ],
        },
      ],
    },

    crate_every: {
      steps: [
        { text: 'You hold each plate up to the lamp and copy the date scratched into the corner. Plate after plate after plate.', animation: 'plates' },
        { text: 'Your fingers go numb. You keep going until the last one is in.', animation: 'crates_done' },
      ],
      next: 'dawn_done',
    },

    crate_rough: {
      steps: [{ text: 'You write "Glass plates, unsorted" on the lid in big letters and nail it shut.', animation: 'crates_done' }],
      next: 'dawn_done',
    },

    crate_leave: {
      steps: [{ text: 'You push the crate against the wall with your foot and sit down on the floor.', animation: 'crates_done' }],
      next: 'dawn_done',
    },

    // -------------------------------------------------------------------------
    // dawn, either way
    // -------------------------------------------------------------------------
    dawn_done: {
      steps: [
        { text: 'You straighten up. The last crate is done, and through the slit in the dome the sky is only just turning grey.', animation: 'dawn_done' },
        {
          id: 'the_night',
          prompt: 'You made it before sunrise. How do you feel about the way you spent the night?',
          animation: 'dawn_done',
          facets: ['Achievement-Striving', 'Self-Discipline', 'Imagination'],
          choices: [
            { label: 'Satisfied. I set out to get it done, and I did.', next: 'morning' },
            { label: 'I finished, but I wish I\'d slowed down and looked closer.', next: 'morning' },
          ],
        },
      ],
    },

    dawn_late: {
      steps: [
        { text: 'Somewhere below, a clock chimes six. Light floods in through the slit in the dome.', animation: 'dawn_late' },
        { text: 'Outside, a car door slams. You\'re out of time, and not everything is in a crate.', animation: 'dawn_late' },
        {
          id: 'the_night',
          prompt: 'Dawn caught you before you finished. How do you feel about the way you spent the night?',
          animation: 'dawn_late',
          facets: ['Achievement-Striving', 'Self-Discipline', 'Imagination'],
          choices: [
            { label: 'Frustrated. I should have stuck to the job.', next: 'morning' },
            { label: 'No regrets. What I found was worth more than finishing.', next: 'morning' },
          ],
        },
      ],
    },

    morning: {
      steps: [
        { speaker: HALE, text: 'Morning. I\'ll get the van loaded with whatever\'s ready.', animation: 'dawn_hale' },
        { text: 'He leaves you alone in the dome for a minute, with the sun coming up over the town she watched the sky above for forty years.', animation: 'dawn_hale' },
        {
          id: 'who_she_was',
          prompt: 'From everything you saw tonight, who do you think Ottilie was?',
          animation: 'dawn_dome',
          facets: ['Imagination', 'Intellect', 'Artistic Interests'],
        },
        { speaker: HALE, text: 'You can take one thing for yourself, if you like. The buyers won\'t miss it.', animation: 'dawn_hale' },
        {
          id: 'take_one',
          prompt: 'You can take one thing home from the observatory. What do you take, and why?',
          animation: 'dawn_dome',
          facets: ['Artistic Interests', 'Imagination', 'Orderliness'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [
        { text: 'You walk down the hill in the early light, carrying it with you.', animation: 'hill_dawn' },
        { text: 'Behind you, the dome turns gold, and then the sun is up.', animation: 'hill_dawn' },
      ],
    },
  },
};
