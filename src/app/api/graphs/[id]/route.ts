import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Graph from "@/lib/models/Graph";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const graph = await Graph.findOne({ _id: id });

    if (!graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }

    return NextResponse.json({ graph });
  } catch (error) {
    console.error("Error fetching graph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const graph = await Graph.findOneAndDelete({ _id: id });

    if (!graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting graph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

