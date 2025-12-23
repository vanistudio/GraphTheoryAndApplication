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
import { Route, X, Search, MapPin, History, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { dijkstra } from "@/lib/algorithms/dijkstra";
import { loadWasmModule } from "@/lib/algorithms/wasm-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
  const [numShippers, setNumShippers] = useState<number>(2);
  const [conflictRadius, setConflictRadius] = useState<number>(10);
  const [pathResult, setPathResult] = useState<Map<number, string[]>>(new Map());
  const [pathDistance, setPathDistance] = useState<Map<number, number>>(new Map());
  const [pathGeometry, setPathGeometry] = useState<Map<number, [number, number][]>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const [nextMarkerId, setNextMarkerId] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newMarkerType, setNewMarkerType] = useState<"shipper" | "delivery">("delivery");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Array<{
    id: string;
    timestamp: number;
    markers: MapMarker[];
    numShippers: number;
    conflictRadius: number;
    result?: {
      pathResult: Array<[number, string[]]>;
      pathDistance: Array<[number, number]>;
    };
  }>>([]);
  const [apiKeys, setApiKeys] = useState<string[]>([]);
  const [showApiKeysDialog, setShowApiKeysDialog] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const currentApiKeyIndexRef = useRef<number>(0);
  const rateLimitedKeysRef = useRef<Set<string>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Map<string, Array<{ display_name: string; lat: string; lon: string }>>>(new Map());
  const distanceMatrixRef = useRef<Map<string, number>>(new Map());

  const defaultCenter: [number, number] = [10.8231, 106.6297];
  const defaultZoom = 13;
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedHistory = localStorage.getItem("shipper-history");
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          setHistory(parsed);
        }
        const savedApiKeys = localStorage.getItem("openrouteservice-api-keys");
        if (savedApiKeys) {
          const parsed = JSON.parse(savedApiKeys);
          setApiKeys(parsed);
        } else {
          const envKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;
          if (envKey) {
            setApiKeys([envKey]);
            localStorage.setItem("openrouteservice-api-keys", JSON.stringify([envKey]));
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined" && apiKeys.length > 0) {
      localStorage.setItem("openrouteservice-api-keys", JSON.stringify(apiKeys));
    }
  }, [apiKeys]);
  const getNextApiKey = (): string | null => {
    const allKeys = apiKeys.length > 0 
      ? apiKeys 
      : (process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY ? [process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY] : []);
    
    if (allKeys.length === 0) {
      return null;
    }
    const availableKeys = allKeys.filter(key => !rateLimitedKeysRef.current.has(key));
    
    if (availableKeys.length === 0) {
      rateLimitedKeysRef.current.clear();
      const key = allKeys[currentApiKeyIndexRef.current % allKeys.length];
      currentApiKeyIndexRef.current = (currentApiKeyIndexRef.current + 1) % allKeys.length;
      return key;
    }
    const key = availableKeys[currentApiKeyIndexRef.current % availableKeys.length];
    currentApiKeyIndexRef.current = (currentApiKeyIndexRef.current + 1) % availableKeys.length;
    return key;
  };
  const markKeyAsRateLimited = (key: string) => {
    rateLimitedKeysRef.current.add(key);
    setTimeout(() => {
      rateLimitedKeysRef.current.delete(key);
    }, 60000);
  };
  const addApiKey = (key: string) => {
    if (key.trim() && !apiKeys.includes(key.trim())) {
      setApiKeys([...apiKeys, key.trim()]);
      setApiKeyInput("");
      toast.success("Đã thêm API key");
    } else if (apiKeys.includes(key.trim())) {
      toast.error("API key đã tồn tại");
    }
  };
  const removeApiKey = (key: string) => {
    setApiKeys(apiKeys.filter(k => k !== key));
    rateLimitedKeysRef.current.delete(key);
    toast.success("Đã xóa API key");
  };
  const saveToHistory = (markers: MapMarker[], numShippers: number, conflictRadius: number, result?: {
    pathResult: Map<number, string[]>;
    pathDistance: Map<number, number>;
  }) => {
    if (typeof window === "undefined") return;

    try {
      const historyItem = {
        id: `history-${Date.now()}`,
        timestamp: Date.now(),
        markers: markers,
        numShippers,
        conflictRadius,
        result: result ? {
          pathResult: Array.from(result.pathResult.entries()),
          pathDistance: Array.from(result.pathDistance.entries()),
        } : undefined,
      };

      const newHistory = [historyItem, ...history].slice(0, 50); 
      setHistory(newHistory);
      localStorage.setItem("shipper-history", JSON.stringify(newHistory));
      toast.success("Đã lưu vào lịch sử");
    } catch (error) {
      console.error("Error saving history:", error);
      toast.error("Lỗi khi lưu lịch sử");
    }
  };
  const loadFromHistory = (historyItem: typeof history[0]) => {
    setMarkers(historyItem.markers);
    setNumShippers(historyItem.numShippers);
    setConflictRadius(historyItem.conflictRadius);
    
    if (historyItem.result) {
      const pathResultMap = new Map(historyItem.result.pathResult);
      const pathDistanceMap = new Map(historyItem.result.pathDistance);
      setPathResult(pathResultMap);
      setPathDistance(pathDistanceMap);
    } else {
      setPathResult(new Map());
      setPathDistance(new Map());
      setPathGeometry(new Map());
    }
    const firstShipper = historyItem.markers.find(m => m.type === "shipper");
    if (firstShipper) {
      setShipperLocation(firstShipper.id);
    }
    const maxId = historyItem.markers.reduce((max, m) => {
      const match = m.id.match(/marker-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        return Math.max(max, num);
      }
      return max;
    }, 0);
    setNextMarkerId(maxId + 1);

    setShowHistory(false);
    toast.success("Đã tải lại từ lịch sử");
  };
  const deleteHistory = (id: string) => {
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    if (typeof window !== "undefined") {
      localStorage.setItem("shipper-history", JSON.stringify(newHistory));
    }
    toast.success("Đã xóa khỏi lịch sử");
  };
  const exportHistory = () => {
    try {
      const dataStr = JSON.stringify(history, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shipper-history-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Đã xuất lịch sử ra file JSON");
    } catch (error) {
      console.error("Error exporting history:", error);
      toast.error("Lỗi khi xuất lịch sử");
    }
  };
  const importHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          if (typeof window !== "undefined") {
            localStorage.setItem("shipper-history", JSON.stringify(parsed));
          }
          toast.success("Đã nhập lịch sử từ file");
        } else {
          toast.error("File không hợp lệ");
        }
      } catch (error) {
        console.error("Error importing history:", error);
        toast.error("Lỗi khi nhập lịch sử");
      }
    };
    reader.readAsText(file);
  };

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
    setMarkers([...markers, newMarker]);
    if (newMarkerType === "shipper" && !shipperLocation) {
      setShipperLocation(newMarker.id);
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
    const newMarkers = markers.filter((m) => m.id !== id);
    setMarkers(newMarkers);
    if (shipperLocation === id) {
      const remainingShippers = newMarkers.filter((m) => m.type === "shipper");
      if (remainingShippers.length > 0) {
        setShipperLocation(remainingShippers[0].id);
      } else {
        setShipperLocation("");
      }
    }
    
    setPathResult(new Map());
    setPathDistance(new Map());
    setPathGeometry(new Map());
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
      const allKeys = apiKeys.length > 0 
        ? apiKeys 
        : (process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY ? [process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY] : []);
      
      if (allKeys.length === 0) {
        return null;
      }
      const maxRetries = Math.min(3, allKeys.length);
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const apiKey = getNextApiKey();
        if (!apiKey) {
          continue;
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
          if (response.status === 429) {
            markKeyAsRateLimited(apiKey);
            console.warn(`API key bị rate limit, chuyển sang key khác...`);
            continue;
          }
          
          if (!response.ok) {
            continue;
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
        } catch (error) {
          console.warn("Error with API key, trying next...", error);
          continue;
        }
      }
      
      return null;
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
        if (dist < nearestDistance || nearestIdx === -1) {
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
  const buildConflictGraph = (
    deliveryPoints: Array<{ id: string; position: [number, number] }>,
    distanceMatrix: number[][],
    pointIndexMap: Map<string, number>,
    conflictRadius: number
  ): { nodes: string[]; edges: Array<[string, string]> } => {
    const nodes = deliveryPoints.map(p => p.id);
    const edges: Array<[string, string]> = [];
    
    for (let i = 0; i < deliveryPoints.length; i++) {
      for (let j = i + 1; j < deliveryPoints.length; j++) {
        const idx1 = pointIndexMap.get(deliveryPoints[i].id)!;
        const idx2 = pointIndexMap.get(deliveryPoints[j].id)!;
        const distance = distanceMatrix[idx1][idx2];
        if (distance > conflictRadius) {
          edges.push([deliveryPoints[i].id, deliveryPoints[j].id]);
        }
      }
    }
    
    return { nodes, edges };
  };
  const colorOrders = (
    nodes: string[],
    edges: Array<[string, string]>,
    numShippers: number,
    points: Array<{ id: string; position: [number, number] }>
  ): Map<number, string[]> => {
    const adjacencyList = new Map<string, Set<string>>();
    nodes.forEach(node => adjacencyList.set(node, new Set()));
    edges.forEach(([u, v]) => {
      adjacencyList.get(u)!.add(v);
      adjacencyList.get(v)!.add(u);
    });
    const degrees = new Map<string, number>();
    nodes.forEach(node => {
      degrees.set(node, adjacencyList.get(node)!.size);
    });
    const sortedNodes = [...nodes].sort((a, b) => 
      (degrees.get(b) || 0) - (degrees.get(a) || 0)
    );
    const colors = new Map<string, number>();
    let maxColor = -1;
    
    for (const node of sortedNodes) {
      const neighbors = adjacencyList.get(node)!;
      const usedColors = new Set<number>();
      for (const neighbor of neighbors) {
        const neighborColor = colors.get(neighbor);
        if (neighborColor !== undefined) {
          usedColors.add(neighborColor);
        }
      }
      let color = 0;
      while (usedColors.has(color)) {
        color++;
      }
      
      colors.set(node, color);
      maxColor = Math.max(maxColor, color);
    }
    const colorGroups = new Map<number, string[]>();
    colors.forEach((color, node) => {
      if (!colorGroups.has(color)) {
        colorGroups.set(color, []);
      }
      colorGroups.get(color)!.push(node);
    });
    if (maxColor + 1 > numShippers) {
      return mergeColorGroups(colorGroups, numShippers, points, distanceMatrixRef.current);
    }
    
    return colorGroups;
  };
  const mergeColorGroups = (
    colorGroups: Map<number, string[]>,
    numShippers: number,
    points: Array<{ id: string; position: [number, number] }>,
    distanceCache: Map<string, number>
  ): Map<number, string[]> => {
    const groups = Array.from(colorGroups.entries());
    const groupDistances = groups.map(([color, groupNodes]) => {
      if (groupNodes.length < 2) return { color, avgDistance: 0, nodes: groupNodes };
      
      let totalDistance = 0;
      let pairCount = 0;
      
      for (let i = 0; i < groupNodes.length; i++) {
        for (let j = i + 1; j < groupNodes.length; j++) {
          const point1 = points.find(p => p.id === groupNodes[i]);
          const point2 = points.find(p => p.id === groupNodes[j]);
          
          if (point1 && point2) {
            const key = `${point1.position[0]},${point1.position[1]}-${point2.position[0]},${point2.position[1]}`;
            const reverseKey = `${point2.position[0]},${point2.position[1]}-${point1.position[0]},${point1.position[1]}`;
            const dist = distanceCache.get(key) || distanceCache.get(reverseKey) || 0;
            totalDistance += dist;
            pairCount++;
          }
        }
      }
      
      return {
        color,
        avgDistance: pairCount > 0 ? totalDistance / pairCount : Infinity,
        nodes: groupNodes
      };
    });
    groupDistances.sort((a, b) => a.avgDistance - b.avgDistance);
    while (groupDistances.length > numShippers) {
      const group1 = groupDistances[0];
      const group2 = groupDistances[1];
      const mergedNodes = [...group1.nodes, ...group2.nodes];
      let totalDistance = 0;
      let pairCount = 0;
      
      for (let i = 0; i < mergedNodes.length; i++) {
        for (let j = i + 1; j < mergedNodes.length; j++) {
          const point1 = points.find(p => p.id === mergedNodes[i]);
          const point2 = points.find(p => p.id === mergedNodes[j]);
          
          if (point1 && point2) {
            const key = `${point1.position[0]},${point1.position[1]}-${point2.position[0]},${point2.position[1]}`;
            const reverseKey = `${point2.position[0]},${point2.position[1]}-${point1.position[0]},${point1.position[1]}`;
            const dist = distanceCache.get(key) || distanceCache.get(reverseKey) || 0;
            totalDistance += dist;
            pairCount++;
          }
        }
      }
      
      const mergedGroup = {
        color: group1.color,
        avgDistance: pairCount > 0 ? totalDistance / pairCount : Infinity,
        nodes: mergedNodes
      };
      
      groupDistances.splice(0, 2, mergedGroup);
      groupDistances.sort((a, b) => a.avgDistance - b.avgDistance);
    }
    const result = new Map<number, string[]>();
    groupDistances.forEach((group, index) => {
      result.set(index, group.nodes);
    });
    return result;
  };
  const handleRunAlgorithm = async () => {
    const shipperMarkers = markers.filter((m) => m.type === "shipper");
    if (shipperMarkers.length === 0) {
      toast.error("Vui lòng thêm ít nhất một vị trí shipper");
      return;
    }
    const deliveryMarkers = markers.filter((m) => m.type === "delivery");
    if (deliveryMarkers.length === 0) {
      toast.error("Vui lòng thêm ít nhất một địa điểm giao hàng");
      return;
    }
    if (numShippers < 1) {
      toast.error("Số lượng shipper phải lớn hơn 0");
      return;
    }
    if (shipperMarkers.length < numShippers) {
      toast.warning(`Bạn đã nhập ${shipperMarkers.length} shipper nhưng yêu cầu ${numShippers}. Sẽ sử dụng ${shipperMarkers.length} shipper.`);
    }
    setIsRunning(true);
    setPathResult(new Map());
    setPathGeometry(new Map());
    setPathDistance(new Map());
    try {
      const allPoints = [...shipperMarkers, ...deliveryMarkers];
      const totalPairs = (allPoints.length * (allPoints.length - 1)) / 2;
      let processedPairs = 0;
      
      if (totalPairs > 0) {
        toast.loading(`Đang tính khoảng cách đường bộ (0/${totalPairs})...`, { id: "road-distance" });
      }
      const needsRecalculation = allPoints.some((point, i) => {
        for (let j = i + 1; j < allPoints.length; j++) {
          const key = `${point.position[0]},${point.position[1]}-${allPoints[j].position[0]},${allPoints[j].position[1]}`;
          const reverseKey = `${allPoints[j].position[0]},${allPoints[j].position[1]}-${point.position[0]},${point.position[1]}`;
          if (!distanceMatrixRef.current.has(key) && !distanceMatrixRef.current.has(reverseKey)) {
            return true;
          }
        }
        return false;
      });
      
      if (needsRecalculation) {
        const promises: Promise<void>[] = [];
        const batchSize = 5;
        let pendingCount = 0;
        for (let i = 0; i < allPoints.length; i++) {
          for (let j = i + 1; j < allPoints.length; j++) {
            const fromMarker = allPoints[i];
            const toMarker = allPoints[j];
            const key = `${fromMarker.position[0]},${fromMarker.position[1]}-${toMarker.position[0]},${toMarker.position[1]}`;
            const reverseKey = `${toMarker.position[0]},${toMarker.position[1]}-${fromMarker.position[0]},${fromMarker.position[1]}`;
            if (!distanceMatrixRef.current.has(key) && !distanceMatrixRef.current.has(reverseKey)) {
              pendingCount++;
              promises.push(
                getRoadDistance(fromMarker.position, toMarker.position, true).then(() => {
                  processedPairs++;
                  if (totalPairs > 5 && processedPairs % batchSize === 0) {
                    toast.loading(
                      `Đang tính khoảng cách đường bộ (${processedPairs}/${totalPairs})...`,
                      { id: "road-distance" }
                    );
                  }
                })
              );
              if (promises.length >= batchSize) {
                await Promise.all(promises);
                promises.length = 0;
              }
            } else {
              processedPairs++;
            }
          }
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        if (pendingCount === 0) {
          toast.dismiss("road-distance");
          toast.success("Sử dụng kết quả đã cache, không cần tính lại");
        }
      } else {
        toast.dismiss("road-distance");
        toast.success("Sử dụng kết quả đã cache, không cần tính lại");
      }
      
      toast.dismiss("road-distance");
      
      const pointIndexMap = new Map<string, number>();
      allPoints.forEach((point, index) => {
        pointIndexMap.set(point.id, index);
      });
      
      const distanceMatrix = buildDistanceMatrix(
        allPoints.map((p) => ({ id: p.id, position: p.position })),
        distanceMatrixRef.current
      );
      
      const deliveryPoints = deliveryMarkers.map((m) => ({ id: m.id, position: m.position }));
      toast.loading("Đang xây dựng đồ thị xung đột...", { id: "conflict-graph" });
      const { nodes, edges } = buildConflictGraph(
        deliveryPoints,
        distanceMatrix,
        pointIndexMap,
        conflictRadius
      );
      toast.dismiss("conflict-graph");
      toast.loading("Đang tô màu đồ thị...", { id: "color-graph" });
      const colorGroups = colorOrders(
        nodes,
        edges,
        numShippers,
        allPoints.map((p) => ({ id: p.id, position: p.position }))
      );
      toast.dismiss("color-graph");
      toast.loading("Đang phân bổ đơn hàng cho shipper...", { id: "assign-shippers" });
      const shipperAssignments = new Map<number, string>();
      for (const [color, deliveryIds] of colorGroups.entries()) {
        if (deliveryIds.length === 0) continue;
        let nearestShipperId = shipperMarkers[0].id;
        let minTotalDistance = Infinity;
        for (const shipper of shipperMarkers) {
          const shipperIdx = pointIndexMap.get(shipper.id)!;
          let totalDist = 0;
          
          for (const deliveryId of deliveryIds) {
            const deliveryIdx = pointIndexMap.get(deliveryId);
            if (deliveryIdx !== undefined) {
              totalDist += distanceMatrix[shipperIdx][deliveryIdx];
            }
          }
          
          if (totalDist < minTotalDistance) {
            minTotalDistance = totalDist;
            nearestShipperId = shipper.id;
          }
        }
        
        shipperAssignments.set(color, nearestShipperId);
      }
      toast.dismiss("assign-shippers");
      toast.loading("Đang tối ưu lộ trình cho từng shipper...", { id: "optimize-routes" });
      const finalPathResult = new Map<number, string[]>();
      const finalPathDistance = new Map<number, number>();
      const finalPathGeometry = new Map<number, [number, number][]>();
      
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
      
      for (const [color, deliveryIds] of colorGroups.entries()) {
        if (deliveryIds.length === 0) continue;
        
        const assignedShipperId = shipperAssignments.get(color);
        if (!assignedShipperId) continue;
        
        const assignedShipper = shipperMarkers.find(s => s.id === assignedShipperId);
        if (!assignedShipper) continue;
        
        const shipperIndex = pointIndexMap.get(assignedShipperId)!;
        const deliveryIndices = deliveryIds.map(id => pointIndexMap.get(id)!).filter(idx => idx !== undefined);
        
        const optimizedRoute = await optimizeRouteWithDijkstra(
          shipperIndex,
          deliveryIndices,
          allPoints.map((p) => ({ id: p.id, position: p.position })),
          distanceMatrix
        );
        
        const fullRoute = [assignedShipperId, ...optimizedRoute];
        finalPathResult.set(color, fullRoute);
        
        let totalDistance = 0;
        const allPathCoordinates: [number, number][] = [assignedShipper.position];
        let currentPointId = assignedShipperId;
        
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
        
        finalPathDistance.set(color, totalDistance);
        finalPathGeometry.set(color, allPathCoordinates);
      }
      
      toast.dismiss("optimize-routes");
      
      setPathResult(finalPathResult);
      setPathDistance(finalPathDistance);
      setPathGeometry(finalPathGeometry);
      
      const totalDistance = Array.from(finalPathDistance.values()).reduce((sum, dist) => sum + dist, 0);
      toast.success(
        `Đã phân chia ${deliveryMarkers.length} đơn hàng cho ${colorGroups.size} shipper. Tổng khoảng cách: ${totalDistance.toFixed(2)} km`
      );
      
      saveToHistory(markers, numShippers, conflictRadius, {
        pathResult: finalPathResult,
        pathDistance: finalPathDistance,
      });
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
                <Label className="text-sm font-medium">Phân chia đơn hàng cho k-shipper</Label>
                <div className="space-y-2">
                  {markers.filter((m) => m.type === "shipper").length === 0 && (
                    <p className="text-xs text-muted-foreground p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                      Chưa có vị trí shipper. Hãy thêm từ tìm kiếm phía trên.
                    </p>
                  )}
                  {markers.filter((m) => m.type === "shipper").length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Đã thêm {markers.filter((m) => m.type === "shipper").length} vị trí shipper. Hệ thống sẽ tự động phân bổ đơn hàng cho shipper gần nhất.
                    </p>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Số lượng shipper (k)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={numShippers}
                      onChange={(e) => setNumShippers(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                      className={`w-full ${customButtonShadow}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Số lượng shipper sẵn có (tương ứng số màu tối đa). Nếu nhập nhiều shipper hơn số này, hệ thống sẽ sử dụng tất cả.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Ngưỡng xung đột (km)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      step="0.5"
                      value={conflictRadius}
                      onChange={(e) => setConflictRadius(Math.max(1, Math.min(100, parseFloat(e.target.value) || 10)))}
                      className={`w-full ${customButtonShadow}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nếu 2 đơn hàng cách nhau &gt; ngưỡng này, chúng sẽ được giao bởi shipper khác nhau
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Label className="text-xs text-muted-foreground">API Keys OpenRouteService</Label>
                      <Dialog open={showApiKeysDialog} onOpenChange={setShowApiKeysDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => setShowApiKeysDialog(true)}
                          >
                            Quản lý ({apiKeys.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Quản lý API Keys</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label className="text-sm">Thêm API Key mới</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="password"
                                  placeholder="Nhập API key..."
                                  value={apiKeyInput}
                                  onChange={(e) => setApiKeyInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && apiKeyInput.trim()) {
                                      addApiKey(apiKeyInput);
                                    }
                                  }}
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (apiKeyInput.trim()) {
                                      addApiKey(apiKeyInput);
                                    }
                                  }}
                                  disabled={!apiKeyInput.trim()}
                                >
                                  Thêm
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Hệ thống sẽ tự động xoay vòng các API keys để tránh rate limit (429)
                              </p>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                              <Label className="text-sm">Danh sách API Keys ({apiKeys.length})</Label>
                              {apiKeys.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                  Chưa có API key. Thêm API key để sử dụng OpenRouteService.
                                </p>
                              ) : (
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                  {apiKeys.map((key, index) => (
                                    <Card key={index} className="p-2 border border-border">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-mono truncate">
                                            {key.substring(0, 20)}...
                                          </p>
                                          {rateLimitedKeysRef.current.has(key) && (
                                            <Badge variant="destructive" className="text-xs mt-1">
                                              Rate Limited
                                            </Badge>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeApiKey(key)}
                                          className="h-7 w-7 p-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </Card>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {apiKeys.length > 0 
                        ? `Đang sử dụng ${apiKeys.length} API key(s). Hệ thống tự động xoay vòng khi gặp 429.`
                        : "Chưa có API key. Click 'Quản lý' để thêm API key từ OpenRouteService."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleRunAlgorithm}
                      disabled={
                        isRunning || 
                        markers.filter((m) => m.type === "shipper").length === 0 ||
                        markers.filter((m) => m.type === "delivery").length === 0 ||
                        numShippers < 1
                      }
                      className={`flex-1 ${customButtonShadow}`}
                    >
                      <Route className="h-4 w-4 mr-2" />
                      {isRunning ? "Đang phân chia..." : "Phân chia đơn hàng"}
                    </Button>
                    <Dialog open={showHistory} onOpenChange={setShowHistory}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className={customButtonShadow}
                          onClick={() => setShowHistory(true)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <span>Lịch sử sử dụng</span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={exportHistory}
                                className="text-xs"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Xuất JSON
                              </Button>
                              <label className="cursor-pointer">
                                <input
                                  type="file"
                                  accept=".json"
                                  onChange={importHistory}
                                  className="hidden"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  asChild
                                >
                                  <span>
                                    <Upload className="h-3 w-3 mr-1" />
                                    Nhập JSON
                                  </span>
                                </Button>
                              </label>
                            </div>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 mt-4">
                          {history.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                              Chưa có lịch sử. Chạy thuật toán để lưu lịch sử.
                            </p>
                          ) : (
                            history.map((item) => (
                              <Card key={item.id} className={`p-3 border border-border ${customButtonShadow}`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {new Date(item.timestamp).toLocaleString("vi-VN")}
                                      </Badge>
                                      {item.result && (
                                        <Badge variant="secondary">
                                          Đã có kết quả
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                      <p>
                                        Shipper: {item.markers.filter(m => m.type === "shipper").length} | 
                                        Đơn hàng: {item.markers.filter(m => m.type === "delivery").length}
                                      </p>
                                      <p>
                                        Số shipper: {item.numShippers} | 
                                        Ngưỡng xung đột: {item.conflictRadius} km
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => loadFromHistory(item)}
                                      className="text-xs"
                                    >
                                      Sử dụng
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => deleteHistory(item.id)}
                                      className="text-xs"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>

              {pathResult.size > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Kết quả phân chia</Label>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Array.from(pathResult.entries()).map(([color, route]) => {
                      const distance = pathDistance.get(color) || 0;
                      const shipperId = route[0];
                      const deliveryIds = route.slice(1);
                      const shipperMarker = markers.find(m => m.id === shipperId);
                      const colorNames = ["Đỏ", "Xanh dương", "Xanh lá", "Vàng", "Tím", "Cam", "Hồng", "Nâu", "Xám", "Đen"];
                      const colorHexArray = [
                        "#ef4444", "#3b82f6", "#22c55e", "#eab308", 
                        "#a855f7", "#f97316", "#ec4899", "#92400e", 
                        "#6b7280", "#000000"
                      ];
                      const colorName = colorNames[color % colorNames.length];
                      const colorHex = colorHexArray[color % colorHexArray.length];
                      
                      return (
                        <Card key={color} className={`p-3 border border-border bg-muted/50 ${customButtonShadow}`}>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-border"
                                style={{ backgroundColor: colorHex }}
                              />
                              <p className="text-sm font-medium">
                                Shipper {color + 1} ({colorName})
                                {shipperMarker && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    - {shipperMarker.name}
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Khoảng cách: {distance.toFixed(2)} km | {deliveryIds.length} đơn hàng
                            </p>
                            <div className="mt-2 pt-2 border-t border-border">
                              <p className="text-xs font-medium mb-1">Thứ tự giao hàng:</p>
                              <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                                {deliveryIds.map((id, idx) => {
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
                      );
                    })}
                  </div>
                  <Card className={`p-3 border border-border bg-muted/50 ${customButtonShadow}`}>
                    <p className="text-sm font-medium">
                      Tổng khoảng cách: {Array.from(pathDistance.values()).reduce((sum, dist) => sum + dist, 0).toFixed(2)} km
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tổng số đơn hàng: {markers.filter((m) => m.type === "delivery").length} | 
                      Số shipper: {pathResult.size}
                    </p>
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
                <p>• Nhập số lượng shipper và ngưỡng xung đột</p>
                <p>• Chạy thuật toán tô màu đồ thị để phân chia đơn hàng</p>
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
            {Array.from(pathGeometry.entries()).map(([color, geometry]) => {
              const colorHex = [
                "#ef4444", "#3b82f6", "#22c55e", "#eab308", 
                "#a855f7", "#f97316", "#ec4899", "#92400e", 
                "#6b7280", "#000000"
              ][color % 10];
              
              return (
                <Polyline
                  key={color}
                  positions={geometry}
                  pathOptions={{
                    color: colorHex,
                    weight: 5,
                    opacity: 0.9,
                  }}
                />
              );
            })}

            {markers.map((marker) => {
              const isShipper = marker.type === "shipper";
              let backgroundColor = "#ffffff";
              let borderColor = "#000000";
              let textColor = "#000000";
              let label = "";
              
              if (isShipper) {
                let assignedColor = -1;
                for (const [color, route] of pathResult.entries()) {
                  if (route[0] === marker.id) {
                    assignedColor = color;
                    break;
                  }
                }
                
                if (assignedColor >= 0) {
                  const colorHexArray = [
                    "#ef4444", "#3b82f6", "#22c55e", "#eab308", 
                    "#a855f7", "#f97316", "#ec4899", "#92400e", 
                    "#6b7280", "#000000"
                  ];
                  backgroundColor = colorHexArray[assignedColor % colorHexArray.length];
                  borderColor = backgroundColor;
                  textColor = "#ffffff";
                  label = `S${assignedColor + 1}`;
                } else {
                  backgroundColor = "#22c55e";
                  borderColor = "#16a34a";
                  textColor = "#ffffff";
                  label = "S";
                }
              } else if (marker.type === "delivery") {
                let assignedColor = -1;
                let pathIndex = -1;
                
                for (const [color, route] of pathResult.entries()) {
                  const index = route.indexOf(marker.id);
                  if (index > 0) {
                    assignedColor = color;
                    pathIndex = index - 1;
                    break;
                  }
                }
                
                if (assignedColor >= 0) {
                  const colorHex = [
                    "#ef4444", "#3b82f6", "#22c55e", "#eab308", 
                    "#a855f7", "#f97316", "#ec4899", "#92400e", 
                    "#6b7280", "#000000"
                  ][assignedColor % 10];
                  backgroundColor = colorHex;
                  borderColor = colorHex;
                  textColor = "#ffffff";
                  label = String(pathIndex + 1);
                } else {
                  backgroundColor = "#fbbf24";
                  borderColor = "#f59e0b";
                  textColor = "#000000";
                }
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