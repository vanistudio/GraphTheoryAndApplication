import type { GraphNode, GraphEdge } from "./dijkstra";

export interface GraphColoringResult {
  colors: Record<string, number>;
  numColors: number;
  steps: Array<{
    node: string;
    color: number;
    reason?: string;
  }>;
}

export function graphColoring(nodes: GraphNode[], edges: GraphEdge[]): GraphColoringResult {
  const colors: Record<string, number> = {};
  const steps: Array<{ node: string; color: number; reason?: string }> = [];

  const adjacencyList: Record<string, string[]> = {};
  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
  });

  edges.forEach((edge) => {
    if (!adjacencyList[edge.source].includes(edge.target)) {
      adjacencyList[edge.source].push(edge.target);
    }
    if (!adjacencyList[edge.target].includes(edge.source)) {
      adjacencyList[edge.target].push(edge.source);
    }
  });

  nodes.forEach((node) => {
    const usedColors = new Set<number>();

    adjacencyList[node.id].forEach((neighbor) => {
      if (colors[neighbor] !== undefined) {
        usedColors.add(colors[neighbor]);
      }
    });

    let color = 0;
    while (usedColors.has(color)) {
      color++;
    }

    colors[node.id] = color;
    steps.push({
      node: node.id,
      color,
      reason: `Smallest color not used by neighbors`,
    });
  });

  const numColors = Math.max(...Object.values(colors), -1) + 1;

  return {
    colors,
    numColors,
    steps,
  };
}

