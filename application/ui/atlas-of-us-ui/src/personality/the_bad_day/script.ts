import type { Script } from '../personality';

// The Bad Day: a comedy of small disasters
// Your phone died in the night, and you have a job interview at 9:30. A real four-minute clock runs from the traffic
// lights to the interview room door, through a driver who won't move, a print shop printer that jams and a receptionist
// who keeps talking. Running out jumps straight to meeting_late, skipping whatever was left. Then an
// afternoon on hold to the bank, and a waitress who gets your dinner wrong and is clearly having a worse day than you.
// Written to the IPIP-NEO items in ../scene_grouping.md: getting angry easily (N2.1), getting irritated easily (N2.2),
// not being easily annoyed (N2.8), losing my temper (N2.5), yelling at people (A4.7), insulting people (A4.8) and being
// indifferent to the feelings of others (A3.7).

const GARY = 'Gary, at reception';
const AGENT = 'Leanne, Customer Care';
const JO = 'Jo, the waitress';

export const theBadDay: Script = {
  id: 'the_bad_day',
  title: 'The Bad Day',
  facets: ['Anger', 'Cooperation', 'Altruism'],
  start: 'opening',
  clock: { seconds: 240, from: 'the_lights', until: 'the_meeting', late: 'meeting_late' },
  sections: {
    // -------------------------------------------------------------------------
    // the morning, before the clock starts
    // -------------------------------------------------------------------------
    opening: {
      steps: [
        { text: 'The Bad Day', animation: 'title_card' },
        { text: 'It\'s Tuesday. Your phone died overnight, so your alarm never went off. You wake up to bright sunlight, which is never a good sign.', animation: 'bedroom' },
        { text: "Today is your interview for a job you'd really love. It starts at 9:30, and you can't be late.", animation: 'bedroom' },
        { text: "You skip the shower, skip breakfast, and throw on yesterday's shirt. Somehow, you're in a cab and nearly there.", animation: 'car' },
        { text: "It's 9:26. The building is just past this next traffic light. You've got four minutes.", animation: 'car_watch' },
      ],
      next: 'the_lights',
    },

    // -------------------------------------------------------------------------
    // the clock is running
    // -------------------------------------------------------------------------
    the_lights: {
      steps: [
        { text: "The light turns green, but the car in front of your cab doesn't move. The driver is looking down at their phone, laughing at something.", animation: 'lights' },
        {
          id: 'the_lights',
          prompt: 'What do you do? Pick one, and tell me what goes through your head.',
          animation: 'lights',
          facets: ['Anger'],
          choices: [
            { label: 'Tell the driver to lean on the horn.', next: 'lights_horn' },
            { label: 'Mutter at them, and drum on the seat.', next: 'lights_mutter' },
            { label: "Give them a second. They'll look up.", next: 'lights_wait' },
            { label: "Shrug. A few seconds won't make any difference now.", next: 'lights_shrug' },
            { label: 'Something else.', next: 'the_printer', other: true },
          ],
        },
      ],
    },

    lights_horn: {
      steps: [{ text: 'They jump, wave a hand without looking back, and pull away at about four miles an hour.', animation: 'lights_horn' }],
      next: 'the_printer',
    },

    lights_mutter: {
      steps: [{ text: "They look up just as the light turns yellow, and speed through. You don't make it.", animation: 'lights_red' }],
      next: 'the_printer',
    },

    lights_wait: {
      steps: [{ text: "They look up just as the light turns yellow, and speed through. You don't make it.", animation: 'lights_red' }],
      next: 'the_printer',
    },

    lights_shrug: {
      steps: [{ text: 'Somebody behind you honks instead. The car in front finally pulls away, and so does your cab.', animation: 'lights_horn' }],
      next: 'the_printer',
    },

    the_printer: {
      steps: [
        { text: "You throw the fare at the driver and run inside. You still need copies of your résumé, and there's a print shop in the lobby: three copies, on the good paper.", animation: 'printer' },
        { text: 'The printer whirs, makes a noise like a sigh, and stops. The screen says PAPER JAM IN TRAY 2. There is no tray 2.', animation: 'printer_jam' },
        {
          id: 'the_printer',
          prompt: 'What do you do? Pick one, and tell me how you feel right now.',
          animation: 'printer_jam',
          facets: ['Anger'],
          choices: [
            { label: 'Thump it. Sometimes that works.', next: 'printer_thump' },
            { label: 'Open every door, and find the jam.', next: 'printer_fix' },
            { label: "Forget the copies. I'll go in without them.", next: 'printer_leave' },
            { label: 'Say a lot of words to it that I wouldn\'t say in front of my mom.', next: 'printer_swear' },
            { label: 'Something else.', next: 'the_gary', other: true },
          ],
        },
      ],
    },

    printer_thump: {
      steps: [{ text: 'It goes quiet, then prints a single page. It\'s completely blank.', animation: 'printer_blank' }],
      next: 'the_gary',
    },

    printer_fix: {
      steps: [{ text: "You find it behind the third door you open: one crumpled page. The printer starts up again, very slowly.", animation: 'printer_going' }],
      next: 'the_gary',
    },

    printer_leave: {
      steps: [{ text: "You leave it blinking and head for the elevator. Of course, the printer starts working the second you walk away.", animation: 'printer_going' }],
      next: 'the_gary',
    },

    printer_swear: {
      steps: [{ text: 'The man at the next printer pretends not to have heard. The printer goes quiet, then prints a single page. It\'s completely blank.', animation: 'printer_blank' }],
      next: 'the_gary',
    },

    the_gary: {
      steps: [
        { speaker: GARY, text: "Morning! Here for an interview? Quick one before you go up: you need to fill in a visitor form.", animation: 'gary' },
        { text: 'You tell him you\'re late for your interview. He nods, and keeps talking anyway.', animation: 'gary' },
        { speaker: GARY, text: "This won't take a sec. It's just that the new forms have two boxes for the date, and nobody knows which one to fill in. Also, sorry, but is that yesterday's shirt?", animation: 'gary_more' },
        {
          id: 'the_gary',
          prompt: 'What do you do? Pick one, and tell me exactly what you say.',
          animation: 'gary_more',
          facets: ['Anger', 'Cooperation'],
          choices: [
            { label: 'Answer his question, quickly, to get it over with.', next: 'gary_answer' },
            { label: "Tell him I'll come and find him after the interview.", next: 'gary_later' },
            { label: 'Walk off mid-sentence.', next: 'gary_walk' },
            { label: 'Snap at him. Gary, not now!', next: 'gary_snap' },
            { label: 'Something else.', next: 'the_meeting', other: true },
          ],
        },
      ],
    },

    gary_answer: {
      steps: [{ text: '"The top one," you say, with no idea if that\'s right. "Perfect," says Gary. "And the other thing..."', animation: 'gary_more' }],
      next: 'the_meeting',
    },

    gary_later: {
      steps: [{ text: '"No worries," says Gary. "I\'ll walk with you." And he does, talking the whole way to the interview room.', animation: 'gary_walk' }],
      next: 'the_meeting',
    },

    gary_walk: {
      steps: [{ text: 'Behind you, you hear him finish his sentence to nobody, and then start talking to the man from the print shop instead.', animation: 'gary_walk' }],
      next: 'the_meeting',
    },

    gary_snap: {
      steps: [{ text: "Gary's face falls. \"Right. Sorry. Of course,\" he says, and sits back down at his desk, holding his mug very carefully.", animation: 'gary_sad' }],
      next: 'the_meeting',
    },

    // -------------------------------------------------------------------------
    // the interview room, on time or not
    // -------------------------------------------------------------------------
    the_meeting: {
      steps: [{ text: 'You burst into the interview room at exactly 9:30. It\'s empty. Then the phone on the wall rings. It\'s Gary, from the front desk: the interviewer is running forty minutes late.', animation: 'meeting' }],
      next: 'the_call',
    },

    meeting_late: {
      steps: [{ text: "It's 9:30, and you're not there yet. By the time you burst into the interview room, it's 9:34. It's empty. Then the phone on the wall rings. It's Gary, from the front desk: the interviewer is running forty minutes late.", animation: 'meeting' }],
      next: 'the_call',
    },

    // -------------------------------------------------------------------------
    // the bank
    // -------------------------------------------------------------------------
    the_call: {
      steps: [
        { text: "The interview goes fine, in the end. But then at lunch, your card gets declined. Twice. The bank has frozen it for suspicious activity, and the suspicious activity was you, buying a sandwich.", animation: 'call' },
        { text: '"Your call is important to us." You are number 14 in line. The hold music is the same eight notes, over and over again.', animation: 'call_hold' },
        { text: "Forty minutes later, someone finally answers, transfers you to another department, and the line goes dead.", animation: 'call_dropped' },
        { text: 'You call back. It\'s another thirty-five minutes of waiting. Number 9. Number 3. The same eight notes.', animation: 'call_queue' },
        { speaker: AGENT, text: "Hi there, you've reached Leanne. Before I can help you, I just need to verify your identity again. Can I get your full name, date of birth, and street address?", animation: 'call_leanne' },
        { speaker: AGENT, text: "Great, thank you. Now, I can see your card has been frozen, but I'm afraid that's handled by a different team. They close at four.", animation: 'call_four' },
        { text: 'It\'s 4:02.', animation: 'call_four' },
        {
          id: 'the_call',
          prompt: 'What do you say to Leanne? Pick one, and tell me the actual words, as you\'d say them.',
          animation: 'call_four',
          facets: ['Anger', 'Cooperation'],
          choices: [
            { label: "Stay calm. It's not her fault.", next: 'call_calm' },
            { label: 'Tell her, firmly, that I need this fixed today.', next: 'call_firm' },
            { label: 'Lose it. Two hours, and you\'re telling me they\'ve gone home?', next: 'call_shout' },
            { label: 'Tell her exactly what I think of this bank, and hang up.', next: 'call_hang_up' },
            { label: 'Something else.', next: 'the_waitress', other: true },
          ],
        },
      ],
    },

    call_calm: {
      steps: [{ text: '"I\'m so sorry," says Leanne, and she sounds like she means it. She puts a note on your account, and promises they\'ll call you first thing in the morning.', animation: 'call_note' }],
      next: 'the_waitress',
    },

    call_firm: {
      steps: [{ text: 'Leanne goes quiet, then says she\'ll see what she can do. Ten minutes later, your card works again. She doesn\'t say how.', animation: 'call_note' }],
      next: 'the_waitress',
    },

    call_shout: {
      steps: [{ text: 'There\'s a pause. "I understand you\'re frustrated," says Leanne, in the voice of someone who has already heard it all today. She puts a note on your account.', animation: 'call_note' }],
      next: 'the_waitress',
    },

    call_hang_up: {
      steps: [{ text: 'You hang up before she can answer. Your card is still frozen, and those same eight notes are stuck in your head.', animation: 'call_ended' }],
      next: 'the_waitress',
    },

    // -------------------------------------------------------------------------
    // dinner
    // -------------------------------------------------------------------------
    the_waitress: {
      steps: [
        { text: "At seven o'clock, you can't face cooking, so you go to the little Italian place around the corner. It's packed, and there seem to be only two people working.", animation: 'cafe' },
        { text: 'You order the mushroom risotto. Forty minutes later, the waitress brings you a plate of seafood pasta. You hate seafood.', animation: 'cafe_plate' },
        { text: "Her name tag says JO, and her eyes are red. A table by the window just yelled at her about their check, and the chef is shouting her name from the kitchen.", animation: 'cafe_jo' },
        { speaker: JO, text: "There you go. Sorry it took so long. Can I get you anything else?", animation: 'cafe_jo' },
        {
          id: 'the_waitress',
          prompt: 'What do you do? Pick one. And what do you make of Jo?',
          animation: 'cafe_jo',
          facets: ['Altruism', 'Anger'],
          choices: [
            { label: "Eat around it. She's got enough on tonight.", next: 'jo_eat' },
            { label: "Tell her, kindly, and say there's no rush.", next: 'jo_kind' },
            { label: "Send it back. I'm paying for what I ordered.", next: 'jo_back' },
            { label: 'Ask for the manager. Someone should know about this.', next: 'jo_manager' },
            { label: 'Something else.', next: 'the_end', other: true },
          ],
        },
      ],
    },

    jo_eat: {
      steps: [{ text: "You pick at the pasta around the shrimp, and tell her it was great. She looks too tired to notice that the plate is still full.", animation: 'jo_eat' }],
      next: 'the_end',
    },

    jo_kind: {
      steps: [{ text: 'Jo closes her eyes for a second. "Thank you," she says. The risotto comes out ten minutes later, with free garlic bread.', animation: 'jo_risotto' }],
      next: 'the_end',
    },

    jo_back: {
      steps: [{ text: 'Jo apologizes twice and takes it away. The risotto comes out twenty minutes later. You both say thank you without looking at each other.', animation: 'jo_risotto' }],
      next: 'the_end',
    },

    jo_manager: {
      steps: [{ text: 'It turns out the manager is also the chef. He comes out, wiping his hands, and chews Jo out right in front of you. You get the risotto, and your meal for free.', animation: 'jo_manager' }],
      next: 'the_end',
    },

    // -------------------------------------------------------------------------
    // home
    // -------------------------------------------------------------------------
    the_end: {
      steps: [
        { text: "You finally get home, and it's started raining. You lie down on the couch and stare at the ceiling for a while.", animation: 'home' },
        {
          id: 'the_day',
          prompt: 'Looking back, out of ten, how wound up did you get today? Which part got to you most, and is there anything you\'d take back?',
          animation: 'home',
          facets: ['Anger', 'Cooperation', 'Altruism'],
        },
      ],
      next: 'real_life',
    },

    // -------------------------------------------------------------------------
    // the real you
    // -------------------------------------------------------------------------
    real_life: {
      steps: [
        { text: 'Now I have a couple of questions about you. Your actual days, that is, not this one.', animation: 'homework' },
        {
          id: 'last_snap',
          prompt: 'Think of the last time you lost your temper: raised your voice, slammed something, or said something you didn\'t mean. When was it, who was it at, and how long did it take you to calm down?',
          animation: 'homework',
          facets: ['Anger', 'Cooperation'],
        },
        {
          id: 'last_niggle',
          prompt: 'In the last seven days, how many times did something small get under your skin: a line, a noise, someone\'s driving? And the last time someone serving you got it wrong, what did you do?',
          animation: 'homework',
          facets: ['Anger', 'Altruism'],
        },
        { text: 'Tomorrow is Wednesday. Maybe set two alarms.', animation: 'goodbye' },
      ],
    },
  },
};
