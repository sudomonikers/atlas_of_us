import type { Script } from '../personality';

// The Party of Strangers: Snowed In
// It's New Year's Eve at a ski lodge up a mountain pass. The friend who invited the player cancels as they arrive,
// and the pass closes behind them, so they're stuck until morning with twenty people they've never met.
// Leaving isn't an option, so the question is how they spend the night. Every path shares the last prompt.

const JUNO = 'Juno';
const BRAM = 'Bram';
const PIP = 'Pip';
const DELPHINE = 'Delphine';

export const partyOfStrangers: Script = {
  id: 'party_of_strangers',
  title: 'The Party of Strangers',
  facets: ['Self-Consciousness', 'Immoderation', 'Friendliness', 'Gregariousness', 'Excitement-Seeking', 'Cheerfulness', 'Playfulness'],
  start: 'arrival',
  sections: {
    // -------------------------------------------------------------------------
    // the porch
    // -------------------------------------------------------------------------
    arrival: {
      steps: [
        { text: 'The Party of Strangers', animation: 'title_card' },
        { text: "It's New Year's Eve. You've been driving up the mountain for two hours, and it's been snowing for one of them.", animation: 'porch_far' },
        { text: "Your friend Juno talked you into this: a party at a ski lodge that belongs to her friend Bram. You've never met him, or anyone else who'll be there.", animation: 'porch_far' },
        { text: 'You park beside a row of snowed-over cars. Inside, somebody is singing badly and a lot of people are laughing.', animation: 'porch' },
        { text: 'Then your phone buzzes.', animation: 'phone' },
        { speaker: JUNO, text: "car's in a ditch. i'm fine!! but they've closed the pass and i can't get up. i'm SO sorry", animation: 'phone_text' },
        { speaker: JUNO, text: 'bram is lovely, everyone is lovely. go in!! you will be fine', animation: 'phone_text' },
        { text: "You look back down the road. A plough's orange light is flashing at the bottom of the hill. The pass is closed behind you too, so you're here until morning.", animation: 'porch_road' },
        { text: 'The door opens and lets out a rush of warm air and noise. Nobody seems to have noticed you yet.', animation: 'porch_door' },
        {
          id: 'on_the_porch',
          prompt: "Juno isn't coming, and the door is open. What do you do?",
          animation: 'porch_door',
          facets: ['Self-Consciousness', 'Gregariousness', 'Friendliness'],
          choices: [
            { label: 'Walk in and find the host.', next: 'in_host' },
            { label: 'Slip in and find a quiet corner.', next: 'in_corner' },
            { label: 'Stay out on the porch a little longer.', next: 'in_porch' },
          ],
        },
      ],
    },

    in_host: {
      steps: [
        { text: 'You ask the first person you see for Bram. They point to the biggest man in the room, who has on a reindeer sweater.', animation: 'room_bram' },
        { speaker: BRAM, text: "Juno's friend! She just texted me. Get in here, you're letting the snow in.", animation: 'room_bram' },
      ],
      next: 'the_room',
    },

    in_corner: {
      steps: [
        { text: 'You slip in behind a couple carrying firewood and find a spot by the coat rack.', animation: 'room_corner' },
        { text: "From there you watch the room for a while. Nobody seems to need anything from you, and that's fine.", animation: 'room_corner' },
      ],
      next: 'the_room',
    },

    in_porch: {
      steps: [
        { text: 'You stand in the cold for ten minutes, watching the snow come down. The party goes on without you.', animation: 'porch' },
        { text: 'Then the door opens again. The man in it is huge, and he has on a reindeer sweater.', animation: 'porch_bram' },
        { speaker: BRAM, text: "You're Juno's friend. She told me you might be lurking. Come in, you're turning blue.", animation: 'porch_bram' },
      ],
      next: 'the_room',
    },

    // -------------------------------------------------------------------------
    // the room
    // -------------------------------------------------------------------------
    the_room: {
      steps: [
        { text: 'The main room is all wood and firelight: twenty-odd people, a fire the size of a car, and a karaoke machine that nobody is using well.', animation: 'room_wide' },
        { text: 'As the door shuts behind you, a few heads turn. They look you over, and then they turn back to their conversations.', animation: 'room_heads' },
        { text: 'One of them, a man in a battered ski jacket, catches your eye, grins, and lifts his mug at you.', animation: 'room_heads' },
        {
          id: 'first_hello',
          prompt: "He's still looking your way. What do you do?",
          animation: 'room_heads',
          facets: ['Friendliness', 'Self-Consciousness'],
        },
        { speaker: BRAM, text: "Glögg. It's mostly wine. Drink it while it's hot.", animation: 'room_glogg' },
        { text: 'He puts a mug into your hands, and then somebody shouts for him from the kitchen. You are on your own.', animation: 'room_wide' },
        { text: 'Round the glögg bowl, a loud group is trading stories about skiing disasters and laughing at every one.', animation: 'room_glogg' },
        { text: 'By the fire, a quiet person is doing a thousand-piece jigsaw of a lighthouse on their own.', animation: 'room_puzzle' },
        { text: 'In the middle of the room, a woman in a silver dress is holding court. The people around her look like they would like to escape.', animation: 'room_circle' },
        {
          id: 'who_to_talk',
          prompt: 'Where do you go?',
          animation: 'room_wide',
          facets: ['Gregariousness', 'Friendliness', 'Excitement-Seeking'],
          choices: [
            { label: 'Over to the loud group by the glögg.', next: 'talk_glogg' },
            { label: 'To the jigsaw by the fire.', next: 'talk_puzzle' },
            { label: 'Into the circle round the woman in silver.', next: 'talk_circle' },
          ],
        },
      ],
    },

    talk_glogg: {
      steps: [
        { text: 'The skiers make room for you without being asked. Within a minute someone wants to hear your worst holiday story.', animation: 'room_glogg' },
        { text: 'The whole group turns to listen, and somebody tops up your mug while you talk.', animation: 'room_glogg' },
      ],
      next: 'resolutions',
    },

    talk_puzzle: {
      steps: [
        { speaker: PIP, text: "I'm Pip. The edges are done. I'm on the sky now, and the sky is the worst part.", animation: 'room_puzzle' },
        { speaker: PIP, text: "I don't really know anyone here either. Bram's my cousin. He collects people.", animation: 'room_puzzle' },
        { text: "You sit down. For a while neither of you says much. You find three pieces of sky.", animation: 'room_puzzle' },
      ],
      next: 'resolutions',
    },

    talk_circle: {
      steps: [
        { text: "You join the circle. The woman in silver is Delphine, and she has opinions about everything.", animation: 'room_circle' },
        { text: "Two people take the chance to slip away to the kitchen while she's looking at you.", animation: 'room_circle' },
      ],
      next: 'resolutions',
    },

    resolutions: {
      steps: [
        { speaker: DELPHINE, text: 'New person! Perfect. Settle something for me.', animation: 'room_delphine' },
        { speaker: DELPHINE, text: "People who don't make New Year's resolutions have given up on themselves. Full stop.", animation: 'room_delphine' },
        { speaker: DELPHINE, text: "So what's your resolution? And don't tell me you haven't got one.", animation: 'room_delphine' },
        {
          id: 'delphine',
          prompt: 'Everyone near you is waiting. A real answer, a joke, or an argument: what do you say?',
          animation: 'room_delphine',
          facets: ['Playfulness', 'Friendliness', 'Self-Consciousness'],
        },
        { speaker: DELPHINE, text: "Hm. I'll allow it.", animation: 'room_delphine' },
        { text: "She's already turned to somebody else.", animation: 'room_circle' },
      ],
      next: 'the_mic',
    },

    // -------------------------------------------------------------------------
    // the karaoke
    // -------------------------------------------------------------------------
    the_mic: {
      steps: [
        { text: 'At half past eleven, Bram comes back, turns the karaoke machine all the way up, and points straight at you.', animation: 'karaoke_wide' },
        { speaker: BRAM, text: 'House rule! The newest guest sings before midnight, and tonight that is you.', animation: 'karaoke_wide' },
        { speaker: BRAM, text: "Any song you like. Everybody's watching, but nobody's really listening. I promise.", animation: 'karaoke_mic' },
        {
          id: 'karaoke',
          prompt: "He's holding out the microphone. What do you do?",
          animation: 'karaoke_mic',
          facets: ['Self-Consciousness', 'Excitement-Seeking', 'Cheerfulness'],
          choices: [
            { label: 'Grab it and go all in.', next: 'sing' },
            { label: 'Only if somebody sings with me.', next: 'duet' },
            { label: 'Pass, politely but firmly.', next: 'pass' },
          ],
        },
      ],
    },

    sing: {
      steps: [
        { text: 'You pick a song you half know and go for it. By the second chorus, half the room is singing along.', animation: 'karaoke_sing' },
        { text: 'When it ends, the applause is loud and sloppy, and every bit of it is sincere.', animation: 'karaoke_cheer' },
      ],
      next: 'toast_time',
    },

    duet: {
      steps: [
        { text: "Bram roars \"Done!\" and grabs the second microphone. He knows all of the words and none of the notes.", animation: 'karaoke_duet' },
        { text: 'Between the two of you it is a disaster, and the room loves it.', animation: 'karaoke_cheer' },
      ],
      next: 'toast_time',
    },

    pass: {
      steps: [
        { text: "Bram shrugs, not bothered at all, and sings it himself: a power ballad, eyes closed, one fist in the air.", animation: 'karaoke_pass' },
        { text: "Nobody seems to have noticed that you passed. If they did, they've already forgotten.", animation: 'karaoke_cheer' },
      ],
      next: 'toast_time',
    },

    // -------------------------------------------------------------------------
    // midnight
    // -------------------------------------------------------------------------
    toast_time: {
      steps: [
        { text: "It's ten to midnight. Bram is going round with a bottle of something fizzy and filling every glass he can find.", animation: 'toast' },
        { text: "You've had two mugs of glögg already, and a tray of chocolate cake is going round too.", animation: 'toast' },
        { speaker: BRAM, text: 'Glasses up! Nobody sees the new year in dry.', animation: 'toast' },
        {
          id: 'the_toast',
          prompt: 'He tips the bottle toward your glass. What do you do?',
          animation: 'toast',
          speaker: BRAM,
          facets: ['Immoderation'],
          choices: [
            { label: "Fill it to the top. It's New Year's.", next: 'midnight' },
            { label: 'Just a splash for the toast, and a glass of water.', next: 'midnight' },
            { label: "Nothing for me, I'm done for the night.", next: 'midnight' },
          ],
        },
      ],
    },

    midnight: {
      steps: [
        { text: 'Everyone spills out onto the deck. The snow has stopped, and the whole valley lies below you.', animation: 'deck_count' },
        { text: 'Twenty strangers count down from ten at the top of their voices.', animation: 'deck_count' },
        { text: 'At midnight, fireworks go up from the village far below.', animation: 'deck_fireworks' },
        { text: 'Bram hugs everyone he can reach, you included. Pip shakes your hand. Delphine kisses you on both cheeks.', animation: 'deck_fireworks' },
        { text: 'For a minute nobody says anything. They all just watch.', animation: 'deck_fireworks' },
        {
          id: 'the_new_year',
          prompt: "Midnight on a mountain, with twenty people you didn't know this morning. What's that minute like for you?",
          animation: 'deck_fireworks',
          facets: ['Cheerfulness', 'Emotionality'],
        },
      ],
      next: 'late',
    },

    // -------------------------------------------------------------------------
    // after midnight
    // -------------------------------------------------------------------------
    late: {
      steps: [
        { text: 'At half past twelve, Bram stomps in carrying an armful of plastic sleds and a box of headlamps.', animation: 'room_sleds' },
        { speaker: BRAM, text: 'Night sledding! The run goes right down to the trees. Then everybody into the hot tub.', animation: 'room_sleds' },
        {
          id: 'after_party',
          prompt: '"You coming?"',
          animation: 'room_sleds',
          speaker: BRAM,
          facets: ['Excitement-Seeking', 'Gregariousness', 'Immoderation'],
          choices: [
            { label: 'Yes. Give me a headlamp.', next: 'sledding' },
            { label: "I'll skip the hill, but I'll take the hot tub.", next: 'hot_tub' },
            { label: "No, I'm off to bed.", next: 'bed' },
          ],
        },
      ],
    },

    sledding: {
      steps: [
        { text: 'You go down the hill in the dark on a plastic tray, screaming, with only a headlamp to see by.', animation: 'hill_sled' },
        { text: 'Then you go down eleven more times.', animation: 'hill_sled' },
        { text: 'After that, everybody piles into the hot tub, steaming under the stars.', animation: 'tub' },
      ],
      next: 'home',
    },

    hot_tub: {
      steps: [
        { text: 'From the hot tub you watch the headlamps zigzag down the hill, and you listen to the screaming.', animation: 'tub' },
        { text: 'Pip climbs in next to you. Neither of you says much, and the snow starts falling again.', animation: 'tub' },
      ],
      next: 'home',
    },

    bed: {
      steps: [
        { text: 'Your bunk is up under the roof. Through the little window you can see headlamps zigzagging down the hill.', animation: 'bunk' },
        { text: 'The laughter carries a long way. You fall asleep before it stops.', animation: 'bunk' },
      ],
      next: 'home',
    },

    // -------------------------------------------------------------------------
    // the morning after, on every path
    // -------------------------------------------------------------------------
    home: {
      steps: [
        { text: "The pass opens at noon. You drive down the mountain in bright sunshine, past the plough and past Juno's car, which is still in its ditch.", animation: 'road' },
        { text: 'Your phone buzzes in the cup holder.', animation: 'phone_day' },
        { speaker: JUNO, text: 'well?? how was it???', animation: 'phone_day' },
        {
          id: 'drive_home',
          prompt: 'On the drive down, do you feel more drained or more awake than when you arrived? Would you go back next year, even without Juno?',
          animation: 'road',
          facets: ['Gregariousness', 'Cheerfulness', 'Self-Consciousness'],
        },
        {
          id: 'your_friday',
          prompt: 'Away from the mountain now. Think of your last free Friday night. What did you choose to do with it, and with how many people?',
          animation: 'road',
          facets: ['Gregariousness', 'Friendliness'],
        },
      ],
      next: 'closing',
    },

    closing: {
      steps: [{ text: "Far up the mountain behind you, smoke is still rising from the lodge's chimney.", animation: 'road_far' }],
    },
  },
};
