import type { Area } from './api';

//the reading behind the Explore view: what the abilities are and where they come from, what they can't tell you and how
//the Atlas uses them
export const ABILITIES = {
  overview:
    "The abilities here are the ones the U.S. Department of Labor's O*NET uses to describe what every job takes. An ability is a lasting capacity you bring to a task, like how fast you react, how far you can see or how well you hold a picture in your head, rather than something you've learned to do, which is a skill. Each one is a scale, and most people sit near the middle of most of them. They fall into four areas: your body's strength, stamina and flexibility, your coordination and speed, your senses, and your mind. Your place on each comes from tests you can do at home or in the app, compared with people of your sex and age. Some move a lot with practice and others barely move, and each one says which.",
  history:
    "The list grew out of decades of lab work. From the 1950s, Edwin Fleishman and his colleagues had thousands of people, many of them in the U.S. Air Force, do hundreds of different tasks, and used factor analysis to find which tasks people tended to be good at together. The same clusters kept turning up, and each became an ability: separate kinds of strength, speed, steadiness, perception and reasoning. Fleishman's taxonomy gave each ability a scale anchored with everyday tasks, from ones that take a little of it to ones that take a lot. In 1998 O*NET replaced the old Dictionary of Occupational Titles and built its 52 abilities on that work, and its job analysts rate every occupation on how much of each it takes. The Atlas uses 46 of them, leaving out the verbal and number abilities, which it treats as skills.",
  limits:
    "A test samples an ability on one day, with one device, at home, so a reading is a good guess rather than a lab result. Screens and headphones differ, which is why some tests have you size the screen with a bank card or set your volume first, and a tired day or a noisy room shows up in the score. The abilities overlap: someone quick at one reaction test is usually quick at another, so they aren't fully separate. Retaking a test usually helps a little on its own, just from knowing what's coming. Depth perception, glare sensitivity, night vision and speech clarity have no test a home can give well, so they aren't asked about. And an ability isn't a skill: it says what comes easily, not what you've learned to do with it.",
  ourTake:
    "Your place on each ability is worked out from the latest reading of every test that shows it, compared with people of your sex and age where the norms allow, and weighted by how much each test says about it. Some norms come from large surveys like NHANES and from published studies. The tests made for the Atlas are compared with the Atlas's own users, by age group, once 100 people of your age have taken them, and until then a reading waits. Each place comes with how sure we are of it, and anything under halfway is shown as an early read. Impairments you've noted are shown beside the abilities they touch, without changing your place. Skills then compare your abilities with what each level of a skill takes, on the same scale O*NET rates jobs on.",
};

//an overview of each of the four areas the abilities fall into
export const AREA_OVERVIEW: Record<Area, string> = {
  Physical:
    "What your body can do with force and range: how much you can lift, push or pull, how long you can keep going, how far and how fast you can bend and stretch, and how well you keep your balance and move your whole body together. These change more with training than any other area, and they change with age, so they're compared with people your age.",
  Psychomotor:
    "How precisely and how quickly you move: steady hands, nimble fingers, reacting fast, picking the right response, tapping quickly, tracking something that moves and timing a move to meet it. These come from your nerves and muscles working together, and they're what most of the tests in the app are about. Practice sharpens many of them, and reaction speed slows a little with age.",
  Sensory:
    'How well you see and hear: sharp vision near and far, telling colors apart, catching things at the edge of your sight, hearing quiet sounds, following one voice over others, hearing speech in noise and telling where a sound is. Most of these are set by your eyes and ears and change little with practice, though glasses, hearing aids and good habits make the most of them. The tests need a calibrated screen or headphones, and each one says how.',
  Cognitive:
    "How you take in, hold and work with ideas: spotting patterns, reasoning from rules, picturing shapes and how they turn, keeping things in mind, switching between tasks, noticing details and coming up with ideas. These are the abilities most tied to learning new things quickly. They're fairly stable through adult life, though speed-based ones slow gently with age, and practice on a test mostly makes you better at that test.",
};
