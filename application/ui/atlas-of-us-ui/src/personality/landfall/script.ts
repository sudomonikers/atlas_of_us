import type { Script } from '../script';

// Expedition I: Landfall
// The Kestrel was sent to chart unmapped waters and went down in a storm. Five survive.
// The cast carries into Expedition II: The Thief, so Tob and Maren's interest in the stores is seeded here on purpose.
//   Harlan Voss  - first mate, gruff and sure of himself, assumes he is in charge
//   Ines Calder  - the expedition's cartographer, restless and curious
//   Maren        - the ship's cook, older, practical, warm
//   Tob          - a young deckhand, quiet and frightened
//   you          - a hand on the ship with no special rank or skill

const VOSS = 'Voss';
const INES = 'Ines';
const MAREN = 'Maren';
const TOB = 'Tob';

export const landfall: Script = {
  id: 'landfall',
  title: 'Expedition I: Landfall',
  facets: [
    'Immoderation',
    'Assertiveness',
    'Activity Level',
    'Imagination',
    'Adventurousness',
    'Orderliness',
    'Cautiousness',
  ],
  start: 'wreck',
  sections: {
    // -------------------------------------------------------------------------
    // Waking on the beach
    // -------------------------------------------------------------------------
    wreck: {
      steps: [
        { text: 'Darkness. The roar of water. Something hits your shoulder hard, and then there is nothing at all.', animation: 'black_screen_storm_audio' },
        { text: 'You wake to sunlight and the hiss of surf.', animation: 'fade_in_beach_dawn' },
        { text: 'Sand in your mouth. Salt in your eyes. Every muscle aches, but nothing seems broken.', animation: 'camera_rise_from_sand' },
        { text: 'The Kestrel lies on her side out on the reef, her mainmast snapped in two. Waves break through her hull.', animation: 'pan_to_wreck_on_reef' },
        { text: 'Crates, rope, splintered timber, and a torn sail are scattered along the tideline.', animation: 'pan_along_debris' },
        { text: 'Behind the beach the land rises steeply into thick green forest. You can see no smoke, no roofs, and no paths.', animation: 'pan_to_treeline' },
        { text: 'Somewhere down the beach, someone is coughing.', animation: 'hold_on_beach_wide' },
        {
          id: 'first_action',
          prompt: 'You have just washed up on an unknown shore. What is the very first thing you do, and what is going through your head?',
          animation: 'hold_on_beach_wide',
          facets: ['Activity Level', 'Cautiousness', 'Imagination'],
        },
      ],
      next: 'gathering',
    },

    // -------------------------------------------------------------------------
    // Who leads
    // -------------------------------------------------------------------------
    gathering: {
      steps: [
        { text: 'Within the hour, four other survivors have found their way to the same stretch of sand.', animation: 'survivors_gather' },
        { text: 'Harlan Voss, the first mate, has a gash across his forehead and looks like he would rather die than sit down.', animation: 'focus_voss' },
        { text: 'Ines Calder, the cartographer, is wringing out her satchel. Her charts are a soggy pulp.', animation: 'focus_ines' },
        { text: 'Maren, the cook, is already pulling a crate above the waterline on her own.', animation: 'focus_maren' },
        { text: 'Tob, the youngest of the deckhands, sits hugging his knees and staring at the wreck.', animation: 'focus_tob' },
        { text: 'No one else comes. No one says the captain\'s name.', animation: 'survivors_gather' },
        { speaker: VOSS, text: 'Right. Listen. With the captain gone, I\'m the ranking officer. That makes this my command.', animation: 'voss_steps_forward' },
        { speaker: VOSS, text: 'We do what I say, when I say it, and we\'ll all live to be pulled off this rock.', animation: 'voss_steps_forward' },
        { speaker: INES, text: 'Your command was a ship, Harlan. The ship is on the reef.', animation: 'ines_folds_arms' },
        { speaker: INES, text: 'None of us knows this place. I don\'t see why one man should decide for all five of us.', animation: 'ines_folds_arms' },
        { speaker: VOSS, text: 'Because somebody has to, and quickly.', animation: 'voss_glares' },
        { text: 'Maren keeps working. Tob looks at the ground.', animation: 'survivors_gather' },
        { text: 'Then, one by one, they turn to look at you.', animation: 'camera_turn_to_player' },
        {
          id: 'who_leads',
          prompt: 'The group is waiting to hear where you stand. What do you say?',
          animation: 'camera_turn_to_player',
          facets: ['Assertiveness'],
          choices: [
            { label: 'Back Voss. Someone needs to be in charge, and he has the experience.', next: 'lead_voss' },
            { label: 'Put yourself forward to lead.', next: 'lead_you' },
            { label: 'Propose that the group decides things together.', next: 'lead_together' },
            { label: 'Stay out of it. Let them sort it out.', next: 'lead_aside' },
          ],
        },
      ],
    },

    lead_voss: {
      steps: [
        { text: 'You tell them Voss should lead, at least for now.', animation: 'player_speaks' },
        { speaker: VOSS, text: 'Good. Sensible.', animation: 'voss_nods' },
        { text: 'Ines exhales through her nose and says nothing. Maren shrugs. Tob looks relieved that someone has decided.', animation: 'survivors_react' },
      ],
      next: 'plan',
    },

    lead_you: {
      steps: [
        { text: 'You step forward and tell them you will take charge.', animation: 'player_speaks' },
        { text: 'For a moment no one says anything.', animation: 'survivors_react' },
        { speaker: VOSS, text: 'You? You\'ve never commanded anything bigger than a mop.', animation: 'voss_glares' },
        { speaker: MAREN, text: 'Neither had he, before somebody let him. Let\'s hear what they\'ve got to say.', animation: 'maren_looks_up' },
        { text: 'Voss doesn\'t argue, but he doesn\'t agree either. Ines watches you with open curiosity.', animation: 'survivors_react' },
      ],
      next: 'plan',
    },

    lead_together: {
      steps: [
        { text: 'You suggest that the five of you make decisions together, at least until you understand where you are.', animation: 'player_speaks' },
        { speaker: INES, text: 'Thank you. That\'s all I was saying.', animation: 'ines_nods' },
        { speaker: VOSS, text: 'A ship run by a vote sinks.', animation: 'voss_glares' },
        { speaker: MAREN, text: 'Ship already sank, love.', animation: 'maren_looks_up' },
        { text: 'Voss grumbles, but he lets it stand for now.', animation: 'survivors_react' },
      ],
      next: 'plan',
    },

    lead_aside: {
      steps: [
        { text: 'You say nothing and let the silence answer for you.', animation: 'player_looks_away' },
        { text: 'Voss takes your silence as agreement. Ines takes it as cowardice. Neither says so.', animation: 'survivors_react' },
        { text: 'The argument fizzles out on its own. Nothing is really settled.', animation: 'survivors_react' },
      ],
      next: 'plan',
    },

    // -------------------------------------------------------------------------
    // Explore or secure camp
    // -------------------------------------------------------------------------
    plan: {
      steps: [
        { text: 'The sun climbs. The heat is already heavy, and everyone is thirsty.', animation: 'sun_climbs' },
        { speaker: VOSS, text: 'We build a shelter and a signal fire, here, today. A ship could pass at any moment. If no one\'s on the beach, they sail right by.', animation: 'voss_points_beach' },
        { speaker: INES, text: 'And drink what? There\'s no fresh water on this beach. We need to find a stream, and we need to know what\'s in that forest before it finds us.', animation: 'ines_points_inland' },
        { speaker: MAREN, text: 'We\'ve got two casks of water from the wreck. Two or three days, if no one\'s greedy.', animation: 'maren_taps_cask' },
        { speaker: TOB, text: 'What if there\'s... something in there? People. Animals.', animation: 'tob_glances_treeline' },
        { text: 'Whatever was or wasn\'t settled earlier, this next question is coming to you.', animation: 'camera_turn_to_player_midday' },
        {
          id: 'explore_or_camp',
          prompt: 'There\'s light for one good push today. What should the group do with it?',
          animation: 'split_view_beach_forest',
          facets: ['Adventurousness', 'Cautiousness', 'Activity Level'],
          choices: [
            { label: 'Head inland to look for water and learn the island.', next: 'explore' },
            { label: 'Stay on the beach, build shelter, and get a signal fire going.', next: 'camp' },
            { label: 'Split up: some explore, some build.', next: 'split' },
          ],
        },
      ],
    },

    explore: {
      steps: [
        { text: 'You and Ines push into the trees while the others haul what they can from the tideline.', animation: 'enter_forest' },
        { text: 'Within twenty paces the sound of the sea is gone. Birds you don\'t recognize call overhead.', animation: 'forest_canopy_light' },
        { text: 'The ground climbs steadily. Vines catch your ankles and the air is thick and wet.', animation: 'forest_walk' },
        { speaker: INES, text: 'Listen. Do you hear that?', animation: 'ines_stops' },
        { text: 'Running water. You follow the sound down into a gully and find a clear, cold stream.', animation: 'reveal_stream' },
        { text: 'Beside it, half-buried in moss, is a stone with a spiral carved into its face. The carving is old, but not natural.', animation: 'reveal_carved_stone' },
        { speaker: INES, text: 'Someone was here. Maybe a long time ago.', animation: 'ines_kneels_at_stone' },
        { text: 'You fill what you can carry and head back toward the beach before the light turns.', animation: 'forest_walk_return' },
        { text: 'When you arrive, the others have made a rough lean-to out of the torn sail. It\'s crooked, but it stands.', animation: 'camp_lean_to' },
      ],
      next: 'supplies',
    },

    camp: {
      steps: [
        { text: 'You stay on the beach. Voss directs, Maren hauls, and Tob, with something to do, finally gets up.', animation: 'camp_work_montage' },
        { text: 'You drag spars from the tideline and lash them together with salvaged rope. Your hands blister.', animation: 'lash_spars' },
        { text: 'By midafternoon the torn sail is stretched over a frame. It is crooked, but it is shade.', animation: 'camp_lean_to' },
        { text: 'You pile driftwood and green leaves on the headland, ready to make smoke if a sail appears.', animation: 'build_signal_pile' },
        { text: 'Ines spends the day walking the edge of the treeline, never quite going in. Near sunset she comes back with a grin.', animation: 'ines_returns' },
        { speaker: INES, text: 'There\'s a stream, not far in. Fresh water. And a carved stone beside it. Someone was here once.', animation: 'ines_returns' },
      ],
      next: 'supplies',
    },

    split: {
      steps: [
        { text: 'The group splits. Ines and Tob head into the trees, and you, Voss, and Maren work the beach.', animation: 'group_splits' },
        { text: 'Tob looks back over his shoulder twice before the forest swallows him.', animation: 'tob_looks_back' },
        { text: 'You drag spars from the tideline and lash a frame together while Maren stretches the torn sail over it.', animation: 'lash_spars' },
        { text: 'Voss builds a signal pile on the headland and keeps glancing at the trees.', animation: 'build_signal_pile' },
        { text: 'The afternoon drags. The shadows get long. No one says anything about how long the others have been gone.', animation: 'shadows_lengthen' },
        { text: 'Then Ines comes crashing out of the brush, scratched and filthy, with Tob behind her. Both are carrying full water skins.', animation: 'ines_tob_return' },
        { speaker: INES, text: 'A stream, close in. And a carved stone by the water. Spirals. Someone was here once.', animation: 'ines_tob_return' },
        { speaker: TOB, text: 'It felt like something was watching us the whole way.', animation: 'focus_tob_afternoon' },
      ],
      next: 'supplies',
    },

    // -------------------------------------------------------------------------
    // Supplies and rationing
    // -------------------------------------------------------------------------
    supplies: {
      steps: [
        { text: 'As evening comes on, Maren spreads everything you salvaged out on the sail cloth.', animation: 'supplies_laid_out' },
        { text: 'A sack of ship\'s biscuit, mostly dry. Six tins of salt pork. A wheel of hard cheese. The two water casks.', animation: 'pan_supplies' },
        { text: 'A hatchet, a coil of rope, a tinderbox, a knife each, a small medicine kit, a spyglass with a cracked lens.', animation: 'pan_supplies' },
        { speaker: MAREN, text: 'That\'s the lot. If we\'re careful, the food lasts perhaps nine days. If we\'re not, four.', animation: 'maren_counts' },
        { speaker: MAREN, text: 'After that we eat what this island gives us, if it gives us anything.', animation: 'maren_counts' },
        { text: 'Tob is counting the biscuits under his breath. When he reaches the end, he starts again from the beginning.', animation: 'tob_counts' },
        { speaker: MAREN, text: 'Someone ought to decide how this gets kept and handed out. You\'ve got a level head. How would you do it?', animation: 'maren_turns_to_player' },
        {
          id: 'organize_supplies',
          prompt: 'How would you organize and ration what the group has? Be as specific or as loose as you like, and tell us why.',
          animation: 'supplies_laid_out',
          facets: ['Orderliness', 'Cautiousness'],
        },
        { text: 'Maren listens and nods slowly. Whatever she thinks of your plan, she keeps it to herself.', animation: 'maren_nods' },
      ],
      next: 'feast',
    },

    // -------------------------------------------------------------------------
    // The rum cask
    // -------------------------------------------------------------------------
    feast: {
      steps: [
        { text: 'Just as the sun touches the water, Voss comes up the beach rolling a small cask he found wedged in the rocks.', animation: 'voss_rolls_cask' },
        { speaker: VOSS, text: 'Captain\'s rum. The good stuff.', animation: 'voss_grins' },
        { text: 'Ines comes back from the trees with an armful of fat orange fruit. She cuts one open and it smells sweet as honey.', animation: 'ines_brings_fruit' },
        { speaker: VOSS, text: 'We\'re alive. Five of us out of twenty-two. That deserves a drink.', animation: 'voss_raises_cup' },
        { speaker: MAREN, text: 'That rum\'s the only thing we\'ve got for cleaning wounds. And we don\'t know if that fruit is safe.', animation: 'maren_frowns' },
        { speaker: INES, text: 'I ate one an hour ago. I\'m still here.', animation: 'ines_shrugs' },
        { text: 'The cask is open. Cups are poured. The fruit is passed around. You haven\'t eaten since the storm, and your stomach clenches.', animation: 'fire_cups_passed' },
        {
          id: 'rum_and_fruit',
          prompt: 'A cup and a piece of fruit are held out to you. What do you do?',
          animation: 'cup_offered_to_player',
          facets: ['Immoderation', 'Cautiousness'],
          choices: [
            { label: 'Take it, and keep going as long as it\'s offered. You\'ve earned it.', next: 'drink_full' },
            { label: 'Have a little, then stop.', next: 'drink_some' },
            { label: 'Refuse, and argue that it should be saved.', next: 'drink_none' },
          ],
        },
      ],
    },

    drink_full: {
      steps: [
        { text: 'The rum burns all the way down, and the fruit is the best thing you\'ve ever tasted. You reach for another.', animation: 'fire_warm_glow' },
        { text: 'Voss laughs and refills your cup. For an hour the island doesn\'t feel so bad.', animation: 'fire_warm_glow' },
        { text: 'Maren quietly hammers the bung back into the cask while there\'s still something left inside.', animation: 'maren_seals_cask' },
      ],
      next: 'dusk',
    },

    drink_some: {
      steps: [
        { text: 'You take one cup and one piece of fruit, then put your hand over the cup when Voss tries to refill it.', animation: 'player_covers_cup' },
        { text: 'The rum warms your chest. The fruit is sticky and sweet, and it leaves you wanting more.', animation: 'fire_warm_glow' },
        { text: 'Maren catches your eye and gives you the smallest of nods.', animation: 'maren_nods_fire' },
      ],
      next: 'dusk',
    },

    drink_none: {
      steps: [
        { text: 'You push the cup away and say the rum and the fruit should be put with the stores.', animation: 'player_refuses_cup' },
        { speaker: VOSS, text: 'Suit yourself. More for the living.', animation: 'voss_shrugs' },
        { text: 'Maren hammers the bung back into the cask. Voss rolls his eyes but doesn\'t stop her.', animation: 'maren_seals_cask' },
        { text: 'The smell of the fruit lingers. Your stomach doesn\'t forgive you.', animation: 'fire_warm_glow' },
      ],
      next: 'dusk',
    },

    // -------------------------------------------------------------------------
    // The light inland
    // -------------------------------------------------------------------------
    dusk: {
      steps: [
        { text: 'Full dark. The fire crackles. Out past the reef, the wreck groans every time a wave hits it.', animation: 'night_fire_wide' },
        { speaker: TOB, text: 'Look. Up there.', animation: 'tob_points_inland' },
        { text: 'High on the slope, far above the treeline, a light flickers. It is pale and steady, nothing like firelight.', animation: 'reveal_inland_light' },
        { text: 'It holds for a long moment, then pulses three times and goes out.', animation: 'inland_light_pulses' },
        { text: 'Nobody speaks. A moment later, from the same direction, comes a low sound like a struck bell.', animation: 'bell_sound_hold' },
        {
          id: 'the_light',
          prompt: 'What do you think that was? Let your mind go wherever it goes.',
          animation: 'inland_slope_dark',
          facets: ['Imagination', 'Adventurousness'],
        },
        { speaker: INES, text: 'Whatever it is, it\'s an hour\'s climb at most. I could be there and back before midnight.', animation: 'ines_stands' },
        { speaker: VOSS, text: 'In the dark? On ground we don\'t know? Sit down.', animation: 'voss_stands' },
        { speaker: TOB, text: 'Please, let\'s not go up there at all.', animation: 'tob_shrinks' },
        {
          id: 'go_to_light',
          prompt: 'Ines is already reaching for a torch. What do you do?',
          animation: 'ines_reaches_for_torch',
          facets: ['Adventurousness', 'Cautiousness'],
          choices: [
            { label: 'Grab a torch and go with her now.', next: 'go_now' },
            { label: 'Convince her to wait for morning.', next: 'wait_morning' },
            { label: 'Argue that no one should go up there at all.', next: 'leave_it' },
          ],
        },
      ],
    },

    go_now: {
      steps: [
        { text: 'You light a torch from the fire and follow Ines into the trees. Voss swears at your backs.', animation: 'enter_forest_night' },
        { text: 'The forest at night is a different place. Every sound is too close. Your torch lights a small circle of leaves and nothing beyond it.', animation: 'forest_night_torch' },
        { text: 'You climb for what feels like an hour. Twice you lose the slope and have to double back.', animation: 'forest_night_torch' },
        { text: 'The light never comes again. Eventually Ines stops and admits you\'re not going to find it in the dark.', animation: 'ines_stops_night' },
        { text: 'You pick your way back down to the beach, scratched and shaking, and find the others still awake.', animation: 'return_to_fire' },
      ],
      next: 'night',
    },

    wait_morning: {
      steps: [
        { text: 'You put a hand on Ines\'s arm and tell her the light will still be up there in the morning.', animation: 'player_stops_ines' },
        { speaker: INES, text: 'You don\'t know that.', animation: 'ines_frowns' },
        { text: 'But she sits back down. Her eyes stay on the slope for a long time.', animation: 'ines_sits' },
      ],
      next: 'night',
    },

    leave_it: {
      steps: [
        { text: 'You tell them whatever is up there, you want nothing to do with it. The beach is where rescue will come.', animation: 'player_speaks_night' },
        { speaker: TOB, text: 'Yes. Yes, that\'s right.', animation: 'tob_nods' },
        { speaker: INES, text: 'We can\'t sit on a beach and pretend that light didn\'t happen.', animation: 'ines_frowns' },
        { text: 'She doesn\'t go tonight. But you can tell she hasn\'t let it go.', animation: 'ines_sits' },
      ],
      next: 'night',
    },

    // -------------------------------------------------------------------------
    // Night
    // -------------------------------------------------------------------------
    night: {
      steps: [
        { text: 'The fire burns low. One by one, the others curl up under the sail.', animation: 'fire_dying' },
        { text: 'You lie on your back in the sand. There are more stars than you have ever seen, and none of them are where they should be.', animation: 'starfield_overhead' },
        { text: 'The day goes back through your mind. The wreck. The argument. The light on the hill.', animation: 'starfield_overhead' },
        {
          id: 'night_reflection',
          prompt: 'How are you feeling as you lie there? And what do you want to do tomorrow?',
          animation: 'starfield_overhead',
          facets: ['Activity Level', 'Orderliness', 'Adventurousness', 'Imagination'],
        },
        { text: 'Sleep comes slowly.', animation: 'fade_to_dark' },
        { text: 'Sometime in the night you half-wake to the soft scrape of the supply crate\'s lid.', animation: 'black_screen_faint_scrape' },
        { text: 'It\'s probably someone getting a drink of water. You\'re too tired to look.', animation: 'black_screen' },
        { text: 'Expedition I: Landfall. End.', animation: 'title_card_end' },
      ],
    },
  },
};
