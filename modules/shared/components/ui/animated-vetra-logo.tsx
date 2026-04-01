'use client'

import { motion } from 'framer-motion'
import * as React from 'react'

const LEAF_PATH =
  'M12.7297 -9.92366e-08C13.9836 -4.44297e-08 15 1.01643 15 2.27027L15 3.64865C15 9.91783 9.91783 15 3.64865 15L2.27027 15C1.01643 15 2.82829e-07 13.9836 3.37635e-07 12.7297L7.94833e-07 2.27027C8.4964e-07 1.01643 1.01644 -6.11241e-07 2.27027 -5.56434e-07L12.7297 -9.92366e-08Z'

const LEAF_SIZE = 15
const GAP = 3
const FRAME = 2 * LEAF_SIZE + GAP // 33

function basePositions() {
  return [
    { key: 'tl', x: 0, y: 0, rot: 0 },
    { key: 'tr', x: LEAF_SIZE + GAP, y: 0, rot: 90 },
    { key: 'br', x: LEAF_SIZE + GAP, y: LEAF_SIZE + GAP, rot: 180 },
    { key: 'bl', x: 0, y: LEAF_SIZE + GAP, rot: 270 },
  ] as const
}

interface AnimatedVetraLogoProps {
  size?: number
  duration?: number
  variant?: 'scale' | 'movement' | 'threeStep'
  className?: string
}

// Variant 1: Scale Animation
function ScaleAnimation({ size = 48, duration = 8 }: { size: number; duration: number }) {
  const positions = basePositions()

  // Scale keyframes for each leaf (converted from your pixel values to scale factors)
  const leafScales = {
    tl: [1, 1.47, 0.73, 1.2, 1], // 15→22→11→18→15
    tr: [1, 0.73, 1.47, 1.2, 1], // 15→11→22→18→15
    br: [1, 1.47, 0.73, 1.2, 1], // 15→22→11→18→15
    bl: [1, 0.73, 1.47, 1.2, 1], // 15→11→22→18→15
  }

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${FRAME} ${FRAME}`}
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      {positions.map(({ key, x, y, rot }) => (
        <g
          key={key}
          transform={`translate(${x} ${y}) rotate(${rot} ${LEAF_SIZE / 2} ${LEAF_SIZE / 2})`}
        >
          <motion.path
            d={LEAF_PATH}
            fill="#04c161"
            initial={{ scale: 1 }}
            animate={{ scale: leafScales[key] }}
            transition={{
              duration,
              ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1],
              repeat: Infinity,
              repeatType: 'loop',
            }}
            style={{ originX: 0, originY: 0, transformBox: 'fill-box' }}
          />
        </g>
      ))}
    </motion.svg>
  )
}

// Variant 2: Movement Animation
function MovementAnimation({
  size = 48,
  duration = 12,
  inward = 14,
}: {
  size: number
  duration: number
  inward: number
}) {
  const maxInward = FRAME - LEAF_SIZE // 18px
  const d = Math.min(inward, maxInward)
  const positions = basePositions()

  const offsets: Record<string, { dx: number; dy: number }> = {
    tl: { dx: +d, dy: +d },
    tr: { dx: -d, dy: +d },
    br: { dx: -d, dy: -d },
    bl: { dx: +d, dy: -d },
  }

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${FRAME} ${FRAME}`}
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      {positions.map(({ key, x, y, rot }) => {
        const { dx, dy } = offsets[key]
        return (
          <motion.g
            key={key}
            initial={{ x, y }}
            animate={{
              x: [x, x + dx, x, x + dx, x],
              y: [y, y + dy, y, y + dy, y],
            }}
            transition={{
              duration,
              times: [0, 0.25, 0.5, 0.75, 1],
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          >
            <g transform={`rotate(${rot} ${LEAF_SIZE / 2} ${LEAF_SIZE / 2})`}>
              <path d={LEAF_PATH} fill="#04c161" />
            </g>
          </motion.g>
        )
      })}
    </motion.svg>
  )
}

// Variant 3: Three Step Animation
function ThreeStepAnimation({
  size = 48,
  duration = 5,
  inward = 5,
}: {
  size: number
  duration: number
  inward: number
}) {
  const positions = basePositions()
  const INNER = FRAME - LEAF_SIZE // 18

  // Step 1 targets
  const step1: Record<string, { x: number; y: number }> = {
    tl: { x: 0, y: INNER },
    tr: { x: INNER, y: 0 },
    br: { x: 0, y: INNER },
    bl: { x: INNER, y: 0 },
  }

  // Step 2: move inward from Step 1
  const d = Math.max(0, Math.min(inward, INNER))
  const step2: typeof step1 = {
    tl: { x: step1.tl.x + d, y: step1.tl.y - d },
    tr: { x: step1.tr.x - d, y: step1.tr.y + d },
    br: { x: step1.br.x + d, y: step1.br.y - d },
    bl: { x: step1.bl.x - d, y: step1.bl.y + d },
  }

  const times = [0, 0.25, 0.5, 0.75, 1]

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${FRAME} ${FRAME}`}
      width={size}
      height={size}
      style={{ display: 'block' }}
    >
      {positions.map(({ key, x, y, rot }) => {
        const s1 = step1[key]
        const s2 = step2[key]
        const xKeys = [x, s1.x, s2.x, s1.x, x]
        const yKeys = [y, s1.y, s2.y, s1.y, y]

        return (
          <motion.g
            key={key}
            initial={{ x, y }}
            animate={{ x: xKeys, y: yKeys }}
            transition={{ duration, ease: 'easeInOut', repeat: Infinity, times }}
          >
            <g transform={`rotate(${rot} ${LEAF_SIZE / 2} ${LEAF_SIZE / 2})`}>
              <path d={LEAF_PATH} fill="#04c161" />
            </g>
          </motion.g>
        )
      })}
    </motion.svg>
  )
}

export function AnimatedVetraLogo({
  size = 48,
  duration = 8,
  variant = 'scale',
  className,
}: AnimatedVetraLogoProps) {
  const props = { size, duration }

  switch (variant) {
    case 'movement':
      return (
        <div className={className}>
          <MovementAnimation {...props} inward={10} />
        </div>
      )
    case 'threeStep':
      return (
        <div className={className}>
          <ThreeStepAnimation {...props} duration={6} inward={4} />
        </div>
      )
    case 'scale':
    default:
      return (
        <div className={className}>
          <ScaleAnimation {...props} />
        </div>
      )
  }
}
