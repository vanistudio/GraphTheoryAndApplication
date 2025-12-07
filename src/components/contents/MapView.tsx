"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Map } from "@/components/ui/map";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationIcon } from "@/components/icons/glass-icons";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { searchPlaces, type GeocodingResult } from "@/lib/geocoding";
import { cn } from "@/lib/utils";
import type { Node } from "reactflow";

interface MapViewProps {
  nodes: Node[];
  highlightedPath?: string[];
  nodeColors?: Record<string, string>;
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    weight: number;
    routeGeometry?: Array<[number, number]>;
  }>;
  onNodeUpdate?: (nodeId: string, lat: number, lng: number) => void;
  onNodeAdd?: (label: string, lat: number, lng: number) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeEdit?: (nodeId: string) => void;
}

export default function MapView({ nodes, highlightedPath = [], nodeColors = {}, edges = [], onNodeUpdate, onNodeAdd, onNodeDelete, onNodeEdit }: MapViewProps) {
  const [newLocationName, setNewLocationName] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([10.762622, 106.660172]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(newLocationName, 500);

  const markers = nodes
    .filter((node) => {
      const pos = node.position;
      return pos && typeof pos.x === "number" && typeof pos.y === "number";
    })
    .map((node) => {
      const pos = node.position;
      const lat = (pos.y / 1000) + 10.762622;
      const lng = (pos.x / 1000) + 106.660172;
      
      return {
        id: node.id,
        position: [lat, lng] as [number, number],
        label: node.data.label || node.id,
        color: nodeColors[node.id],
      };
    });

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (selectedNode && onNodeUpdate) {
        onNodeUpdate(selectedNode, lat, lng);
        toast.success("Đã cập nhật vị trí node");
        setSelectedNode(null);
      } else if (newLocationName.trim() && onNodeAdd) {
        onNodeAdd(newLocationName.trim(), lat, lng);
        setNewLocationName("");
        toast.success("Đã thêm địa điểm mới");
      }
    },
    [selectedNode, newLocationName, onNodeUpdate, onNodeAdd]
  );

  const handleMarkerClick = useCallback(() => {
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchPlaces(debouncedQuery);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (inputRef.current && !inputRef.current.contains(target)) {
        const suggestionDropdown = document.querySelector('[data-suggestion-dropdown]');
        if (!suggestionDropdown?.contains(target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectSuggestion = useCallback(
    (suggestion: GeocodingResult) => {
      setNewLocationName(suggestion.display_name);
      setSuggestions([]);
      setIsOpen(false);
      
      const lat = parseFloat(suggestion.lat);
      const lng = parseFloat(suggestion.lon);
      setMapCenter([lat, lng]);
      
      if (onNodeAdd) {
        onNodeAdd(suggestion.display_name, lat, lng);
        toast.success(`Đã thêm địa điểm: ${suggestion.display_name}`);
        setNewLocationName("");
      } else {
        toast.info("Click vào bản đồ để xác nhận vị trí");
      }
    },
    [onNodeAdd]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LocationIcon className="h-5 w-5" size={20} />
          Bản đồ địa điểm
        </CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-4 flex-1 px-6 pb-6">

        <div className="flex gap-2 relative">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Tìm kiếm địa điểm..."
              value={newLocationName}
              onChange={(e) => {
                setNewLocationName(e.target.value);
                if (e.target.value.trim().length >= 3) {
                  setIsOpen(true);
                }
              }}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setIsOpen(true);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newLocationName.trim()) {
                  if (suggestions.length > 0) {
                    handleSelectSuggestion(suggestions[0]);
                  } else {
                    toast.info("Click vào bản đồ để thêm địa điểm");
                  }
                }
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
            />
            {isOpen && (suggestions.length > 0 || isLoading) && (
              <div 
                data-suggestion-dropdown
                className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto"
              >
                {isLoading ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    Đang tìm kiếm...
                  </div>
                ) : (
                  suggestions.map((suggestion) => (
                    <button
                      key={suggestion.place_id}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground",
                        "border-b border-border last:border-b-0",
                        "transition-colors"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <LocationIcon className="h-4 w-4 mt-0.5 shrink-0" size={16} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {suggestion.display_name.split(",")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {suggestion.display_name.split(",").slice(1).join(",").trim()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedNode && (
            <Button
              onClick={() => setSelectedNode(null)}
              variant="outline"
            >
              Hủy chọn
            </Button>
          )}
        </div>

        {selectedNode && (
          <div className="flex items-center gap-2 p-3 bg-accent/50 border border-border rounded-md">
            <p className="text-sm text-foreground">
              <span className="font-medium">Chế độ chỉnh sửa:</span>{" "}
              <span className="font-semibold">{nodes.find((n) => n.id === selectedNode)?.data.label}</span>
            </p>
            <Button
              onClick={() => {
                setSelectedNode(null);
                toast.info("Đã hủy chế độ chỉnh sửa");
              }}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
            >
              Hủy
            </Button>
          </div>
        )}

        {!selectedNode && newLocationName.trim() && (
          <div className="flex items-center gap-2 p-3 bg-accent/50 border border-border rounded-md">
            <p className="text-sm text-foreground">
              <span className="font-medium">Sẵn sàng thêm:</span>{" "}
              <span className="font-semibold">{newLocationName}</span>
            </p>
            <Button
              onClick={() => {
                setNewLocationName("");
                toast.info("Đã hủy thêm địa điểm");
              }}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
            >
              Hủy
            </Button>
          </div>
        )}

        <Map
          markers={markers}
          highlightedPath={highlightedPath}
          edges={edges}
          onMarkerClick={handleMarkerClick}
          onMarkerDelete={(id) => {
            if (onNodeDelete) {
              onNodeDelete(id);
              toast.success("Đã xóa địa điểm");
            }
          }}
          onMarkerEdit={(id) => {
            if (onNodeEdit) {
              onNodeEdit(id);
              setSelectedNode(id);
              toast.info("Đã bật chế độ chỉnh sửa. Click vào bản đồ để chọn vị trí mới");
            }
          }}
          onClick={handleMapClick}
          height="calc(100vh - 300px)"
          center={mapCenter}
          zoom={13}
        />

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Nhập tên địa điểm và click vào bản đồ để thêm mới</p>
          <p>• Click vào marker để xem thông tin</p>
          <p>• Click nút &quot;Sửa&quot; trong popup để chỉnh sửa vị trí</p>
        </div>
      </div>
    </Card>
  );
}

