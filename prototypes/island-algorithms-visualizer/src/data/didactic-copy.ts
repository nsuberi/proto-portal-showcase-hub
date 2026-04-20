import type { AlgorithmId } from "@/types";

interface Entry {
  label: string;
  tagline: string;
  bigO: { time: string; space: string };
  dataStructure: string;
  whenToUse: string[];
  gotchas: string[];
}

export const DIDACTIC: Record<AlgorithmId, Entry> = {
  dfs: {
    label: "DFS",
    tagline: "Depth-first: dive deep, backtrack when stuck.",
    bigO: { time: "O(V + E)", space: "O(V) recursion / explicit stack" },
    dataStructure: "Stack (implicit via recursion, or explicit LIFO)",
    whenToUse: [
      "Connected components / number-of-islands grid problems",
      "Cycle detection in directed graphs",
      "Generating all paths or combinations",
      "Small / moderate depth — beware stack overflow on huge grids (use iterative)",
    ],
    gotchas: [
      "Recursion blows the stack on large inputs — iterate with an explicit list if depth > 1e4.",
      "Mark visited at push time, not pop time, to avoid re-enqueuing.",
      "4-way vs 8-way neighbors matters: islands (4-way) vs. land-mass (8-way).",
    ],
  },

  bfs: {
    label: "BFS",
    tagline: "Breadth-first: expand shells outward from each source.",
    bigO: { time: "O(V + E)", space: "O(V) for queue + visited" },
    dataStructure: "Queue (deque — O(1) popleft in Python)",
    whenToUse: [
      "Shortest path on unweighted graphs (hop count)",
      "Level-by-level processing (rotting oranges, word ladder)",
      "Finding nearest feature from multiple sources (multi-source BFS)",
      "When recursion depth would explode",
    ],
    gotchas: [
      "Do not use a list + pop(0) in Python — it is O(n). Always deque.",
      "Visited must be marked on enqueue, not dequeue, or the same cell enters the queue many times.",
      "For shortest path on a grid, BFS is enough — Dijkstra is overkill until edges have weights.",
    ],
  },

  dijkstra: {
    label: "Dijkstra",
    tagline: "Shortest path when edges have non-negative weights.",
    bigO: { time: "O((V + E) log V)", space: "O(V)" },
    dataStructure: "Min-heap keyed on cumulative distance",
    whenToUse: [
      "Weighted grids or graphs with non-negative edges",
      "Network routing / latency minimization",
      "When BFS would undercount because steps have different costs",
    ],
    gotchas: [
      "Skip stale heap entries: if popped distance > dist[u], continue.",
      "Does NOT handle negative weights — use Bellman-Ford there.",
      "On unweighted graphs, Dijkstra degenerates to BFS with heap overhead — just use BFS.",
    ],
  },

  "dp-max-area": {
    label: "DP · Max Area (Union-Find)",
    tagline: "Union-Find to merge neighbors into components — size tracks the answer.",
    bigO: { time: "O(V · α(V))", space: "O(V)" },
    dataStructure: "Disjoint-Set Union with path compression + union by size",
    whenToUse: [
      "Dynamic connectivity queries (edges arrive over time)",
      "Number of islands when cells are added one-by-one (LC 305)",
      "Kruskal's MST, account merging",
    ],
    gotchas: [
      "Without path compression + union by size, α(n) degrades to O(log n).",
      "Union returns early when roots match — forgetting this double-adds size.",
      "DSU is 'dynamic programming on components' in spirit — not always how people categorize it.",
    ],
  },

  "dp-square": {
    label: "DP · Largest Square",
    tagline: "Classic 2D DP: dp[i][j] = side of largest square ending at (i,j).",
    bigO: { time: "O(W · H)", space: "O(W · H) — can collapse to O(W)" },
    dataStructure: "2D table (or rolling 1D)",
    whenToUse: [
      "Any optimization problem with optimal substructure on a grid",
      "Recurrences of the form f(i,j) = g(f(i-1,j), f(i,j-1), f(i-1,j-1))",
      "Counting paths, edit distance, regex matching, knapsack variants",
    ],
    gotchas: [
      "Always state the subproblem in one sentence before writing the recurrence.",
      "Watch your base cases — row 0 / col 0 are the whole game for many grid DPs.",
      "Collapse to rolling arrays only once the 2D version is verified.",
    ],
  },
};

