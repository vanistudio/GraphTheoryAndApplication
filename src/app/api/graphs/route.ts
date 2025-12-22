import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ graphs: [] }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nodes, edges } = body;

    if (!name || !nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: "Missing required fields: name and nodes are required" }, { status: 400 });
    }

    if (!edges || !Array.isArray(edges)) {
      return NextResponse.json({ error: "Missing required fields: edges must be an array" }, { status: 400 });
    }
    const graph = {
      _id: `temp_${Date.now()}`,
      name,
      nodes,
      edges,
      createdAt: new Date(),
    };

    return NextResponse.json({ graph }, { status: 201 });
  } catch (error) {
    console.error("Error creating graph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

