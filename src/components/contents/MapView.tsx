"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Route, X, Search, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { loadWasmModule } from "@/lib/algorithms/wasm-loader";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

const customButtonShadow = "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  type: "shipper" | "delivery";
}

type MapMode = "light" | "dark" | "satellite";

function MapStyleUpdater({ mode }: { mode: MapMode }) {
  const map = useMap();

  useEffect(() => {
    if (mode === "satellite") {
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}");
        }
      });
    } else if (mode === "dark") {
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png");
        }
      });
    } else {
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          layer.setUrl("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
        }
      });
    }
  }, [map, mode]);

  return null;
}

export default function MapView() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [mapMode, setMapMode] = useState<MapMode>("light");
  const [shipperLocation, setShipperLocation] = useState<string>("");
  const [pathResult, setPathResult] = useState<string[]>([]);
  const [pathDistance, setPathDistance] = useState<number>(0);
  const [pathGeometry, setPathGeometry] = useState<[number, number][]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [nextMarkerId, setNextMarkerId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newMarkerType, setNewMarkerType] = useState<"shipper" | "delivery">("delivery");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Map<string, Array<{ display_name: string; lat: string; lon: string }>>>(new Map());
  const distanceMatrixRef = useRef<Map<string, number>>(new Map());

  const defaultCenter: [number, number] = [10.8231, 106.6297];
  const defaultZoom = 13;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSuggestions]);
  const searchAddress = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    const normalizedQuery = query.trim().toLowerCase();
    
    if (searchCacheRef.current.has(normalizedQuery)) {
      const cachedResults = searchCacheRef.current.get(normalizedQuery)!;
      setSearchResults(cachedResults);
      setShowSuggestions(cachedResults.length > 0);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=0&extratags=0&namedetails=0`,
        {
          headers: {
            "User-Agent": "GraphTheoryApp/1.0",
          },
          signal: abortControllerRef.current.signal,
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response from Nominatim:", text);
        throw new Error("Invalid response format");
      }
      
      const data = await response.json();
      
      searchCacheRef.current.set(normalizedQuery, data);
      
      if (searchCacheRef.current.size > 50) {
        const firstKey = searchCacheRef.current.keys().next().value;
        if (firstKey) {
          searchCacheRef.current.delete(firstKey);
        }
      }
      
      setSearchResults(data);
      setShowSuggestions(data.length > 0);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Error searching address:", error);
      toast.error("Lỗi khi tìm kiếm địa chỉ");
      setSearchResults([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (value.trim().length >= 3) {
      const normalizedQuery = value.trim().toLowerCase();
      if (searchCacheRef.current.has(normalizedQuery)) {
        const cachedResults = searchCacheRef.current.get(normalizedQuery)!;
        setSearchResults(cachedResults);
        setShowSuggestions(cachedResults.length > 0);
        return;
      }

      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(value);
      }, 250);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectResult = (result: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    const newMarker: MapMarker = {
      id: `marker-${nextMarkerId}`,
      position: [lat, lon],
      name: result.display_name.split(",")[0] || `${newMarkerType === "shipper" ? "Vị trí shipper" : "Điểm giao hàng"} ${nextMarkerId}`,
      type: newMarkerType,
    };
    if (newMarkerType === "shipper") {
      setMarkers((prev) => {
        const filtered = prev.filter((m) => m.type !== "shipper");
        return [...filtered, newMarker];
      });
      setShipperLocation(newMarker.id);
    } else {
      setMarkers([...markers, newMarker]);
    }
    
    setNextMarkerId(nextMarkerId + 1);
    setSearchQuery("");
    setSearchResults([]);
    setShowSuggestions(false);
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lon], 15);
    }
    
    toast.success(`Đã thêm: ${newMarker.name}`);
  };

  const deleteMarker = (id: string) => {
    const marker = markers.find((m) => m.id === id);
    setMarkers(markers.filter((m) => m.id !== id));
    if (shipperLocation === id) {
      setShipperLocation("");
    }
    setPathResult([]);
    setPathDistance(0);
    setPathGeometry([]);
    distanceMatrixRef.current.clear();
    toast.success(`Đã xóa ${marker?.type === "shipper" ? "vị trí shipper" : "điểm giao hàng"}`);
  };

  const calculateDistance = (pos1: [number, number], pos2: [number, number]): number => {
    const R = 6371;
    const dLat = ((pos2[0] - pos1[0]) * Math.PI) / 180;
    const dLon = ((pos2[1] - pos1[1]) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pos1[0] * Math.PI) / 180) *
        Math.cos((pos2[0] * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const decodePolyline = (encoded: string): [number, number][] | null => {
    try {
      const coordinates: [number, number][] = [];
      let index = 0;
      const len = encoded.length;
      let lat = 0;
      let lng = 0;

      while (index < len) {
        let b: number;
        let shift = 0;
        let result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
          b = encoded.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        coordinates.push([lat * 1e-5, lng * 1e-5]);
      }

      return coordinates;
    } catch {
      return null;
    }
  };

  const getRoadRoute = async (coordinates: [number, number][]): Promise<{ geometry: [number, number][]; distance: number } | null> => {
    if (coordinates.length < 2) return null;

    const tryOpenRouteService = async (): Promise<{ geometry: [number, number][]; distance: number } | null> => {
      const apiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;
      if (!apiKey) {
        return null;
      }
      try {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car`;
        const body = {
          coordinates: coordinates.map(([lat, lon]) => [lon, lat]),
        };
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': apiKey
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          return null;
        }
        
        const data = await response.json();
        
        if (data.routes && Array.isArray(data.routes) && data.routes.length > 0) {
          const route = data.routes[0];
          
          if (route.geometry && typeof route.geometry === 'string') {
            const polyline = route.geometry;
            const decoded = decodePolyline(polyline);
            
            if (decoded && decoded.length >= 2) {
              const geometry: [number, number][] = decoded.map(
                ([lat, lon]: [number, number]) => [lat, lon]
              );
              const distance = (route.summary?.distance || 0) / 1000;
              
              if (distance > 0 && geometry.length >= 2) {
                return { geometry, distance };
              }
            }
          }
        }
        
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          const feature = data.features[0];
          
          if (feature.geometry && feature.geometry.coordinates) {
            const coords = feature.geometry.coordinates;
            
            if (Array.isArray(coords) && coords.length >= 2) {
              const geometry: [number, number][] = coords.map(
                ([lon, lat]: [number, number]) => [lat, lon]
              );
              
              const distance = (feature.properties?.summary?.distance || 0) / 1000;
              
              if (distance > 0 && geometry.length >= 2) {
                return { geometry, distance };
              }
            }
          }
        }
        
        return null;
      } catch {
        return null;
      }
    };
    const tryOSRM = async (): Promise<{ geometry: [number, number][]; distance: number } | null> => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates.map(([lat, lon]) => `${lon},${lat}`).join(";")}?overview=full&geometries=geojson&steps=false`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          return null;
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return null;
        }
        
        const data = await response.json();

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const geometry: [number, number][] = route.geometry.coordinates.map(
            ([lon, lat]: [number, number]) => [lat, lon]
          );
          const distance = route.distance / 1000;
          
          return { geometry, distance };
        }
        
        return null;
      } catch {
        return null;
      }
    };

    const result = await tryOpenRouteService();
    if (result && result.geometry && Array.isArray(result.geometry) && result.geometry.length >= 2 && result.distance > 0) {
      console.log("Using OpenRouteService result");
      return result;
    }

    console.log("OpenRouteService failed, trying OSRM...");
    const osrmResult = await tryOSRM();
    if (osrmResult && osrmResult.geometry && Array.isArray(osrmResult.geometry) && osrmResult.geometry.length >= 2 && osrmResult.distance > 0) {
      console.log("Using OSRM result");
      return osrmResult;
    }

    console.log("Both APIs failed, returning null");
    return null;
  };
  const getRoadDistance = async (pos1: [number, number], pos2: [number, number], useCache: boolean = true): Promise<number> => {
    const key = `${pos1[0]},${pos1[1]}-${pos2[0]},${pos2[1]}`;
    const reverseKey = `${pos2[0]},${pos2[1]}-${pos1[0]},${pos1[1]}`;
    
    if (useCache) {
      if (distanceMatrixRef.current.has(key)) {
        return distanceMatrixRef.current.get(key)!;
      }
      if (distanceMatrixRef.current.has(reverseKey)) {
        return distanceMatrixRef.current.get(reverseKey)!;
      }
    }
    
    const route = await getRoadRoute([pos1, pos2]);
    const distance = route ? route.distance : calculateDistance(pos1, pos2);
    
    if (useCache) {
      distanceMatrixRef.current.set(key, distance);
      distanceMatrixRef.current.set(reverseKey, distance);
    }
    
    return distance;
  };
  const buildDistanceMatrix = (
    points: Array<{ id: string; position: [number, number] }>,
    distanceCache: Map<string, number>
  ): number[][] => {
    const n = points.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(Infinity));
    
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 0;
      for (let j = i + 1; j < n; j++) {
        const key = `${points[i].position[0]},${points[i].position[1]}-${points[j].position[0]},${points[j].position[1]}`;
        const reverseKey = `${points[j].position[0]},${points[j].position[1]}-${points[i].position[0]},${points[i].position[1]}`;
        const dist = distanceCache.get(key) || distanceCache.get(reverseKey) || Infinity;
        matrix[i][j] = dist;
        matrix[j][i] = dist;
      }
    }
    
    return matrix;
  };
  const calculateRouteDistance = (
    route: number[],
    distanceMatrix: number[][]
  ): number => {
    if (route.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += distanceMatrix[route[i]][route[i + 1]];
    }
    return total;
  };
  const nearestNeighborRoute = (
    startIndex: number,
    deliveryIndices: number[],
    distanceMatrix: number[][],
    points: Array<{ id: string; position: [number, number] }>
  ): { route: string[]; distance: number } => {
    const route: number[] = [startIndex];
    const visited = new Set<number>([startIndex]);
    const remaining = [...deliveryIndices];
    let currentIndex = startIndex;
    
    while (remaining.length > 0) {
      let nearestIdx = -1;
      let nearestDistance = Infinity;
      
      for (let i = 0; i < remaining.length; i++) {
        const targetIndex = remaining[i];
        const dist = distanceMatrix[currentIndex][targetIndex];
        
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestIdx = i;
        }
      }
      
      if (nearestIdx === -1) break;
      
      const nearestIndex = remaining[nearestIdx];
      route.push(nearestIndex);
      visited.add(nearestIndex);
      currentIndex = nearestIndex;
      remaining.splice(nearestIdx, 1);
    }
    
    const distance = calculateRouteDistance(route, distanceMatrix);
    return {
      route: route.slice(1).map(idx => points[idx].id),
      distance
    };
  };
  const twoOptImprovement = (
    route: number[],
    distanceMatrix: number[][]
  ): number[] => {
    let improved = true;
    let bestRoute = [...route];
    let bestDistance = calculateRouteDistance(bestRoute, distanceMatrix);
    
    while (improved) {
      improved = false;
      
      for (let i = 1; i < bestRoute.length - 1; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          const newRoute = [
            ...bestRoute.slice(0, i),
            ...bestRoute.slice(i, j + 1).reverse(),
            ...bestRoute.slice(j + 1)
          ];
          
          const newDistance = calculateRouteDistance(newRoute, distanceMatrix);
          
          if (newDistance < bestDistance) {
            bestRoute = newRoute;
            bestDistance = newDistance;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    
    return bestRoute;
  };
  const optimizeRouteWithDijkstra = async (
    shipperIndex: number,
    deliveryIndices: number[],
    points: Array<{ id: string; position: [number, number] }>,
    distanceMatrix: number[][]
  ): Promise<string[]> => {
    if (deliveryIndices.length === 0) return [];
    const sortedDeliveryIndices = [...deliveryIndices].sort((a, b) => 
      points[a].id.localeCompare(points[b].id)
    );
    
    try {
      await loadWasmModule();
    } catch (error) {
      console.warn("Failed to load WASM, using fallback:", error);
      return optimizeRouteFallback(shipperIndex, sortedDeliveryIndices, distanceMatrix, points);
    }
    let bestRoute: string[] = [];
    let bestDistance = Infinity;
    const routeFromShipper = nearestNeighborRoute(
      shipperIndex,
      sortedDeliveryIndices,
      distanceMatrix,
      points
    );
    
    if (routeFromShipper.distance < bestDistance) {
      bestRoute = routeFromShipper.route;
      bestDistance = routeFromShipper.distance;
    }
    if (sortedDeliveryIndices.length > 1) {
      for (const firstDeliveryIdx of sortedDeliveryIndices.slice(0, Math.min(5, sortedDeliveryIndices.length))) {
        const remaining = sortedDeliveryIndices.filter(idx => idx !== firstDeliveryIdx);
        const partialRoute = nearestNeighborRoute(
          firstDeliveryIdx,
          remaining,
          distanceMatrix,
          points
        );
        const totalDistance = distanceMatrix[shipperIndex][firstDeliveryIdx] + partialRoute.distance;
        
        if (totalDistance < bestDistance) {
          bestRoute = [points[firstDeliveryIdx].id, ...partialRoute.route];
          bestDistance = totalDistance;
        }
      }
    }
    if (bestRoute.length > 2) {
      const routeIndices = [shipperIndex, ...bestRoute.map(id => {
        const idx = points.findIndex(p => p.id === id);
        return idx >= 0 ? idx : -1;
      }).filter(idx => idx >= 0)];
      
      const improvedIndices = twoOptImprovement(routeIndices, distanceMatrix);
      bestRoute = improvedIndices.slice(1).map(idx => points[idx].id);
    }
    
    return bestRoute;
  };
  const optimizeRouteFallback = (
    shipperIndex: number,
    deliveryIndices: number[],
    distanceMatrix: number[][],
    points: Array<{ id: string; position: [number, number] }>
  ): string[] => {
    const sortedDeliveryIndices = [...deliveryIndices].sort((a, b) => 
      points[a].id.localeCompare(points[b].id)
    );
    let bestRoute: string[] = [];
    let bestDistance = Infinity;
    const routeFromShipper = nearestNeighborRoute(
      shipperIndex,
      sortedDeliveryIndices,
      distanceMatrix,
      points
    );
    
    if (routeFromShipper.distance < bestDistance) {
      bestRoute = routeFromShipper.route;
      bestDistance = routeFromShipper.distance;
    }
    if (sortedDeliveryIndices.length > 1) {
      for (const firstDeliveryIdx of sortedDeliveryIndices.slice(0, Math.min(5, sortedDeliveryIndices.length))) {
        const remaining = sortedDeliveryIndices.filter(idx => idx !== firstDeliveryIdx);
        const partialRoute = nearestNeighborRoute(
          firstDeliveryIdx,
          remaining,
          distanceMatrix,
          points
        );
        
        const totalDistance = distanceMatrix[shipperIndex][firstDeliveryIdx] + partialRoute.distance;
        
        if (totalDistance < bestDistance) {
          bestRoute = [points[firstDeliveryIdx].id, ...partialRoute.route];
          bestDistance = totalDistance;
        }
      }
    }
    if (bestRoute.length > 2) {
      const routeIndices = [shipperIndex, ...bestRoute.map(id => {
        const idx = points.findIndex(p => p.id === id);
        return idx >= 0 ? idx : -1;
      }).filter(idx => idx >= 0)];
      
      const improvedIndices = twoOptImprovement(routeIndices, distanceMatrix);
      bestRoute = improvedIndices.slice(1).map(idx => points[idx].id);
    }
    
    return bestRoute;
  };


  const handleRunAlgorithm = async () => {
    if (!shipperLocation) {
      toast.error("Vui lòng thêm vị trí shipper");
      return;
    }

    const deliveryMarkers = markers.filter((m) => m.type === "delivery");
    if (deliveryMarkers.length === 0) {
      toast.error("Vui lòng thêm ít nhất một địa điểm giao hàng");
      return;
    }

    const shipperMarker = markers.find((m) => m.id === shipperLocation);
    if (!shipperMarker) {
      toast.error("Không tìm thấy vị trí shipper");
      return;
    }

    setIsRunning(true);
    setPathResult([]);
    setPathGeometry([]);

    try {
      const allPoints = [shipperMarker, ...deliveryMarkers];
      const totalPairs = (allPoints.length * (allPoints.length - 1)) / 2;
      let processedPairs = 0;
      
      if (totalPairs > 0) {
        toast.loading(`Đang tính khoảng cách đường bộ (0/${totalPairs})...`, { id: "road-distance" });
      }
      
      distanceMatrixRef.current.clear();
      
      for (let i = 0; i < allPoints.length; i++) {
        for (let j = i + 1; j < allPoints.length; j++) {
          const fromMarker = allPoints[i];
          const toMarker = allPoints[j];
          
          await getRoadDistance(fromMarker.position, toMarker.position, true);
          processedPairs++;
          if (totalPairs > 5) {
            toast.loading(
              `Đang tính khoảng cách đường bộ (${processedPairs}/${totalPairs})...`,
              { id: "road-distance" }
            );
          }
        }
      }
      
      toast.dismiss("road-distance");
      const pointIndexMap = new Map<string, number>();
      allPoints.forEach((point, index) => {
        pointIndexMap.set(point.id, index);
      });
      toast.loading("Đang tối ưu tuyến đường...", { id: "optimize-route" });
      const distanceMatrix = buildDistanceMatrix(
        allPoints.map((p) => ({ id: p.id, position: p.position })),
        distanceMatrixRef.current
      );
      const shipperIndex = pointIndexMap.get(shipperLocation)!;
      const deliveryIndices = deliveryMarkers.map((m) => pointIndexMap.get(m.id)!);
      
      const optimizedRoute = await optimizeRouteWithDijkstra(
        shipperIndex,
        deliveryIndices,
        allPoints.map((p) => ({ id: p.id, position: p.position })),
        distanceMatrix
      );

      toast.dismiss("optimize-route");
      const fullRoute = [shipperLocation, ...optimizedRoute];
      setPathResult(fullRoute);
      let totalDistance = 0;
      const allPathCoordinates: [number, number][] = [shipperMarker.position];
      toast.loading("Đang tính toán đường đi chi tiết...", { id: "road-route" });
      const graphNodes = allPoints.map((marker) => ({
        id: marker.id,
        label: marker.name,
        position: { x: marker.position[1], y: marker.position[0] },
      }));

      const graphEdges: Array<{ id: string; source: string; target: string; weight: number }> = [];
      for (let i = 0; i < allPoints.length; i++) {
        for (let j = i + 1; j < allPoints.length; j++) {
          const key = `${allPoints[i].position[0]},${allPoints[i].position[1]}-${allPoints[j].position[0]},${allPoints[j].position[1]}`;
          const reverseKey = `${allPoints[j].position[0]},${allPoints[j].position[1]}-${allPoints[i].position[0]},${allPoints[i].position[1]}`;
          const weight = distanceMatrixRef.current.get(key) || distanceMatrixRef.current.get(reverseKey) || Infinity;
          
          if (weight !== Infinity) {
            graphEdges.push({
              id: `${allPoints[i].id}-${allPoints[j].id}`,
              source: allPoints[i].id,
              target: allPoints[j].id,
              weight: weight,
            });
            graphEdges.push({
              id: `${allPoints[j].id}-${allPoints[i].id}`,
              source: allPoints[j].id,
              target: allPoints[i].id,
              weight: weight,
            });
          }
        }
      }
      let currentPointId = shipperLocation;
      for (const nextPointId of optimizedRoute) {
        const dijkstraResult = await dijkstra(graphNodes, graphEdges, currentPointId, nextPointId);
        
        if (dijkstraResult.path.length > 0) {
          totalDistance += dijkstraResult.distance;
          const pathCoords = dijkstraResult.path.map((id) => {
            const marker = markers.find((m) => m.id === id);
            return marker ? marker.position : null;
          }).filter((pos): pos is [number, number] => pos !== null);
          
          if (pathCoords.length >= 2) {
            const segmentRoute = await getRoadRoute(pathCoords);
            if (segmentRoute && segmentRoute.geometry && segmentRoute.geometry.length > 0) {
              allPathCoordinates.push(...segmentRoute.geometry.slice(1));
            } else {
              allPathCoordinates.push(pathCoords[pathCoords.length - 1]);
            }
          }
          
          currentPointId = nextPointId;
        }
      }
      
      toast.dismiss("road-route");

      if (allPathCoordinates.length >= 2) {
        setPathGeometry(allPathCoordinates);
        setPathDistance(totalDistance);
        toast.success(`Lịch trình tối ưu: ${totalDistance.toFixed(2)} km (${deliveryMarkers.length} điểm giao hàng)`);
      } else {
        setPathGeometry([]);
        setPathDistance(totalDistance);
        toast.success(`Lịch trình tối ưu: ${totalDistance.toFixed(2)} km`);
      }
    } catch (error) {
      console.error("Error running algorithm:", error);
      toast.error("Lỗi khi chạy thuật toán");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 h-full">
        <div className="lg:col-span-1 space-y-4">
          <Card className={`border border-border ${customButtonShadow}`}>
            <CardHeader>
              <CardTitle className="text-lg">Điều khiển bản đồ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tìm kiếm địa chỉ</Label>
                <div className="space-y-2">
                  <Select value={newMarkerType} onValueChange={(value) => setNewMarkerType(value as "shipper" | "delivery")}>
                    <SelectTrigger className={`w-full text-sm ${customButtonShadow}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shipper">Vị trí shipper</SelectItem>
                      <SelectItem value="delivery">Điểm giao hàng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative search-container">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={`Nhập địa chỉ ${newMarkerType === "shipper" ? "shipper" : "giao hàng"}...`}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => {
                        if (searchResults.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className={`pl-9 pr-9 ${customButtonShadow}`}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {showSuggestions && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectResult(result)}
                          className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {result.display_name.split(",")[0]}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {result.display_name}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Chế độ bản đồ</Label>
                <Select value={mapMode} onValueChange={(value) => setMapMode(value as MapMode)}>
                  <SelectTrigger className={`w-full ${customButtonShadow}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Tối ưu lịch trình giao hàng</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Vị trí shipper</Label>
                    <Select value={shipperLocation} onValueChange={setShipperLocation}>
                      <SelectTrigger className={`w-full text-sm ${customButtonShadow}`}>
                        <SelectValue placeholder="Chọn vị trí shipper" />
                      </SelectTrigger>
                      <SelectContent>
                        {markers.filter((m) => m.type === "shipper").map((marker) => (
                          <SelectItem key={marker.id} value={marker.id}>
                            {marker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {markers.filter((m) => m.type === "shipper").length === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Chưa có vị trí shipper. Hãy thêm từ tìm kiếm phía trên.
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleRunAlgorithm}
                    disabled={
                      isRunning || 
                      !shipperLocation ||
                      markers.filter((m) => m.type === "delivery").length === 0
                    }
                    className={`w-full ${customButtonShadow}`}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    {isRunning ? "Đang tối ưu..." : "Tối ưu lịch trình"}
                  </Button>
                </div>
              </div>

              {pathResult.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Kết quả tối ưu</Label>
                  <Card className={`p-3 border border-border bg-muted/50 ${customButtonShadow}`}>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Tổng khoảng cách: {pathDistance.toFixed(2)} km</p>
                      <p className="text-xs text-muted-foreground">
                        Số điểm giao hàng: {markers.filter((m) => m.type === "delivery").length}
                      </p>
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs font-medium mb-1">Thứ tự giao hàng:</p>
                        <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                          {pathResult.slice(1, -1).map((id, idx) => {
                            const marker = markers.find((m) => m.id === id);
                            return marker ? (
                              <li key={id} className="truncate">
                                {idx + 1}. {marker.name}
                              </li>
                            ) : null;
                          })}
                        </ol>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Điểm đã thêm ({markers.length})
                  {markers.filter((m) => m.type === "shipper").length > 0 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      (Shipper: {markers.filter((m) => m.type === "shipper").length}, 
                      Giao hàng: {markers.filter((m) => m.type === "delivery").length})
                    </span>
                  )}
                </Label>
                <div className="space-y-2 lg:max-h-48 overflow-y-auto">
                  <AnimatePresence>
                    {markers.map((marker) => (
                      <motion.div
                        key={marker.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Card className={`p-2 border border-border ${marker.type === "shipper" ? "bg-green-50 dark:bg-green-950/20" : ""} ${customButtonShadow}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium truncate">{marker.name}</p>
                                {marker.type === "shipper" && (
                                  <span className="text-xs px-1.5 py-0.5 bg-green-500 text-white rounded">
                                    Shipper
                                  </span>
                                )}
                                {marker.type === "delivery" && (
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded">
                                    Giao hàng
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                              </p>
                            </div>
                            <Button
                              onClick={() => deleteMarker(marker.id)}
                              variant="outline"
                              size="icon"
                              className={`h-7 w-7 shrink-0 ${customButtonShadow}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                <p>• Chọn loại điểm (Shipper/Giao hàng) trước khi tìm kiếm</p>
                <p>• Thêm vị trí shipper và các điểm giao hàng</p>
                <p>• Chạy thuật toán để tối ưu lịch trình giao hàng</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 flex-1 min-h-[50vh] lg:min-h-0 rounded-md overflow-hidden border border-border">
          <MapContainer
            center={defaultCenter}
            zoom={defaultZoom}
            style={{ height: "100%", width: "100%" }}
            ref={(map) => {
              if (map) {
                mapRef.current = map;
              }
            }}
          >
            <MapStyleUpdater mode={mapMode} />
            <TileLayer
              url={
                mapMode === "satellite"
                  ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  : mapMode === "dark"
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              }
              attribution={
                mapMode === "satellite"
                  ? '&copy; <a href="https://www.esri.com/">Esri</a>'
                  : mapMode === "dark"
                  ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
            />
            {pathGeometry.length > 0 && (
              <Polyline
                positions={pathGeometry}
                pathOptions={{
                  color: "#22c55e",
                  weight: 5,
                  opacity: 0.9,
                }}
              />
            )}

            {markers.map((marker) => {
              const isInPath = pathResult.includes(marker.id);
              const isShipper = marker.id === shipperLocation;
              const pathIndex = pathResult.indexOf(marker.id);
              let backgroundColor = "#ffffff";
              let borderColor = "#000000";
              let textColor = "#000000";
              let label = "";
              
              if (isShipper) {
                backgroundColor = "#22c55e";
                borderColor = "#16a34a";
                textColor = "#ffffff";
                label = "S";
              } else if (isInPath && pathIndex > 0 && pathIndex < pathResult.length - 1) {
                backgroundColor = "#3b82f6";
                borderColor = "#2563eb";
                textColor = "#ffffff";
                label = String(pathIndex);
              } else if (marker.type === "delivery") {
                backgroundColor = "#fbbf24";
                borderColor = "#f59e0b";
                textColor = "#000000";
              }
              
              const icon = L.divIcon({
                className: "custom-marker",
                html: `
                  <div style="
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    background: ${backgroundColor};
                    border: 3px solid ${borderColor};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                    color: ${textColor};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                  ">
                    ${label}
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15],
              });

              return (
                <Marker key={marker.id} position={marker.position} icon={icon}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium">{marker.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}