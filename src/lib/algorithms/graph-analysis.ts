import type { GraphNode, GraphEdge } from "@/components/contents/GraphView";
import { findConnectedComponents } from "./connected-components";
import { detectCycles } from "./cycle-detection";

export interface GraphInfo {
  isDirected: boolean;
  isWeighted: boolean;
  hasNegativeWeights: boolean;
  nodeCount: number;
  edgeCount: number;
  hasCycles: boolean;
  cycleCount: number;
  isConnected: boolean;
  componentCount: number;
  degrees: Record<string, number>;
  inDegrees: Record<string, number>;
  outDegrees: Record<string, number>;
  adjacencyMatrix: number[][];
  adjacencyList: Record<string, Array<{ target: string; weight: number }>>;
  isComplete: boolean;
  isRegular: boolean;
  regularDegree: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  totalWeight: number;
  averageWeight: number;
}

export function analyzeGraph(
  nodes: GraphNode[],
  edges: GraphEdge[]
): GraphInfo {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const nodeIds = new Set(nodes.map((n) => n.id));
  const nodeIndexMap = new Map(nodes.map((n, i) => [n.id, i]));

  let isDirected = false;
  let hasNegativeWeights = false;
  let minWeight: number | null = null;
  let maxWeight: number | null = null;
  let totalWeight = 0;

  const adjacencyList: Record<string, Array<{ target: string; weight: number }>> = {};
  const degrees: Record<string, number> = {};
  const inDegrees: Record<string, number> = {};
  const outDegrees: Record<string, number> = {};

  nodes.forEach((node) => {
    adjacencyList[node.id] = [];
    degrees[node.id] = 0;
    inDegrees[node.id] = 0;
    outDegrees[node.id] = 0;
  });

  edges.forEach((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      return;
    }

    const weight = edge.weight;
    totalWeight += weight;

    if (minWeight === null || weight < minWeight) {
      minWeight = weight;
    }
    if (maxWeight === null || weight > maxWeight) {
      maxWeight = weight;
    }

    if (weight < 0) {
      hasNegativeWeights = true;
    }

    adjacencyList[edge.source].push({ target: edge.target, weight });

    if (edge.source !== edge.target) {
      degrees[edge.source] = (degrees[edge.source] || 0) + 1;
      degrees[edge.target] = (degrees[edge.target] || 0) + 1;
      outDegrees[edge.source] = (outDegrees[edge.source] || 0) + 1;
      inDegrees[edge.target] = (inDegrees[edge.target] || 0) + 1;
    }

    const reverseEdge = edges.find(
      (e) => e.source === edge.target && e.target === edge.source
    );

    if (!reverseEdge) {
      isDirected = true;
    }
  });

  const adjacencyMatrix: number[][] = [];
  for (let i = 0; i < nodeCount; i++) {
    const row: number[] = [];
    for (let j = 0; j < nodeCount; j++) {
      row.push(0);
    }
    adjacencyMatrix.push(row);
  }

  edges.forEach((edge) => {
    const sourceIdx = nodeIndexMap.get(edge.source);
    const targetIdx = nodeIndexMap.get(edge.target);
    if (sourceIdx !== undefined && targetIdx !== undefined) {
      adjacencyMatrix[sourceIdx][targetIdx] = edge.weight;
      if (!isDirected && sourceIdx !== targetIdx) {
        adjacencyMatrix[targetIdx][sourceIdx] = edge.weight;
      }
    }
  });

  const cycles = detectCycles(nodes, edges);
  const hasCycles = cycles.length > 0;
  const cycleCount = cycles.length;

  const components = findConnectedComponents(nodes, edges);
  const isConnectedGraph = components.length === 1;
  const componentCount = components.length;

  const degreeValues = Object.values(degrees);
  const isComplete =
    nodeCount > 0 &&
    edgeCount === (nodeCount * (nodeCount - 1)) / (isDirected ? 1 : 2);

  const uniqueDegrees = new Set(degreeValues);
  const isRegular = uniqueDegrees.size === 1 && nodeCount > 0;
  const regularDegree = isRegular ? degreeValues[0] : null;

  const averageWeight = edgeCount > 0 ? totalWeight / edgeCount : 0;

  return {
    isDirected,
    isWeighted: edges.some((e) => e.weight !== 1),
    hasNegativeWeights,
    nodeCount,
    edgeCount,
    hasCycles,
    cycleCount,
    isConnected: isConnectedGraph,
    componentCount,
    degrees,
    inDegrees,
    outDegrees,
    adjacencyMatrix,
    adjacencyList,
    isComplete,
    isRegular,
    regularDegree,
    minWeight,
    maxWeight,
    totalWeight,
    averageWeight,
  };
}

