import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Graph from "@/lib/models/Graph";

export async function GET() {
  try {
    await connectDB();

    const graphs = await Graph.find().sort({ createdAt: -1 });

    return NextResponse.json({ graphs });
  } catch (error) {
    console.error("Error fetching graphs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, nodes, edges } = body;

    if (!name || !nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Missing required fields: name and nodes are required" }, { status: 400 });
    }

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Missing required fields: edges must be an array" }, { status: 400 });
    }

    const graph = new Graph({
      name,
      nodes,
      edges,
    });

    await graph.save();

    return NextResponse.json({ graph }, { status: 201 });
  } catch (error) {
    console.error("Error creating graph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

