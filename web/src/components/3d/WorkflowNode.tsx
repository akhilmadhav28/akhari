import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { WorkflowNodeDef } from '@/constants/workflow'
import { nodeRuntime } from '@/lib/scene/flowState'
import { getNodeFaceTexture } from '@/lib/three/nodeFaceTexture'
import { C } from '@/constants/brand'
import { damp, easeOutBack, easeOutCubic } from '@/lib/animation/math'

/**
 * One automation module.
 *
 * Built as an actual object rather than a billboarded card: a bevelled metal
 * slab, an inset face plate carrying the icon and label, a raised bezel that
 * catches the key light, port nubs where the cables land, and corner brackets
 * marking the module's slot before it arrives.
 *
 * All animation is read from `nodeRuntime[id]` inside useFrame — this component
 * never re-renders after mount.
 */

export const NODE_W = 1.78
export const NODE_H = 1.11
export const NODE_D = 0.3

const BRACKET = 0.3
const CORNERS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
]

interface WorkflowNodeProps {
  def: WorkflowNodeDef
  position: THREE.Vector3
  /** Deterministic per-node variation so entries don't look synchronised. */
  seed: number
  onHover: (id: string, hovering: boolean) => void
}

export function WorkflowNode({ def, position, seed, onHover }: WorkflowNodeProps) {
  const group = useRef<THREE.Group>(null)
  const faceMat = useRef<THREE.MeshStandardMaterial>(null)
  const bezelMat = useRef<THREE.MeshStandardMaterial>(null)

  const face = useMemo(
    () => getNodeFaceTexture(def.type, def.label, def.meta, def.accent),
    [def.type, def.label, def.meta, def.accent],
  )

  const accent = useMemo(() => new THREE.Color(def.accent), [def.accent])

  // One geometry and one material shared across all eight bracket arms, so the
  // socket costs a single material update per frame instead of eight.
  const bracketGeo = useMemo(() => new THREE.BoxGeometry(BRACKET, 0.024, 0.024), [])
  // Graphite rather than accent: the socket is an anticipation marker, and on
  // this palette orange is reserved for what is actually live.
  const socketMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(C.ink),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      bracketGeo.dispose()
      socketMat.dispose()
    }
  }, [bracketGeo, socketMat])

  /** Where the module flies in from, and the tilt it carries on the way. */
  const entry = useMemo(() => {
    const angle = seed * Math.PI * 2
    return {
      offset: new THREE.Vector3(Math.cos(angle) * 3.2, 2.6 + seed * 1.8, 4.5 + seed * 2.2),
      spin: (seed - 0.5) * 1.5,
      /** Small permanent tilt so the wall of nodes isn't perfectly flat. */
      rest: (seed - 0.5) * 0.12,
    }
  }, [seed])

  useFrame((_, delta) => {
    const g = group.current
    if (!g) return

    const rt = nodeRuntime[def.id]
    const dt = Math.min(delta, 0.05)
    const now = performance.now()

    // --- Arrival -----------------------------------------------------------
    // easeOutBack overshoots slightly then settles: the magnetic snap.
    const snap = easeOutBack(rt.build, 1.15)
    const inv = 1 - snap

    g.position.set(
      position.x + entry.offset.x * inv,
      position.y + entry.offset.y * inv,
      position.z + entry.offset.z * inv,
    )

    g.rotation.z = entry.spin * inv + entry.rest
    g.rotation.y = entry.spin * 0.6 * inv
    g.rotation.x = entry.spin * 0.3 * inv

    // --- Illumination ------------------------------------------------------
    // Pulse arrival, hover, and a slow idle breath once the node is live.
    const idle = rt.build > 0.98 ? 0.5 + 0.5 * Math.sin(now * 0.0011 + seed * 8) : 0
    const lit = Math.min(1, rt.glow + rt.hover * 0.55 + idle * 0.12)

    g.scale.setScalar(easeOutCubic(rt.build) * (1 + rt.glow * 0.055 + rt.hover * 0.025))

    // The screen is the only self-lit surface now. On a bright ground a module
    // reads as "active" because its display brightens and its bezel picks up
    // the accent — not because it throws light into the room.
    if (faceMat.current) {
      // Held just under the bloom threshold at its peak, deliberately.
      //
      // The face must never bloom. Its glow is *painted* — the icon and the lit
      // LED are drawn with a canvas shadow, so they read as emitting without
      // any help from the post chain. Letting the material cross the threshold
      // on top of that double-counts: the screen-space blur then smears the
      // label text and the icon into each other, and on the close-up beat the
      // whole module turns into a single bright blob. Bloom in this scene
      // belongs to the pulses, the port and the figure, and nothing else.
      faceMat.current.emissiveIntensity = 0.6 + lit * 0.42
      faceMat.current.opacity = rt.build
    }
    if (bezelMat.current) {
      bezelMat.current.emissiveIntensity = lit * 0.35
    }

    // --- Socket ------------------------------------------------------------
    const blink = 0.55 + 0.45 * Math.sin(now * 0.0026 + seed * 5)
    socketMat.opacity = rt.socket * (0.22 + 0.3 * blink)

    // Eased here rather than on pointerout so a fast exit still decays.
    rt.hover = damp(rt.hover, rt.hoverTarget, 12, dt)
  })

  return (
    <group>
      {/* Socket — four corner brackets marking the slot before arrival. */}
      <group position={position}>
        {CORNERS.map(([sx, sy]) => (
          <group key={`${sx}:${sy}`} position={[sx * NODE_W * 0.58, sy * NODE_H * 0.66, 0]}>
            <mesh
              geometry={bracketGeo}
              material={socketMat}
              position={[(-sx * BRACKET) / 2, 0, 0]}
            />
            <mesh
              geometry={bracketGeo}
              material={socketMat}
              position={[0, (-sy * BRACKET) / 2, 0]}
              rotation={[0, 0, Math.PI / 2]}
            />
          </group>
        ))}
      </group>

      <group
        ref={group}
        onPointerOver={(e) => {
          e.stopPropagation()
          nodeRuntime[def.id].hoverTarget = 1
          onHover(def.id, true)
        }}
        onPointerOut={() => {
          nodeRuntime[def.id].hoverTarget = 0
          onHover(def.id, false)
        }}
      >
        {/* Body — blackened steel. Rough enough that the warm key lands as a
            broad sheen along one edge rather than a mirror highlight. */}
        <RoundedBox args={[NODE_W, NODE_H, NODE_D]} radius={0.075} smoothness={4} castShadow>
          <meshStandardMaterial color={C.steel} metalness={0.86} roughness={0.38} />
        </RoundedBox>

        {/* Bezel — a marginally larger, darker frame behind the face, which is
            what reads as a machined edge under a raking key. */}
        <RoundedBox
          args={[NODE_W - 0.05, NODE_H - 0.05, NODE_D + 0.035]}
          radius={0.065}
          smoothness={3}
          castShadow
        >
          <meshStandardMaterial
            ref={bezelMat}
            color={C.steelEdge}
            metalness={0.78}
            roughness={0.34}
            emissive={accent}
            emissiveIntensity={0}
          />
        </RoundedBox>

        {/* Face plate — the drawn texture, inset and self-lit. */}
        <mesh position={[0, 0, NODE_D / 2 + 0.031]}>
          <planeGeometry args={[NODE_W - 0.13, NODE_H - 0.09]} />
          <meshStandardMaterial
            ref={faceMat}
            map={face}
            emissiveMap={face}
            emissive="#ffffff"
            emissiveIntensity={0.35}
            transparent
            roughness={0.5}
            metalness={0}
          />
        </mesh>

        {/* The additive bloom card that used to sit here is gone: adding light
            to a white ground produces nothing, so on this palette it was pure
            cost. Its job — signalling an active module — now belongs to the
            screen's emissive and the bezel's accent tint. */}

        {/* Port nubs — where the cables physically land. */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            position={[side * (NODE_W / 2 + 0.045), 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[0.058, 0.07, 0.11, 10]} />
            <meshStandardMaterial color={C.brassMetal} metalness={0.95} roughness={0.28} />
          </mesh>
        ))}

        {/* Heat-sink ribs along the bottom edge. */}
        {[-0.42, -0.14, 0.14, 0.42].map((x) => (
          <mesh key={x} position={[x, -NODE_H / 2 + 0.035, NODE_D / 2 - 0.01]}>
            <boxGeometry args={[0.11, 0.022, 0.03]} />
            <meshStandardMaterial color="#4A423A" metalness={0.9} roughness={0.42} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
