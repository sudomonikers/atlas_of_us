import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from 'react'
import { Canvas, useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

type PersonalityTrait = {
  name: string
  description: string | null
  id: string
}

type GroupProps = ThreeElements['group']

const PALETTE = {
  green: '#88D18A',
  pink: '#FD96A9',
  blue: '#30C5FF',
  purple: '#613F75',
  teal: '#023436',
  white: '#FDFFFC',
  ink: '#171A21',
}

// thickness of the comic-book ink outline, in world units
const LINE = 0.045

// ---------- comic-style building blocks ----------

// three hard bands of light for a flat, cel-shaded look
const toonGradient = (() => {
  const tex = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat)
  tex.minFilter = THREE.NearestFilter
  tex.magFilter = THREE.NearestFilter
  tex.needsUpdate = true
  return tex
})()

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

type Shape =
  | { kind: 'box'; size: [number, number, number] }
  | { kind: 'sphere'; radius: number }
  | { kind: 'capsule'; radius: number; length: number }
  | { kind: 'cylinder'; top: number; bottom: number; height: number }

function ShapeGeometry({ shape }: { shape: Shape }) {
  switch (shape.kind) {
    case 'box':
      return <boxGeometry args={shape.size} />
    case 'sphere':
      return <sphereGeometry args={[shape.radius, 32, 24]} />
    case 'capsule':
      return <capsuleGeometry args={[shape.radius, shape.length, 8, 20]} />
    case 'cylinder':
      return <cylinderGeometry args={[shape.top, shape.bottom, shape.height, 28]} />
  }
}

// scale that grows a shape by an absolute amount on every side, so outlines
// stay an even thickness regardless of the shape's proportions
function growScale(shape: Shape, t: number): [number, number, number] {
  switch (shape.kind) {
    case 'box': {
      const [x, y, z] = shape.size
      return [(x + 2 * t) / x, (y + 2 * t) / y, (z + 2 * t) / z]
    }
    case 'sphere': {
      const s = (shape.radius + t) / shape.radius
      return [s, s, s]
    }
    case 'capsule': {
      const r = (shape.radius + t) / shape.radius
      const total = shape.length + 2 * shape.radius
      return [r, (total + 2 * t) / total, r]
    }
    case 'cylinder': {
      const max = Math.max(shape.top, shape.bottom)
      const r = (max + t) / max
      return [r, (shape.height + 2 * t) / shape.height, r]
    }
  }
}

// A cel-shaded shape with a thick ink outline (inverted hull) and a slightly
// offset halo of its own color so the paint looks like it bleeds past the line.
function Ink({
  shape,
  color,
  line = LINE,
  bleed = true,
  ...group
}: { shape: Shape; color: string; line?: number; bleed?: boolean } & GroupProps) {
  return (
    <group {...group}>
      <mesh>
        <ShapeGeometry shape={shape} />
        <meshToonMaterial color={color} gradientMap={toonGradient} />
      </mesh>
      {line > 0 && (
        <mesh scale={growScale(shape, line)}>
          <ShapeGeometry shape={shape} />
          <meshBasicMaterial color={PALETTE.ink} side={THREE.BackSide} />
        </mesh>
      )}
      {bleed && (
        <mesh scale={growScale(shape, line * 1.9)} position={[line * 0.6, -line * 0.5, 0]}>
          <ShapeGeometry shape={shape} />
          <meshBasicMaterial color={color} side={THREE.BackSide} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

// ---------- classroom ----------

function Room() {
  const wallTex = useMemo(() => {
    const tex = makeCanvasTexture(128, 128, (ctx) => {
      ctx.fillStyle = PALETTE.pink
      ctx.fillRect(0, 0, 128, 128)
      ctx.fillStyle = 'rgba(253,255,252,0.35)'
      for (const [x, y] of [[32, 32], [96, 96]]) {
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fill()
      }
    })
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(40, 12)
    return tex
  }, [])

  const floorTex = useMemo(() => {
    const tex = makeCanvasTexture(256, 256, (ctx) => {
      // soft lavender tiles, a pale tint of velvet purple so the floor sits back
      ctx.fillStyle = '#E4D8EA'
      ctx.fillRect(0, 0, 256, 256)
      ctx.fillStyle = '#F1EAF4'
      ctx.fillRect(0, 0, 128, 128)
      ctx.fillRect(128, 128, 128, 128)
      ctx.strokeStyle = 'rgba(97,63,117,0.25)'
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, 256, 256)
      ctx.beginPath()
      ctx.moveTo(128, 0)
      ctx.lineTo(128, 256)
      ctx.moveTo(0, 128)
      ctx.lineTo(256, 128)
      ctx.stroke()
    })
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(27, 20)
    return tex
  }, [])

  useEffect(() => () => {
    wallTex.dispose()
    floorTex.dispose()
  }, [wallTex, floorTex])

  return (
    <group>
      {/* wall */}
      <mesh position={[0, 10, -3.2]}>
        <planeGeometry args={[80, 20]} />
        <meshBasicMaterial map={wallTex} />
      </mesh>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 27]}>
        <planeGeometry args={[80, 60]} />
        <meshBasicMaterial map={floorTex} />
      </mesh>
      {/* chair rail and baseboard */}
      <Ink shape={{ kind: 'box', size: [80, 0.16, 0.12] }} color={PALETTE.white} position={[0, 1.1, -3.12]} bleed={false} />
      <Ink shape={{ kind: 'box', size: [80, 0.4, 0.16] }} color={PALETTE.purple} position={[0, 0.2, -3.1]} bleed={false} />
    </group>
  )
}

function Clock() {
  const minute = useRef<THREE.Group>(null)
  const hour = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (minute.current) minute.current.rotation.z = -t * 0.5
    if (hour.current) hour.current.rotation.z = -t * 0.04
  })

  return (
    <group position={[0, 6.35, -3.05]}>
      <Ink shape={{ kind: 'cylinder', top: 0.62, bottom: 0.62, height: 0.16 }} color={PALETTE.white} rotation={[Math.PI / 2, 0, 0]} />
      <Ink shape={{ kind: 'cylinder', top: 0.72, bottom: 0.72, height: 0.1 }} color={PALETTE.green} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.05]} />
      <group ref={hour} position={[0, 0, 0.1]}>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[0.07, 0.34, 0.02]} />
          <meshBasicMaterial color={PALETTE.ink} />
        </mesh>
      </group>
      <group ref={minute} position={[0, 0, 0.11]}>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.045, 0.48, 0.02]} />
          <meshBasicMaterial color={PALETTE.pink} />
        </mesh>
      </group>
    </group>
  )
}

function chalkText(
  ctx: CanvasRenderingContext2D,
  rand: () => number,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  maxWidth?: number,
) {
  ctx.font = `bold ${size}px "Chalkboard SE", "Comic Sans MS", cursive`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color
  // several jittered, translucent passes give a dusty chalk edge
  for (let i = 0; i < 6; i++) {
    ctx.globalAlpha = 0.28
    ctx.fillText(text, x + (rand() - 0.5) * size * 0.04, y + (rand() - 0.5) * size * 0.04, maxWidth)
  }
  ctx.globalAlpha = 1
}

const OCEAN = ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'] as const