// Portable "Graphs" cheat-sheet content, cross-linked from the mobile view.
export const CHEATSHEET_PATTERNS = [
  {
    id: "graphs",
    name: "Graphs",
    why: "The Swiss army knife — BFS/DFS show up in disguise constantly. Number of Islands is the archetype.",
    concepts: [
      "BFS / DFS traversal",
      "Shortest path (Dijkstra, BFS unweighted)",
      "Topological sort (Kahn's)",
      "Cycle detection",
      "Connected components / Union-Find",
    ],
    pythonEssentials: [
      { tool: "collections.deque", use: "BFS queue — O(1) popleft" },
      { tool: "collections.defaultdict(list)", use: "Adjacency list builder" },
      { tool: "heapq", use: "Dijkstra's priority queue" },
    ],
    problems: [
      { name: "Number of Islands", id: "200", diff: "Medium", url: "https://leetcode.com/problems/number-of-islands/", focus: "BFS/DFS grid traversal" },
      { name: "Course Schedule II", id: "210", diff: "Medium", url: "https://leetcode.com/problems/course-schedule-ii/", focus: "Topological sort" },
      { name: "Network Delay Time", id: "743", diff: "Medium", url: "https://leetcode.com/problems/network-delay-time/", focus: "Dijkstra" },
      { name: "Word Ladder", id: "127", diff: "Hard", url: "https://leetcode.com/problems/word-ladder/", focus: "BFS shortest path" },
    ],
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    why: "If you can state the subproblem clearly, the code writes itself.",
    concepts: [
      "1D DP (climbing stairs pattern)",
      "2D DP (grid paths, string matching)",
      "Knapsack variations",
      "Interval DP",
      "Memoization via @lru_cache",
    ],
    pythonEssentials: [
      { tool: "@lru_cache(None)", use: "Top-down memoization — instant DP" },
      { tool: "dp = [0]*(n+1)", use: "Bottom-up tabulation" },
    ],
    problems: [
      { name: "Maximal Square", id: "221", diff: "Medium", url: "https://leetcode.com/problems/maximal-square/", focus: "The exact DP this visualizer runs" },
      { name: "Coin Change", id: "322", diff: "Medium", url: "https://leetcode.com/problems/coin-change/", focus: "Unbounded knapsack" },
      { name: "Longest Increasing Subsequence", id: "300", diff: "Medium", url: "https://leetcode.com/problems/longest-increasing-subsequence/", focus: "Classic 1D DP" },
      { name: "Edit Distance", id: "72", diff: "Medium", url: "https://leetcode.com/problems/edit-distance/", focus: "2D string DP" },
    ],
  },
] as const;

// Quick-reference code templates for the cheat sheet.
export const TEMPLATES = [
  {
    name: "BFS (grid)",
    code: `from collections import deque

def bfs(grid, sr, sc):
    R, C = len(grid), len(grid[0])
    q = deque([(sr, sc)])
    seen = {(sr, sc)}
    while q:
        r, c = q.popleft()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r+dr, c+dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] and (nr,nc) not in seen:
                seen.add((nr,nc))
                q.append((nr,nc))`,
  },
  {
    name: "DFS (iterative)",
    code: `def dfs(grid, sr, sc):
    stack = [(sr, sc)]
    seen = {(sr, sc)}
    while stack:
        r, c = stack.pop()
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r+dr, c+dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] and (nr,nc) not in seen:
                seen.add((nr,nc))
                stack.append((nr,nc))`,
  },
  {
    name: "Dijkstra",
    code: `import heapq

def dijkstra(graph, src):
    dist = {src: 0}
    heap = [(0, src)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist`,
  },
  {
    name: "Union-Find",
    code: `class DSU:
    def __init__(self, n):
        self.p = list(range(n))
        self.r = [0]*n
    def find(self, x):
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]
            x = self.p[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb: return False
        if self.r[ra] < self.r[rb]: ra, rb = rb, ra
        self.p[rb] = ra
        if self.r[ra] == self.r[rb]: self.r[ra] += 1
        return True`,
  },
  {
    name: "Maximal Square DP",
    code: `def maximalSquare(mat):
    H, W = len(mat), len(mat[0])
    dp = [[0]*W for _ in range(H)]
    best = 0
    for y in range(H):
        for x in range(W):
            if mat[y][x] == "1":
                t = dp[y-1][x]    if y else 0
                l = dp[y][x-1]    if x else 0
                d = dp[y-1][x-1]  if x and y else 0
                dp[y][x] = min(t, l, d) + 1
                best = max(best, dp[y][x])
    return best * best`,
  },
];
