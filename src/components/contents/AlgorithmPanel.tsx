"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Info, Play, Zap, Network, Link2 } from "lucide-react";
import type { GraphNode, GraphEdge } from "@/components/contents/GraphView";

type Algorithm = "dijkstra" | "bellman-ford" | "kruskal" | "prim";

const customButtonShadow =
  "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

interface AlgorithmPanelProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onRunAlgorithm: (
    algorithm: Algorithm,
    sourceNode?: string,
    targetNode?: string
  ) => Promise<void>;
}

const algorithmInfo: Record<
  Algorithm,
  { name: string; description: string; complexity: string }
> = {
  dijkstra: {
    name: "Dijkstra",
    description:
      "Tìm đường đi ngắn nhất từ một đỉnh nguồn đến tất cả các đỉnh khác",
    complexity: "O(V²) hoặc O(E log V)",
  },
  "bellman-ford": {
    name: "Bellman-Ford",
    description:
      "Tìm đường đi ngắn nhất, hỗ trợ trọng số âm và phát hiện chu trình âm",
    complexity: "O(V × E)",
  },
  kruskal: {
    name: "Kruskal",
    description: "Tìm cây khung nhỏ nhất (Minimum Spanning Tree)",
    complexity: "O(E log E)",
  },
  prim: {
    name: "Prim",
    description: "Tìm cây khung nhỏ nhất (Minimum Spanning Tree)",
    complexity: "O(E log V)",
  },
};

export default function AlgorithmPanel({
  nodes,
  edges,
  onRunAlgorithm,
}: AlgorithmPanelProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | "">(
    ""
  );
  const [sourceNode, setSourceNode] = useState<string>("");
  const [targetNode, setTargetNode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!selectedAlgorithm) {
      toast.warning("Vui lòng chọn thuật toán");
      return;
    }

    if (nodes.length === 0) {
      toast.warning("Vui lòng thêm ít nhất một đỉnh vào đồ thị");
      return;
    }

    setLoading(true);
    try {
      if (
        selectedAlgorithm === "dijkstra" ||
        selectedAlgorithm === "bellman-ford"
      ) {
        if (!sourceNode) {
          toast.error("Vui lòng chọn đỉnh nguồn");
          setLoading(false);
          return;
        }
        await onRunAlgorithm(
          selectedAlgorithm,
          sourceNode,
          targetNode || undefined
        );
      } else if (
        selectedAlgorithm === "kruskal" ||
        selectedAlgorithm === "prim"
      ) {
        if (edges.length === 0) {
          toast.warning("Vui lòng thêm ít nhất một cạnh vào đồ thị");
          setLoading(false);
          return;
        }
        await onRunAlgorithm(selectedAlgorithm);
      }
    } catch (error) {
      console.error("Error running algorithm:", error);
      toast.error("Đã xảy ra lỗi khi chạy thuật toán");
    } finally {
      setLoading(false);
    }
  };

  const selectedInfo = selectedAlgorithm
    ? algorithmInfo[selectedAlgorithm]
    : null;
  const canRun =
    selectedAlgorithm &&
    nodes.length > 0 &&
    (selectedAlgorithm === "dijkstra" || selectedAlgorithm === "bellman-ford"
      ? sourceNode !== ""
      : edges.length > 0);

  return (
    <Card
      className={`h-full flex flex-col border border-border ${customButtonShadow}`}
    >
      <CardHeader className="border-b border-border pb-2 lg:pb-3 px-3 lg:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
            <Zap className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-sm lg:text-lg truncate">
                Thuật toán
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                Chạy các thuật toán đồ thị
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 lg:gap-2 shrink-0">
            <Badge variant="outline" className="text-xs">
              <Network className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">{nodes.length}</span>
              <span className="sm:hidden">{nodes.length}</span>
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Link2 className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">{edges.length}</span>
              <span className="sm:hidden">{edges.length}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 lg:p-4 space-y-3 lg:space-y-4 overflow-y-auto">
        {nodes.length === 0 && (
          <Alert variant="destructive" className="py-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Cần ít nhất một đỉnh để chạy thuật toán
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label className="text-xs lg:text-sm font-medium">
            Chọn thuật toán
          </Label>
          <Select
            value={selectedAlgorithm}
            onValueChange={(value) => {
              setSelectedAlgorithm(value as Algorithm);
              setSourceNode("");
              setTargetNode("");
            }}
          >
            <SelectTrigger
              className={`w-full text-sm h-10 ${customButtonShadow}`}
            >
              <SelectValue placeholder="Chọn thuật toán" />
            </SelectTrigger>
            <SelectContent className={customButtonShadow}>
              <SelectItem value="dijkstra">
                Dijkstra (Đường đi ngắn nhất)
              </SelectItem>
              <SelectItem value="bellman-ford">
                Bellman-Ford (Có trọng số âm)
              </SelectItem>
              <SelectItem value="kruskal">
                Kruskal (Cây khung nhỏ nhất)
              </SelectItem>
              <SelectItem value="prim">Prim (Cây khung nhỏ nhất)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {selectedInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1.5">
                <p className="font-medium text-sm">{selectedInfo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedInfo.description}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  Độ phức tạp: {selectedInfo.complexity}
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {(selectedAlgorithm === "dijkstra" ||
          selectedAlgorithm === "bellman-ford") && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs lg:text-sm font-medium">
                  Đỉnh nguồn
                </Label>
                <Select value={sourceNode} onValueChange={setSourceNode}>
                  <SelectTrigger
                    className={`w-full text-sm h-10 ${customButtonShadow}`}
                  >
                    <SelectValue placeholder="Chọn đỉnh nguồn" />
                  </SelectTrigger>
                  <SelectContent className={customButtonShadow}>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs lg:text-sm font-medium">
                  Đỉnh đích (tùy chọn)
                </Label>
                <Select
                  value={targetNode || "none"}
                  onValueChange={(value) =>
                    setTargetNode(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger
                    className={`w-full text-sm h-10 ${customButtonShadow}`}
                  >
                    <SelectValue placeholder="Chọn đỉnh đích" />
                  </SelectTrigger>
                  <SelectContent className={customButtonShadow}>
                    <SelectItem value="none">Không có</SelectItem>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
        {(selectedAlgorithm === "kruskal" || selectedAlgorithm === "prim") &&
          edges.length === 0 && (
            <>
              <Separator />
              <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Cần ít nhất một cạnh để chạy thuật toán {selectedInfo?.name}
                </AlertDescription>
              </Alert>
            </>
          )}

        <Separator />

        <Button
          onClick={handleRun}
          disabled={!canRun || loading}
          variant="outline"
          className={`w-full h-11 lg:h-12 text-sm lg:text-base ${customButtonShadow}`}
          size="lg"
        >
          {loading ? (
            <>
              <Play className="h-4 w-4 mr-2 animate-spin" />
              Đang chạy...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Chạy thuật toán
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
