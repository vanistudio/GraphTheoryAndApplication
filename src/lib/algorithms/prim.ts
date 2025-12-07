import type { GraphNode, GraphEdge } from "./dijkstra";
import type { MSTEdge } from "./kruskal";

export interface PrimResult {
  mst: MSTEdge[];
  totalWeight: number;
  steps: Array<{
    node: string;
    edge?: MSTEdge;
    action: "add" | "start";
  }>;
}

export function prim(nodes: GraphNode[], edges: GraphEdge[]): PrimResult {
  const mst: MSTEdge[] = [];
  const steps: Array<{ node: string; edge?: MSTEdge; action: "add" | "start" }> = [];
  const visited = new Set<string>();
  const minEdge: Record<string, { weight: number; source: string | null }> = {};

  nodes.forEach((node) => {
    minEdge[node.id] = { weight: Infinity, source: null };
  });

  if (nodes.length === 0) {
    return { mst, totalWeight: 0, steps };
  }

  const startNode = nodes[0].id;
  minEdge[startNode] = { weight: 0, source: null };
  steps.push({ node: startNode, action: "start" });

  const adjacencyList: Record<string, Array<{ target: string; weight: number }>> = {};
  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge) => {
    adjacencyList[edge.source].push({ target: edge.target, weight: edge.weight });
    adjacencyList[edge.target].push({ target: edge.source, weight: edge.weight });
  });

  for (let i = 0; i < nodes.length; i++) {
    let minNode: string | null = null;
    let minWeight = Infinity;

    nodes.forEach((node) => {
      if (!visited.has(node.id) && minEdge[node.id].weight < minWeight) {
        minWeight = minEdge[node.id].weight;
        minNode = node.id;
      }
    });

    if (minNode === null) break;

    visited.add(minNode);

    if (minEdge[minNode].source !== null) {
      const mstEdge: MSTEdge = {
        source: minEdge[minNode].source!,
        target: minNode,
        weight: minEdge[minNode].weight,
      };
      mst.push(mstEdge);
      steps.push({
        node: minNode,
        edge: mstEdge,
        action: "add",
      });
    }

    adjacencyList[minNode].forEach((neighbor) => {
      if (!visited.has(neighbor.target) && neighbor.weight < minEdge[neighbor.target].weight) {
        minEdge[neighbor.target] = {
          weight: neighbor.weight,
          source: minNode,
        };
      }
    });
  }

  const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);

  return {
    mst,
    totalWeight,
    steps,
  };
}

