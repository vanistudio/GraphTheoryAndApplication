import type { GraphNode, GraphEdge } from "./dijkstra";

export interface BellmanFordResult {
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  path: string[];
  distance: number;
  hasNegativeCycle: boolean;
  steps: Array<{
    iteration: number;
    node: string;
    distance: number;
    updated: boolean;
  }>;
}

export function bellmanFord(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId?: string
): BellmanFordResult {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const steps: Array<{ iteration: number; node: string; distance: number; updated: boolean }> = [];
  nodes.forEach((node) => {
    distances[node.id] = node.id === sourceId ? 0 : Infinity;
    previous[node.id] = null;
  });
  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    edges.forEach((edge) => {
      const u = edge.source;
      const v = edge.target;
      const w = edge.weight;

      if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
        distances[v] = distances[u] + w;
        previous[v] = u;
        updated = true;
        steps.push({
          iteration: i + 1,
          node: v,
          distance: distances[v],
          updated: true,
        });
      }
      if (distances[v] !== Infinity && distances[v] + w < distances[u]) {
        distances[u] = distances[v] + w;
        previous[u] = v;
        updated = true;
        steps.push({
          iteration: i + 1,
          node: u,
          distance: distances[u],
          updated: true,
        });
      }
    });

    if (!updated) break;
  }
  let hasNegativeCycle = false;
  edges.forEach((edge) => {
    const u = edge.source;
    const v = edge.target;
    const w = edge.weight;

    if (distances[u] !== Infinity && distances[u] + w < distances[v]) {
      hasNegativeCycle = true;
    }
    if (distances[v] !== Infinity && distances[v] + w < distances[u]) {
      hasNegativeCycle = true;
    }
  });
  const path: string[] = [];
  let distance = 0;
  if (targetId && !hasNegativeCycle && previous[targetId] !== null) {
    let current: string | null = targetId;
    while (current !== null) {
      path.unshift(current);
      const prev: string | null = previous[current] ?? null;
      if (prev !== null) {
        const edge = edges.find(
          (e) =>
            (e.source === prev && e.target === current) ||
            (e.source === current && e.target === prev)
        );
        if (edge) distance += edge.weight;
      }
      current = prev;
    }
  }

  return {
    distances,
    previous,
    path,
    distance,
    hasNegativeCycle,
    steps,
  };
}

