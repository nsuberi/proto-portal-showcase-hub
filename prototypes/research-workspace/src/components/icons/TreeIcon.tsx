interface TreeIconProps {
  className?: string;
  strokeWidth?: number;
}

/**
 * Gardener brand mark — a stylized knowledge tree: a rounded, layered canopy
 * over a short trunk with two roots. Stroke-based (currentColor) so it inherits
 * text color and sits naturally alongside the lucide icon set.
 */
export default function TreeIcon({
  className,
  strokeWidth = 1.8,
}: TreeIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Canopy — three overlapping rounded tiers */}
      <path d="M12 3c-2 0-3.6 1.5-3.8 3.4C6.7 6.7 5.5 8 5.5 9.6c0 .5.1 1 .3 1.4C4.6 11.5 4 12.6 4 13.8 4 15.6 5.5 17 7.3 17h9.4c1.8 0 3.3-1.4 3.3-3.2 0-1.2-.6-2.3-1.8-2.8.2-.4.3-.9.3-1.4 0-1.6-1.2-2.9-2.7-3.2C15.6 4.5 14 3 12 3Z" />
      {/* Trunk */}
      <path d="M12 17v3" />
      {/* Roots — splay down and outward at the base */}
      <path d="M12 20c-.7.4-1.1 1-1.3 1.8M12 20c.7.4 1.1 1 1.3 1.8" />
      {/* Inner branch hint */}
      <path d="M12 14.5v-3M12 12l-1.6-1.4M12 12.5l1.6-1.4" />
    </svg>
  );
}
