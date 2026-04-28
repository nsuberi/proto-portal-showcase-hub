/** Root — who you are: background, skills, internalized knowledge */
export interface Root {
  id: string;
  label: string;
  confidence: number; // 0-1
  source: "stated" | "inferred" | "internalized";
  internalizedFrom?: string; // branchId if this was once an intention
  createdAt: string;
}

/** Branch — active intentions: what you're reaching toward */
export interface Branch {
  id: string;
  title: string;
  description: string;
  status: "growing" | "flowering" | "internalizing" | "rooted";
  parentBranchId?: string;
  rootConnections: string[]; // root ids that feed this branch
  createdAt: string;
  lastActiveAt: string;
}

/** Leaf — information artifacts: research the agent produces */
export interface Leaf {
  id: string;
  branchId: string;
  type: "markdown" | "code" | "diagram" | "reference";
  filePath: string; // path in vault
  summary: string;
  createdAt: string;
}

/** Flower — personal insights: what resonated with YOU */
export interface Flower {
  id: string;
  branchId: string;
  leafId?: string; // the specific artifact it came from
  rootConnections: string[]; // which parts of identity it touches
  insight: string; // the resonant insight itself
  published: boolean;
  publishedAt?: string;
  createdAt: string;
}

/** Connection — edges in the knowledge graph */
export interface Connection {
  from: string;
  to: string;
  type: "feeds" | "led_to" | "internalized_as" | "branched_from";
  label?: string;
}

/** The full Banyan Tree stored as .tree.json in the vault */
export interface BanyanTree {
  version: 1;
  roots: Root[];
  branches: Branch[];
  leaves: Leaf[];
  flowers: Flower[];
  connections: Connection[];
  lastModified: string;
}
