import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    return NextResponse.json({ error: "Graph not found" }, { status: 404 });
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
    const { id } = await params;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting graph:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

