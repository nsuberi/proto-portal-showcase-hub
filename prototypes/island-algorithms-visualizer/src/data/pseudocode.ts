import type { AlgorithmId } from "@/types";

export const PSEUDOCODE: Record<AlgorithmId, string> = {
  dfs: `def num_islands(grid):
    count = 0
    for (x, y) in cells:
        if grid[x][y] == 1 and not visited[x][y]:
            count += 1
            stack = [(x, y)]
            while stack:
                cx, cy = stack[-1]
                nxt = next_unvisited_neighbor(cx, cy)
                if nxt:
                    visited[nxt] = True
                    stack.append(nxt)
                else:
                    stack.pop()
    return count`,

  bfs: `def bfs_islands(grid):
    count = 0
    dist = {}
    for start in cells:
        if grid[start] == 1 and start not in dist:
            count += 1
            dist[start] = 0
            q = deque([start])
            while q:
                u = q.popleft()
                for v in neighbors(u):
                    if grid[v] == 1 and v not in dist:
                        dist[v] = dist[u] + 1
                        q.append(v)
    return count`,

  dijkstra: `def dijkstra(grid, src, dst):
    dist = {src: 0}
    heap = [(0, src)]
    while heap:
        d, u = heappop(heap)
        if d > dist[u]:
            continue                    # stale
        if u == dst:
            return d
        for v in neighbors(u):
            nd = d + weight(v)
            if nd < dist.get(v, INF):
                dist[v] = nd
                heappush(heap, (nd, v))
    return INF`,

  "dp-max-area": `def max_area_dsu(grid):
    parent = list(range(n))
    size   = [1 if grid[i] else 0 for i in range(n)]
    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i
    for (u, v) in edges:
        if grid[u] and grid[v]:
            ra, rb = find(u), find(v)
            if ra != rb:
                parent[ra] = rb
                size[rb] += size[ra]
    return max(size)`,

  "dp-square": `def maximal_square(grid):
    H, W = len(grid), len(grid[0])
    dp = [[0]*W for _ in range(H)]
    best = 0
    for y in range(H):
        for x in range(W):
            if grid[y][x]:
                top  = dp[y-1][x]   if y else 0
                left = dp[y][x-1]   if x else 0
                diag = dp[y-1][x-1] if x and y else 0
                dp[y][x] = min(top, left, diag) + 1
                best = max(best, dp[y][x])
    return best * best`,
};
