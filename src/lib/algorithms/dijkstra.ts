export interface GraphNode {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface DijkstraResult {
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  path: string[];
  distance: number;
  steps: Array<{
    node: string;
    distance: number;
    visited: boolean;
  }>;
}

export function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId?: string
): DijkstraResult {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const steps: Array<{ node: string; distance: number; visited: boolean }> = [];

  nodes.forEach((node) => {
    distances[node.id] = node.id === sourceId ? 0 : Infinity;
    previous[node.id] = null;
  });

  const adjacencyList: Record<string, Array<{ target: string; weight: number }>> = {};
  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge) => {
    adjacencyList[edge.source].push({ target: edge.target, weight: edge.weight });
    adjacencyList[edge.target].push({ target: edge.source, weight: edge.weight });
  });

  while (visited.size < nodes.length) {
    let minNode: string | null = null;
    let minDistance = Infinity;

    nodes.forEach((node) => {
      if (!visited.has(node.id) && distances[node.id] < minDistance) {
        minDistance = distances[node.id];
        minNode = node.id;
      }
    });

    if (minNode === null || minDistance === Infinity) break;

    visited.add(minNode);
    steps.push({
      node: minNode,
      distance: distances[minNode],
      visited: true,
    });

    if (targetId && minNode === targetId) break;

    adjacencyList[minNode].forEach((neighbor) => {
      if (!visited.has(neighbor.target)) {
        const alt = distances[minNode!]! + neighbor.weight;
        if (alt < distances[neighbor.target]) {
          distances[neighbor.target] = alt;
          previous[neighbor.target] = minNode;
        }
      }
    });
  }

  const path: string[] = [];
  let distance = 0;
  if (targetId && previous[targetId] !== null) {
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
    steps,
  };
}

