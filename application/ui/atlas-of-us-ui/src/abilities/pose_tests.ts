import { bendTwist } from './bend_twist_touch/watcher';
import { coinTransfer } from './coin_transfer/watcher';
import { coinTurning } from './coin_turning/watcher';
import { crossing, type Crossing } from './crossing';
import { oneLeg } from './one_leg_stand/watcher';
import { plank } from './plank/watcher';
import { plateTapping } from './plate_tapping/watcher';
import type { Point } from './pose';
import { pushUps } from './push_ups/watcher';
import { steadyHand } from './steady_hand/watcher';
import { jump } from './vertical_jump/watcher';

// The home tests a camera can watch, so someone doing them alone doesn't have to time or count themselves. Each one is
// fed the body in every frame and says where the test is up to: what to tell the person, the time or count so far, and
// when to beep or speak. They start on what the body does, since the person is too far from the screen to touch it. Distances are measured against the length of the person's torso, so it doesn't matter how far
// they stand from the camera.

export type CameraTest = 'oneLeg' | 'plank' | 'pushUps' | 'bendTwist' | 'jump' | 'plateTapping' | 'coinTransfer' | 'coinTurning' | 'steadyHand';

//what the person hears: a beep as it starts, at each rep and as it stops, and words said aloud
export type Cue = { beep?: 'start' | 'rep' | 'stop'; say?: string };

export interface Watched {
  phase: 'setup' | 'ready' | 'going' | 'done';
  message: string; //what to do now, or why it stopped
  value: number; //seconds or how many so far
  corner?: string; //how much is left, such as the seconds on the clock or the taps to go
  countIn?: number; //the number being counted down before it starts
  marks?: number[]; //lines to draw down the picture, across it from 0 to 1, for where the person has to reach
  cue?: Cue;
}

//what the camera sees in a frame: the body, for a test that watches the whole body, or the hands, for one that watches
//them close up, each its points
export interface Seen {
  body?: Point[] | null;
  hands?: Point[][];
  width?: number; //the frame's, in pixels
}

export interface Watcher {
  feed: (seen: Seen, at: number) => Watched; //at is in ms
}

//what each test records: seconds, how many, centimeters or millimeters
export type Recorded = 's' | 'count' | 'cm' | 'mm';

//which model a test needs, the body's or the hands'
export type Looks = 'body' | 'hands';

export const WATCHED: Record<string, { test: CameraTest; records: Recorded; looks: Looks; setup: string }> = {
  'One-Leg Stand, Eyes Closed': {
    test: 'oneLeg',
    records: 's',
    looks: 'body',
    setup: "Prop your phone or laptop up about 2 meters away, facing you, so it can see you from head to toe. I'll start the clock when you lift your foot with your arms crossed, stop it when you falter, and tell you your time out loud.",
  },
  'Plank Hold': {
    test: 'plank',
    records: 's',
    looks: 'body',
    setup: "Put your phone or laptop on the floor about 2 meters to your side, so it can see you from head to toe once you're in your plank. I'll start the clock when your body is straight and stop it when your hips sag or a knee drops.",
  },
  'Push-Ups': {
    test: 'pushUps',
    records: 'count',
    looks: 'body',
    setup: "Put your phone or laptop on the floor about 2 meters to your side, so it can see you from head to toe once you're down. I'll count each push-up out loud and stop when you do.",
  },
  'Vertical Jump': {
    test: 'jump',
    records: 'cm',
    looks: 'body',
    setup: "Prop your phone or laptop up about 2 meters away, at about waist height, so it can see you from head to toe with a little floor showing below your feet. Stand still, then jump straight up as high as you can – swinging your arms – and land on your toes with straight legs. I'll work out each jump's height from how long you're in the air, and you get three tries.",
  },
  'Plate Tapping': {
    test: 'plateTapping',
    records: 's',
    looks: 'hands',
    setup: "Stand your phone or laptop on the far side of the table, facing you, so your resting hand is between the two lines and both coasters are outside them. Put your hands in place and keep still, and I'll count you in, count every tap, and stop the clock at the 50th.",
  },
  'Coin Transfer': {
    test: 'coinTransfer',
    records: 's',
    looks: 'hands',
    setup: "Stand your phone or laptop on the far side of the table, facing you, so the pile of coins is on one side of the two lines and the mug on the other. Rest your stronger hand on the coins and keep still, and I'll count you in, count every coin into the mug, and stop the clock at the 20th.",
  },
  'Coin Turning': {
    test: 'coinTurning',
    records: 's',
    looks: 'hands',
    setup: "Stand your phone or laptop on the far side of the table, facing you, so the row of coins runs between the two lines. Rest your stronger hand just outside the line at one end and keep still, and I'll count you in. Once you've turned the last coin, sweep your hand out past the other line and I'll stop the clock.",
  },
  'Steady Hand': {
    test: 'steadyHand',
    records: 'mm',
    looks: 'hands',
    setup: "Sit or stand facing your camera, about a meter away. Hold your stronger arm straight out toward it at shoulder height – hand up and fingers together – with your palm facing the camera. Once I can see your hand I'll count you in, then you hold it as still as you can for 20 seconds.",
  },
  'Bend, Twist and Touch': {
    test: 'bendTwist',
    records: 'count',
    looks: 'body',
    setup: "Prop your phone or laptop up about 2 meters in front of you, so it can see you from head to toe with the wall behind you. Once you're in view I'll count you in, then count every touch for 20 seconds.",
  },
};

const CROSSINGS: Record<'plateTapping' | 'coinTransfer' | 'coinTurning', Crossing> = { plateTapping, coinTransfer, coinTurning };

//a fresh watcher for a test, with its time limit in seconds
export function watcher(test: CameraTest, limit: number, timer: number | null): Watcher {
  if (test === 'oneLeg') return oneLeg(limit);
  if (test === 'plank') return plank(limit);
  if (test === 'pushUps') return pushUps();
  if (test === 'jump') return jump();
  if (test === 'plateTapping' || test === 'coinTransfer' || test === 'coinTurning') return crossing(CROSSINGS[test], limit);
  if (test === 'steadyHand') return steadyHand(timer ?? 20);
  return bendTwist(timer ?? 20);
}
