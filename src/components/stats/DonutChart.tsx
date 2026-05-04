// ─── DonutChart ───────────────────────────────────────────────────────────────
// SVG donut chart using stroke-dasharray technique.
// Satisfies Req 5 AC 1 & 2.

interface DonutChartProps {
  segments: Array<{ color: string; value: number }>
  totalLabel: string
  size?: number
}

export default function DonutChart({ segments, totalLabel, size = 200 }: DonutChartProps) {
  const r = (size / 2) * 0.7
  const circumference = 2 * Math.PI * r
  const strokeWidth = size * 0.12
  const center = size / 2

  const total = segments.reduce((sum, s) => sum + s.value, 0)

  // Split totalLabel into up to two lines on space
  const labelParts = totalLabel.split(' ')
  const line1 = labelParts[0] ?? ''
  const line2 = labelParts.slice(1).join(' ')

  // No data: render a single gray placeholder circle
  if (total === 0 || segments.length === 0) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="No data available"
        role="img"
      >
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="var(--color-surface-container-high)"
          strokeWidth={strokeWidth}
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.1}
          fill="var(--color-on-surface-variant)"
          fontFamily="inherit"
        >
          {totalLabel}
        </text>
      </svg>
    )
  }

  // Build segments with cumulative offsets
  let cumulativeDash = 0
  const renderedSegments = segments.map((seg, i) => {
    const dash = (seg.value / total) * circumference
    const gap = circumference - dash
    // Offset: start at top (-90deg = -circumference/4), then add cumulative
    const offset = circumference / 4 - cumulativeDash
    cumulativeDash += dash

    return (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={seg.color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={offset}
        strokeLinecap="butt"
      />
    )
  })

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Donut chart. Total: ${totalLabel}`}
      role="img"
    >
      {renderedSegments}

      {/* Center label */}
      {line2 ? (
        <>
          <text
            x={center}
            y={center - size * 0.06}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.12}
            fontWeight="600"
            fill="var(--color-on-surface)"
            fontFamily="inherit"
          >
            {line1}
          </text>
          <text
            x={center}
            y={center + size * 0.08}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.1}
            fontWeight="500"
            fill="var(--color-on-surface-variant)"
            fontFamily="inherit"
          >
            {line2}
          </text>
        </>
      ) : (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={size * 0.12}
          fontWeight="600"
          fill="var(--color-on-surface)"
          fontFamily="inherit"
        >
          {line1}
        </text>
      )}
    </svg>
  )
}
