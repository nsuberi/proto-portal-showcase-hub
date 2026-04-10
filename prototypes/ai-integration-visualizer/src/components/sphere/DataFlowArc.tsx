interface DataFlowArcProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  curveY: number;
  color: string;
  highlight?: boolean;
  annotation?: string;
}

export function DataFlowArc({
  x1,
  y1,
  x2,
  y2,
  curveY,
  color,
  highlight = false,
  annotation,
}: DataFlowArcProps) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 + curveY;
  const path = `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  return (
    <g>
      <path
        d={path} fill="none" stroke={color}
        strokeWidth={highlight ? 0.8 : 0.4} opacity={highlight ? 0.15 : 0.08}
      />
      <path
        d={path} fill="none" stroke={color}
        strokeWidth={highlight ? 2 : 1.5}
        strokeDasharray="5 12" opacity={highlight ? 0.55 : 0.35}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0" to="-34"
          dur="3s" repeatCount="indefinite"
        />
      </path>
      {annotation && (
        <text
          x={mx} y={my - 6} textAnchor="middle"
          fill={color} fontSize="5.5" fontFamily="'IBM Plex Mono', monospace"
          opacity={0.5}
        >
          {annotation}
        </text>
      )}
    </g>
  );
}
