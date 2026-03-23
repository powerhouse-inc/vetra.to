import type { MetricSeries } from '@/modules/cloud/types'

const COLORS = ['#04c161', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']

type SparklineProps = {
  series: MetricSeries[]
  width?: number
  height?: number
}

export function Sparkline({ series, width = 300, height = 100 }: SparklineProps) {
  const allPoints = series.flatMap((s) => s.datapoints)

  if (allPoints.length === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <text
          x={width / 2}
          y={height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9ea0a1"
          fontSize={12}
        >
          No data
        </text>
      </svg>
    )
  }

  const timestamps = allPoints.map((p) => p.timestamp)
  const values = allPoints.map((p) => p.value)

  const minTs = Math.min(...timestamps)
  const maxTs = Math.max(...timestamps)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)

  const tsRange = maxTs - minTs || 1
  const valRange = maxVal - minVal || 1

  const toX = (ts: number) => ((ts - minTs) / tsRange) * width
  const toY = (val: number) => height - ((val - minVal) / valRange) * height

  const gridLines = [0.25, 0.5, 0.75].map((frac) => frac * height)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {gridLines.map((y, i) => (
        <line key={i} x1={0} y1={y} x2={width} y2={y} stroke="#333" strokeWidth="0.5" />
      ))}

      {series.map((s, si) => {
        if (s.datapoints.length === 0) return null
        const points = s.datapoints
          .map((p) => `${toX(p.timestamp).toFixed(2)},${toY(p.value).toFixed(2)}`)
          .join(' ')
        return (
          <polyline
            key={si}
            points={points}
            fill="none"
            stroke={COLORS[si % COLORS.length]}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}
