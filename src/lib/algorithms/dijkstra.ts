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
    if (targetId && distances[targetId] !== Infinity) {
      let current: string | null = targetId;
      const visited = new Set<string>();
      
      while (current !== null && current !== sourceId) {
        visited.add(current);
        let bestPrev: string | null = null;
        let found = false;
        
        adjacencyList[current].forEach((neighbor) => {
          if (!visited.has(neighbor.target)) {
            const edge = edges.find(
              (e) =>
                (e.source === neighbor.target && e.target === current) ||
                (e.source === current && e.target === neighbor.target)
            );
            if (edge && current !== null) {
              const expectedDist = distances[neighbor.target] + edge.weight;
              if (Math.abs(expectedDist - distances[current]) < 0.001) {
                if (bestPrev === null) {
                  bestPrev = neighbor.target;
                  found = true;
                } else if (distances[neighbor.target] < distances[bestPrev]) {
                  bestPrev = neighbor.target;
                  found = true;
                }
              }
            }
          }
        });
        
        if (found && bestPrev !== null) {
          previous[current] = bestPrev;
          current = bestPrev;
        } else {
          break;
        }
      }
      if (current === sourceId) {
        previous[sourceId] = null;
      }
    }
    const sortedNodes = [...nodes].sort((a, b) => distances[a.id] - distances[b.id]);
    sortedNodes.forEach((node) => {
      if (distances[node.id] !== Infinity) {
        steps.push({
          node: node.id,
          distance: distances[node.id],
          visited: true,
        });
      }
    });

    const path: string[] = [];
    let distance = 0;
    if (targetId && distances[targetId] !== Infinity) {
      if (targetId === sourceId) {
        path.push(sourceId);
        distance = 0;
      } else {
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
          if (current === sourceId) {
            path.unshift(sourceId);
            break;
          }
        }
        if (path.length > 0 && path[0] !== sourceId) {
          path.unshift(sourceId);
        }
        if (distance === 0 && path.length > 1) {
          distance = distances[targetId];
        }
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

