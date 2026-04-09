import type { Domain } from "../types";
import { DOMAIN_LABELS } from "../types";

interface Props {
  active: Domain[];
  onToggle: (domain: Domain) => void;
}

const DOMAIN_STYLES: Record<Domain, { active: string; inactive: string }> = {
  distributed: {
    active: "bg-domain-distributed/20 text-domain-distributed border-domain-distributed/40",
    inactive: "text-domain-distributed/60 border-transparent hover:border-domain-distributed/20",
  },
  music: {
    active: "bg-domain-music/20 text-domain-music border-domain-music/40",
    inactive: "text-domain-music/60 border-transparent hover:border-domain-music/20",
  },
  architecture: {
    active: "bg-domain-architecture/20 text-domain-architecture border-domain-architecture/40",
    inactive: "text-domain-architecture/60 border-transparent hover:border-domain-architecture/20",
  },
  ml: {
    active: "bg-domain-ml/20 text-domain-ml border-domain-ml/40",
    inactive: "text-domain-ml/60 border-transparent hover:border-domain-ml/20",
  },
};

const DOMAINS: Domain[] = ["distributed", "music", "architecture", "ml"];

export default function DomainFilter({ active, onToggle }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {DOMAINS.map((domain) => {
        const isActive = active.includes(domain);
        const styles = DOMAIN_STYLES[domain];
        return (
          <button
            key={domain}
            onClick={() => onToggle(domain)}
            className={`font-label text-xs px-3 py-1.5 rounded-full border transition-all ${
              isActive ? styles.active : styles.inactive
            } bg-surface-container-low`}
          >
            {DOMAIN_LABELS[domain]}
          </button>
        );
      })}
    </div>
  );
}
