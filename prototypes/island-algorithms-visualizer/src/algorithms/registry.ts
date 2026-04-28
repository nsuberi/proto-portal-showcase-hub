import type { AlgorithmEntry, AlgorithmMeta } from "./types";
import { dfsSteps } from "./dfs";
import { bfsSteps } from "./bfs";
import { dijkstraSteps } from "./dijkstra";
import { dpMaxAreaSteps, dpMaxSquareSteps } from "./dynamic";
import { PSEUDOCODE } from "@/data/pseudocode";
import { DIDACTIC } from "@/data/didactic-copy";

function meta(id: AlgorithmMeta["id"]): AlgorithmMeta {
  return {
    id,
    label: DIDACTIC[id].label,
    tagline: DIDACTIC[id].tagline,
    bigO: DIDACTIC[id].bigO,
    dataStructure: DIDACTIC[id].dataStructure,
    whenToUse: DIDACTIC[id].whenToUse,
    gotchas: DIDACTIC[id].gotchas,
    pseudocode: PSEUDOCODE[id],
    requiresWeighted: id === "dijkstra",
    requires3DAware: id === "dp-square" ? false : undefined,
  };
}

export const ALGORITHMS: Record<AlgorithmMeta["id"], AlgorithmEntry> = {
  dfs: { meta: meta("dfs"), runner: dfsSteps },
  bfs: { meta: meta("bfs"), runner: bfsSteps },
  dijkstra: { meta: meta("dijkstra"), runner: dijkstraSteps },
  "dp-max-area": { meta: meta("dp-max-area"), runner: dpMaxAreaSteps },
  "dp-square": { meta: meta("dp-square"), runner: dpMaxSquareSteps },
};

export const ALGORITHM_ORDER: AlgorithmMeta["id"][] = [
  "dfs",
  "bfs",
  "dijkstra",
  "dp-max-area",
  "dp-square",
];
