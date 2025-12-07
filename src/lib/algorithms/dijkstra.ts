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

export async function dijkstra(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId?: string
): Promise<DijkstraResult> {
  if (typeof window === "undefined") {
    return dijkstraTS(nodes, edges, sourceId, targetId);
  }

  try {
    const { loadWasmModule, dijkstraWasm } = await import("./wasm-loader");
    await loadWasmModule();

    const nodeIndexMap = new Map<string, number>();
    nodes.forEach((node, index) => {
      nodeIndexMap.set(node.id, index);
    });

    const sourceIndex = nodeIndexMap.get(sourceId);
    if (sourceIndex === undefined) {
      throw new Error("Source node not found");
    }

    const n = nodes.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(Infinity));
    
    nodes.forEach((_, i) => {
      matrix[i][i] = 0;
    });

    edges.forEach((edge) => {
      const u = nodeIndexMap.get(edge.source);
      const v = nodeIndexMap.get(edge.target);
      if (u !== undefined && v !== undefined) {
        matrix[u][v] = edge.weight;
        matrix[v][u] = edge.weight;
      }
    });

    const wasmDistances = dijkstraWasm(n, sourceIndex, matrix);

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const steps: Array<{ node: string; distance: number; visited: boolean }> = [];

    nodes.forEach((node, index) => {
      distances[node.id] = wasmDistances[index];
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

    const visited = new Set<string>();
    const sortedNodes = [...nodes].sort((a, b) => distances[a.id] - distances[b.id]);
    
    for (const node of sortedNodes) {
      if (distances[node.id] === Infinity) break;
      if (visited.has(node.id)) continue;
      
      visited.add(node.id);
      steps.push({
        node: node.id,
        distance: distances[node.id],
        visited: true,
      });

      if (targetId && node.id === targetId) break;

      adjacencyList[node.id].forEach((neighbor) => {
        const alt = distances[node.id] + neighbor.weight;
        if (alt < distances[neighbor.target]) {
          distances[neighbor.target] = alt;
          previous[neighbor.target] = node.id;
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
  } catch (error) {
    if (typeof window !== "undefined") {
      console.warn("WASM failed, falling back to TypeScript implementation:", error);
    }
    return dijkstraTS(nodes, edges, sourceId, targetId);
  }
}

function dijkstraTS(
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

