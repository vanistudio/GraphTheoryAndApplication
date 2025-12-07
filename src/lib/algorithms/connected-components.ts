import type { GraphNode, GraphEdge } from "@/components/contents/GraphView";

export interface ConnectedComponent {
  nodes: string[];
  size: number;
}

export function findConnectedComponents(
  nodes: GraphNode[],
  edges: GraphEdge[]
): ConnectedComponent[] {
  if (nodes.length === 0) return [];

  const adjList: Record<string, string[]> = {};
  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    adjList[node.id] = [];
  });

  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      if (!adjList[edge.source].includes(edge.target)) {
        adjList[edge.source].push(edge.target);
      }
      if (!adjList[edge.target].includes(edge.source)) {
        adjList[edge.target].push(edge.source);
      }
    }
  });

  const visited = new Set<string>();
  const components: ConnectedComponent[] = [];

  function dfs(nodeId: string, component: string[]) {
    visited.add(nodeId);
    component.push(nodeId);

    for (const neighbor of adjList[nodeId] || []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, component);
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const component: string[] = [];
      dfs(node.id, component);
      components.push({
        nodes: component,
        size: component.length,
      });
    }
  }

  return components.sort((a, b) => b.size - a.size);
}

export function isConnected(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  const components = findConnectedComponents(nodes, edges);
  return components.length === 1;
}