function Blackboard({ traits }: { traits: PersonalityTrait[] }) {
  const boardTex = useMemo(
    () =>
      makeCanvasTexture(2048, 910, (ctx) => {
        const w = 2048
        const h = 910
        const rand = seeded(7)
        ctx.fillStyle = PALETTE.teal
        ctx.fillRect(0, 0, w, h)

        // old eraser smudges
        for (let i = 0; i < 45; i++) {
          ctx.fillStyle = `rgba(253,255,252,${0.015 + rand() * 0.035})`
          ctx.beginPath()
          ctx.ellipse(rand() * w, rand() * h, 60 + rand() * 220, 20 + rand() * 60, rand() * Math.PI, 0, Math.PI * 2)
          ctx.fill()
        }

        chalkText(ctx, rand, 'The Big Five', w / 2, h * 0.17, 140, PALETTE.white)

        // wavy underline
        ctx.strokeStyle = PALETTE.pink
        ctx.lineWidth = 10
        ctx.lineCap = 'round'
        ctx.globalAlpha = 0.75
        ctx.beginPath()
        for (let x = w * 0.3; x <= w * 0.7; x += 8) {
          const y = h * 0.29 + Math.sin(x / 30) * 8
          if (x === w * 0.3) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
        ctx.globalAlpha = 1

        const colors = [PALETTE.pink, PALETTE.blue, PALETTE.green, PALETTE.white, PALETTE.pink]
        OCEAN.forEach((domain, i) => {
          const x = (w * (i + 0.5)) / OCEAN.length
          chalkText(ctx, rand, domain[0], x, h * 0.55, 250, colors[i])
          // the api also returns facets, so only use an exact match for the domain itself
          const name = traits.find((t) => t.name.toLowerCase() === domain.toLowerCase())?.name ?? domain
          chalkText(ctx, rand, name, x, h * 0.82, 52, PALETTE.white, w / OCEAN.length - 40)
        })

        // doodled star in the corner
        ctx.strokeStyle = PALETTE.white
        ctx.lineWidth = 6
        ctx.globalAlpha = 0.6
        ctx.beginPath()
        for (let i = 0; i <= 10; i++) {
          const r = i % 2 === 0 ? 50 : 22
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2
          const px = w - 130 + Math.cos(a) * r
          const py = 120 + Math.sin(a) * r
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
        ctx.globalAlpha = 1
      }),
    [traits],
  )

  useEffect(() => () => boardTex.dispose(), [boardTex])

  return (
    <group position={[0, 3.25, -3]}>
      {/* frame */}
      <Ink shape={{ kind: 'box', size: [9.7, 4.7, 0.2] }} color={PALETTE.purple} />
      {/* writing surface */}
      <mesh position={[0, 0, 0.11]}>
        <planeGeometry args={[9, 4]} />
        <meshBasicMaterial map={boardTex} />
      </mesh>
      {/* chalk tray */}
      <Ink shape={{ kind: 'box', size: [8.6, 0.12, 0.38] }} color={PALETTE.purple} position={[0, -2.38, 0.25]} />
      <Ink shape={{ kind: 'cylinder', top: 0.045, bottom: 0.045, height: 0.36 }} color={PALETTE.white} line={0.02} bleed={false} rotation={[0, 0, Math.PI / 2]} position={[-2.6, -2.27, 0.3]} />
      <Ink shape={{ kind: 'cylinder', top: 0.045, bottom: 0.045, height: 0.28 }} color={PALETTE.pink} line={0.02} bleed={false} rotation={[0, 0.4, Math.PI / 2]} position={[-2.05, -2.27, 0.32]} />
      <Ink shape={{ kind: 'cylinder', top: 0.045, bottom: 0.045, height: 0.32 }} color={PALETTE.blue} line={0.02} bleed={false} rotation={[0, -0.3, Math.PI / 2]} position={[2.2, -2.27, 0.3]} />
      {/* eraser */}
      <Ink shape={{ kind: 'box', size: [0.6, 0.18, 0.26] }} color={PALETTE.green} line={0.03} position={[3, -2.22, 0.28]} />
    </group>
  )
}

function Desk({ chair, children, ...group }: { chair: string; children?: ReactNode } & GroupProps) {
  const legs: [number, number][] = [[-0.95, -0.5], [0.95, -0.5], [-0.95, 0.5], [0.95, 0.5]]
  return (
    <group {...group}>
      <Ink shape={{ kind: 'box', size: [2.3, 0.14, 1.3] }} color={PALETTE.green} position={[0, 1.35, 0]} />
      {legs.map(([x, z]) => (
        <Ink key={`${x}${z}`} shape={{ kind: 'cylinder', top: 0.06, bottom: 0.06, height: 1.3 }} color={PALETTE.purple} line={0.03} bleed={false} position={[x, 0.65, z]} />
      ))}
      {/* chair, back toward the camera as if we're sitting behind it */}
      <group position={[0, 0, 1.25]}>
        <Ink shape={{ kind: 'box', size: [1.2, 0.12, 0.9] }} color={chair} position={[0, 0.82, 0]} />
        <Ink shape={{ kind: 'box', size: [1.2, 0.55, 0.1] }} color={chair} position={[0, 1.45, 0.42]} />
        {legs.map(([x, z]) => (
          <Ink key={`${x}${z}`} shape={{ kind: 'cylinder', top: 0.05, bottom: 0.05, height: 1.2 }} color={PALETTE.purple} line={0.025} bleed={false} position={[x * 0.5, z > 0 ? 0.88 : 0.41, z * 0.8]} scale={[1, z > 0 ? 1.45 : 0.68, 1]} />
        ))}
      </group>
      <group position={[0, 1.42, 0]}>{children}</group>
    </group>
  )
}

function Apple(props: GroupProps) {
  return (
    <group {...props}>
      <Ink shape={{ kind: 'sphere', radius: 0.2 }} color={PALETTE.pink} line={0.03} position={[0, 0.2, 0]} scale={[1, 0.9, 1]} />
      <Ink shape={{ kind: 'cylinder', top: 0.015, bottom: 0.02, height: 0.12 }} color={PALETTE.purple} line={0.015} bleed={false} position={[0, 0.42, 0]} rotation={[0, 0, 0.3]} />
      <Ink shape={{ kind: 'sphere', radius: 0.06 }} color={PALETTE.green} line={0.015} position={[0.07, 0.45, 0]} scale={[1.6, 0.6, 1]} rotation={[0, 0, -0.5]} />
    </group>
  )
}

function Pencil(props: GroupProps) {
  return (
    <group {...props} rotation={[0, 0, Math.PI / 2]}>
      <Ink shape={{ kind: 'cylinder', top: 0.04, bottom: 0.04, height: 0.6 }} color={PALETTE.blue} line={0.015} bleed={false} />
      <Ink shape={{ kind: 'cylinder', top: 0, bottom: 0.04, height: 0.1 }} color={PALETTE.white} line={0.015} bleed={false} position={[0, 0.35, 0]} />
      <Ink shape={{ kind: 'cylinder', top: 0.04, bottom: 0.04, height: 0.07 }} color={PALETTE.pink} line={0.015} bleed={false} position={[0, -0.33, 0]} />
    </group>
  )
}

function Books(props: GroupProps) {
  const stack: [string, number, number][] = [[PALETTE.purple, 0, 0], [PALETTE.blue, 0.05, 0.25], [PALETTE.pink, -0.04, -0.15]]
  return (
    <group {...props}>
      {stack.map(([color, dx, rot], i) => (
        <group key={color} position={[dx, 0.08 + i * 0.17, 0]} rotation={[0, rot, 0]}>
          <Ink shape={{ kind: 'box', size: [0.8, 0.14, 0.58] }} color={color} line={0.025} />
          <mesh position={[0.02, 0, 0]}>
            <boxGeometry args={[0.78, 0.1, 0.59]} />
            <meshBasicMaterial color={PALETTE.white} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ---------- characters ----------

type Speaker = 'lulu' | 'andrew'

const SPEAKERS: Record<Speaker, { name: string; color: string; text: string }> = {
  lulu: { name: 'Lulu', color: PALETTE.pink, text: PALETTE.ink },
  andrew: { name: 'Andrew', color: PALETTE.blue, text: PALETTE.ink },
}

type BoardTarget = 'title' | (typeof OCEAN)[number]

// Animations a dialogue line can trigger. Each one names the character who performs it.
type SceneAnimation =
  | { type: 'wave'; who: Speaker }
  | { type: 'point'; who: Speaker; at: BoardTarget }
  | { type: 'hop'; who: Speaker }

// The animations for the line on screen. `step` changes with every line so a
// character knows to restart even when the same animation plays twice in a row.
type Cue = { step: number; animations: SceneAnimation[] }

const CHARACTER_X = 6.3
const CHARACTER_Z = -1.6
const UP = new THREE.Vector3(0, 1, 0)

// world position of something written on the board (matches Blackboard's canvas layout)
function boardPoint(target: BoardTarget) {
  const onBoard = (u: number, v: number) => new THREE.Vector3((u - 0.5) * 9, 3.25 + (0.5 - v) * 4, -2.89)
  if (target === 'title') return onBoard(0.5, 0.17)
  return onBoard((OCEAN.indexOf(target) + 0.5) / OCEAN.length, 0.55)
}

const clamp01 = (p: number) => Math.min(1, Math.max(0, p))

// overshoots then settles: the snappy anime "pop" into a pose
function easeOutBack(p: number) {
  const c = 1.9
  const q = p - 1
  return 1 + (c + 1) * q * q * q + c * q * q
}

// wind up, snap past the target, settle and hold
function pointRaise(t: number, from: number, to: number) {
  const windUp = 0.35
  if (t < 0.14) return from - windUp * (t / 0.14)
  const p = clamp01((t - 0.14) / 0.32)
  return from - windUp + (to - from + windUp) * easeOutBack(p) + (p === 1 ? Math.sin(t * 3) * 0.02 : 0)
}

function waveRaise(t: number, idle: number) {
  if (t > 1.9) return idle
  const p = clamp01(t / 0.25)
  return 2.6 * easeOutBack(p) + Math.sin(t * 13) * 0.3 * p
}

// two excited hops: crouch, stretch on the way up, squash on landing
function hop(t: number) {
  if (t > 1.6) return { lift: 0, squash: 0 }
  const k = t % 0.8
  if (k < 0.12) return { lift: 0, squash: -0.15 * (k / 0.12) }
  if (k < 0.6) {
    const p = (k - 0.12) / 0.48
    return { lift: Math.sin(p * Math.PI) * 0.5, squash: 0.12 * Math.cos(p * Math.PI) }
  }
  const p = Math.min(1, (k - 0.6) / 0.15)
  return { lift: 0, squash: -0.15 * Math.sin(p * Math.PI) }
}

// ---------- paper-puppet rig ----------
//
// Characters are flat, hand-drawn cutouts. Every part is drawn with canvas paths
// on a shared "sheet": 600px wide, x = 300 is the centerline and y = 880 is where
// the feet touch the floor. Each part becomes a textured plane in the scene, and
// the animated ones (arms, head) rotate around a pivot point on that sheet.

const SHEET_W = 600
const FEET_Y = 880
const PX_PER_UNIT = 200
const TEX_RES = 1.6

// [x, y, width, height] in sheet pixels
type Box = [number, number, number, number]
type Draw = (ctx: CanvasRenderingContext2D) => void

type PaintOpts = { line?: number; shade?: string; shadeColor?: string; bleed?: boolean }

// Comic fill: an offset, translucent copy of the color bleeds past the line,
// then the flat fill, a hard cel shadow clipped inside, and the ink outline.
function paint(ctx: CanvasRenderingContext2D, d: string, fill: string, { line = 6, shade, shadeColor, bleed = true }: PaintOpts = {}) {
  const p = new Path2D(d)
  ctx.save()
  if (bleed) {
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.translate(5, 4)
    ctx.fillStyle = fill
    ctx.fill(p)
    ctx.restore()
  }
  ctx.fillStyle = fill
  ctx.fill(p)
  if (shade && shadeColor) {
    ctx.save()
    ctx.clip(p)
    ctx.fillStyle = shadeColor
    ctx.fill(new Path2D(shade))
    ctx.restore()
  }
  if (line > 0) {
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = line
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke(p)
  }
  ctx.restore()
}

function stroke(ctx: CanvasRenderingContext2D, d: string, width = 3, color: string = PALETTE.ink, dash?: number[]) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (dash) ctx.setLineDash(dash)
  ctx.stroke(new Path2D(d))
  ctx.restore()
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, line = 0) {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (line > 0) {
    ctx.strokeStyle = PALETTE.ink
    ctx.lineWidth = line
    ctx.stroke()
  }
  ctx.restore()
}

function clipped(ctx: CanvasRenderingContext2D, d: string, fn: () => void) {
  ctx.save()
  ctx.clip(new Path2D(d))
  fn()
  ctx.restore()
}

// vertical knit ribbing, fanned slightly so it follows the body
function ribs(ctx: CanvasRenderingContext2D, d: string, x0: number, x1: number, y0: number, y1: number, color: string) {
  clipped(ctx, d, () => {
    for (let x = x0; x <= x1; x += 12) {
      stroke(ctx, `M ${x} ${y0} L ${x + (x - SHEET_W / 2) * 0.06} ${y1}`, 2, color)
    }
  })
}

const PivotContext = createContext<[number, number]>([SHEET_W / 2, FEET_Y])

// One cutout piece. Children are positioned relative to this part's pivot, so
// rotating the part (an arm, the head) carries everything attached to it.
function Part({
  ref,
  box,
  pivot,
  layer,
  draw,
  mirror = false,
  children,
}: {
  ref?: Ref<THREE.Group>
  box: Box
  pivot?: [number, number]
  layer: number
  draw: Draw
  // flip the drawing left-to-right around the centerline (for the other arm)
  mirror?: boolean
  children?: ReactNode
}) {
  const parent = useContext(PivotContext)
  const [x, y, w, h] = mirror ? [SHEET_W - box[0] - box[2], box[1], box[2], box[3]] : box
  const px = pivot ? (mirror ? SHEET_W - pivot[0] : pivot[0]) : x + w / 2
  const py = pivot ? pivot[1] : y + h / 2

  const tex = useMemo(
    () =>
      makeCanvasTexture(Math.ceil(w * TEX_RES), Math.ceil(h * TEX_RES), (ctx) => {
        ctx.scale(TEX_RES, TEX_RES)
        ctx.translate(-x, -y)
        if (mirror) {
          ctx.translate(SHEET_W, 0)
          ctx.scale(-1, 1)
        }
        draw(ctx)
      }),
    [x, y, w, h, mirror, draw],
  )
  useEffect(() => () => tex.dispose(), [tex])

  return (
    <group ref={ref} position={[(px - parent[0]) / PX_PER_UNIT, -(py - parent[1]) / PX_PER_UNIT, 0]}>
      {/* layers are stacked a hair apart and drawn back to front */}
      <mesh position={[(x + w / 2 - px) / PX_PER_UNIT, -(y + h / 2 - py) / PX_PER_UNIT, layer * 0.012]} renderOrder={10 + layer}>
        <planeGeometry args={[w / PX_PER_UNIT, h / PX_PER_UNIT]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} />
      </mesh>
      <PivotContext value={[px, py]}>{children}</PivotContext>
    </group>
  )
}

type Art = {
  // the viewer-left shoulder; the other arm is drawn mirrored
  shoulder: [number, number]
  neck: [number, number]
  body: { box: Box; draw: Draw }
  head: { box: Box; draw: Draw }
  // hair that sits behind the head but in front of the body (ponytails etc.)
  hair?: { box: Box; draw: Draw }
  eyes: { box: Box; open: Draw; closed: Draw }
  mouth: { box: Box; open: Draw; closed: Draw }
  arm: { box: Box; holding: Draw; empty: Draw }
  tagY: number
}

// ---------- Andrew ----------
// Tall and broad through the shoulders, tousled brown hair swept up, blue eyes,
// a big grin and one permanently cocked eyebrow. Cream ribbed polo, silver chain.

const ANDREW_SKIN = '#F2C6A5'
const ANDREW_SKIN_SHADE = '#E0A987'
const ANDREW_SKIN_LINE = '#B87A5C'
const ANDREW_HAIR = '#5A3E2B'
const POLO = '#EFE6D2'
const POLO_SHADE = '#D8CBB0'
const POLO_RIB = 'rgba(150,128,96,0.35)'

function drawAndrewBody(ctx: CanvasRenderingContext2D) {
  // trousers
  paint(ctx, 'M 214 486 L 386 486 L 394 560 L 380 846 L 314 846 L 304 590 L 296 590 L 286 846 L 220 846 L 206 560 Z', '#2F4858', {
    shade: 'M 350 486 L 394 560 L 380 846 L 352 846 L 362 560 Z',
    shadeColor: '#22384A',
  })
  stroke(ctx, 'M 236 700 Q 252 707 268 700', 2.5)
  stroke(ctx, 'M 332 700 Q 348 707 364 700', 2.5)
  stroke(ctx, 'M 300 560 L 300 590', 2.5)
  stroke(ctx, 'M 224 830 L 284 830', 2, '#4E6A7C')
  stroke(ctx, 'M 316 830 L 376 830', 2, '#4E6A7C')

  // sneakers with white soles
  for (const d of [
    'M 220 840 L 288 840 L 294 860 Q 296 880 280 880 L 204 880 Q 192 878 198 864 Q 206 852 220 850 Z',
    'M 380 840 L 312 840 L 306 860 Q 304 880 320 880 L 396 880 Q 408 878 402 864 Q 394 852 380 850 Z',
  ]) {
    paint(ctx, d, '#2A2833', { shade: 'M 190 868 L 410 868 L 410 884 L 190 884 Z', shadeColor: PALETTE.white })
  }
  stroke(ctx, 'M 200 868 L 294 868', 2.5)
  stroke(ctx, 'M 306 868 L 400 868', 2.5)

  // neck, shadowed under the jaw
  paint(ctx, 'M 272 168 L 270 214 Q 300 226 330 214 L 328 168 Z', ANDREW_SKIN, {
    shade: 'M 260 160 L 340 160 L 340 200 Q 300 214 260 200 Z',
    shadeColor: ANDREW_SKIN_SHADE,
  })
  stroke(ctx, 'M 284 192 L 292 216', 2, ANDREW_SKIN_LINE)
  stroke(ctx, 'M 316 192 L 308 216', 2, ANDREW_SKIN_LINE)

  // ribbed polo with a V-taper from broad shoulders to the waist
  const shirt = 'M 270 204 Q 216 212 174 230 Q 158 238 156 262 L 180 336 Q 194 420 206 494 L 394 494 Q 406 420 420 336 L 444 262 Q 442 238 426 230 Q 384 212 330 204 Z'
  paint(ctx, shirt, POLO, { shade: 'M 372 214 L 450 262 L 424 336 L 410 420 L 398 500 L 362 500 Q 386 380 372 214 Z', shadeColor: POLO_SHADE })
  ribs(ctx, shirt, 168, 432, 240, 494, POLO_RIB)
  stroke(ctx, shirt, 6)
  stroke(ctx, 'M 238 300 Q 268 318 294 304', 2.5, '#B9A788')
  stroke(ctx, 'M 306 304 Q 332 318 362 300', 2.5, '#B9A788')
  stroke(ctx, 'M 208 480 L 392 480', 2, '#B9A788')

  // open collar showing skin, with the chain sitting on top
  paint(ctx, 'M 280 206 L 300 268 L 320 206 Z', ANDREW_SKIN, { line: 3, bleed: false })
  stroke(ctx, 'M 276 210 Q 300 276 324 210', 6)
  stroke(ctx, 'M 276 210 Q 300 276 324 210', 3.5, '#D6D9E0', [4, 3])
  paint(ctx, 'M 270 198 L 246 214 L 262 256 L 296 270 L 280 208 Z', '#F7F1E3', { line: 4 })
  paint(ctx, 'M 330 198 L 354 214 L 338 256 L 304 270 L 320 208 Z', '#F7F1E3', { line: 4, shade: 'M 330 198 L 360 214 L 344 260 Z', shadeColor: POLO_SHADE })
}

function drawAndrewHead(ctx: CanvasRenderingContext2D) {
  // ears
  paint(ctx, 'M 240 108 Q 222 102 222 124 Q 224 146 244 150 Z', ANDREW_SKIN, { line: 5 })
  paint(ctx, 'M 360 108 Q 378 102 378 124 Q 376 146 356 150 Z', ANDREW_SKIN, { line: 5, shade: 'M 360 100 L 384 100 L 384 150 Z', shadeColor: ANDREW_SKIN_SHADE })
  stroke(ctx, 'M 234 116 Q 228 126 236 140', 2, ANDREW_SKIN_LINE)
  stroke(ctx, 'M 366 116 Q 372 126 364 140', 2, ANDREW_SKIN_LINE)

  // angular face: square jaw, defined chin
  paint(ctx, 'M 238 96 L 240 138 L 250 164 L 276 186 L 288 192 L 312 192 L 324 186 L 350 164 L 360 138 L 362 96 Q 360 52 300 50 Q 240 52 238 96 Z', ANDREW_SKIN, {
    shade: 'M 344 96 L 366 96 L 364 140 L 352 166 L 326 190 L 312 196 L 300 196 Q 338 176 346 140 Z',
    shadeColor: ANDREW_SKIN_SHADE,
  })
  stroke(ctx, 'M 252 150 L 260 157', 2, ANDREW_SKIN_LINE)
  stroke(ctx, 'M 348 150 L 340 157', 2, ANDREW_SKIN_LINE)
  stroke(ctx, 'M 300 183 L 300 189', 2, ANDREW_SKIN_LINE)

  // nose: a straight bridge with a sharp tip
  stroke(ctx, 'M 304 124 L 311 150 L 302 156', 3, '#A86E52')
  stroke(ctx, 'M 290 154 Q 294 158 298 156', 2, '#A86E52')

  // brows: one level, one cocked up
  paint(ctx, 'M 256 112 L 290 106 L 292 114 L 258 120 Z', '#4A3324', { line: 2, bleed: false })
  paint(ctx, 'M 310 104 L 342 96 L 346 104 L 311 112 Z', '#4A3324', { line: 2, bleed: false })

  // tousled hair swept up into tufts, short at the sides
  paint(
    ctx,
    'M 236 116 L 232 84 Q 232 56 254 40 L 244 20 L 270 30 L 272 6 L 292 24 L 308 0 L 318 24 L 340 8 L 340 32 L 364 24 L 354 48 Q 370 64 368 92 L 364 116 L 356 92 Q 350 74 332 70 L 318 76 L 300 66 L 282 74 L 266 68 Q 248 74 244 96 Z',
    ANDREW_HAIR,
    { shade: 'M 330 30 L 370 20 L 360 48 Q 376 64 374 92 L 368 120 L 356 92 Q 350 74 332 70 Z', shadeColor: '#3F2A1D' },
  )
  for (const d of ['M 262 64 Q 266 46 282 30', 'M 288 62 Q 296 40 306 14', 'M 314 66 Q 320 44 334 20', 'M 338 68 Q 346 54 352 40', 'M 248 86 Q 250 66 260 50']) {
    stroke(ctx, d, 2.5, '#2E1F15')
  }
  stroke(ctx, 'M 276 50 Q 284 38 292 32', 4, '#8A6449')
  stroke(ctx, 'M 304 46 Q 310 34 316 28', 4, '#8A6449')
  paint(ctx, 'M 238 96 L 240 124 L 246 124 L 246 100 Z', ANDREW_HAIR, { line: 3, bleed: false })
  paint(ctx, 'M 362 96 L 360 124 L 354 124 L 354 100 Z', ANDREW_HAIR, { line: 3, bleed: false })
}

// blue eyes, glancing left toward the board
function drawAndrewEyes(ctx: CanvasRenderingContext2D) {
  const eyes: [string, number][] = [
    ['M 258 130 Q 272 118 290 126 Q 276 136 260 132 Z', 274],
    ['M 342 130 Q 328 118 310 126 Q 324 136 340 132 Z', 326],
  ]
  for (const [d, cx] of eyes) {
    paint(ctx, d, PALETTE.white, { line: 0, bleed: false })
    clipped(ctx, d, () => {
      circle(ctx, cx - 3, 127, 7.5, '#4F8FC0')
      stroke(ctx, `M ${cx - 3 - 7.5} 127 A 7.5 7.5 0 1 0 ${cx - 3 + 7.5} 127 A 7.5 7.5 0 1 0 ${cx - 3 - 7.5} 127`, 1.5, '#2D5F86')
      circle(ctx, cx - 3, 127, 3.5, PALETTE.ink)
      circle(ctx, cx - 1, 125, 2, PALETTE.white)
    })
  }
  stroke(ctx, 'M 256 131 Q 272 116 292 125', 4)
  stroke(ctx, 'M 344 131 Q 328 116 308 125', 4)
  stroke(ctx, 'M 262 133 Q 276 137 288 128', 1.5)
  stroke(ctx, 'M 338 133 Q 324 137 312 128', 1.5)
  stroke(ctx, 'M 262 120 Q 274 113 288 118', 1.5, ANDREW_SKIN_LINE)
  stroke(ctx, 'M 338 120 Q 326 113 312 118', 1.5, ANDREW_SKIN_LINE)
}

function drawAndrewEyesClosed(ctx: CanvasRenderingContext2D) {
  stroke(ctx, 'M 258 128 Q 274 136 290 126', 4)
  stroke(ctx, 'M 342 128 Q 326 136 310 126', 4)
}

// resting smirk, lifted on one side
function drawAndrewMouth(ctx: CanvasRenderingContext2D) {
  stroke(ctx, 'M 280 168 Q 298 176 320 162', 4)
  stroke(ctx, 'M 322 158 Q 326 162 324 167', 2)
  stroke(ctx, 'M 292 178 Q 300 181 308 178', 2, ANDREW_SKIN_LINE)
}

// talking: the big toothy grin from the photo
function drawAndrewMouthOpen(ctx: CanvasRenderingContext2D) {
  const mouth = 'M 278 164 Q 300 168 322 160 Q 316 184 298 186 Q 284 184 278 164 Z'
  paint(ctx, mouth, '#6B2E2E', { line: 0, bleed: false })
  clipped(ctx, mouth, () => {
    paint(ctx, 'M 270 150 L 330 150 L 330 171 Q 300 177 270 170 Z', PALETTE.white, { line: 0, bleed: false })
    circle(ctx, 300, 186, 8, '#D4707A')
  })
  stroke(ctx, mouth, 4)
}

function drawAndrewArm(holding: boolean): Draw {
  return (ctx) => {
    if (holding) {
      paint(ctx, 'M 171 548 L 181 548 L 178 878 L 174 878 Z', PALETTE.purple, { line: 3 })
      circle(ctx, 176, 880, 7, PALETTE.pink, 3)
    }
    // muscular arm: bicep bulge, tapering forearm
    paint(ctx, 'M 148 296 Q 140 350 152 402 Q 146 456 158 522 L 192 522 Q 206 456 198 402 Q 210 350 202 296 Z', ANDREW_SKIN, {
      line: 5,
      shade: 'M 186 296 L 212 296 Q 214 350 202 402 Q 210 456 196 526 L 182 526 Q 192 456 186 402 Q 196 350 186 296 Z',
      shadeColor: ANDREW_SKIN_SHADE,
    })
    stroke(ctx, 'M 184 334 Q 194 356 188 384', 2, ANDREW_SKIN_LINE)
    stroke(ctx, 'M 160 404 L 170 410', 2, ANDREW_SKIN_LINE)
    stroke(ctx, 'M 166 430 Q 170 470 168 500', 1.5, ANDREW_SKIN_LINE)
    // hand, fingers curled
    paint(ctx, 'M 156 516 L 194 516 Q 200 540 194 562 L 182 574 Q 164 572 158 556 Q 152 536 156 516 Z', ANDREW_SKIN, { line: 5 })
    stroke(ctx, 'M 168 548 L 170 568', 2, ANDREW_SKIN_LINE)
    stroke(ctx, 'M 178 548 L 180 572', 2, ANDREW_SKIN_LINE)
    stroke(ctx, 'M 188 546 L 188 564', 2, ANDREW_SKIN_LINE)
    stroke(ctx, 'M 194 524 Q 202 540 194 552', 3)
    // short ribbed sleeve
    const sleeve = 'M 146 236 Q 172 220 202 236 L 210 318 Q 178 330 142 318 Z'
    paint(ctx, sleeve, POLO, { line: 0, shade: 'M 186 220 L 214 230 L 214 330 L 188 330 Z', shadeColor: POLO_SHADE })
    ribs(ctx, sleeve, 140, 212, 226, 330, POLO_RIB)
    stroke(ctx, sleeve, 5)
    stroke(ctx, 'M 144 306 Q 178 318 208 306', 2, '#B9A788')
  }
}

const ANDREW_ART: Art = {
  shoulder: [174, 244],
  neck: [300, 196],
  body: { box: [144, 160, 316, 730], draw: drawAndrewBody },
  head: { box: [210, -8, 180, 216], draw: drawAndrewHead },
  eyes: { box: [248, 106, 104, 40], open: drawAndrewEyes, closed: drawAndrewEyesClosed },
  mouth: { box: [268, 148, 66, 46], open: drawAndrewMouthOpen, closed: drawAndrewMouth },
  arm: { box: [130, 216, 92, 674], holding: drawAndrewArm(true), empty: drawAndrewArm(false) },
  tagY: 4.75,
}

// ---------- Lulu ----------
// Tall and slender, long black hair pulled back with a side part and a low
// ponytail over one shoulder, winged liner, red lips, white drop earrings.
// Belted, double-breasted beige trench coat with a heart pendant underneath.

const LULU_SKIN = '#F5D5BC'
const LULU_SKIN_SHADE = '#E8BC9C'
const LULU_SKIN_LINE = '#C08A6A'
const LULU_HAIR = '#2B2330'
const LULU_HAIR_SHEEN = '#4A4560'
const TRENCH = '#D9BE94'
const TRENCH_SHADE = '#BFA076'
const TRENCH_LINE = '#A88A60'
const TRENCH_BELT = '#B8946A'

function drawLuluBody(ctx: CanvasRenderingContext2D) {
  // black tights and ankle boots
  paint(ctx, 'M 264 636 L 272 846 L 294 846 L 298 636 Z', LULU_HAIR, { line: 5 })
  paint(ctx, 'M 302 636 L 306 846 L 328 846 L 336 636 Z', LULU_HAIR, { line: 5 })
  stroke(ctx, 'M 282 660 L 285 830', 3, '#4A4058')
  stroke(ctx, 'M 318 660 L 316 830', 3, '#4A4058')
  paint(ctx, 'M 268 834 L 296 834 L 298 862 L 306 874 L 306 880 L 256 880 Q 254 868 266 860 Z', '#4A3040', { line: 5 })
  paint(ctx, 'M 332 834 L 304 834 L 302 862 L 294 874 L 294 880 L 344 880 Q 346 868 334 860 Z', '#4A3040', { line: 5 })

  // neck
  paint(ctx, 'M 286 196 L 284 248 Q 300 254 316 248 L 314 196 Z', LULU_SKIN, {
    shade: 'M 276 190 L 324 190 L 324 220 Q 300 230 276 220 Z',
    shadeColor: LULU_SKIN_SHADE,
  })

  // trench coat: cinched waist, flared hem
  paint(ctx, 'M 286 238 Q 250 242 216 254 Q 204 260 204 280 L 212 400 L 188 640 Q 300 652 412 640 L 388 400 L 396 280 Q 396 260 384 254 Q 350 242 314 238 Z', TRENCH, {
    shade: 'M 360 250 L 400 280 L 392 400 L 416 644 L 372 648 L 356 400 Q 370 320 360 250 Z',
    shadeColor: TRENCH_SHADE,
  })
  stroke(ctx, 'M 196 626 Q 300 638 404 626', 2, TRENCH_LINE, [6, 4])
  stroke(ctx, 'M 318 350 L 330 642', 3)
  stroke(ctx, 'M 222 470 L 254 500', 4)
  stroke(ctx, 'M 378 470 L 346 500', 4)
  stroke(ctx, 'M 240 560 L 234 630', 2, TRENCH_LINE)
  stroke(ctx, 'M 364 560 L 370 630', 2, TRENCH_LINE)
  stroke(ctx, 'M 300 520 L 300 640', 2, TRENCH_LINE)

  // black top and neckline with the heart pendant
  paint(ctx, 'M 276 246 L 300 336 L 324 246 Z', LULU_HAIR, { line: 3, bleed: false })
  paint(ctx, 'M 286 240 L 300 292 L 314 240 Z', LULU_SKIN, { line: 3, bleed: false })
  stroke(ctx, 'M 287 244 Q 300 290 313 244', 1.5, '#D6D9E0')
  paint(ctx, 'M 300 298 L 292 290 Q 288 284 294 282 Q 298 282 300 286 Q 302 282 306 282 Q 312 284 308 290 Z', PALETTE.pink, { line: 2, bleed: false })

  // notched lapels
  paint(ctx, 'M 286 238 L 250 250 L 236 274 L 258 300 L 248 312 L 300 352 L 278 252 Z', TRENCH, { line: 5 })
  paint(ctx, 'M 314 238 L 350 250 L 364 274 L 342 300 L 352 312 L 300 352 L 322 252 Z', TRENCH, { line: 5, shade: 'M 330 240 L 370 250 L 370 320 L 340 300 Z', shadeColor: TRENCH_SHADE })
  stroke(ctx, 'M 258 300 L 266 296', 2.5)
  stroke(ctx, 'M 342 300 L 334 296', 2.5)

  // belt, buckle and tail
  paint(ctx, 'M 211 388 L 389 388 L 390 410 L 210 410 Z', TRENCH_BELT, { line: 4 })
  paint(ctx, 'M 318 398 L 330 398 L 338 450 L 326 452 Z', TRENCH_BELT, { line: 3 })
  paint(ctx, 'M 284 382 L 316 382 L 316 416 L 284 416 Z', '#8A6A44', { line: 3, bleed: false })
  paint(ctx, 'M 291 390 L 309 390 L 309 408 L 291 408 Z', TRENCH_BELT, { line: 2, bleed: false })

  // double-breasted buttons
  for (const [bx, by] of [[262, 334], [338, 334], [262, 450], [338, 450], [262, 530], [338, 530]]) {
    circle(ctx, bx, by, 7, '#5A3E2B', 2)
    circle(ctx, bx - 2, by - 2, 2, '#9A7A58')
  }
}

function drawLuluHair(ctx: CanvasRenderingContext2D) {
  // volume behind the head
  paint(ctx, 'M 240 176 Q 222 112 258 86 Q 300 66 344 86 Q 378 112 360 176 Q 340 150 300 146 Q 260 150 240 176 Z', LULU_HAIR)
  // low ponytail draped forward over her shoulder
  paint(ctx, 'M 340 190 Q 378 214 380 276 Q 384 360 356 452 L 348 480 L 338 446 Q 358 364 350 292 Q 346 240 326 212 Z', LULU_HAIR)
  stroke(ctx, 'M 358 232 Q 370 300 362 380', 5, LULU_HAIR_SHEEN)
  stroke(ctx, 'M 348 222 Q 366 290 352 420', 2, '#15111A')
  stroke(ctx, 'M 340 244 Q 356 320 346 440', 2, '#15111A')
  paint(ctx, 'M 330 196 L 348 190 L 352 206 L 334 212 Z', PALETTE.pink, { line: 3 })
}

function drawLuluHead(ctx: CanvasRenderingContext2D) {
  // ears and drop earrings
  paint(ctx, 'M 250 148 Q 236 144 236 162 Q 238 180 252 182 Z', LULU_SKIN, { line: 5 })
  paint(ctx, 'M 350 148 Q 364 144 364 162 Q 362 180 348 182 Z', LULU_SKIN, { line: 5 })
  for (const s of [1, -1]) {
    const ex = s === 1 ? 242 : 358
    stroke(ctx, `M ${ex} 180 Q ${ex - 4 * s} 186 ${ex} 190`, 2, '#B8BCC8')
    paint(ctx, `M ${ex} 188 Q ${ex - 10 * s} 204 ${ex} 222 Q ${ex + 10 * s} 204 ${ex} 188 Z`, PALETTE.white, { line: 3, bleed: false })
    stroke(ctx, `M ${ex} 194 Q ${ex - 4 * s} 206 ${ex + s} 216`, 1.5, '#B8BCC8')
  }

  // heart-shaped face narrowing to a pointed chin
  paint(ctx, 'M 248 140 Q 248 104 300 96 Q 352 104 352 140 L 350 168 Q 344 192 322 208 L 300 220 L 278 208 Q 256 192 250 168 Z', LULU_SKIN, {
    shade: 'M 336 120 Q 356 130 354 168 Q 348 194 324 212 L 306 222 Q 334 190 338 150 Z',
    shadeColor: LULU_SKIN_SHADE,
  })
  stroke(ctx, 'M 302 166 L 305 184 Q 301 188 295 186', 2.5, LULU_SKIN_LINE)

  // blush with little anime hatch marks
  for (const cx of [266, 334]) {
    ctx.save()
    ctx.fillStyle = 'rgba(253,150,169,0.45)'
    ctx.beginPath()
    ctx.ellipse(cx, 184, 13, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    for (const dx of [-6, 0, 6]) stroke(ctx, `M ${cx + dx - 2} 186 L ${cx + dx + 2} 180`, 1.5, '#F07890')
  }

  // thin arched brows
  paint(ctx, 'M 256 142 Q 272 128 294 134 L 294 138 Q 272 134 258 146 Z', LULU_HAIR, { line: 1, bleed: false })
  paint(ctx, 'M 344 142 Q 328 128 306 134 L 306 138 Q 328 134 342 146 Z', LULU_HAIR, { line: 1, bleed: false })

  // side-parted hair swept across the forehead, with face-framing wisps
  paint(ctx, 'M 244 162 Q 234 104 270 86 Q 300 74 336 84 Q 368 102 358 160 L 352 140 Q 346 120 328 108 Q 300 104 282 114 Q 262 124 250 146 Z', LULU_HAIR)
  stroke(ctx, 'M 262 104 Q 290 88 322 92', 6, LULU_HAIR_SHEEN)
  for (const d of ['M 328 108 Q 296 110 262 138', 'M 328 108 Q 304 96 276 98', 'M 328 108 Q 346 114 354 136']) stroke(ctx, d, 2, '#15111A')
  paint(ctx, 'M 252 148 Q 240 182 250 216 L 254 214 Q 248 182 258 154 Z', LULU_HAIR, { line: 2, bleed: false })
  paint(ctx, 'M 352 146 Q 362 176 354 202 L 350 200 Q 356 174 348 150 Z', LULU_HAIR, { line: 2, bleed: false })
}

// almond eyes with winged liner, glancing right toward the board
function drawLuluEyes(ctx: CanvasRenderingContext2D) {
  const eyes: [string, number][] = [
    ['M 258 160 Q 270 148 294 156 Q 282 168 264 164 Z', 278],
    ['M 342 160 Q 330 148 306 156 Q 318 168 336 164 Z', 322],
  ]
  for (const [d, cx] of eyes) {
    paint(ctx, d, PALETTE.white, { line: 0, bleed: false })
    clipped(ctx, d, () => {
      circle(ctx, cx + 3, 158, 8, '#3A2620')
      circle(ctx, cx + 3, 158, 4, '#120A08')
      circle(ctx, cx + 5, 155, 2.5, PALETTE.white)
      circle(ctx, cx + 1, 161, 1.2, PALETTE.white)
    })
  }
  stroke(ctx, 'M 296 156 Q 274 144 258 161 L 248 152', 4.5)
  stroke(ctx, 'M 304 156 Q 326 144 342 161 L 352 152', 4.5)
  for (const [x0, y0, x1, y1] of [[263, 156, 257, 150], [269, 152, 265, 145]]) {
    stroke(ctx, `M ${x0} ${y0} L ${x1} ${y1}`, 2)
    stroke(ctx, `M ${SHEET_W - x0} ${y0} L ${SHEET_W - x1} ${y1}`, 2)
  }
  stroke(ctx, 'M 264 165 Q 280 168 292 160', 1.5, LULU_SKIN_LINE)
  stroke(ctx, 'M 336 165 Q 320 168 308 160', 1.5, LULU_SKIN_LINE)
}

function drawLuluEyesClosed(ctx: CanvasRenderingContext2D) {
  stroke(ctx, 'M 258 157 Q 276 167 294 157 M 258 157 L 249 152', 4)
  stroke(ctx, 'M 342 157 Q 324 167 306 157 M 342 157 L 351 152', 4)
}

// small, sweet red-lipped smile
function drawLuluMouth(ctx: CanvasRenderingContext2D) {
  paint(ctx, 'M 286 197 Q 293 192 300 195 Q 307 192 314 197 Q 300 200 286 197 Z', '#C8364A', { line: 1.5, bleed: false })
  paint(ctx, 'M 286 197 Q 300 208 314 197 Q 300 201 286 197 Z', '#D9485A', { line: 1.5, bleed: false })
  stroke(ctx, 'M 284 195 L 286 197', 1.5)
  stroke(ctx, 'M 316 195 L 314 197', 1.5)
}

function drawLuluMouthOpen(ctx: CanvasRenderingContext2D) {
  const mouth = 'M 286 196 Q 300 192 314 196 Q 312 212 300 214 Q 288 212 286 196 Z'
  paint(ctx, mouth, '#6B2E2E', { line: 0, bleed: false })
  clipped(ctx, mouth, () => {
    paint(ctx, 'M 280 190 L 320 190 L 320 201 L 280 201 Z', PALETTE.white, { line: 0, bleed: false })
    circle(ctx, 300, 213, 6, '#D4707A')
  })
  stroke(ctx, mouth, 4, '#C8364A')
  stroke(ctx, mouth, 1.2)
}

function drawLuluArm(holding: boolean): Draw {
  return (ctx) => {
    if (holding) paint(ctx, 'M 214 536 L 224 536 L 226 566 L 216 566 Z', PALETTE.white, { line: 2, bleed: false })
    paint(ctx, 'M 208 498 L 238 498 Q 244 526 234 548 L 224 554 Q 210 548 208 528 Z', LULU_SKIN, { line: 4 })
    stroke(ctx, 'M 218 532 L 219 550', 1.5, LULU_SKIN_LINE)
    stroke(ctx, 'M 226 532 L 228 552', 1.5, LULU_SKIN_LINE)
    // trench sleeve with elbow creases, cuff strap and epaulette
    paint(ctx, 'M 200 252 Q 222 240 244 256 L 248 330 Q 250 420 242 500 L 204 504 Q 196 420 198 330 Z', TRENCH, {
      line: 5,
      shade: 'M 232 246 L 250 256 L 254 330 Q 256 420 246 504 L 230 504 Q 238 420 236 330 Z',
      shadeColor: TRENCH_SHADE,
    })
    stroke(ctx, 'M 204 380 Q 220 388 240 378', 2, TRENCH_LINE)
    stroke(ctx, 'M 208 392 Q 220 398 236 392', 2, TRENCH_LINE)
    paint(ctx, 'M 202 470 L 244 466 L 244 482 L 202 486 Z', TRENCH_BELT, { line: 3 })
    stroke(ctx, 'M 214 468 L 224 468 L 224 484 L 214 484 Z', 2, '#5A3E2B')
    paint(ctx, 'M 202 254 L 240 250 L 242 264 L 204 268 Z', TRENCH, { line: 3, bleed: false })
    circle(ctx, 232, 258, 3.5, '#5A3E2B', 1.5)
  }
}

const LULU_ART: Art = {
  shoulder: [222, 262],
  neck: [300, 214],
  body: { box: [180, 186, 240, 704], draw: drawLuluBody },
  head: { box: [226, 70, 150, 160], draw: drawLuluHead },
  hair: { box: [214, 58, 176, 432], draw: drawLuluHair },
  eyes: { box: [244, 138, 112, 36], open: drawLuluEyes, closed: drawLuluEyesClosed },
  mouth: { box: [278, 186, 44, 34], open: drawLuluMouthOpen, closed: drawLuluMouth },
  arm: { box: [188, 236, 74, 342], holding: drawLuluArm(true), empty: drawLuluArm(false) },
  tagY: 4.4,
}

function NameTag({ name, ...group }: { name: string } & GroupProps) {
  const tex = useMemo(
    () =>
      makeCanvasTexture(512, 140, (ctx) => {
        ctx.fillStyle = PALETTE.ink
        ctx.beginPath()
        ctx.roundRect(4, 4, 504, 132, 60)
        ctx.fill()
        ctx.fillStyle = PALETTE.white
        ctx.beginPath()
        ctx.roundRect(14, 14, 484, 112, 52)
        ctx.fill()
        ctx.font = 'bold 58px "Chalkboard SE", "Comic Sans MS", cursive'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = PALETTE.purple
        ctx.fillText(name, 256, 74, 450)
      }),
    [name],
  )
  useEffect(() => () => tex.dispose(), [tex])

  return (
    <group {...group}>
      <mesh>
        <planeGeometry args={[1.9, 0.52]} />
        <meshBasicMaterial map={tex} transparent />
      </mesh>
    </group>
  )
}

type CharacterProps = {
  who: Speaker
  art: Art
  x: number
  yaw: number
  // the arm nearest the board, which holds the prop and does the gesturing
  gestureSide: 1 | -1
  idleRaise: number
  phase: number
  cue: Cue
  talking: boolean
}

// Shared puppet rig. Plays whichever cue animations name this character,
// blinks, flaps its mouth while talking, and otherwise idles with a little
// squash-and-stretch breathing.
function Character({ who, art, x, yaw, gestureSide, idleRaise, phase, cue, talking }: CharacterProps) {
  const body = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)
  const gesture = useRef<THREE.Group>(null)
  const rest = useRef<THREE.Group>(null)
  const eyesOpen = useRef<THREE.Group>(null)
  const eyesClosed = useRef<THREE.Group>(null)
  const mouthOpen = useRef<THREE.Group>(null)
  const mouthClosed = useRef<THREE.Group>(null)
  const cueStart = useRef({ step: -1, at: 0 })
  const raise = useRef(idleRaise)

  // arm moves (point/wave) and body moves (hop) can play together
  const mine = cue.animations.filter((a) => a.who === who)
  const armAnim = mine.find((a) => a.type === 'point' || a.type === 'wave')
  const hopping = mine.some((a) => a.type === 'hop')

  // arm angle that aims the gesture hand at a spot on the board
  const aim = useMemo(() => {
    if (armAnim?.type !== 'point') return idleRaise
    const shoulderX = (gestureSide * Math.abs(art.shoulder[0] - SHEET_W / 2)) / PX_PER_UNIT
    const shoulderY = (FEET_Y - art.shoulder[1]) / PX_PER_UNIT
    const local = boardPoint(armAnim.at).sub(new THREE.Vector3(x, 0, CHARACTER_Z)).applyAxisAngle(UP, -yaw)
    return gestureSide * Math.atan2(local.x - shoulderX, shoulderY - local.y)
  }, [armAnim, x, yaw, gestureSide, idleRaise, art])

  useFrame(({ clock }, delta) => {
    if (!body.current || !head.current || !gesture.current || !rest.current) return
    const t = clock.elapsedTime
    if (cueStart.current.step !== cue.step) cueStart.current = { step: cue.step, at: t }
    const ct = t - cueStart.current.at

    let squash = Math.sin(t * 2.2 + phase) * 0.018
    let lift = 0
    if (hopping) {
      const h = hop(ct)
      squash += h.squash
      lift = h.lift
    }
    body.current.scale.set(1 - squash * 0.5, 1 + squash, 1)
    body.current.position.y = lift
    head.current.rotation.z = talking ? Math.sin(t * 5) * 0.035 : Math.sin(t * 1.1 + phase) * 0.012

    let target = idleRaise + Math.sin(t * 2.2 + phase + 1) * 0.04
    if (armAnim?.type === 'point') target = pointRaise(ct, idleRaise, aim)
    if (armAnim?.type === 'wave') target = waveRaise(ct, idleRaise)
    // damping smooths the jumps between poses without killing the overshoot
    raise.current = THREE.MathUtils.damp(raise.current, target, 20, delta)
    gesture.current.rotation.z = gestureSide * raise.current
    rest.current.rotation.z = -gestureSide * (0.06 + Math.sin(t * 2.2 + phase) * 0.02)

    const blink = (t + phase) % 4.2 < 0.13
    if (eyesOpen.current && eyesClosed.current) {
      eyesOpen.current.visible = !blink
      eyesClosed.current.visible = blink
    }
    const open = talking && Math.sin(t * 17) > -0.2
    if (mouthOpen.current && mouthClosed.current) {
      mouthOpen.current.visible = open
      mouthClosed.current.visible = !open
    }
  })

  return (
    <group position={[x, 0, CHARACTER_Z]} rotation={[0, yaw, 0]}>
      <group ref={body}>
        <Part box={art.body.box} layer={2} draw={art.body.draw} />
        <Part ref={head} box={art.head.box} pivot={art.neck} layer={4} draw={art.head.draw}>
          {art.hair && <Part box={art.hair.box} layer={3} draw={art.hair.draw} />}
          <Part ref={eyesOpen} box={art.eyes.box} layer={5} draw={art.eyes.open} />
          <Part ref={eyesClosed} box={art.eyes.box} layer={5} draw={art.eyes.closed} />
          <Part ref={mouthOpen} box={art.mouth.box} layer={5} draw={art.mouth.open} />
          <Part ref={mouthClosed} box={art.mouth.box} layer={5} draw={art.mouth.closed} />
        </Part>
        <Part ref={rest} box={art.arm.box} pivot={art.shoulder} layer={6} draw={art.arm.empty} mirror={gestureSide === -1} />
        <Part ref={gesture} box={art.arm.box} pivot={art.shoulder} layer={7} draw={art.arm.holding} mirror={gestureSide === 1} />
      </group>
      <NameTag name={SPEAKERS[who].name} position={[0, art.tagY, 0]} />
    </group>
  )
}

type ActorProps = { cue: Cue; talking: boolean }

function Lulu(props: ActorProps) {
  return <Character {...props} who="lulu" art={LULU_ART} x={-CHARACTER_X} yaw={0.2} gestureSide={1} idleRaise={0.2} phase={0} />
}

function Andrew(props: ActorProps) {
  return <Character {...props} who="andrew" art={ANDREW_ART} x={CHARACTER_X} yaw={-0.2} gestureSide={-1} idleRaise={0.5} phase={1.6} />
}

// ---------- dialogue ----------

type DialogueLine = {
  speaker: Speaker
  text: string
  animations: SceneAnimation[]
}

// Lulu is bright, sincere and sweet; Andrew is snarky with a dry sense of humor.
const SCRIPT: DialogueLine[] = [
  {
    speaker: 'lulu',
    text: "So what makes you, well, you?! There are many things, but we will start with the Personality.",
    animations: [{ type: 'wave', who: 'lulu' }],
  },
  {
    speaker: 'andrew',
    text: "Gather round all horoscope lovers, astrology girls, and other general weirdos. It's time to learn about actual ",
    animations: [{ type: 'point', who: 'andrew', at: 'title' }],
  },
  {
    speaker: 'lulu',
    text: 'Each letter in OCEAN is one trait! O is for Openness: how curious you are about new ideas, art and adventures.',
    animations: [
      { type: 'point', who: 'lulu', at: 'Openness' },
      { type: 'hop', who: 'lulu' },
    ],
  },
  {
    speaker: 'andrew',
    text: 'C is Conscientiousness: how organized and dependable you are. I have a very detailed to-do list. I just never look at it.',
    animations: [{ type: 'point', who: 'andrew', at: 'Conscientiousness' }],
  },
  {
    speaker: 'lulu',
    text: 'E is for Extraversion: how much energy you get from being around people. Parties make me so happy!',
    animations: [{ type: 'point', who: 'lulu', at: 'Extraversion' }],
  },
  {
    speaker: 'andrew',
    text: "A is Agreeableness: how kind, trusting and cooperative you are. Lulu is off the charts. I'm... on the chart.",
    animations: [
      { type: 'point', who: 'andrew', at: 'Agreeableness' },
      { type: 'wave', who: 'lulu' },
    ],
  },
  {
    speaker: 'lulu',
    text: "And N is for Neuroticism: how strongly you feel stress and worry. Remember, no trait is good or bad. They're all part of what makes you, you!",
    animations: [{ type: 'point', who: 'lulu', at: 'Neuroticism' }],
  },
]

const TYPE_MS = 28

const DIALOGUE_CSS = `
@keyframes dialogue-pop {
  0% { transform: scale(0.92) translateY(10px); }
  60% { transform: scale(1.03) translateY(-3px); }
  100% { transform: scale(1) translateY(0); }
}
@keyframes dialogue-nudge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(5px); }
}
`

const DIALOGUE_FONT = '"Chalkboard SE", "Comic Sans MS", cursive'

// Pokemon-style text box: types the line out letter by letter, with a bouncing
// arrow once it's finished and there's more to read.
function DialogueBox({ line, chars, step, more }: { line: DialogueLine; chars: number; step: number; more: boolean }) {
  const speaker = SPEAKERS[line.speaker]
  const done = chars >= line.text.length

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 'clamp(12px, 3vh, 32px)',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      <style>{DIALOGUE_CSS}</style>
      <div key={step} style={{ position: 'relative', width: '100%', maxWidth: 920, animation: 'dialogue-pop 260ms cubic-bezier(.34,1.56,.64,1)' }}>
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 28,
            zIndex: 1,
            padding: '4px 18px',
            background: speaker.color,
            color: speaker.text,
            border: `4px solid ${PALETTE.ink}`,
            borderRadius: 999,
            boxShadow: `4px 4px 0 ${PALETTE.ink}`,
            transform: 'rotate(-2deg)',
            fontFamily: DIALOGUE_FONT,
            fontWeight: 700,
            fontSize: 'clamp(14px, 1.6vw, 18px)',
          }}
        >
          {speaker.name}
        </div>
        <div
          style={{
            position: 'relative',
            padding: 'clamp(22px, 3vw, 32px) clamp(18px, 3vw, 34px) clamp(16px, 2.4vw, 26px)',
            background: PALETTE.white,
            border: `5px solid ${PALETTE.ink}`,
            borderRadius: 22,
            boxShadow: `inset 0 0 0 6px ${speaker.color}55, 7px 7px 0 ${PALETTE.ink}`,
          }}
        >
          <p
            style={{
              margin: 0,
              minHeight: '3em',
              fontFamily: DIALOGUE_FONT,
              fontSize: 'clamp(16px, 2.1vw, 23px)',
              lineHeight: 1.5,
              color: PALETTE.ink,
              textAlign: 'left',
            }}
          >
            {line.text.slice(0, chars)}
            {/* the untyped rest holds its space so words don't jump lines mid-type */}
            <span style={{ visibility: 'hidden' }}>{line.text.slice(chars)}</span>
          </p>
          {done && more && (
            <span
              style={{
                position: 'absolute',
                right: 22,
                bottom: 10,
                color: speaker.color,
                fontSize: 22,
                textShadow: `-2px 0 ${PALETTE.ink}, 2px 0 ${PALETTE.ink}, 0 2px ${PALETTE.ink}, 0 -2px ${PALETTE.ink}`,
                animation: 'dialogue-nudge 0.7s ease-in-out infinite',
              }}
            >
              ▼
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- scene ----------

const CAMERA_FOV = 50
// how far either side of center must stay on screen (characters plus their name tags)
const FRAME_HALF_WIDTH = CHARACTER_X + 1.3

// Keeps the composition framed on any screen shape: wide screens just see more
// classroom, narrow ones pull the camera back until both characters fit.
function FitCamera() {
  const camera = useThree((s) => s.camera)
  const aspect = useThree((s) => s.size.width / s.size.height)

  useEffect(() => {
    const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2))
    const z = Math.max(11, FRAME_HALF_WIDTH / (tanHalfFov * aspect) + CHARACTER_Z)
    camera.position.set(0, 3.3, z)
    camera.lookAt(0, 2.8, 0)
  }, [camera, aspect])

  return null
}

export default function Personality() {
  const [traits, setTraits] = useState<PersonalityTrait[]>([])
  // index of the SCRIPT line on screen
  const [step, setStep] = useState(0)
  const [chars, setChars] = useState(0)

  const line: DialogueLine | undefined = SCRIPT[step]
  const more = step < SCRIPT.length - 1
  const typing = line !== undefined && chars < line.text.length

  useEffect(() => {
    fetch('/api/personality/traits')
      .then((res) => res.json())
      .then(setTraits)
  }, [])

  useEffect(() => {
    if (!typing) return
    const id = setTimeout(() => setChars((c) => c + 1), TYPE_MS)
    return () => clearTimeout(id)
  }, [typing, chars])

  // first click finishes the line being typed, the next moves on to the following line
  const advance = () => {
    if (!line) return
    if (typing) {
      setChars(line.text.length)
      return
    }
    if (more) goTo(step + 1)
  }

  // jumping to a line retypes it and replays its animations
  const goTo = (next: number) => {
    setStep(next)
    setChars(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        advance()
      } else if (e.key === 'ArrowLeft' && step > 0) {
        e.preventDefault()
        goTo(step - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const cue: Cue = { step, animations: line?.animations ?? [] }

  return (
    // fixed to the viewport so the scene ignores any max-width on its parents
    <div
      onClick={advance}
      style={{ position: 'fixed', inset: 0, background: PALETTE.ink, cursor: 'pointer', userSelect: 'none' }}
    >
      <Canvas flat camera={{ position: [0, 3.3, 11], fov: CAMERA_FOV }}>
        <FitCamera />
        <color attach="background" args={[PALETTE.pink]} />
        <ambientLight intensity={1.6} />
        <directionalLight position={[4, 8, 6]} intensity={2.2} />

        <Room />
        <Clock />
        <Blackboard traits={traits} />

        <Lulu cue={cue} talking={typing && line?.speaker === 'lulu'} />
        <Andrew cue={cue} talking={typing && line?.speaker === 'andrew'} />

        <Desk chair={PALETTE.blue} position={[-3.9, 0, 4.2]} rotation={[0, 0.08, 0]}>
          <Apple position={[0.6, 0, -0.15]} />
          <Pencil position={[-0.3, 0.04, 0.2]} />
        </Desk>
        <Desk chair={PALETTE.pink} position={[3.9, 0, 4.2]} rotation={[0, -0.08, 0]}>
          <Books position={[-0.4, 0, -0.1]} />
        </Desk>
      </Canvas>

      {line && <DialogueBox line={line} chars={chars} step={step} more={more} />}
    </div>
  )
}
