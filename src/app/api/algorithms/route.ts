import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import AlgorithmResult from "@/lib/models/AlgorithmResult";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { bellmanFord } from "@/lib/algorithms/bellman-ford";
import { kruskal } from "@/lib/algorithms/kruskal";
import { prim } from "@/lib/algorithms/prim";
import Graph from "@/lib/models/Graph";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { graphId, algorithm, sourceNode, targetNode } = body;

    if (!graphId || !algorithm) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const graph = await Graph.findOne({ _id: graphId, userId: session.user.id });

    if (!graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }

    let result;

    switch (algorithm) {
      case "dijkstra":
        if (!sourceNode) {
          return NextResponse.json({ error: "Source node required" }, { status: 400 });
        }
        result = dijkstra(graph.nodes, graph.edges, sourceNode, targetNode);
        break;

      case "bellman-ford":
        if (!sourceNode) {
          return NextResponse.json({ error: "Source node required" }, { status: 400 });
        }
        result = bellmanFord(graph.nodes, graph.edges, sourceNode, targetNode);
        break;

      case "kruskal":
        result = kruskal(graph.nodes, graph.edges);
        break;

      case "prim":
        result = prim(graph.nodes, graph.edges);
        break;

      default:
        return NextResponse.json({ error: "Invalid algorithm" }, { status: 400 });
    }
    const algorithmResult = new AlgorithmResult({
      graphId,
      userId: session.user.id,
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

