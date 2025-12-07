"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AlgorithmPanel from "@/components/contents/AlgorithmPanel";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import betterFetch from "@/lib/better-fetch";
import { Skeleton } from "@/components/ui/skeleton";

const MapView = dynamic(() => import("@/components/contents/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4 border rounded-md">
      <div className="p-6 space-y-2 border-b">
        <Skeleton className="h-6 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-[calc(100vh-300px)] w-full rounded-md" />
      </div>
    </div>
  ),
});

interface Location {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
  routeGeometry?: Array<[number, number]>;
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [routeName] = useState<string>("Tuyến đường mới");
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [nodeColors, setNodeColors] = useState<Record<string, string>>({});
  const session = authClient.useSession();

  const handleAddLocation = useCallback((label: string, lat: number, lng: number) => {
    const newLocation: Location = {
      id: `loc_${Date.now()}`,
      label,
      lat,
      lng,
    };
    setLocations([...locations, newLocation]);
    toast.success(`Đã thêm địa điểm: ${label}`);
  }, [locations]);

  const handleDeleteLocation = useCallback((id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id));
  }, [locations]);

  const handleEditLocation = useCallback((id: string) => {
    const location = locations.find((loc) => loc.id === id);
    if (location) {
    }
  }, [locations]);

  const handleUpdateLocation = useCallback((id: string, lat: number, lng: number) => {
    setLocations(
      locations.map((loc) =>
        loc.id === id ? { ...loc, lat, lng } : loc
      )
    );
    toast.success("Đã cập nhật vị trí");
  }, [locations]);

  const handleRunAlgorithm = useCallback(
    async (algorithm: string, sourceNode?: string, targetNode?: string) => {
      if (!session.data?.user) {
        toast.error("Vui lòng đăng nhập để chạy thuật toán");
        return;
      }

      if (locations.length === 0) {
        toast.warning("Vui lòng thêm ít nhất một địa điểm");
        return;
      }

      const toastId = toast.loading("Đang tính toán khoảng cách theo đường xá...");

      try {
        const nodes = locations.map((loc) => ({
          id: loc.id,
          label: loc.label,
          position: {
            x: (loc.lng - 106.660172) * 1000,
            y: (loc.lat - 10.762622) * 1000,
          },
        }));

        const computedEdges: Edge[] = [];
        const geometries: Record<string, Array<[number, number]>> = {};

        toast.loading("Đang tính toán khoảng cách giữa các địa điểm...", { id: toastId });

        for (let i = 0; i < locations.length; i++) {
          for (let j = i + 1; j < locations.length; j++) {
            const from = locations[i];
            const to = locations[j];
            const edgeId = `e_${from.id}_${to.id}`;

            try {
              const routeResponse = await betterFetch.post<{
                distance: number;
                duration: number;
                geometry: {
                  type: string;
                  coordinates: Array<[number, number]>;
                };
              }>("/api/routing", {
                from: [from.lng, from.lat],
                to: [to.lng, to.lat],
              });

              if (routeResponse.data) {
                const distance = routeResponse.data.distance;
                const coords = routeResponse.data.geometry.coordinates.map(
                  ([lng, lat]) => [lat, lng] as [number, number]
                );

                computedEdges.push({
                  id: edgeId,
                  source: from.id,
                  target: to.id,
                  weight: Math.round(distance),
                  routeGeometry: coords,
                });

                geometries[edgeId] = coords;
              }
            } catch (error) {
              console.error(`Failed to calculate route from ${from.label} to ${to.label}:`, error);
              const fallbackDistance = Math.sqrt(
                Math.pow(to.lat - from.lat, 2) + Math.pow(to.lng - from.lng, 2)
              ) * 111000;
              computedEdges.push({
                id: edgeId,
                source: from.id,
                target: to.id,
                weight: Math.round(fallbackDistance),
              });
            }
          }
        }

        setEdges(computedEdges);

        toast.loading("Đang chạy thuật toán...", { id: toastId });

        let graphId: string | null = null;
        try {
          const response = await betterFetch.post<{ graph: { _id: string } }>("/api/graphs", {
            name: routeName,
            nodes,
            edges: computedEdges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              weight: e.weight,
              label: e.weight.toString(),
            })),
          });
          
          if (response.data?.graph?._id) {
            graphId = response.data.graph._id;
          }
        } catch (error) {
          console.error("Failed to save graph:", error);
          toast.error("Không thể lưu đồ thị. Vui lòng thử lại.", { id: toastId });
          return;
        }

        if (!graphId) {
          toast.error("Không thể lưu đồ thị. Vui lòng thử lại.", { id: toastId });
          return;
        }

        const { data } = await betterFetch.post<{ result: unknown }>("/api/algorithms", {
          graphId,
          algorithm,
          sourceNode,
          targetNode,
        });

        if (!data) {
          throw new Error("No data returned from algorithm");
        }

        console.log("Algorithm result:", data.result);

        const algorithmNames: Record<string, string> = {
          dijkstra: "Dijkstra",
          "bellman-ford": "Bellman-Ford",
          kruskal: "Kruskal",
          prim: "Prim",
        };

        toast.success(
          `Đã chạy thuật toán ${algorithmNames[algorithm] || algorithm} thành công!`,
          { id: toastId }
        );

        if (data?.result && typeof data.result === "object") {
          const result = data.result as Record<string, unknown>;
          
          if ("path" in result && Array.isArray(result.path) && result.path.length > 0) {
            setHighlightedPath(result.path as string[]);
            setNodeColors({});
            toast.info(`Tìm thấy đường đi với ${result.path.length} điểm dừng`);
          } else if ("mst" in result && Array.isArray(result.mst) && result.mst.length > 0) {
            const mstNodeIds = new Set<string>();
            (result.mst as Array<{ source: string; target: string }>).forEach((edge) => {
              mstNodeIds.add(edge.source);
              mstNodeIds.add(edge.target);
            });
            setHighlightedPath(Array.from(mstNodeIds));
            setNodeColors({});
            toast.info(`Tìm thấy cây khung với ${result.mst.length} cạnh`);
          } else if ("distances" in result && typeof result.distances === "object") {
            const distances = result.distances as Record<string, number>;
            const allNodes = Object.keys(distances).filter((nodeId) => distances[nodeId] !== Infinity && distances[nodeId] !== undefined);
            if (allNodes.length > 0) {
              setHighlightedPath(allNodes);
              setNodeColors({});
              toast.info(`Đã tính toán khoảng cách cho ${allNodes.length} node`);
            } else {
              setHighlightedPath([]);
              setNodeColors({});
            }
          } else {
            setHighlightedPath([]);
            setNodeColors({});
          }
        } else {
          setHighlightedPath([]);
          setNodeColors({});
        }
      } catch (error) {
        console.error("Error running algorithm:", error);
        const errorMessage = error instanceof Error ? error.message : "Lỗi khi chạy thuật toán";
        toast.error(errorMessage, { id: toastId });
      }
    },
    [session, locations, routeName]
  );

  const mapNodes = locations.map((loc) => ({
    id: loc.id,
    type: "default" as const,
    position: {
      x: (loc.lng - 106.660172) * 1000,
      y: (loc.lat - 10.762622) * 1000,
    },
    data: { label: loc.label },
  }));

  return (
    <div className="page">
      <div className="grid h-full grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapView
            nodes={mapNodes}
            highlightedPath={highlightedPath}
            nodeColors={nodeColors}
            edges={edges}
            onNodeAdd={handleAddLocation}
            onNodeUpdate={handleUpdateLocation}
            onNodeDelete={handleDeleteLocation}
            onNodeEdit={handleEditLocation}
          />
        </div>

        <div className="lg:col-span-1">
          <AlgorithmPanel
            nodes={mapNodes}
            edges={edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.weight.toString(),
              data: { weight: e.weight },
            }))}
            onRunAlgorithm={handleRunAlgorithm}
          />
        </div>
      </div>
    </div>
  );
}
