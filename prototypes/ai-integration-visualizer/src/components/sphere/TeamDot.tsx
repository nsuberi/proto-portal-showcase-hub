interface TeamDotProps {
  x: number;
  y: number;
  color: string;
  pulse?: boolean;
  size?: number;
}

export function TeamDot({ x, y, color, pulse = false, size = 5 }: TeamDotProps) {
  return (
    <g>
      {pulse && (
        <circle cx={x} cy={y} r={size * 2.5} fill={color} opacity={0.06}>
          <animate
            attributeName="r"
            values={`${size * 2};${size * 3.5};${size * 2}`}
            dur="2.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.06;0.12;0.06"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle cx={x} cy={y} r={size} fill={color} opacity={0.8} />
      <circle cx={x} cy={y} r={size * 0.4} fill="white" opacity={0.3} />
    </g>
  );
}
