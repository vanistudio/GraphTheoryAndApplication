import type { GraphNode, GraphEdge } from "@/components/contents/GraphView";

export interface Cycle {
  nodes: string[];
  edges: string[];
}

export function detectCycles(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Cycle[] {
  if (nodes.length === 0 || edges.length === 0) return [];

  const adjList: Record<string, Array<{ target: string; edgeId: string }>> = {};
  const nodeIds = new Set(nodes.map((n) => n.id));

  nodes.forEach((node) => {
    adjList[node.id] = [];
  });

  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjList[edge.source].push({ target: edge.target, edgeId: edge.id });
      adjList[edge.target].push({ target: edge.source, edgeId: edge.id });
    }
  });

  const cycles: Cycle[] = [];
  const visited = new Set<string>();
  const parent: Record<string, string | null> = {};
  const edgePath: Record<string, string> = {};

  function dfs(nodeId: string, prevNodeId: string | null, prevEdgeId: string | null) {
    visited.add(nodeId);
    parent[nodeId] = prevNodeId;
    if (prevEdgeId) {
      edgePath[nodeId] = prevEdgeId;
    }

    for (const { target, edgeId } of adjList[nodeId] || []) {
      if (target === prevNodeId) continue;

      if (visited.has(target)) {
        const cycleNodes: string[] = [];
        const cycleEdges: string[] = [];
        let current: string | null = nodeId;

        while (current && current !== target) {
          cycleNodes.push(current);
          if (edgePath[current]) {
            cycleEdges.push(edgePath[current]);
          }
          current = parent[current] || null;
        }

        if (current === target) {
          cycleNodes.push(target);
          cycleNodes.push(nodeId);
          if (edgeId) {
            cycleEdges.push(edgeId);
          }

          const cycleKey = cycleNodes.sort().join("-");
          const existingCycle = cycles.find(
            (c) => c.nodes.sort().join("-") === cycleKey
          );

          if (!existingCycle && cycleNodes.length >= 3) {
            cycles.push({
              nodes: cycleNodes,
              edges: cycleEdges,
            });
          }
        }
      } else {
        dfs(target, nodeId, edgeId);
      }
    }
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, null, null);
    }
  }

  return cycles;
}

export function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
  return detectCycles(nodes, edges).length > 0;
}

