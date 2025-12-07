export interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

export async function searchPlaces(query: string): Promise<GeocodingResult[]> {
  if (!query.trim() || query.length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `extratags=1`,
      {
        headers: {
          "User-Agent": "DeliveryOptimizer/1.0",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();
    return data.map((item: GeocodingResult) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
      boundingbox: item.boundingbox,
    }));
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

