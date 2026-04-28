interface SpotlightProps {
  fromX: number;
  fromY: number;
  toX: number | null;
  toY: number | null;
  color: string;
  active?: boolean;
  label?: string | null;
}

export function Spotlight({
  fromX,
  fromY,
  toX,
  toY,
  color,
  active = true,
  label = null,
}: SpotlightProps) {
  if (!active || toX == null || toY == null) return null;
  return (
    <g>
      <line
        x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={color} strokeWidth={12} opacity={0.03} strokeLinecap="round"
      />
      <line
        x1={fromX} y1={fromY} x2={toX} y2={toY}
        stroke={color} strokeWidth={2} opacity={0.18} strokeDasharray="2 5"
      >
        <animate
          attributeName="strokeDashoffset"
          from="0" to="-14"
          dur="1.5s" repeatCount="indefinite"
        />
      </line>
      <circle cx={toX} cy={toY} r={10} fill={color} opacity={0.06} />
      <circle
        cx={toX} cy={toY} r={4}
        fill="none" stroke={color} strokeWidth={0.8} opacity={0.2}
      />
      {label && (
        <text
          x={toX} y={toY + 18} textAnchor="middle"
          fill={color} fontSize="6" fontFamily="'IBM Plex Mono', monospace"
          opacity={0.35}
        >
          {label}
        </text>
      )}
    </g>
  );
}
