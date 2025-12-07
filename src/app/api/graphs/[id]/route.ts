import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Graph from "@/lib/models/Graph";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const graph = await Graph.findOne({ _id: id, userId: session.user.id });

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
    const auth = await getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const graph = await Graph.findOneAndDelete({ _id: id, userId: session.user.id });

    if (!graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting graph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

