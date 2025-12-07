"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from "react-leaflet";
import { useTheme } from "next-themes";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Minus, Layers, Navigation, Waypoints, Pentagon, PenLine, Trash2, Undo2, Edit2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  markers?: Array<{
    id: string;
    position: [number, number];
    label: string;
    color?: string;
  }>;
  highlightedPath?: string[];
  edges?: Array<{
    id: string;
    source: string;
    target: string;
    weight: number;
    routeGeometry?: Array<[number, number]>;
  }>;
  onMarkerClick?: (id: string) => void;
  onMarkerDelete?: (id: string) => void;
  onMarkerEdit?: (id: string) => void;
  onClick?: (lat: number, lng: number) => void;
  height?: string;
}

type MapLayerType = "dark" | "light" | "satellite";
const DarkTileLayer = () => {
  return (
    <TileLayer
      attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, © <a href="https://carto.com/attributions">CARTO</a>'
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      subdomains="abcd"
    />
  );
};
const LightTileLayer = () => {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      className="grayscale"
    />
  );
};
const SatelliteTileLayer = () => {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.esri.com/">Esri</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    />
  );
};
const MapClickHandler = ({ onClick }: { onClick?: (lat: number, lng: number) => void }) => {
  const map = useMap();

  useEffect(() => {
    if (!onClick) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.closest('.leaflet-marker-icon') || target.closest('.leaflet-popup')) {
        return;
      }
      onClick(e.latlng.lat, e.latlng.lng);
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onClick]);

  return null;
};
const MapCenterUpdater = ({ center, zoom }: { center?: [number, number]; zoom?: number }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [map, center, zoom]);

  return null;
};
interface MarkerPopupContentProps {
  marker: {
    id: string;
    position: [number, number];
    label: string;
  };
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

const MarkerPopupContent = ({ marker, onDelete, onEdit }: MarkerPopupContentProps) => {
  const map = useMap();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(marker.id);
      toast.success(`Đã xóa "${marker.label}"`);
    }
    setShowDeleteDialog(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(marker.id);
    }
  };

  const handleCopyCoordinates = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const coords = `${marker.position[0]}, ${marker.position[1]}`;
    try {
      await navigator.clipboard.writeText(coords);
      toast.success("Đã copy tọa độ");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Không thể copy tọa độ");
    }
  };

  const handleCopyLabel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(marker.label);
      toast.success("Đã copy tên địa điểm");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Không thể copy tên địa điểm");
    }
  };

  const handleOpenInMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    const [lat, lng] = marker.position;
    window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=15`, "_blank");
  };

  const handleCenterOnMarker = (e: React.MouseEvent) => {
    e.stopPropagation();
    map.setView(marker.position, Math.max(map.getZoom(), 15));
    map.closePopup();
  };

  return (
    <div className="p-3 space-y-3 min-w-[220px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-card-foreground truncate">
            {marker.label}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            {marker.position[0].toFixed(6)}, {marker.position[1].toFixed(6)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleEdit}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Sửa
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleCopyCoordinates}
            title="Copy tọa độ"
          >
            <Copy className="h-3 w-3 mr-1" />
            Tọa độ
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleCopyLabel}
            title="Copy tên địa điểm"
          >
            <Copy className="h-3 w-3 mr-1" />
            Tên
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleCenterOnMarker}
            title="Di chuyển bản đồ đến địa điểm này"
          >
            <Navigation className="h-3 w-3 mr-1" />
            Đến đây
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={handleOpenInMaps}
            title="Mở trong OpenStreetMap"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Mở bản đồ
          </Button>
          {onDelete && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Xóa
              </Button>
              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc muốn xóa địa điểm &quot;{marker.label}&quot;? Hành động này không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                      Hủy
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleConfirmDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
const MapReady = ({ children }: { children: React.ReactNode }) => {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!map) return;

    const checkAndSetReady = () => {
      try {
        const container = map.getContainer();
        if (container) {
          setIsReady(true);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    if (checkAndSetReady()) {
      return;
    }

    map.whenReady(() => {
      checkAndSetReady();
    });

    const timeout = setTimeout(() => {
      checkAndSetReady();
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [map]);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
};
const DynamicTileLayer = ({ layerType }: { layerType: MapLayerType }) => {
  switch (layerType) {
    case "dark":
      return <DarkTileLayer />;
    case "light":
      return <LightTileLayer />;
    case "satellite":
      return <SatelliteTileLayer />;
    default:
      return <DarkTileLayer />;
  }
};


export function Map({
  center = [10.762622, 106.660172], 
  zoom = 13,
  className,
  markers = [],
  highlightedPath = [],
  edges = [],
  onMarkerClick,
  onMarkerDelete,
  onMarkerEdit,
  onClick,
  height = "400px",
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme || "dark";
  const [layerType, setLayerType] = useState<MapLayerType>(
    currentTheme === "dark" ? "dark" : "light"
  );

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleTrackLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.setView([latitude, longitude], 15);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };
  const MapInstanceStore = () => {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  };

  return (
    <div className={cn("w-full rounded-md border overflow-hidden relative", className)} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
        zoomControl={false}
      >
        <MapReady>
          <DynamicTileLayer layerType={layerType} />
        </MapReady>
        <MapClickHandler onClick={onClick} />
        <MapCenterUpdater center={center} zoom={zoom} />
        <MapInstanceStore />
        {markers.map((marker) => {
          const isHighlighted = highlightedPath.includes(marker.id);
          const markerColor = marker.color || (isHighlighted ? "#3388ff" : "#3388ff");
          
          return (
            <Marker
              key={marker.id}
              position={marker.position}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  onMarkerClick?.(marker.id);
                },
              }}
            >
              {isHighlighted && (
                <Circle
                  center={marker.position}
                  radius={50}
                  pathOptions={{
                    color: markerColor,
                    fillColor: markerColor,
                    fillOpacity: 0.2,
                    weight: 3,
                  }}
                />
              )}
              <Popup closeButton={true}>
                <MarkerPopupContent
                  marker={marker}
                  onDelete={onMarkerDelete}
                  onEdit={onMarkerEdit}
                />
              </Popup>
            </Marker>
          );
        })}
        {highlightedPath.length > 1 && (() => {
          const routePositions: Array<[number, number]> = [];
          
          for (let i = 0; i < highlightedPath.length - 1; i++) {
            const fromId = highlightedPath[i];
            const toId = highlightedPath[i + 1];
            
            const edge = edges.find(
              (e) =>
                (e.source === fromId && e.target === toId) ||
                (e.source === toId && e.target === fromId)
            );
            
            if (edge?.routeGeometry && edge.routeGeometry.length > 0) {
              routePositions.push(...edge.routeGeometry);
            } else {
              const fromMarker = markers.find((m) => m.id === fromId);
              const toMarker = markers.find((m) => m.id === toId);
              if (fromMarker && toMarker) {
                if (routePositions.length === 0 || 
                    routePositions[routePositions.length - 1][0] !== fromMarker.position[0] ||
                    routePositions[routePositions.length - 1][1] !== fromMarker.position[1]) {
                  routePositions.push(fromMarker.position);
                }
                routePositions.push(toMarker.position);
              }
            }
          }
          
          if (routePositions.length > 0) {
            return (
              <Polyline
                positions={routePositions}
                pathOptions={{
                  color: "#3388ff",
                  weight: 4,
                  opacity: 0.7,
                }}
              />
            );
          }
          return null;
        })()}
      </MapContainer>
      <div className="absolute top-1 left-1 z-1001 pointer-events-none">
        <ButtonGroup orientation="vertical" className="pointer-events-auto">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
          >
            <Plus className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
          >
            <Minus className="size-4" />
          </Button>
        </ButtonGroup>
      </div>

      <div className="absolute top-1 right-1 z-1001 pointer-events-none">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-8 pointer-events-auto"
              aria-label="Select layers"
              title="Select layers"
            >
              <Layers className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="pointer-events-auto">
            <DropdownMenuItem
              onClick={() => setLayerType("dark")}
              className={layerType === "dark" ? "bg-accent" : ""}
            >
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLayerType("light")}
              className={layerType === "light" ? "bg-accent" : ""}
            >
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLayerType("satellite")}
              className={layerType === "satellite" ? "bg-accent" : ""}
            >
              Satellite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="absolute right-1 bottom-5 z-1001 pointer-events-none">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-8 pointer-events-auto"
          onClick={handleTrackLocation}
          title="Track location"
          aria-label="Start location tracking"
        >
          <Navigation className="size-4" />
        </Button>
      </div>

      <div className="absolute bottom-1 left-1 z-1001 pointer-events-none">
        <ButtonGroup orientation="vertical" className="pointer-events-auto">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            aria-label="Draw polyline"
            title="Draw polyline"
          >
            <Waypoints className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            aria-label="Draw polygon"
            title="Draw polygon"
          >
            <Pentagon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            disabled
            aria-label="Edit shapes"
            title="Edit shapes"
          >
            <PenLine className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            disabled
            aria-label="Remove shapes"
            title="Remove shapes"
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-8"
            disabled
            aria-label="Undo"
            title="Undo"
          >
            <Undo2 className="size-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
