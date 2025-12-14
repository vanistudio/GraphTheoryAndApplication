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
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { motion, AnimatePresence } from "framer-motion";

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
  const [sourceMarker, setSourceMarker] = useState<string>("");
  const [targetMarker, setTargetMarker] = useState<string>("");
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Map<string, Array<{ display_name: string; lat: string; lon: string }>>>(new Map());

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
      name: result.display_name.split(",")[0] || `Điểm ${nextMarkerId}`,
    };
    
    setMarkers([...markers, newMarker]);
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
    setMarkers(markers.filter((m) => m.id !== id));
    if (sourceMarker === id) setSourceMarker("");
    if (targetMarker === id) setTargetMarker("");
    setPathResult([]);
    setPathDistance(0);
    setPathGeometry([]);
    toast.success("Đã xóa điểm");
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

  const getRoadDistance = async (pos1: [number, number], pos2: [number, number]): Promise<number> => {
    const route = await getRoadRoute([pos1, pos2]);
    if (route) {
      return route.distance;
    }
    return calculateDistance(pos1, pos2);
  };


  const handleRunAlgorithm = async () => {
    if (!sourceMarker || !targetMarker) {
      toast.error("Vui lòng chọn điểm nguồn và điểm đích");
      return;
    }

    if (sourceMarker === targetMarker) {
      toast.error("Điểm nguồn và điểm đích phải khác nhau");
      return;
    }

    if (markers.length < 2) {
      toast.error("Cần ít nhất 2 điểm để chạy thuật toán");
      return;
    }

    setIsRunning(true);
    setPathResult([]);
    setPathGeometry([]);

    try {
      const graphNodes = markers.map((marker) => ({
        id: marker.id,
        label: marker.name,
        position: { x: marker.position[1], y: marker.position[0] },
      }));

      const graphEdges: Array<{ id: string; source: string; target: string; weight: number }> = [];
      
      const totalPairs = (markers.length * (markers.length - 1)) / 2;
      let processedPairs = 0;
      
      if (totalPairs > 0) {
        toast.loading(`Đang tính khoảng cách đường bộ (0/${totalPairs})...`, { id: "road-distance" });
      }
      
      for (let i = 0; i < markers.length; i++) {
        for (let j = i + 1; j < markers.length; j++) {
          const fromMarker = markers[i];
          const toMarker = markers[j];
          
          const weight = await getRoadDistance(fromMarker.position, toMarker.position);
          processedPairs++;
          if (totalPairs > 5) {
            toast.loading(
              `Đang tính khoảng cách đường bộ (${processedPairs}/${totalPairs})...`,
              { id: "road-distance" }
            );
          }
          
          graphEdges.push({
            id: `${fromMarker.id}-${toMarker.id}`,
            source: fromMarker.id,
            target: toMarker.id,
            weight: Math.round(weight * 100) / 100,
          });
          graphEdges.push({
            id: `${toMarker.id}-${fromMarker.id}`,
            source: toMarker.id,
            target: fromMarker.id,
            weight: Math.round(weight * 100) / 100,
          });
        }
      }
      
      toast.dismiss("road-distance");

      const dijkstraResult = await dijkstra(graphNodes, graphEdges, sourceMarker, targetMarker);
        const result = {
          path: dijkstraResult.path,
          distance: dijkstraResult.distance,
        };

        if (result && result.path.length > 0) {
          setPathResult(result.path);
          
          const pathCoordinates = result.path.map((id) => {
            const marker = markers.find((m) => m.id === id);
            return marker ? marker.position : null;
          }).filter((pos): pos is [number, number] => pos !== null);
          
          if (pathCoordinates.length >= 2) {
            toast.loading("Đang lấy đường đi thực tế...", { id: "road-route" });
            const roadRoute = await getRoadRoute(pathCoordinates);
            toast.dismiss("road-route");
            
            if (roadRoute && roadRoute.geometry && roadRoute.geometry.length >= 2 && roadRoute.distance > 0) {
              setPathGeometry(roadRoute.geometry);
              setPathDistance(roadRoute.distance);
              toast.success(`Tìm thấy đường đi: ${roadRoute.distance.toFixed(2)} km`);
            } else {
              const fallbackDistance = pathCoordinates.reduce((sum, coord, idx) => {
                if (idx === 0) return 0;
                return sum + calculateDistance(pathCoordinates[idx - 1], coord);
              }, 0);
              setPathGeometry(pathCoordinates);
              setPathDistance(fallbackDistance);
              toast.success(`Tìm thấy đường đi: ${fallbackDistance.toFixed(2)} km (khoảng cách đường chim bay)`);
            }
          } else {
            setPathGeometry([]);
            setPathDistance(result.distance);
            toast.success(`Tìm thấy đường đi: ${result.distance.toFixed(2)} km`);
          }
        } else {
          setPathResult([]);
          setPathDistance(0);
          setPathGeometry([]);
          toast.error("Không tìm thấy đường đi");
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
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className={`border border-border ${customButtonShadow}`}>
            <CardHeader>
              <CardTitle className="text-lg">Điều khiển bản đồ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tìm kiếm địa chỉ</Label>
                <div className="relative search-container">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nhập địa chỉ để tìm kiếm..."
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

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Tìm đường đi</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Điểm nguồn</Label>
                    <Select value={sourceMarker} onValueChange={setSourceMarker}>
                      <SelectTrigger className={`w-full text-sm ${customButtonShadow}`}>
                        <SelectValue placeholder="Chọn điểm nguồn" />
                      </SelectTrigger>
                      <SelectContent>
                        {markers.map((marker) => (
                          <SelectItem key={marker.id} value={marker.id}>
                            {marker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Điểm đích</Label>
                    <Select value={targetMarker} onValueChange={setTargetMarker}>
                      <SelectTrigger className={`w-full text-sm ${customButtonShadow}`}>
                        <SelectValue placeholder="Chọn điểm đích" />
                      </SelectTrigger>
                      <SelectContent>
                        {markers.map((marker) => (
                          <SelectItem key={marker.id} value={marker.id}>
                            {marker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleRunAlgorithm}
                    disabled={
                      isRunning || 
                      markers.length < 2 ||
                      (!sourceMarker || !targetMarker)
                    }
                    className={`w-full ${customButtonShadow}`}
                  >
                    <Route className="h-4 w-4 mr-2" />
                    {isRunning ? "Đang tính toán..." : "Tìm đường đi"}
                  </Button>
                </div>
              </div>

              {pathResult.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Kết quả</Label>
                  <Card className={`p-3 border border-border bg-muted/50 ${customButtonShadow}`}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Khoảng cách: {pathDistance.toFixed(2)} km</p>
                      <p className="text-xs text-muted-foreground">
                        Số điểm: {pathResult.length}
                      </p>
                    </div>
                  </Card>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Điểm đã thêm ({markers.length})</Label>
                <div className="space-y-2 lg:max-h-48">
                  <AnimatePresence>
                    {markers.map((marker) => (
                      <motion.div
                        key={marker.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Card className={`p-2 border border-border ${customButtonShadow}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{marker.name}</p>
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
                <p>• Tìm kiếm địa chỉ để thêm điểm</p>
                <p>• Chọn 2 điểm và chạy thuật toán để tìm đường đi</p>
                <p>• Khoảng cách được tính tự động</p>
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
              const isSource = marker.id === sourceMarker;
              const isTarget = marker.id === targetMarker;
              let backgroundColor = "#ffffff";
              let borderColor = "#000000";
              let textColor = "#000000";
              let label = "";
              
              if (isSource) {
                backgroundColor = "#22c55e";
                borderColor = "#16a34a";
                textColor = "#ffffff";
                label = "S";
              } else if (isTarget) {
                backgroundColor = "#ef4444";
                borderColor = "#dc2626";
                textColor = "#ffffff";
                label = "T";
              } else if (isInPath) {
                backgroundColor = "#3b82f6";
                borderColor = "#2563eb";
                textColor = "#ffffff";
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