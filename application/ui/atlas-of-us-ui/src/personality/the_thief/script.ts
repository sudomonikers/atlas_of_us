import type { Script } from '../personality';

// Expedition II: The Thief
// The morning after Landfall. Two days of food went missing in the night, the scrape the player half heard.
// Tob took it, frightened the food would run out, and Maren saw him and kept quiet.
// The opening recalls who the player said should lead in Landfall, and Voss's accusation recalls the rum.
// Choices carry consequences in the story only: every branch rejoins, so camp_rules is always the last question.

const VOSS = 'Voss';
const INES = 'Ines';
const MAREN = 'Maren';
const TOB = 'Tob';

export const theThief: Script = {
  id: 'the_thief',
  title: 'Expedition II: The Thief',
  facets: ['Liberalism', 'Trust', 'Morality', 'Altruism', 'Cooperation', 'Sympathy'],
  start: 'morning',
  sections: {
    // -------------------------------------------------------------------------
    // The missing food
    // -------------------------------------------------------------------------
    morning: {
      steps: [
        { text: 'Expedition II: The Thief', animation: 'title_card_start' },
        { text: 'Morning comes grey and close. The fire is cold ash.', animation: 'dawn_camp_wide' },
        { speaker: MAREN, text: 'Who\'s been in the stores?', animation: 'maren_at_supplies' },
        { text: 'Maren is kneeling by the sail cloth with the supplies spread out around her. There are gaps where there shouldn\'t be.', animation: 'supplies_gaps' },
        { speaker: MAREN, text: 'A tin of pork. A good third of the biscuit. A wedge out of the cheese, cut clean with a knife.', animation: 'maren_counts_dawn' },
        { speaker: MAREN, text: 'That\'s two days of food. Gone in one night.', animation: 'maren_counts_dawn' },
        { text: 'You remember the soft scrape of the crate lid in the dark.', animation: 'remember_scrape' },
      ],
      recall: {
        scenario: 'landfall',
        question: 'who_leads',
        choices: {
          'Back Voss. Someone needs to be in charge, and he has the experience.': 'led_voss',
          'Put yourself forward to lead.': 'led_you',
          'Propose that the group decides things together.': 'led_together',
          'Stay out of it. Let them sort it out.': 'led_aside',
        },
      },
      next: 'led_aside',
    },

    led_voss: {
      steps: [
        { speaker: VOSS, text: 'Nobody touches the stores without my say. Somebody did. I want to know who, and I want to know now.', animation: 'voss_paces' },
        { text: 'Since yesterday he has carried himself like a captain. This morning he looks at all of you like a crew he can\'t trust.', animation: 'crew_lined_up' },
        { speaker: VOSS, text: 'You backed me yesterday. Back me now. Help me find who did this.', animation: 'voss_turns_to_player' },
      ],
      next: 'suspects',
    },

    led_you: {
      steps: [
        { text: 'Everyone turns to you. Yesterday you said you would lead.', animation: 'crew_lined_up' },
        { speaker: VOSS, text: 'Well? You wanted the job. Here it is.', animation: 'voss_glares_dawn' },
        { speaker: INES, text: 'Go on, then. What do we do?', animation: 'ines_looks_to_player' },
      ],
      next: 'suspects',
    },

    led_together: {
      steps: [
        { speaker: INES, text: 'We said we\'d decide things together. So we decide this together, too.', animation: 'ines_looks_to_player' },
        { text: 'The five of you sit in a rough circle on the sand. Nobody wants to be the first to speak.', animation: 'circle_on_sand' },
        { speaker: VOSS, text: 'Fine. Together, then. Let\'s find out which of us is a thief.', animation: 'circle_on_sand' },
      ],
      next: 'suspects',
    },

    led_aside: {
      steps: [
        { text: 'Nobody ever settled who was in charge, and it shows. Everyone starts talking at once.', animation: 'crew_lined_up' },
        { speaker: VOSS, text: 'Quiet! All of you!', animation: 'voss_glares_dawn' },
        { text: 'For once, they listen.', animation: 'crew_lined_up' },
      ],
      next: 'suspects',
    },

    // -------------------------------------------------------------------------
    // Suspicion
    // -------------------------------------------------------------------------
    suspects: {
      steps: [
        { speaker: VOSS, text: 'You were up half the night, Ines. Wandering about. I heard you.', animation: 'voss_points_ines' },
        { speaker: INES, text: 'I was watching the hill for the light. And you\'re the one who found the rum, Harlan. Who knows what else you\'ve found and kept to yourself?', animation: 'ines_points_voss' },
        { text: 'Maren says nothing. She is suddenly very busy folding the cloth.', animation: 'maren_folds_cloth' },
        { text: 'Tob sits apart from everyone, staring at his feet.', animation: 'tob_apart' },
      ],
      recall: {
        scenario: 'landfall',
        question: 'rum_and_fruit',
        choices: {
          'Take it, and keep going as long as it\'s offered. You\'ve earned it.': 'suspect_drinker',
          'Refuse, and argue that it should be saved.': 'suspect_saver',
        },
      },
      next: 'suspicion',
    },

    suspect_drinker: {
      steps: [
        { speaker: VOSS, text: 'And you. You put away the captain\'s rum like water last night. Maybe you woke up hungry.', animation: 'voss_points_player' },
        { text: 'Every face turns to you.', animation: 'faces_turn_to_player' },
      ],
      next: 'suspicion',
    },

    suspect_saver: {
      steps: [
        { speaker: VOSS, text: 'Funny. You were the one so keen to have everything put in the stores. Easier to help yourself later, maybe.', animation: 'voss_points_player' },
        { text: 'Every face turns to you.', animation: 'faces_turn_to_player' },
      ],
      next: 'suspicion',
    },

    suspicion: {
      steps: [
        {
          id: 'first_suspicion',
          prompt: 'Everyone is watching everyone else. What do you make of all this? Who do you think took the food, if anyone, and why?',
          animation: 'crew_lined_up',
          facets: ['Trust', 'Sympathy'],
        },
        { speaker: VOSS, text: 'Talk is cheap. I say we turn out every bag and bedroll on this beach. Mine included.', animation: 'voss_paces' },
        { speaker: INES, text: 'Search us like prisoners? Over a tin of pork?', animation: 'ines_points_voss' },
        { speaker: MAREN, text: 'Over two days of food, love.', animation: 'maren_folds_cloth' },
        {
          id: 'search_bags',
          prompt: 'Voss wants to search everyone\'s things. What do you say?',
          animation: 'voss_turns_to_player',
          facets: ['Trust', 'Liberalism', 'Cooperation'],
          choices: [
            { label: 'Agree. Search everyone, me included.', next: 'search' },
            { label: 'Refuse. We don\'t treat each other like criminals.', next: 'no_search' },
            { label: 'Ask whoever did it to own up in private, with no punishment.', next: 'amnesty' },
          ],
        },
      ],
    },

    search: {
      steps: [
        { text: 'One by one, every bag and bedroll is turned out onto the sand. Nobody looks anyone in the eye.', animation: 'search_bedrolls' },
        { text: 'Your own things are shaken out in front of everyone. It feels worse than you expected.', animation: 'search_bedrolls' },
        { text: 'Then Voss pulls Tob\'s blanket aside, and biscuit crumbs spill across the sand.', animation: 'crumbs_in_blanket' },
        { text: 'Tob doesn\'t argue. He just gets up and walks toward the rocks at the end of the beach.', animation: 'tob_walks_to_rocks' },
      ],
      next: 'reveal',
    },

    no_search: {
      steps: [
        { text: 'You tell Voss no. Nobody is going through anyone\'s things.', animation: 'player_speaks_dawn' },
        { speaker: VOSS, text: 'Then we\'ll never know, will we?', animation: 'voss_glares_dawn' },
        { text: 'The group breaks apart in a sour silence. The morning goes on hauling wood and saying nothing.', animation: 'camp_chores' },
        { text: 'Around midday you walk to the end of the beach and find Tob crouched among the rocks, pushing a bundle of sailcloth out of sight.', animation: 'tob_at_rocks' },
        { text: 'He freezes when he sees you. You call the others over.', animation: 'tob_at_rocks' },
      ],
      next: 'reveal',
    },

    amnesty: {
      steps: [
        { text: 'You say that whoever took it can come to you privately and put back what\'s left. No one will be punished.', animation: 'player_speaks_dawn' },
        { speaker: VOSS, text: 'And if nobody comes?', animation: 'voss_glares_dawn' },
        { text: 'Nobody answers him.', animation: 'crew_lined_up' },
        { text: 'The morning passes. Near midday Tob finds you alone by the water casks. He can\'t look at you.', animation: 'tob_comes_to_player' },
        { speaker: TOB, text: 'It was me. I\'m sorry. I\'m so sorry.', animation: 'tob_comes_to_player' },
        { text: 'He leads you, and then all the others, to the rocks at the end of the beach.', animation: 'tob_walks_to_rocks' },
      ],
      next: 'reveal',
    },

    // -------------------------------------------------------------------------
    // Tob, and Maren
    // -------------------------------------------------------------------------
    reveal: {
      steps: [
        { text: 'Wedged in a crevice is a bundle of sailcloth. Inside is the missing food. Most of it is still there.', animation: 'stash_revealed' },
        { speaker: TOB, text: 'I kept counting it. Nine days, Maren said. And then we just... wait to starve.', animation: 'tob_confesses' },
        { speaker: TOB, text: 'I thought if I had a little put by, I wouldn\'t be so scared. I only ate a bit of it. I swear.', animation: 'tob_confesses' },
        { text: 'Maren lets out a long breath.', animation: 'maren_admits' },
        { speaker: MAREN, text: 'I saw him last night. I heard the crate, saw it was Tob, and went back to sleep.', animation: 'maren_admits' },
        { speaker: MAREN, text: 'He\'s a boy, and he\'s frightened. I meant to have a quiet word with him this morning. Then the shouting started.', animation: 'maren_admits' },
        { speaker: VOSS, text: 'You knew. You sat there and let us go at each other\'s throats, and you knew.', animation: 'voss_rounds_on_maren' },
        {
          id: 'why_tob',
          prompt: 'Tob is shaking. Why do you think he really did it? And how do you feel about him right now?',
          animation: 'tob_close_up',
          facets: ['Sympathy', 'Trust'],
        },
        { speaker: VOSS, text: 'On a ship, a man who steals from the stores gets flogged. At the very least, he goes without.', animation: 'voss_at_rocks' },
        { speaker: INES, text: 'This isn\'t a ship. And you don\'t get to make up the law because you\'re the loudest.', animation: 'ines_at_rocks' },
        { speaker: MAREN, text: 'With what he ate, we\'ve seven days of food, not nine. That\'s the real cost.', animation: 'maren_admits' },
        { text: 'Tob looks up at you. They all do.', animation: 'faces_at_rocks' },
        {
          id: 'tob_punishment',
          prompt: 'What should happen to Tob?',
          animation: 'faces_at_rocks',
          facets: ['Morality', 'Sympathy', 'Liberalism', 'Cooperation'],
          choices: [
            { label: 'Cut his rations until what he ate is paid back.', next: 'punish_rations' },
            { label: 'Let it go. He was scared, and he gave back what was left.', next: 'punish_none' },
            { label: 'Have him make up for it with the night watches and the hardest work.', next: 'punish_work' },
            { label: 'Send him to sleep away from camp, far from the stores.', next: 'punish_exile' },
          ],
        },
      ],
    },

    punish_rations: {
      steps: [
        { text: 'You say Tob goes on half rations until the food he ate is made up.', animation: 'player_speaks_rocks' },
        { speaker: VOSS, text: 'Fair. More than fair.', animation: 'voss_nods_rocks' },
        { text: 'Tob nods without looking up. Ines turns away.', animation: 'tob_close_up' },
      ],
      next: 'maren',
    },

    punish_none: {
      steps: [
        { text: 'You say it\'s done. He gave back what he had, and nobody here is going to starve a frightened boy.', animation: 'player_speaks_rocks' },
        { speaker: VOSS, text: 'So stealing\'s free now. Good to know.', animation: 'voss_at_rocks' },
        { text: 'Tob starts to cry, quietly, with relief.', animation: 'tob_close_up' },
      ],
      next: 'maren',
    },

    punish_work: {
      steps: [
        { text: 'You say Tob takes the night watches and the worst of the hauling until he\'s made it right.', animation: 'player_speaks_rocks' },
        { speaker: TOB, text: 'I will. I\'ll do all of it.', animation: 'tob_close_up' },
        { text: 'Voss grunts. It\'s not what he wanted, but he lets it stand.', animation: 'voss_at_rocks' },
      ],
      next: 'maren',
    },

    punish_exile: {
      steps: [
        { text: 'You say Tob should sleep apart from the camp, down the beach, well away from the stores.', animation: 'player_speaks_rocks' },
        { speaker: MAREN, text: 'Alone? At night? With whatever\'s up on that hill?', animation: 'maren_admits' },
        { text: 'Tob says nothing. He picks up the empty sailcloth and walks off down the sand.', animation: 'tob_walks_away' },
      ],
      next: 'maren',
    },

    maren: {
      steps: [
        { speaker: VOSS, text: 'And her? She covered for him. She\'d have let one of us take the blame.', animation: 'voss_rounds_on_maren' },
        { speaker: MAREN, text: 'I\'d have sorted it before it came to that. I\'ve fed this crew for eleven years, Harlan.', animation: 'maren_admits' },
        {
          id: 'maren_knew',
          prompt: 'Maren knew, and said nothing. How do you deal with that?',
          animation: 'maren_close_up',
          facets: ['Trust', 'Morality', 'Cooperation'],
          choices: [
            { label: 'She should have told us. She answers for it too.', next: 'maren_blame' },
            { label: 'She did what she thought was kind. Leave her be.', next: 'maren_forgive' },
            { label: 'Take it up with her privately, not in front of everyone.', next: 'maren_private' },
          ],
        },
      ],
    },

    maren_blame: {
      steps: [
        { text: 'You tell Maren she should have spoken up, and that she let the rest of you suspect each other.', animation: 'player_speaks_rocks' },
        { speaker: MAREN, text: 'Maybe so. Then someone else can count the stores from now on.', animation: 'maren_hurt' },
      ],
      next: 'supper',
    },

    maren_forgive: {
      steps: [
        { text: 'You say Maren did what she thought was right, and that\'s the end of it.', animation: 'player_speaks_rocks' },
        { speaker: VOSS, text: 'Soft. The pair of you.', animation: 'voss_at_rocks' },
        { text: 'Maren squeezes your arm as she passes.', animation: 'maren_close_up' },
      ],
      next: 'supper',
    },

    maren_private: {
      steps: [
        { text: 'You wait until the others have drifted off, then sit with Maren by the water casks.', animation: 'maren_by_casks' },
        { speaker: MAREN, text: 'I know. I should have said. I just couldn\'t bear to watch them go at him.', animation: 'maren_by_casks' },
      ],
      next: 'supper',
    },

    // -------------------------------------------------------------------------
    // Supper and rules
    // -------------------------------------------------------------------------
    supper: {
      steps: [
        { text: 'That evening Maren hands out supper. The portions are noticeably smaller.', animation: 'supper_handed_out' },
        { text: 'Tob sits at the edge of the firelight with his share. He hasn\'t eaten properly since yesterday, and it shows.', animation: 'tob_by_fire' },
        {
          id: 'share_portion',
          prompt: 'Your own portion is in your hands. What do you do with it?',
          animation: 'player_portion',
          facets: ['Altruism', 'Sympathy'],
          choices: [
            { label: 'Give part of it to Tob.', next: 'share_tob' },
            { label: 'Eat it. Everyone is hungry.', next: 'share_eat' },
            { label: 'Put part of it back in the stores for later.', next: 'share_stores' },
          ],
        },
      ],
    },

    share_tob: {
      steps: [
        { text: 'You tear your biscuit in half and hold it out to Tob. He stares at it for a long moment before he takes it.', animation: 'player_offers_tob' },
        { text: 'He eats it slowly, as if someone might take it back.', animation: 'tob_by_fire' },
      ],
      next: 'rules',
    },

    share_eat: {
      steps: [
        { text: 'You eat every crumb. It isn\'t nearly enough.', animation: 'fire_glow' },
        { text: 'Across the fire, Tob does the same.', animation: 'tob_by_fire' },
      ],
      next: 'rules',
    },

    share_stores: {
      steps: [
        { text: 'You wrap half your biscuit and hand it back to Maren for the stores.', animation: 'player_offers_maren' },
        { speaker: MAREN, text: 'Hm. Seven days and a bit, then.', animation: 'player_offers_maren' },
      ],
      next: 'rules',
    },

    rules: {
      steps: [
        { speaker: VOSS, text: 'This can\'t happen again. We need rules for the stores, and for what happens to whoever breaks them.', animation: 'voss_by_fire' },
        { speaker: INES, text: 'Rules we all agree to. Not orders.', animation: 'ines_by_fire' },
        {
          id: 'camp_rules',
          prompt: 'What rules, if any, should the camp live by from now on? And who gets to decide them?',
          animation: 'fire_circle',
          facets: ['Liberalism', 'Cooperation', 'Morality'],
        },
        {
          id: 'your_trust',
          prompt: 'Away from the island now. Think of someone in your own life who let you down, or took something that was yours. Did you trust them again, and how long did it take?',
          animation: 'fire_circle',
          facets: ['Trust', 'Anger'],
        },
        { text: 'Late that night, Maren counts the stores one more time by firelight.', animation: 'maren_counts_night' },
        { text: 'She stops. She counts again.', animation: 'maren_counts_night' },
        { speaker: MAREN, text: 'Tob gave back the tin he took. There\'s still one missing.', animation: 'maren_looks_up_night' },
        { text: 'Out past the firelight, something moves in the trees.', animation: 'treeline_night' },
        { text: 'Expedition II: The Thief. End.', animation: 'title_card_end' },
      ],
    },
  },
};
