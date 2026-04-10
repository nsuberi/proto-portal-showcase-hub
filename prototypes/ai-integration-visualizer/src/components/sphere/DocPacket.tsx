import { C } from "../../lib/colors";

interface DocPacketProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number;
  color?: string;
}

export function DocPacket({
  fromX,
  fromY,
  toX,
  toY,
  progress,
  color = C.doc,
}: DocPacketProps) {
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress - Math.sin(progress * Math.PI) * 20;
  return (
    <g>
      <rect
        x={x - 5} y={y - 4} width={10} height={8} rx={1.5}
        fill={color} opacity={0.7} stroke="white" strokeWidth={0.3} strokeOpacity={0.2}
      />
      <line
        x1={x - 3} y1={y - 1} x2={x + 3} y2={y - 1}
        stroke="white" strokeWidth={0.5} opacity={0.3}
      />
      <line
        x1={x - 3} y1={y + 1} x2={x + 2} y2={y + 1}
        stroke="white" strokeWidth={0.5} opacity={0.2}
      />
    </g>
  );
}
