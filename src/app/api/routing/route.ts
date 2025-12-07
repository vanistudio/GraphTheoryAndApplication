import { NextRequest, NextResponse } from "next/server";

interface RouteResponse {
  code: string;
  routes: Array<{
    distance: number;
    duration: number;
    geometry: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { from, to } = body;

    if (!from || !to || !Array.isArray(from) || !Array.isArray(to)) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const [fromLng, fromLat] = from;
    const [toLng, toLat] = to;

    if (typeof fromLat !== "number" || typeof fromLng !== "number" || typeof toLat !== "number" || typeof toLng !== "number") {
      return NextResponse.json({ error: "Invalid coordinate format" }, { status: 400 });
    }

    const url = `http://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.statusText}`);
    }

    const data: RouteResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const route = data.routes[0];
    
    return NextResponse.json({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
    });
  } catch (error) {
    console.error("Error calculating route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

