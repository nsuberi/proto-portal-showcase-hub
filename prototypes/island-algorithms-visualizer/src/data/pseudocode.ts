import type { AlgorithmId } from "@/types";

/**
 * These are *runnable* Python reference implementations. The runner files
 * (`src/algorithms/*.ts`) emit step numbers that correspond line-for-line
 * to the text below — so when a generator yields `sourceLine: X`, the
 * highlight in the codex lands on the Python line the TS is mimicking at
 * that moment.
 *
 * Keep each function self-contained and executable. Mutating this text
 * requires updating the matching `LINE` constants in the corresponding
 * algorithm file.
 */
export const PSEUDOCODE: Record<AlgorithmId, string> = {
  // Line indices are 1-based in the UI.
  dfs: `def num_islands(grid):
    visited = [[False] * len(grid[0]) for _ in range(len(grid))]
    count = 0
    for y in range(len(grid)):
        for x in range(len(grid[0])):
            if not grid[y][x] or visited[y][x]:
                continue
            count += 1
            stack = [(x, y)]
            visited[y][x] = True
            while stack:
                cx, cy = stack[-1]
                nxt = next_unvisited_neighbor(grid, visited, cx, cy)
                if nxt:
                    nx, ny = nxt
                    visited[ny][nx] = True
                    stack.append((nx, ny))
                else:
                    stack.pop()
    return count`,

  bfs: `def bfs_islands(grid):
    dist = {}
    count = 0
    for y in range(len(grid)):
        for x in range(len(grid[0])):
            if not grid[y][x] or (x, y) in dist:
                continue
            count += 1
            dist[(x, y)] = 0
            q = deque([(x, y)])
            while q:
                cx, cy = q.popleft()
                for nx, ny in neighbors(grid, cx, cy):
                    if grid[ny][nx] and (nx, ny) not in dist:
                        dist[(nx, ny)] = dist[(cx, cy)] + 1
                        q.append((nx, ny))
    return count`,

  dijkstra: `def dijkstra(grid, src, dst):
    dist = {src: 0}
    parent = {src: None}
    heap = [(0, src)]
    while heap:
        d, u = heappop(heap)
        if d > dist[u]:
            continue
        if u == dst:
            return d, reconstruct(parent, dst)
        for v in neighbors(grid, *u):
            nd = d + weight(grid, v)
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                parent[v] = u
                heappush(heap, (nd, v))
    return float('inf'), []`,

  "dp-max-area": `def max_area_dsu(grid):
    n = len(grid) * len(grid[0])
    parent = list(range(n))
    size = [1 if cell else 0 for row in grid for cell in row]
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for y in range(len(grid)):
        for x in range(len(grid[0])):
            if not grid[y][x]:
                continue
            for nx, ny in neighbors(grid, x, y):
                if not grid[ny][nx]:
                    continue
                ra, rb = find(flat(x, y)), find(flat(nx, ny))
                if ra == rb:
                    continue
                if size[ra] < size[rb]:
                    ra, rb = rb, ra
                parent[rb] = ra
                size[ra] += size[rb]
                size[rb] = 0
    return max(size)`,

  "dp-square": `def maximal_square(grid):
    H, W = len(grid), len(grid[0])
    dp = [[0] * W for _ in range(H)]
    best = 0
    for y in range(H):
        for x in range(W):
            if not grid[y][x]:
                continue
            top  = dp[y - 1][x]     if y else 0
            left = dp[y][x - 1]     if x else 0
            diag = dp[y - 1][x - 1] if x and y else 0
            dp[y][x] = min(top, left, diag) + 1
            best = max(best, dp[y][x])
    return best * best`,
};
