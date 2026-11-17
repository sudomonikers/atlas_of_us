import type { ReactNode } from 'react';
import type { Pt } from '../shared_components/story/ink';

// What the body animations are made of: the figure's sizes and poses, how it moves between them, and what an animation
// is.

export const GY = 350; //the floor
export const SKIN = '#f3d6c3';

//how long each part of the body is, in the drawing's units
export const L = { torso: 92, shoulder: 86, neck: 10, head: 21, upper: 50, fore: 46, thigh: 58, shin: 58 };

//a limb by the angle of each of its two parts, in degrees from straight down, turning toward the right, or by where its
//end goes, with which way the middle joint bends: 1 turns it clockwise from the line between its ends, -1 the other way
export type Limb = [number, number] | { to: Pt; bend: 1 | -1 };

//a pose: where the hips are, the angle of the body (180 is upright), the head's tilt from it, and the arms and legs,
//near then far from a side, or right then left from the front
export interface Pose {
  x: number;
  y: number;
  t: number;
  h?: number;
  an: Limb;
  af: Limb;
  ln: Limb;
  lf: Limb;
}

//where each joint of a posed figure is, for what's drawn around it
export interface Joints {
  hip: Pt;
  neck: Pt;
  shoulder: Pt;
  head: Pt;
  hands: [Pt, Pt];
  feet: [Pt, Pt];
}

export interface Figure {
  view: 'side' | 'front';
  frames: [number, Pose][]; //each pose and the second it's reached, back to the first at the end of the loop
  eyes?: 'closed';
}

export interface Motion {
  label: string; //what it shows, for people who can't see it
  period: number; //seconds in one loop
  still: number; //the moment shown when motion is reduced
  figure?: Figure;
  draw?: (time: number, j: Joints | undefined) => ReactNode; //what's drawn over the figure
  under?: (time: number, j: Joints | undefined) => ReactNode; //what's drawn behind it
}

export const rad = (a: number) => (a * Math.PI) / 180;
export const dir = (a: number): Pt => [Math.sin(rad(a)), Math.cos(rad(a))];
export const add = (p: Pt, v: Pt, k = 1): Pt => [p[0] + v[0] * k, p[1] + v[1] * k];
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const ease = (p: number) => (1 - Math.cos(Math.PI * p)) / 2;

export const STAND: Pose = { x: 300, y: 234, t: 180, an: [10, 4], af: [-10, -4], ln: [3, 0], lf: [-3, 0] }; //from the front
export const SIDE: Pose = { x: 300, y: 234, t: 180, an: [6, 14], af: [-6, 4], ln: [3, -2], lf: [-3, 2] }; //from the side, facing right
export const SEATED: Pose = { x: 230, y: 290, t: 176, an: [10, 60], af: [6, 60], ln: [90, 0], lf: [88, 2] };

//poses at even steps through a loop
export const steps = (gap: number, poses: Pose[]): [number, Pose][] => poses.map((p, i) => [i * gap, p]);
