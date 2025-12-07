"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Node, Edge } from "reactflow";

type Algorithm = "dijkstra" | "bellman-ford" | "kruskal" | "prim";

interface AlgorithmPanelProps {
  nodes: Node[];
  edges: Edge[];
  onRunAlgorithm: (
    algorithm: Algorithm,
    sourceNode?: string,
    targetNode?: string
  ) => Promise<void>;
}

export default function AlgorithmPanel({
  nodes,
  edges,
  onRunAlgorithm,
}: AlgorithmPanelProps) {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | "">("");
  const [sourceNode, setSourceNode] = useState<string>("");
  const [targetNode, setTargetNode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!selectedAlgorithm) {
      toast.warning("Vui lòng chọn thuật toán");
      return;
    }

    if (nodes.length === 0) {
      toast.warning("Vui lòng thêm ít nhất một node vào đồ thị");
      return;
    }

    setLoading(true);
    try {
      if (selectedAlgorithm === "dijkstra" || selectedAlgorithm === "bellman-ford") {
        if (!sourceNode) {
          toast.error("Vui lòng chọn node nguồn");
          setLoading(false);
          return;
        }
        await onRunAlgorithm(selectedAlgorithm, sourceNode, targetNode || undefined);
      } else if (selectedAlgorithm === "kruskal" || selectedAlgorithm === "prim") {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thuật toán</CardTitle>
      </CardHeader>
      <div className="flex flex-col gap-4 px-6 pb-6">
        <div className="space-y-2">
          <Label>Chọn thuật toán</Label>
          <Select
            value={selectedAlgorithm}
            onValueChange={(value) => setSelectedAlgorithm(value as Algorithm)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn thuật toán" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dijkstra">Dijkstra (Đường đi ngắn nhất)</SelectItem>
              <SelectItem value="bellman-ford">Bellman-Ford (Có trọng số âm)</SelectItem>
              <SelectItem value="kruskal">Kruskal (Cây khung nhỏ nhất)</SelectItem>
              <SelectItem value="prim">Prim (Cây khung nhỏ nhất)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(selectedAlgorithm === "dijkstra" || selectedAlgorithm === "bellman-ford") && (
          <>
            <div className="space-y-2">
              <Label>Node nguồn</Label>
              <Select value={sourceNode} onValueChange={setSourceNode}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn node nguồn" />
                </SelectTrigger>
                <SelectContent>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Node đích (tùy chọn)</Label>
              <Select value={targetNode || "none"} onValueChange={(value) => setTargetNode(value === "none" ? "" : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn node đích" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có</SelectItem>
                  {nodes.map((node) => (
                    <SelectItem key={node.id} value={node.id}>
                      {node.data.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Button
          onClick={handleRun}
          disabled={loading || !selectedAlgorithm}
        >
          {loading ? "Đang chạy..." : "Chạy thuật toán"}
        </Button>
      </div>
    </Card>
  );
}

