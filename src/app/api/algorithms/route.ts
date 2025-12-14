import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AlgorithmResult from "@/lib/models/AlgorithmResult";
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { bellmanFord } from "@/lib/algorithms/bellman-ford";
import { kruskal } from "@/lib/algorithms/kruskal";
import { prim } from "@/lib/algorithms/prim";
import { findConnectedComponents, isConnected } from "@/lib/algorithms/connected-components";
import { detectCycles, hasCycle } from "@/lib/algorithms/cycle-detection";
import Graph from "@/lib/models/Graph";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { graphId, algorithm, sourceNode, targetNode } = body;

    if (!graphId || !algorithm) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const graph = await Graph.findOne({ _id: graphId });

    if (!graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }

    let result;

    switch (algorithm) {
      case "dijkstra":
        if (!sourceNode) {
          return NextResponse.json({ error: "Source node required" }, { status: 400 });
        }
        result = await dijkstra(graph.nodes, graph.edges, sourceNode, targetNode);
        break;

      case "bellman-ford":
        if (!sourceNode) {
          return NextResponse.json({ error: "Source node required" }, { status: 400 });
        }
        result = await bellmanFord(graph.nodes, graph.edges, sourceNode, targetNode);
        break;

      case "kruskal":
        result = kruskal(graph.nodes, graph.edges);
        break;

      case "prim":
        result = prim(graph.nodes, graph.edges);
        break;

      case "connected-components":
        result = {
          components: findConnectedComponents(graph.nodes, graph.edges),
          isConnected: isConnected(graph.nodes, graph.edges),
          componentCount: findConnectedComponents(graph.nodes, graph.edges).length,
        };
        break;

      case "cycle-detection":
        result = {
          cycles: detectCycles(graph.nodes, graph.edges),
          hasCycle: hasCycle(graph.nodes, graph.edges),
          cycleCount: detectCycles(graph.nodes, graph.edges).length,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid algorithm" }, { status: 400 });
    }
    const algorithmResult = new AlgorithmResult({
      graphId,
      algorithm,
      result,
      sourceNode,
      targetNode,
    });

    await algorithmResult.save();

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error("Error running algorithm:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

