'use client'

import { useMemo, useId, type CSSProperties } from 'react'

interface GridBackgroundProps {
  squareSize?: number
  strokeWidth?: number
  strokeColor?: string
  topFadeDistance?: number
  topFadeIntensity?: number
  bottomFadeDistance?: number
  bottomFadeIntensity?: number
  leftFadeDistance?: number
  leftFadeIntensity?: number
  rightFadeDistance?: number
  rightFadeIntensity?: number
  style?: CSSProperties
  className?: string
}

export function GridBackground(props: GridBackgroundProps) {
  const {
    squareSize = 50,
    strokeWidth = 2,
    strokeColor = '#000000',
    topFadeDistance = 20,
    topFadeIntensity = 80,
    bottomFadeDistance = 20,
    bottomFadeIntensity = 80,
    leftFadeDistance = 20,
    leftFadeIntensity = 80,
    rightFadeDistance = 20,
    rightFadeIntensity = 80,
    className = '',
  } = props

  const id = useId()

  const gridSvg = useMemo(() => {
    const maskId = `fade-mask-${id}`

    const gridSvg = (
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <defs>
          <pattern
            id={`grid-${maskId}`}
            x="0"
            y="0"
            width={squareSize}
            height={squareSize}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width={squareSize}
              height={squareSize}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </pattern>

          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            {/* Top fade */}
            {topFadeDistance > 0 && (
              <rect
                x="0"
                y="0"
                width="100%"
                height={`${topFadeDistance}%`}
                fill={`url(#topGradient-${maskId})`}
              />
            )}
            {/* Bottom fade */}
            {bottomFadeDistance > 0 && (
              <rect
                x="0"
                y={`${100 - bottomFadeDistance}%`}
                width="100%"
                height={`${bottomFadeDistance}%`}
                fill={`url(#bottomGradient-${maskId})`}
              />
            )}
            {/* Left fade */}
            {leftFadeDistance > 0 && (
              <rect
                x="0"
                y="0"
                width={`${leftFadeDistance}%`}
                height="100%"
                fill={`url(#leftGradient-${maskId})`}
              />
            )}
            {/* Right fade */}
            {rightFadeDistance > 0 && (
              <rect
                x={`${100 - rightFadeDistance}%`}
                y="0"
                width={`${rightFadeDistance}%`}
                height="100%"
                fill={`url(#rightGradient-${maskId})`}
              />
            )}
          </mask>

          {/* Gradient definitions */}
          <linearGradient id={`topGradient-${maskId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" stopOpacity={1 - topFadeIntensity / 100} />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`bottomGradient-${maskId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="black" stopOpacity={1 - bottomFadeIntensity / 100} />
          </linearGradient>
          <linearGradient id={`leftGradient-${maskId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="black" stopOpacity={leftFadeIntensity / 100} />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`rightGradient-${maskId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="black" stopOpacity={rightFadeIntensity / 100} />
          </linearGradient>
        </defs>

        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill={`url(#grid-${maskId})`}
          mask={`url(#${maskId})`}
        />
      </svg>
    )

    return gridSvg
  }, [
    squareSize,
    strokeWidth,
    strokeColor,
    topFadeDistance,
    topFadeIntensity,
    bottomFadeDistance,
    bottomFadeIntensity,
    leftFadeDistance,
    leftFadeIntensity,
    rightFadeDistance,
    rightFadeIntensity,
    id,
  ])

  return (
    <div
      className={className}
      style={{
        ...props.style,
        position: 'relative',
        width: '100%',
        height: '100%',
        minWidth: '5px',
        minHeight: '5px',
        overflow: 'hidden',
      }}
    >
      {gridSvg}
    </div>
  )
}
