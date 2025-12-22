import { NextRequest, NextResponse } from "next/server";
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { bellmanFord } from "@/lib/algorithms/bellman-ford";
import { kruskal } from "@/lib/algorithms/kruskal";
import { prim } from "@/lib/algorithms/prim";
import { findConnectedComponents, isConnected } from "@/lib/algorithms/connected-components";
import { detectCycles, hasCycle } from "@/lib/algorithms/cycle-detection";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodes, edges, algorithm, sourceNode, targetNode } = body;

    if (!nodes || !Array.isArray(nodes) || !edges || !Array.isArray(edges) || !algorithm) {
      return NextResponse.json({ error: "Missing required fields: nodes, edges, and algorithm are required" }, { status: 400 });
    }

    let result;

    switch (algorithm) {
      case "dijkstra":
        if (!sourceNode) {
          return NextResponse.json({ error: "Source node required" }, { status: 400 });
        }
        result = await dijkstra(nodes, edges, sourceNode, targetNode);
        break;

      case "bellman-ford":
        if (!sourceNode) {
          return NextResponse.json({ error: "Source node required" }, { status: 400 });
        }
        result = await bellmanFord(nodes, edges, sourceNode, targetNode);
        break;

      case "kruskal":
        result = await kruskal(nodes, edges);
        break;

      case "prim":
        result = await prim(nodes, edges);
        break;

      case "connected-components":
        result = {
          components: findConnectedComponents(nodes, edges),
          isConnected: isConnected(nodes, edges),
          componentCount: findConnectedComponents(nodes, edges).length,
        };
        break;

      case "cycle-detection":
        result = {
          cycles: detectCycles(nodes, edges),
          hasCycle: hasCycle(nodes, edges),
          cycleCount: detectCycles(nodes, edges).length,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid algorithm" }, { status: 400 });
    }

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Error running algorithm:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

