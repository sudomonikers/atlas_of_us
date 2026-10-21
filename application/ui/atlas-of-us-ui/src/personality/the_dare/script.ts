import type { Script } from '../personality';

// The Dare: two weeks abroad on Kit's action camera
// Kit chases adrenaline, and has talked the player into two weeks somewhere hot, cheap and, in Kit's words,
// "mountainous enough to fall off". Packing the night before, lost in a town where they can't read a sign, choosing the
// days, then a bungee off a railway bridge and a night ride on the back of Kit's motorbike, with Kit asking "faster?".
// Written to the IPIP-NEO items in ../scene_grouping.md: always being prepared (C5.2), doing things according to a plan
// (C2.5), adapting easily to new situations (N1.10), loving excitement (E5.1), seeking adventure (E5.2), never going
// bungee jumping (E5.9), jumping into things without thinking (C6.4), enjoying being reckless (E5.5) and acting
// without thinking (C6.9).

const KIT = 'Kit';
const MAN = 'The man with the clipboard';

export const theDare: Script = {
  id: 'the_dare',
  title: 'The Dare',
  facets: ['Anxiety', 'Excitement-Seeking', 'Orderliness', 'Self-Discipline', 'Cautiousness'],
  start: 'opening',
  sections: {
    // -------------------------------------------------------------------------
    // the night before
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Dare', animation: 'title_card' },
        { text: "Your friend Kit has jumped out of a plane, gone swimming with sharks, and once ate a whole ghost pepper on a bet. Kit is also very hard to say no to.", animation: 'bedroom' },
        { text: "Which is how you've ended up with two weeks off work, a flight at six tomorrow morning, and a destination that Kit describes as \"hot, cheap, and mountainous enough to fall off.\"", animation: 'bedroom' },
        { speaker: KIT, text: "Don't plan anything, okay? Plans are for people who are scared of finding out what happens.", animation: 'phone' },
        {
          id: 'packing',
          prompt: "It's the night before. How ready are you? Pick one, and tell me what's in the bag.",
          animation: 'packing',
          facets: ['Self-Discipline', 'Orderliness'],
          choices: [
            { label: 'Packed days ago, off a list, with a rough plan for every day.', next: 'packed_early' },
            { label: 'Mostly packed, and an idea of the first few days.', next: 'packed_mostly' },
            { label: "I'll throw some things in a bag in the morning.", next: 'packed_late' },
            { label: "Kit's right. Passport, phone, see what happens.", next: 'packed_nothing' },
          ],
        },
      ],
    },

    packed_early: {
      steps: [{ text: 'You check off the last thing on your list, set two alarms, and get a good night\'s sleep.', animation: 'bag_shut' }],
      next: 'arriving',
    },

    packed_mostly: {
      steps: [{ text: 'You add a few last things, sit on the bag until it zips shut, and go to bed.', animation: 'bag_shut' }],
      next: 'arriving',
    },

    packed_late: {
      steps: [{ text: 'At four thirty in the morning, you throw whatever is clean into a bag and run out to the cab.', animation: 'bag_messy' }],
      next: 'arriving',
    },

    packed_nothing: {
      steps: [{ text: 'You leave your passport by the door and go to bed. How hard can it be?', animation: 'passport' }],
      next: 'arriving',
    },

    // -------------------------------------------------------------------------
    // lost
    // -------------------------------------------------------------------------
    arriving: {
      steps: [
        { text: 'Fourteen hours later, you arrive in a little hill town in the heat of the evening. Kit falls asleep the moment you get to the guesthouse.', animation: 'town' },
        { text: 'You head out to buy some water, and take a few turns down the narrow streets to see what\'s around.', animation: 'town' },
        { text: 'Twenty minutes later, your phone dies. Every street looks just like the last one. You can\'t read a single sign, and you never caught the name of the guesthouse.', animation: 'lost' },
        { text: "You've tried asking a few people for help, but nobody you've found speaks your language. And it's starting to get dark.", animation: 'lost_dark' },
        {
          id: 'lost',
          prompt: "What do you do? And how are you feeling, standing there? Tell me honestly.",
          animation: 'lost_dark',
          facets: ['Anxiety'],
        },
        { text: "An hour later, a woman selling grilled corn recognizes your description of a blue door with a goat on the step, and walks you all the way back there herself. Kit is still asleep.", animation: 'found' },
      ],
      next: 'the_days',
    },

    // -------------------------------------------------------------------------
    // choosing the days
    // -------------------------------------------------------------------------
    the_days: {
      steps: [
        { text: 'At breakfast, Kit pulls out a napkin. On one side is a list written in big capital letters: CANYONING. CLIFF JUMPING. A BUNGEE JUMP OFF THE OLD RAILWAY BRIDGE. A NIGHT RIDE DOWN THE COAST.', animation: 'napkin_kit' },
        { speaker: KIT, text: "That's my list. Flip it over and write yours on the back. We'll do some of each. Probably.", animation: 'napkin_kit' },
        { text: 'The brochures at the guesthouse have some other ideas: a cooking class, a boat trip out to the islands, the old fort, and a beach that\'s supposed to be the best on the whole coast.', animation: 'napkin_both' },
        {
          id: 'the_days',
          prompt: "You've got ten days. What goes on your side of the napkin? Pick one, and tell me how you'd spend the days.",
          animation: 'napkin_both',
          facets: ['Excitement-Seeking'],
          choices: [
            { label: "I'd copy Kit's list, and add a couple more.", next: 'the_bridge' },
            { label: "A bit of Kit's, a bit of the calm stuff.", next: 'the_bridge' },
            { label: 'The calm stuff. Kit can do the rest alone.', next: 'the_bridge' },
            { label: "No list. I'd go where nobody else is going and see what turns up.", next: 'the_bridge' },
            { label: 'Something else.', next: 'the_bridge', other: true },
          ],
        },
      ],
    },

    // -------------------------------------------------------------------------
    // the bridge
    // -------------------------------------------------------------------------
    the_bridge: {
      steps: [
        { text: 'On day four, Kit heads up to the gorge for the bungee jump. It\'s on the way to everything else on the napkin, so you go along.', animation: 'bridge' },
        { text: 'The old railway bridge stands two hundred feet above a green river. In the middle of it, a man with a clipboard, a cooler and a pile of ropes is running the bungee jump.', animation: 'bridge' },
        { text: 'Kit goes first, screaming the whole way down, and comes back up grinning from ear to ear.', animation: 'kit_jumps' },
        { speaker: MAN, text: 'You want to go next? I have a free slot. It\'s very safe. Mostly.', animation: 'edge' },
        {
          id: 'the_bridge',
          prompt: 'Do you jump? Pick one, and tell me what goes through your head.',
          animation: 'edge',
          facets: ['Excitement-Seeking', 'Cautiousness'],
          choices: [
            { label: "Yes, straight off, before I can think about it.", next: 'jump_now' },
            { label: 'Yes, once I\'ve checked the harness and asked how often they change the ropes.', next: 'jump_checked' },
            { label: "No. I'll hold the camera for Kit.", next: 'film_it' },
            { label: 'Never. Not for any money.', next: 'walk_off' },
            { label: 'Something else.', next: 'the_ride', other: true },
          ],
        },
      ],
    },

    jump_now: {
      steps: [{ text: "He's barely done up the last buckle when you jump. The river comes rushing up at you very fast, and then you're bouncing back up into the air.", animation: 'you_jump' }],
      next: 'the_ride',
    },

    jump_checked: {
      steps: [
        { text: "He shows you the logbook. The ropes get changed every two hundred jumps, and this one is only on forty-one. You check every buckle twice.", animation: 'harness' },
        { text: 'Then you jump. The river comes rushing up at you very fast, and then you\'re bouncing back up into the air.', animation: 'you_jump' },
      ],
      next: 'the_ride',
    },

    film_it: {
      steps: [{ text: 'Kit goes again. You get the whole thing on camera, including the part where Kit loses a shoe.', animation: 'filming' }],
      next: 'the_ride',
    },

    walk_off: {
      steps: [{ text: "You walk back to solid ground and watch from there. Kit cheerfully calls you a coward all the way back to the bus.", animation: 'walk_off' }],
      next: 'the_ride',
    },

    // -------------------------------------------------------------------------
    // the night ride
    // -------------------------------------------------------------------------
    the_ride: {
      steps: [
        { text: "It's the last night of the trip. Kit has rented a motorcycle for a ride down the coast, and you're on the back.", animation: 'keys' },
        { speaker: KIT, text: 'Hold on tight. And you tell me how fast we go!', animation: 'keys' },
        { text: 'The coast road is empty. It\'s dead straight in some places and twisting in others, with the black sea on one side and nothing but the moon to light it.', animation: 'road' },
        { text: 'Kit twists the throttle, and yells back over their shoulder: "FASTER?"', animation: 'road_fast' },
        {
          id: 'the_ride',
          prompt: 'What do you tell Kit? Pick one, and tell me why.',
          animation: 'road_fast',
          facets: ['Excitement-Seeking', 'Cautiousness'],
          choices: [
            { label: 'Yell "FASTER!" back, and mean it.', next: 'flat_out' },
            { label: 'Faster on the straight parts, sure.', next: 'bit_faster' },
            { label: 'Tell Kit to keep it where it is.', next: 'steady' },
            { label: "Tell Kit to pull over. I'll get a cab back.", next: 'pull_over' },
            { label: 'Something else.', next: 'home', other: true },
          ],
        },
      ],
    },

    flat_out: {
      steps: [{ text: 'Kit opens it right up. The engine howls, the wind roars in your ears, and the white lines on the road blur into one. You\'re screaming with joy, or possibly terror.', animation: 'flat_out' }],
      next: 'home',
    },

    bit_faster: {
      steps: [{ text: 'On the long straight parts Kit lets it go, and eases off on the curves. You find yourself grinning into the wind.', animation: 'road_fast' }],
      next: 'home',
    },

    steady: {
      steps: [{ text: 'Kit keeps it steady, grumbling. After a while, the two of you just watch the moonlight on the water.', animation: 'road_steady' }],
      next: 'home',
    },

    pull_over: {
      steps: [{ text: 'Kit pulls into a gas station, and you call a cab. Kit rides the rest of the way alone, and sulks about it at breakfast.', animation: 'pulled_over' }],
      next: 'home',
    },

    // -------------------------------------------------------------------------
    // flying home
    // -------------------------------------------------------------------------
    home: {
      steps: [
        { text: 'On the flight home, Kit is already looking up volcanoes for the next trip.', animation: 'plane' },
        {
          id: 'the_trip',
          prompt: "Looking back on the two weeks: what was the best part, and was there anything you'd never do again? Would you go away with Kit again?",
          animation: 'plane',
          facets: ['Excitement-Seeking', 'Anxiety'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Before you unpack, I have a couple of questions about you. Your actual life, that is, not the trip.', animation: 'keepsakes' },
        {
          id: 'last_rush',
          prompt: "In the last twelve months, what's the most physically risky thing you've done just for the thrill of it: a ride, a sport, a jump, a dare, driving too fast? When was it, and did you think it through first? If nothing comes to mind, that's an answer too.",
          animation: 'keepsakes',
          facets: ['Excitement-Seeking', 'Cautiousness'],
        },
        {
          id: 'last_trip',
          prompt: "Think about the last time you went away, even for a night. How far ahead did you pack, and did you plan what you'd do? What went wrong, if anything, and how did you take it?",
          animation: 'keepsakes',
          facets: ['Self-Discipline', 'Orderliness', 'Anxiety'],
        },
        { text: "Kit is already texting you about next year.", animation: 'goodbye' },
      ],
    },
  },
};
