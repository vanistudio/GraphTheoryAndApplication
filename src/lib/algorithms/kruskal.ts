import type { GraphNode, GraphEdge } from "./dijkstra";

export interface MSTEdge {
  source: string;
  target: string;
  weight: number;
}

export interface KruskalResult {
  mst: MSTEdge[];
  totalWeight: number;
  steps: Array<{
    edge: MSTEdge;
    action: "add" | "skip";
    reason?: string;
  }>;
}

class UnionFind {
  private parent: Record<string, string>;
  private rank: Record<string, number>;

  constructor(nodes: GraphNode[]) {
    this.parent = {};
    this.rank = {};
    nodes.forEach((node) => {
      this.parent[node.id] = node.id;
      this.rank[node.id] = 0;
    });
  }

  find(x: string): string {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]);
    }
    return this.parent[x];
  }

  union(x: string, y: string): boolean {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX === rootY) return false;

    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }

    return true;
  }
}

export function kruskal(nodes: GraphNode[], edges: GraphEdge[]): KruskalResult {
  const mst: MSTEdge[] = [];
  const steps: Array<{ edge: MSTEdge; action: "add" | "skip"; reason?: string }> = [];
  const unionFind = new UnionFind(nodes);

  const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);

  sortedEdges.forEach((edge) => {
    const mstEdge: MSTEdge = {
      source: edge.source,
      target: edge.target,
      weight: edge.weight,
    };

    if (unionFind.find(edge.source) !== unionFind.find(edge.target)) {
      unionFind.union(edge.source, edge.target);
      mst.push(mstEdge);
      steps.push({
        edge: mstEdge,
        action: "add",
      });
    } else {
      steps.push({
        edge: mstEdge,
        action: "skip",
        reason: "Creates cycle",
      });
    }
  });

  const totalWeight = mst.reduce((sum, edge) => sum + edge.weight, 0);

  return {
    mst,
    totalWeight,
    steps,
  };
}

