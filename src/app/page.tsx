"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import AlgorithmPanel from "@/components/contents/AlgorithmPanel";
import { toast } from "sonner";
import betterFetch from "@/lib/better-fetch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import type { GraphNode, GraphEdge } from "@/components/contents/GraphView";

const GraphView = dynamic(() => import("@/components/contents/GraphView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4 border rounded-md">
      <div className="p-6 space-y-2 border-b">
        <Skeleton className="h-6 w-[200px]" />
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-[calc(100vh-300px)] w-full rounded-md" />
      </div>
    </div>
  ),
});

export default function Home() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [graphName] = useState<string>("Đồ thị mới");
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [nodeColors, setNodeColors] = useState<Record<string, string>>({});
  const [algorithmProgress, setAlgorithmProgress] = useState<number>(0);
  const [isRunningAlgorithm, setIsRunningAlgorithm] = useState<boolean>(false);

  const handleNodesChange = useCallback((newNodes: GraphNode[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: GraphEdge[]) => {
    setEdges(newEdges);
  }, []);

  const handleRunAlgorithm = useCallback(
    async (algorithm: string, sourceNode?: string, targetNode?: string) => {
      if (nodes.length === 0) {
        toast.warning("Vui lòng thêm ít nhất một node vào đồ thị");
        return;
      }

      setIsRunningAlgorithm(true);
      setAlgorithmProgress(0);
      const toastId = toast.loading("Đang chạy thuật toán...");
      let progressInterval: NodeJS.Timeout | null = null;
      progressInterval = setInterval(() => {
        setAlgorithmProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const graphNodes = nodes.map((node) => ({
          id: node.id,
          label: node.label,
          position: { x: node.x, y: node.y },
        }));

        const graphEdges = edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          weight: edge.weight,
          label: edge.label || String(edge.weight),
        }));

        let graphId: string | null = null;
        try {
          const response = await betterFetch.post<{ graph: { _id: string } }>("/api/graphs", {
            name: graphName,
            nodes: graphNodes,
            edges: graphEdges,
          });
          
          if (response.data?.graph?._id) {
            graphId = response.data.graph._id;
          }
        } catch (error) {
          if (progressInterval) clearInterval(progressInterval);
          setIsRunningAlgorithm(false);
          setAlgorithmProgress(0);
          console.error("Failed to save graph:", error);
          toast.error("Không thể lưu đồ thị. Vui lòng thử lại.", { id: toastId });
          return;
        }

        if (!graphId) {
          if (progressInterval) clearInterval(progressInterval);
          setIsRunningAlgorithm(false);
          setAlgorithmProgress(0);
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
          "connected-components": "Thành phần liên thông",
          "cycle-detection": "Phát hiện chu trình",
        };

        if (progressInterval) clearInterval(progressInterval);
        setAlgorithmProgress(100);
        setTimeout(() => {
          setIsRunningAlgorithm(false);
          setAlgorithmProgress(0);
        }, 500);

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
          } else if ("components" in result && Array.isArray(result.components)) {
            const allComponentNodes: string[] = [];
            (result.components as Array<{ nodes: string[] }>).forEach((comp) => {
              allComponentNodes.push(...comp.nodes);
            });
            if (allComponentNodes.length > 0) {
              setHighlightedPath(allComponentNodes);
              const colors: Record<string, string> = {};
              const colorPalette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
              (result.components as Array<{ nodes: string[] }>).forEach((comp, idx) => {
                const color = colorPalette[idx % colorPalette.length];
                comp.nodes.forEach((nodeId) => {
                  colors[nodeId] = color;
                });
              });
              setNodeColors(colors);
              toast.info(
                `Tìm thấy ${result.componentCount} thành phần liên thông. Đồ thị ${result.isConnected ? "liên thông" : "không liên thông"}.`
              );
            } else {
              setHighlightedPath([]);
              setNodeColors({});
            }
          } else if ("cycles" in result && Array.isArray(result.cycles)) {
            const allCycleNodes: string[] = [];
            (result.cycles as Array<{ nodes: string[] }>).forEach((cycle) => {
              allCycleNodes.push(...cycle.nodes);
            });
            if (allCycleNodes.length > 0) {
              setHighlightedPath(Array.from(new Set(allCycleNodes)));
              setNodeColors({});
              toast.info(
                `Tìm thấy ${result.cycleCount} chu trình trong đồ thị.`
              );
            } else {
              setHighlightedPath([]);
              setNodeColors({});
              toast.info("Đồ thị không có chu trình.");
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
        if (progressInterval) clearInterval(progressInterval);
        setIsRunningAlgorithm(false);
        setAlgorithmProgress(0);
        console.error("Error running algorithm:", error);
        const errorMessage = error instanceof Error ? error.message : "Lỗi khi chạy thuật toán";
        toast.error(errorMessage, { id: toastId });
      }
    },
    [nodes, edges, graphName]
  );

  return (
    <div className="h-[calc(100vh-120px)] min-h-0 overflow-hidden">
      <AnimatePresence>
        {isRunningAlgorithm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-background border border-border rounded-md p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Đang chạy thuật toán...</span>
                <span className="text-xs text-muted-foreground">{algorithmProgress}%</span>
              </div>
              <Progress value={algorithmProgress} className="h-2" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col lg:grid lg:grid-cols-4 h-full gap-2 lg:gap-4">
        <div className="lg:col-span-1 order-2 lg:order-1 shrink-0 lg:shrink">
          <AlgorithmPanel
            nodes={nodes}
            edges={edges}
            onRunAlgorithm={handleRunAlgorithm}
          />
        </div>
        <div className="lg:col-span-3 order-1 lg:order-2 flex-1 min-h-0 overflow-hidden">
          <GraphView
            nodes={nodes}
            edges={edges}
            highlightedPath={highlightedPath}
            nodeColors={nodeColors}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
          />
        </div>
      </div>
    </div>
  );
}
