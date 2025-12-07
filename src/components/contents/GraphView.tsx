"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Info,
  Network,
  Link2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeGraph } from "@/lib/algorithms/graph-analysis";
import { Icon } from "@iconify/react";

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  label?: string;
}

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  highlightedPath?: string[];
  nodeColors?: Record<string, string>;
  onNodesChange: (nodes: GraphNode[]) => void;
  onEdgesChange: (edges: GraphEdge[]) => void;
}

const NODE_RADIUS = 30;
const NODE_DIAMETER = NODE_RADIUS * 2;

const customButtonShadow =
  "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

export default function GraphView({
  nodes: initialNodes,
  edges: initialEdges,
  highlightedPath = [],
  nodeColors = {},
  onNodesChange,
  onEdgesChange,
}: GraphViewProps) {
  const isMobile = useIsMobile();
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState<string>("");
  const [sourceNodeId, setSourceNodeId] = useState<string>("");
  const [targetNodeId, setTargetNodeId] = useState<string>("");
  const [edgeWeightDialogOpen, setEdgeWeightDialogOpen] = useState(false);
  const [edgeWeight, setEdgeWeight] = useState<string>("1");
  const [newEdgeWeight, setNewEdgeWeight] = useState<string>("1");
  const [isEditingEdge, setIsEditingEdge] = useState(false);
  const [matrixData, setMatrixData] = useState<(number | string)[][]>([[""]]);
  const [matrixSize, setMatrixSize] = useState<number>(1);
  const [matrixDialogOpen, setMatrixDialogOpen] = useState(false);
  const [graphDetailsDialogOpen, setGraphDetailsDialogOpen] = useState(false);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  const getEdgePath = useCallback(
    (edge: GraphEdge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return "";

      const x1 = sourceNode.x;
      const y1 = sourceNode.y;
      const x2 = targetNode.x;
      const y2 = targetNode.y;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) return "";

      const unitX = dx / distance;
      const unitY = dy / distance;

      const startX = x1 + unitX * NODE_RADIUS;
      const startY = y1 + unitY * NODE_RADIUS;
      const endX = x2 - unitX * NODE_RADIUS;
      const endY = y2 - unitY * NODE_RADIUS;

      return `M ${startX} ${startY} L ${endX} ${endY}`;
    },
    [nodes]
  );

  const getEdgeLabelPosition = useCallback(
    (edge: GraphEdge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);

      if (!sourceNode || !targetNode) return { x: 0, y: 0 };

      const x = (sourceNode.x + targetNode.x) / 2;
      const y = (sourceNode.y + targetNode.y) / 2;

      return { x, y };
    },
    [nodes]
  );

  const isPointInNode = useCallback((x: number, y: number, node: GraphNode) => {
    const dx = x - node.x;
    const dy = y - node.y;
    return dx * dx + dy * dy <= NODE_RADIUS * NODE_RADIUS;
  }, []);

  const getEdgeAtPoint = useCallback(
    (x: number, y: number): GraphEdge | null => {
      for (const edge of edges) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);

        if (!sourceNode || !targetNode) continue;

        const x1 = sourceNode.x;
        const y1 = sourceNode.y;
        const x2 = targetNode.x;
        const y2 = targetNode.y;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
          return edge;
        }
      }

      return null;
    },
    [nodes, edges]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;

      e.preventDefault();

      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        const touch = e.touches[0] || e.changedTouches[0];
        clientX = touch?.clientX ?? 0;
        clientY = touch?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = svgRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / scale;
      const y = (clientY - rect.top - pan.y) / scale;

      const clickedNode = nodes.find((node) => isPointInNode(x, y, node));
      if (clickedNode) {
        setDraggingNode(clickedNode.id);
        setDragOffset({
          x: x - clickedNode.x,
          y: y - clickedNode.y,
        });
        setSelectedNode(clickedNode);
        setSelectedEdge(null);
        if (typeof document !== "undefined") {
          document.body.style.userSelect = "none";
          document.body.style.webkitUserSelect = "none";
        }
        return;
      }

      const clickedEdge = getEdgeAtPoint(x, y);
      if (clickedEdge) {
        setSelectedEdge(clickedEdge);
        setSourceNodeId(clickedEdge.source);
        setTargetNodeId(clickedEdge.target);
        setIsEditingEdge(true);
        setEdgeWeight(clickedEdge.weight.toString());
        setEdgeWeightDialogOpen(true);
        setSelectedNode(null);
        return;
      }

      setIsPanning(true);
      setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
      setSelectedNode(null);
      setSelectedEdge(null);
    },
    [nodes, pan, scale, isPointInNode, getEdgeAtPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;

      if (draggingNode || isPanning) {
        e.preventDefault();
      }

      let clientX: number;
      let clientY: number;

      if ("touches" in e) {
        const touch = e.touches[0];
        clientX = touch?.clientX ?? 0;
        clientY = touch?.clientY ?? 0;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = svgRef.current.getBoundingClientRect();
      const x = (clientX - rect.left - pan.x) / scale;
      const y = (clientY - rect.top - pan.y) / scale;

      if (draggingNode) {
        const node = nodes.find((n) => n.id === draggingNode);
        if (node) {
          const newX = x - dragOffset.x;
          const newY = y - dragOffset.y;
          setNodes((prev) =>
            prev.map((n) =>
              n.id === draggingNode
                ? {
                    ...n,
                    x: Math.max(
                      NODE_RADIUS,
                      Math.min(rect.width / scale - NODE_RADIUS, newX)
                    ),
                    y: Math.max(
                      NODE_RADIUS,
                      Math.min(rect.height / scale - NODE_RADIUS, newY)
                    ),
                  }
                : n
            )
          );
        }
      } else if (isPanning) {
        setPan({
          x: clientX - panStart.x,
          y: clientY - panStart.y,
        });
      }
    },
    [draggingNode, dragOffset, nodes, isPanning, panStart, pan, scale]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingNode) {
      const updatedNodes = nodes.map((n) =>
        n.id === draggingNode ? { ...n, x: n.x, y: n.y } : n
      );
      onNodesChange(updatedNodes);
    }
    setDraggingNode(null);
    setIsPanning(false);
    if (typeof document !== "undefined") {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
    }
  }, [draggingNode, nodes, onNodesChange]);

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prev) => Math.max(0.5, Math.min(2, prev * delta)));
  }, []);

  const addNode = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = (rect.width / 2 - pan.x) / scale;
    const centerY = (rect.height / 2 - pan.y) / scale;

    if (!newNodeLabel.trim()) {
      toast.warning("Vui lòng nhập tên node");
      return;
    }

    const existingNode = nodes.find((n) => n.label === newNodeLabel.trim());
    if (existingNode) {
      toast.warning("Node với tên này đã tồn tại");
      return;
    }

    const label = newNodeLabel.trim();

    const newNode: GraphNode = {
      id: `node_${Date.now()}`,
      label,
      x: centerX,
      y: centerY,
    };

    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setNewNodeLabel("");
    onNodesChange(newNodes);
    toast.success(`Đã thêm node: ${label}`);
  }, [newNodeLabel, nodes, pan, scale, onNodesChange]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    const newNodes = nodes.filter((n) => n.id !== selectedNode.id);
    const newEdges = edges.filter(
      (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setSelectedNode(null);
    onNodesChange(newNodes);
    onEdgesChange(newEdges);
    toast.success(`Đã xóa node: ${selectedNode.label}`);
  }, [selectedNode, nodes, edges, onNodesChange, onEdgesChange]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;
    const newEdges = edges.filter((e) => e.id !== selectedEdge.id);
    setEdges(newEdges);
    setSelectedEdge(null);
    onEdgesChange(newEdges);
    toast.success(`Đã xóa cạnh`);
  }, [selectedEdge, edges, onEdgesChange]);

  const createGraphFromMatrix = useCallback(
    (matrix: number[][]) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const centerX = (rect.width / 2 - pan.x) / scale;
      const centerY = (rect.height / 2 - pan.y) / scale;
      const radius = Math.min(rect.width, rect.height) / 4 / scale;
      const n = matrix.length;

      const newNodes: GraphNode[] = [];
      const newEdges: GraphEdge[] = [];

      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const label = String.fromCharCode(65 + i);

        newNodes.push({
          id: `node_${i}`,
          label,
          x,
          y,
        });
      }

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const weight = matrix[i][j];
          if (weight !== 0 && !isNaN(weight) && i !== j) {
            const edgeId = `edge_${i}_${j}`;
            const existingEdge = newEdges.find(
            (e) =>
                (e.source === newNodes[i].id && e.target === newNodes[j].id) ||
                (e.source === newNodes[j].id && e.target === newNodes[i].id)
            );

            if (!existingEdge) {
              newEdges.push({
                id: edgeId,
                source: newNodes[i].id,
                target: newNodes[j].id,
                weight,
                label: weight.toString(),
              });
            }
          }
        }
      }

      setNodes(newNodes);
      setEdges(newEdges);
      onNodesChange(newNodes);
      onEdgesChange(newEdges);
      toast.success(
        `Đã tạo đồ thị từ ma trận với ${n} đỉnh và ${newEdges.length} cạnh`
      );
    },
    [pan, scale, onNodesChange, onEdgesChange]
  );

  const handleMatrixSizeChange = useCallback(
    (newSize: number) => {
      if (newSize < 1 || newSize > 10) return;
      setMatrixSize(newSize);
      const newMatrix: (number | string)[][] = [];
      for (let i = 0; i < newSize; i++) {
        const row: (number | string)[] = [];
        for (let j = 0; j < newSize; j++) {
          if (i < matrixData.length && j < (matrixData[i]?.length || 0)) {
            const val = matrixData[i][j];
            row.push(typeof val === "number" ? String(val) : val);
      } else {
            row.push("");
          }
        }
        newMatrix.push(row);
      }
      setMatrixData(newMatrix);
    },
    [matrixData]
  );

  const handleMatrixCellChange = useCallback(
    (row: number, col: number, value: string, moveNext: boolean = false) => {
      const newMatrix = matrixData.map((r, i) =>
        r.map((c, j) => (i === row && j === col ? value : c))
      );
      setMatrixData(newMatrix);

      if (
        moveNext &&
        value &&
        value !== "-" &&
        value !== "." &&
        value.length > 0
      ) {
        setTimeout(() => {
          let nextRow = row;
          let nextCol = col + 1;
          if (nextCol >= matrixSize) {
            nextCol = 0;
            nextRow = row + 1;
            if (nextRow >= matrixSize) {
              nextRow = 0;
            }
          }
          const nextKey = `${nextRow}-${nextCol}`;
          const nextInput = inputRefs.current[nextKey];
          if (nextInput) {
            nextInput.focus();
            nextInput.select();
          }
        }, 10);
      }
    },
    [matrixData, matrixSize]
  );

  const convertMatrixToNumberArray = useCallback((): number[][] | null => {
    try {
      const matrix: number[][] = [];
      for (let i = 0; i < matrixData.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < (matrixData[i]?.length || 0); j++) {
          const cellValue = matrixData[i][j];
          const cellStr = String(cellValue).trim();
          if (cellStr === "") {
            row.push(0);
            continue;
          }
          const val =
            typeof cellValue === "number" ? cellValue : parseFloat(cellStr);
          if (isNaN(val)) {
            const rowNum = i + 1;
            const colNum = j + 1;
            toast.error(
              `Giá trị tại hàng ${rowNum}, cột ${colNum} không hợp lệ`
            );
            return null;
          }
          row.push(val);
        }
        matrix.push(row);
      }
      return matrix;
    } catch {
      return null;
    }
  }, [matrixData]);

  const handleMatrixSubmit = useCallback(() => {
    const matrix = convertMatrixToNumberArray();
    if (!matrix) {
      toast.error("Ma trận không hợp lệ. Vui lòng kiểm tra lại các giá trị.");
      return;
    }

    if (matrix.length !== matrix[0]?.length) {
      toast.error("Ma trận phải là ma trận vuông");
      return;
    }

    createGraphFromMatrix(matrix);
    setMatrixData([[""]]);
    setMatrixSize(1);
  }, [convertMatrixToNumberArray, createGraphFromMatrix]);

  const handleCreateEdge = useCallback(() => {
    if (!sourceNodeId || !targetNodeId) {
      toast.warning("Vui lòng chọn cả node nguồn và node đích");
      return;
    }

    if (sourceNodeId === targetNodeId) {
      toast.warning("Node nguồn và node đích không thể giống nhau");
      return;
    }

    const edgeExists = edges.some(
      (e) =>
        (e.source === sourceNodeId && e.target === targetNodeId) ||
        (e.source === targetNodeId && e.target === sourceNodeId)
    );

    if (edgeExists) {
      toast.warning("Cạnh này đã tồn tại");
      return;
    }

    const weight = parseFloat(newEdgeWeight);
    if (isNaN(weight)) {
      toast.error("Trọng số phải là một số hợp lệ");
      return;
    }

    const edgeId = `e_${sourceNodeId}_${targetNodeId}_${Date.now()}`;
    const newEdge: GraphEdge = {
      id: edgeId,
      source: sourceNodeId,
      target: targetNodeId,
      weight,
      label: weight.toString(),
    };
    const newEdges = [...edges, newEdge];
    setEdges(newEdges);
    onEdgesChange(newEdges);
    toast.success(`Đã thêm cạnh với trọng số ${weight}`);
    setSourceNodeId("");
    setTargetNodeId("");
    setNewEdgeWeight("1");
  }, [sourceNodeId, targetNodeId, newEdgeWeight, edges, onEdgesChange]);

  const handleConfirmEdge = useCallback(() => {
    if (!sourceNodeId || !targetNodeId) {
      setEdgeWeightDialogOpen(false);
      return;
    }

    const weight = parseFloat(edgeWeight);
    if (isNaN(weight)) {
      toast.error("Trọng số phải là một số hợp lệ");
      return;
    }
    
    if (isEditingEdge && selectedEdge) {
      const newEdges = edges.map((e) =>
          e.id === selectedEdge.id
          ? { ...e, weight, label: weight.toString() }
          : e
      );
      setEdges(newEdges);
      onEdgesChange(newEdges);
      toast.success(`Đã cập nhật trọng số cạnh thành ${weight}`);
    } else {
      const edgeId = `e_${sourceNodeId}_${targetNodeId}_${Date.now()}`;
      const newEdge: GraphEdge = {
        id: edgeId,
        source: sourceNodeId,
        target: targetNodeId,
        weight,
        label: weight.toString(),
      };
      const newEdges = [...edges, newEdge];
      setEdges(newEdges);
      onEdgesChange(newEdges);
      toast.success(`Đã thêm cạnh với trọng số ${weight}`);
      setSourceNodeId("");
      setTargetNodeId("");
    }
    
    setEdgeWeight("1");
    setEdgeWeightDialogOpen(false);
    setSelectedEdge(null);
    setIsEditingEdge(false);
  }, [
    sourceNodeId,
    targetNodeId,
    edgeWeight,
    isEditingEdge,
    selectedEdge,
    edges,
    onEdgesChange,
  ]);

  const isEdgeHighlighted = useCallback(
    (edge: GraphEdge) => {
      if (highlightedPath.length === 0) return false;
      for (let i = 0; i < highlightedPath.length - 1; i++) {
        if (
          (highlightedPath[i] === edge.source &&
            highlightedPath[i + 1] === edge.target) ||
          (highlightedPath[i] === edge.target &&
            highlightedPath[i + 1] === edge.source)
        ) {
          return true;
        }
      }
      return false;
    },
    [highlightedPath]
  );

  const isNodeHighlighted = useCallback(
    (nodeId: string) => {
      return highlightedPath.includes(nodeId);
    },
    [highlightedPath]
  );

  const fitView = useCallback(() => {
    if (nodes.length === 0) return;

    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y));

    const width = maxX - minX + NODE_DIAMETER * 2;
    const height = maxY - minY + NODE_DIAMETER * 2;

    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const newScale = Math.min(scaleX, scaleY, 1) * 0.8;

    setScale(newScale);
    setPan({
      x: containerWidth / 2 - ((minX + maxX) / 2) * newScale,
      y: containerHeight / 2 - ((minY + maxY) / 2) * newScale,
    });
  }, [nodes]);

  const totalWeight = edges.reduce((sum, edge) => sum + edge.weight, 0);

  return (
    <div className="h-full flex flex-col">
      <Card
        className={`flex-1 flex flex-col border border-border ${customButtonShadow}`}
      >
        <CardHeader className="border-b border-border pb-2 lg:pb-3 px-3 lg:px-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
              <Network className="h-4 w-4 lg:h-5 lg:w-5 shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm lg:text-lg truncate">
                Đồ thị
              </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 hidden lg:block">
                  Tạo và chỉnh sửa đồ thị
                </p>
            </div>
            </div>
            <div className="flex items-center gap-1 lg:gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">
                <Network className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{nodes.length} đỉnh</span>
                <span className="sm:hidden">{nodes.length}</span>
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Link2 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{edges.length} cạnh</span>
                <span className="sm:hidden">{edges.length}</span>
              </Badge>
              {totalWeight > 0 && (
                <Badge
                  variant="secondary"
                  className="text-xs hidden md:inline-flex"
                >
                  Tổng: {totalWeight}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col lg:flex-row gap-0 lg:gap-4 min-h-0 overflow-hidden">
          <div
            className="flex-1 relative border-r-0 lg:border-r border-border min-h-0 overflow-hidden"
            ref={containerRef}
          >
          {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80">
                <Alert className="max-w-xs">
              <Info className="h-4 w-4" />
              <AlertDescription>
                    Đồ thị trống!
              </AlertDescription>
            </Alert>
              </div>
            )}
            <div className="h-full w-full relative overflow-hidden bg-background">
              <div className="absolute top-2 right-2 lg:top-4 lg:right-4 z-20 flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setScale((prev) => Math.min(2, prev * 1.2))}
                  className={`h-9 w-9 lg:h-8 lg:w-8 ${customButtonShadow}`}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setScale((prev) => Math.max(0.5, prev * 0.8))}
                  className={`h-9 w-9 lg:h-8 lg:w-8 ${customButtonShadow}`}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={fitView}
                  className={`h-9 w-9 lg:h-8 lg:w-8 ${customButtonShadow}`}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <svg
                ref={svgRef}
                className="w-full h-full cursor-move touch-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
                onWheel={handleWheel}
                style={{
                  background: "#1a1a1a",
                  touchAction: "none",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                }}
              >
                <defs>
                  <pattern
                    id="grid-lines"
                    width={50}
                    height={50}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 50 0 L 0 0 0 50"
                      fill="none"
                      stroke="#666666"
                      strokeWidth="1"
                      opacity="0.6"
                    />
                  </pattern>
                  <filter
                    id="node-shadow"
                    x="-150%"
                    y="-150%"
                    width="400%"
                    height="400%"
                  >
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="16"
                      result="blur1"
                    />
                    <feOffset in="blur1" dx="0" dy="32" result="offset1" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="0.3"
                      result="flood1"
                    />
                    <feComposite
                      in="flood1"
                      in2="offset1"
                      operator="in"
                      result="shadow1"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="8"
                      result="blur2"
                    />
                    <feOffset in="blur2" dx="0" dy="16" result="offset2" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="0.3"
                      result="flood2"
                    />
                    <feComposite
                      in="flood2"
                      in2="offset2"
                      operator="in"
                      result="shadow2"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="4"
                      result="blur3"
                    />
                    <feOffset in="blur3" dx="0" dy="8" result="offset3" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="0.24"
                      result="flood3"
                    />
                    <feComposite
                      in="flood3"
                      in2="offset3"
                      operator="in"
                      result="shadow3"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="2"
                      result="blur4"
                    />
                    <feOffset in="blur4" dx="0" dy="4" result="offset4" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="0.24"
                      result="flood4"
                    />
                    <feComposite
                      in="flood4"
                      in2="offset4"
                      operator="in"
                      result="shadow4"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="8"
                      result="blur5"
                    />
                    <feOffset in="blur5" dx="0" dy="-8" result="offset5" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="0.16"
                      result="flood5"
                    />
                    <feComposite
                      in="flood5"
                      in2="offset5"
                      operator="in"
                      result="shadow5"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="2"
                      result="blur6"
                    />
                    <feOffset in="blur6" dx="0" dy="2" result="offset6" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="0.24"
                      result="flood6"
                    />
                    <feComposite
                      in="flood6"
                      in2="offset6"
                      operator="in"
                      result="shadow6"
                    />
                    <feGaussianBlur
                      in="SourceAlpha"
                      stdDeviation="0.5"
                      result="blur7"
                    />
                    <feOffset in="blur7" dx="0" dy="0" result="offset7" />
                    <feFlood
                      floodColor="#000000"
                      floodOpacity="1"
                      result="flood7"
                    />
                    <feComposite
                      in="flood7"
                      in2="offset7"
                      operator="in"
                      result="shadow7"
                    />
                    <feMerge>
                      <feMergeNode in="shadow1" />
                      <feMergeNode in="shadow2" />
                      <feMergeNode in="shadow3" />
                      <feMergeNode in="shadow4" />
                      <feMergeNode in="shadow5" />
                      <feMergeNode in="shadow6" />
                      <feMergeNode in="shadow7" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <rect width="100%" height="100%" fill="#1a1a1a" />

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                  <rect
                    x="-10000"
                    y="-10000"
                    width="20000"
                    height="20000"
                    fill="url(#grid-lines)"
                  />
                </g>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
                  {edges.map((edge) => {
                    const path = getEdgePath(edge);
                    const isHighlighted = isEdgeHighlighted(edge);
                    const labelPos = getEdgeLabelPosition(edge);

                    return (
                      <g key={edge.id}>
                        {isHighlighted && (
                          <path
                            d={path}
                            stroke="#22c55e"
                            strokeWidth={6}
                            fill="none"
                            opacity={0.3}
                            style={{ pointerEvents: "none" }}
                          />
                        )}
                        <path
                          d={path}
                          stroke={isHighlighted ? "#22c55e" : "#ffffff"}
                          strokeWidth={isHighlighted ? 4 : 3}
                          fill="none"
                          opacity={isHighlighted ? 1 : 0.9}
                          className="cursor-pointer"
                          style={{ pointerEvents: "stroke" }}
                        />
                        {edge.label && (
                          <>
                            <circle
                              cx={labelPos.x}
                              cy={labelPos.y}
                              r={isHighlighted ? 14 : 12}
                              fill={
                                isHighlighted
                                  ? "#22c55e"
                                  : "#ffffff"
                              }
                              stroke={
                                isHighlighted
                                  ? "#22c55e"
                                  : "#ffffff"
                              }
                              strokeWidth={isHighlighted ? 2 : 4}
                            />
                            <text
                              x={labelPos.x}
                              y={labelPos.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={isHighlighted ? "#ffffff" : "#000"}
                              fontSize={isHighlighted ? "14" : "13"}
                              fontWeight="700"
                              pointerEvents="none"
                            >
                              {edge.label}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}

                  {nodes.map((node) => {
                    const isHighlighted = isNodeHighlighted(node.id);
                    const isSelected = selectedNode?.id === node.id;
                    const nodeColor = nodeColors[node.id];

                    return (
                      <g key={node.id}>
                        {isHighlighted && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={NODE_RADIUS + 5}
                            fill="#22c55e"
                            opacity={0.2}
                          />
                        )}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={NODE_RADIUS}
                          fill={
                            nodeColor || (isHighlighted ? "#22c55e" : "#ffffff")
                          }
                          stroke={
                            isSelected
                              ? "hsl(var(--primary))"
                              : isHighlighted
                              ? "#22c55e"
                              : "#000000"
                          }
                          strokeWidth={isSelected || isHighlighted ? 4 : 1}
                          className="cursor-move"
                          filter="url(#node-shadow)"
                        />
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill={isHighlighted ? "#ffffff" : "#000000"}
                          fontSize="14"
                          fontWeight="600"
                          pointerEvents="none"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={`fixed bottom-4 right-4 z-30 lg:hidden h-12 w-12 rounded-full border-2 ${customButtonShadow}`}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] overflow-y-auto pb-6 px-4"
              >
                <SheetHeader className="mb-4 pb-3 border-b">
                  <SheetTitle className="text-lg">Điều khiển đồ thị</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Xem chi tiết</Label>
                    <Button
                      variant="outline"
                      onClick={() => setGraphDetailsDialogOpen(true)}
                      disabled={nodes.length === 0}
                      className={`w-full h-10 ${customButtonShadow}`}
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Xem chi tiết đồ thị
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nhập ma trận</Label>
                    <Button
                      variant="outline"
                      onClick={() => setMatrixDialogOpen(true)}
                      className={`w-full h-10 ${customButtonShadow}`}
                      size="sm"
                    >
                      <Network className="h-4 w-4 mr-2" />
                      Mở form nhập ma trận
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Thêm đỉnh</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tên đỉnh"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addNode()}
                        className={`text-sm ${customButtonShadow}`}
                      />
                      <Button
                        onClick={addNode}
                        size="icon"
                        variant="outline"
                        className={`shrink-0 ${customButtonShadow}`}
                      >
                            <Plus className="h-4 w-4" />
                          </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Tạo cạnh</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          Đỉnh nguồn
                        </Label>
                        <Select
                          value={sourceNodeId}
                          onValueChange={setSourceNodeId}
                        >
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
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          Đỉnh đích
                        </Label>
                        <Select
                          value={targetNodeId}
                          onValueChange={setTargetNodeId}
                        >
                          <SelectTrigger
                            className={`w-full text-sm h-10 ${customButtonShadow}`}
                          >
                            <SelectValue placeholder="Chọn đỉnh đích" />
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
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">
                          Trọng số
                        </Label>
                        <Input
                          type="number"
                          placeholder="Trọng số"
                          value={newEdgeWeight}
                          onChange={(e) => setNewEdgeWeight(e.target.value)}
                          className={`w-full text-sm h-10 ${customButtonShadow}`}
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <Button
                        onClick={handleCreateEdge}
                        disabled={
                          !sourceNodeId ||
                          !targetNodeId ||
                          sourceNodeId === targetNodeId
                        }
                        variant="outline"
                        className={`w-full h-10 ${customButtonShadow}`}
                        size="sm"
                      >
                        <Link2 className="h-4 w-4 mr-1.5" />
                        Tạo cạnh
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {selectedNode && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Đỉnh đã chọn
                      </Label>
                      <Card
                        className={`p-3 border border-border ${customButtonShadow}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {selectedNode.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              ID: {selectedNode.id}
                            </p>
                          </div>
                          <Button
                            onClick={deleteSelectedNode}
                            variant="outline"
                            size="icon"
                            className={`h-8 w-8 shrink-0 ${customButtonShadow}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}

                  {selectedEdge && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Cạnh đã chọn
                      </Label>
                      <Card
                        className={`p-3 border border-border ${customButtonShadow}`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {nodes.find((n) => n.id === selectedEdge.source)
                                  ?.label || selectedEdge.source}{" "}
                                →{" "}
                                {nodes.find((n) => n.id === selectedEdge.target)
                                  ?.label || selectedEdge.target}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Trọng số: {selectedEdge.weight}
                              </p>
                            </div>
                            <Button
                              onClick={deleteSelectedEdge}
                              variant="outline"
                              size="icon"
                              className={`h-8 w-8 shrink-0 ${customButtonShadow}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Trọng số mới"
                              value={edgeWeight}
                              onChange={(e) => setEdgeWeight(e.target.value)}
                              className={`flex-1 text-sm h-9 ${customButtonShadow}`}
                              min="0"
                              step="0.1"
                            />
                            <Button
                              onClick={() => {
                                const weight = parseFloat(edgeWeight);
                                if (isNaN(weight) || weight < 0) {
                                  toast.error("Trọng số phải là số dương");
                                  return;
                                }
                                const newEdges = edges.map((e) =>
                                  e.id === selectedEdge.id
                                    ? { ...e, weight, label: weight.toString() }
                                    : e
                                );
                                setEdges(newEdges);
                                onEdgesChange(newEdges);
                                toast.success(
                                  `Đã cập nhật trọng số cạnh thành ${weight}`
                                );
                                setEdgeWeight("1");
                              }}
                              variant="outline"
                              size="sm"
                              className={`h-9 ${customButtonShadow}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Hướng dẫn
                    </Label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Chạm vào đỉnh để chọn và xóa</p>
                      <p>• Kéo đỉnh để di chuyển</p>
                      <p>• Chạm vào cạnh để chỉnh sửa trọng số</p>
                      <p>• Kéo nền để di chuyển đồ thị</p>
                      <p>• Chụm để phóng to/thu nhỏ</p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          ) : null}

          {!isMobile && (
            <div className="w-72 border-l border-border p-4 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Xem chi tiết</Label>
                <Button
                  variant="outline"
                  onClick={() => setGraphDetailsDialogOpen(true)}
                  disabled={nodes.length === 0}
                  className={`w-full h-9 ${customButtonShadow}`}
                  size="sm"
                >
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Xem chi tiết đồ thị
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Nhập ma trận</Label>
                <Button
                  variant="outline"
                  onClick={() => setMatrixDialogOpen(true)}
                  className={`w-full h-9 ${customButtonShadow}`}
                  size="sm"
                >
                  <Network className="h-3.5 w-3.5 mr-2" />
                  Mở form nhập ma trận
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium">Thêm đỉnh</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tên đỉnh"
                    value={newNodeLabel}
                    onChange={(e) => setNewNodeLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNode()}
                    className={`text-sm ${customButtonShadow}`}
                  />
                  <Button
                    onClick={addNode}
                    size="icon"
                    variant="outline"
                    className={`shrink-0 ${customButtonShadow}`}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

                      <Separator />

              <div className="space-y-3">
                <Label className="text-xs font-medium">Tạo cạnh</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Đỉnh nguồn
                    </Label>
                    <Select
                      value={sourceNodeId}
                      onValueChange={setSourceNodeId}
                    >
                      <SelectTrigger
                        className={`w-full text-sm ${customButtonShadow}`}
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
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Đỉnh đích
                    </Label>
                    <Select
                      value={targetNodeId}
                      onValueChange={setTargetNodeId}
                    >
                      <SelectTrigger
                        className={`w-full text-sm ${customButtonShadow}`}
                      >
                        <SelectValue placeholder="Chọn đỉnh đích" />
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
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">
                      Trọng số
                    </Label>
                    <Input
                      type="number"
                      placeholder="Trọng số"
                      value={newEdgeWeight}
                      onChange={(e) => setNewEdgeWeight(e.target.value)}
                      className={`w-full text-sm ${customButtonShadow}`}
                      min="0"
                      step="0.1"
                    />
                  </div>
                  <Button
                    onClick={handleCreateEdge}
                    disabled={
                      !sourceNodeId ||
                      !targetNodeId ||
                      sourceNodeId === targetNodeId
                    }
                    variant="outline"
                    className={`w-full ${customButtonShadow}`}
                    size="sm"
                  >
                    <Link2 className="h-3 w-3 mr-1.5" />
                    Tạo cạnh
                  </Button>
                </div>
              </div>

              <Separator />

              {selectedNode && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Đỉnh đã chọn</Label>
                  <Card
                    className={`p-3 border border-border ${customButtonShadow}`}
                  >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                        <p className="text-sm font-medium">
                          {selectedNode.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ID: {selectedNode.id}
                            </p>
                          </div>
                              <Button
                                onClick={deleteSelectedNode}
                        variant="outline"
                                size="icon"
                        className={`h-7 w-7 ${customButtonShadow}`}
                              >
                        <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                        </div>
                      </Card>
                </div>
              )}

              {selectedEdge && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Cạnh đã chọn</Label>
                  <Card
                    className={`p-3 border border-border ${customButtonShadow}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {nodes.find((n) => n.id === selectedEdge.source)
                              ?.label || selectedEdge.source}{" "}
                            →{" "}
                            {nodes.find((n) => n.id === selectedEdge.target)
                              ?.label || selectedEdge.target}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Trọng số: {selectedEdge.weight}
                          </p>
                </div>
                        <Button
                          onClick={deleteSelectedEdge}
                          variant="outline"
                          size="icon"
                          className={`h-7 w-7 ${customButtonShadow}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
          </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Trọng số mới"
                          value={edgeWeight}
                          onChange={(e) => setEdgeWeight(e.target.value)}
                          className={`flex-1 text-sm ${customButtonShadow}`}
                          min="0"
                          step="0.1"
                        />
                        <Button
                          onClick={() => {
                            const weight = parseFloat(edgeWeight);
                            if (isNaN(weight) || weight < 0) {
                              toast.error("Trọng số phải là số dương");
                              return;
                            }
                            const newEdges = edges.map((e) =>
                              e.id === selectedEdge.id
                                ? { ...e, weight, label: weight.toString() }
                                : e
                            );
                            setEdges(newEdges);
                            onEdgesChange(newEdges);
                            toast.success(
                              `Đã cập nhật trọng số cạnh thành ${weight}`
                            );
                            setEdgeWeight("1");
                          }}
                          variant="outline"
                          size="sm"
                          className={customButtonShadow}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
              </div>
                    </div>
                  </Card>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Hướng dẫn
                </Label>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Click vào đỉnh để chọn và xóa</p>
                  <p>• Kéo đỉnh để di chuyển</p>
                  <p>• Click vào cạnh để chỉnh sửa trọng số</p>
                  <p>• Kéo nền để di chuyển đồ thị</p>
                  <p>• Cuộn chuột để phóng to/thu nhỏ</p>
            </div>
            </div>
          </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={edgeWeightDialogOpen}
        onOpenChange={setEdgeWeightDialogOpen}
      >
        <DialogContent className={customButtonShadow}>
          <DialogHeader>
            <DialogTitle>
              {isEditingEdge ? "Chỉnh sửa trọng số" : "Nhập trọng số cạnh"}
            </DialogTitle>
            <DialogDescription>
              {isEditingEdge
                ? "Chỉnh sửa trọng số cho cạnh đã chọn"
                : "Nhập trọng số cho cạnh mới"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="weight">Trọng số</Label>
            <Input
              id="weight"
              type="number"
              placeholder="Trọng số"
              value={edgeWeight}
              onChange={(e) => setEdgeWeight(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirmEdge();
                }
              }}
              autoFocus
              min="0"
              step="0.1"
              className={customButtonShadow}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEdgeWeightDialogOpen(false);
                setEdgeWeight("1");
                if (!isEditingEdge) {
                  setSourceNodeId("");
                  setTargetNodeId("");
                }
                setSelectedEdge(null);
                setIsEditingEdge(false);
              }}
              className={customButtonShadow}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirmEdge}
              variant="outline"
              className={customButtonShadow}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={graphDetailsDialogOpen}
        onOpenChange={setGraphDetailsDialogOpen}
      >
        <DialogContent className={`max-w-[calc(100%-2rem)] sm:max-w-6xl max-h-[90vh] overflow-y-auto ${customButtonShadow}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon
                icon="solar:document-text-bold-duotone"
                className="h-5 w-5"
              />
              Chi tiết đồ thị
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đồ thị hiện tại
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {nodes.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Đồ thị trống. Vui lòng thêm đỉnh và cạnh để xem chi tiết.
                </AlertDescription>
              </Alert>
            ) : (
              (() => {
                const graphInfo = analyzeGraph(nodes, edges);
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className={`p-4 border ${customButtonShadow}`}>
                        <CardHeader className="p-0 pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Icon
                              icon="solar:info-circle-bold-duotone"
                              className="h-4 w-4"
                            />
                            Thông tin cơ bản
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Loại đồ thị
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.isDirected ? "Có hướng" : "Vô hướng"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Số đỉnh
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.nodeCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Số cạnh
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.edgeCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Có trọng số
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.isWeighted ? "Có" : "Không"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className={`p-4 border ${customButtonShadow}`}>
                        <CardHeader className="p-0 pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Icon
                              icon="solar:graph-bold-duotone"
                              className="h-4 w-4"
                            />
                            Tính chất đồ thị
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Liên thông
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.isConnected ? (
                                  <span className="text-green-600">Có</span>
                                ) : (
                                  <span className="text-red-600">Không</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Thành phần liên thông
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.componentCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Có chu trình
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.hasCycles ? (
                                  <span className="text-orange-600">
                                    Có ({graphInfo.cycleCount})
                                  </span>
                                ) : (
                                  <span className="text-green-600">Không</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Đồ thị đầy đủ
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.isComplete ? "Có" : "Không"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Đồ thị đều
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.isRegular
                                  ? `Có (bậc ${graphInfo.regularDegree})`
                                  : "Không"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Trọng số âm
                              </div>
                              <div className="text-sm font-semibold">
                                {graphInfo.hasNegativeWeights ? (
                                  <span className="text-orange-600">Có</span>
                                ) : (
                                  "Không"
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {graphInfo.isWeighted && (
                      <>
                        <Card className={`p-4 border ${customButtonShadow}`}>
                          <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Icon
                                icon="solar:chart-bold-duotone"
                                className="h-4 w-4"
                              />
                              Thống kê trọng số
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Trọng số nhỏ nhất
                                </div>
                                <div className="text-sm font-semibold">
                                  {graphInfo.minWeight?.toFixed(2) || "N/A"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Trọng số lớn nhất
                                </div>
                                <div className="text-sm font-semibold">
                                  {graphInfo.maxWeight?.toFixed(2) || "N/A"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Tổng trọng số
                                </div>
                                <div className="text-sm font-semibold">
                                  {graphInfo.totalWeight.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">
                                  Trọng số trung bình
                                </div>
                                <div className="text-sm font-semibold">
                                  {graphInfo.averageWeight.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}

                    <Card className={`p-4 border ${customButtonShadow}`}>
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon
                            icon="solar:users-group-rounded-bold-duotone"
                            className="h-4 w-4"
                          />
                          Bậc của các đỉnh
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-left p-2 text-xs font-semibold text-muted-foreground">
                                  Đỉnh
                                </th>
                                {graphInfo.isDirected ? (
                                  <>
                                    <th className="text-center p-2 text-xs font-semibold text-muted-foreground">
                                      Bậc vào
                                    </th>
                                    <th className="text-center p-2 text-xs font-semibold text-muted-foreground">
                                      Bậc ra
                                    </th>
                                    <th className="text-center p-2 text-xs font-semibold text-muted-foreground">
                                      Tổng bậc
                                    </th>
                                  </>
                                ) : (
                                  <th className="text-center p-2 text-xs font-semibold text-muted-foreground">
                                    Bậc
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {nodes.map((node) => {
                                const degree = graphInfo.degrees[node.id] || 0;
                                const inDegree = graphInfo.isDirected
                                  ? graphInfo.inDegrees[node.id] || 0
                                  : null;
                                const outDegree = graphInfo.isDirected
                                  ? graphInfo.outDegrees[node.id] || 0
                                  : null;
                                return (
                                  <tr
                                    key={node.id}
                                    className="border-b border-border/50 hover:bg-muted/30"
                                  >
                                    <td className="p-2 text-sm font-medium">
                                      {node.label}
                                    </td>
                                    {graphInfo.isDirected ? (
                                      <>
                                        <td className="p-2 text-sm text-center">
                                          {inDegree}
                                        </td>
                                        <td className="p-2 text-sm text-center">
                                          {outDegree}
                                        </td>
                                        <td className="p-2 text-sm text-center font-semibold">
                                          {degree}
                                        </td>
                                      </>
                                    ) : (
                                      <td className="p-2 text-sm text-center font-semibold">
                                        {degree}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`p-4 border ${customButtonShadow}`}>
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Icon
                            icon="solar:database-bold-duotone"
                            className="h-4 w-4"
                          />
                          Ma trận kề
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto rounded-md border border-border">
                          <table className="w-full border-collapse text-xs">
                            <thead>
                              <tr>
                                <th className="border border-border p-2 bg-muted/50 font-semibold sticky left-0 z-10">
                                  {" "}
                                </th>
                                {nodes.map((node) => (
                                  <th
                                    key={node.id}
                                    className="border border-border p-2 bg-muted/50 text-center font-semibold min-w-[60px]"
                                  >
                                    {node.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {graphInfo.adjacencyMatrix.map((row, i) => (
                                <tr key={i}>
                                  <td className="border border-border p-2 bg-muted/50 text-center font-semibold sticky left-0 z-10">
                                    {nodes[i]?.label}
                                  </td>
                                  {row.map((cell, j) => (
                                    <td
                                      key={j}
                                      className={`border border-border p-2 text-center min-w-[60px] ${
                                        cell !== 0
                                          ? "bg-primary/10 font-semibold text-primary"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      {cell === 0 ? "0" : cell.toFixed(1)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGraphDetailsDialogOpen(false)}
              className={customButtonShadow}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={matrixDialogOpen} onOpenChange={setMatrixDialogOpen}>
        <DialogContent className={`max-w-2xl ${customButtonShadow}`}>
          <DialogHeader>
            <DialogTitle>Nhập ma trận kề</DialogTitle>
            <DialogDescription>
              Nhập ma trận kề của đồ thị. Mỗi giá trị đại diện cho trọng số cạnh
              giữa hai đỉnh.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Kích thước:</Label>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMatrixSizeChange(matrixSize - 1)}
                  disabled={matrixSize <= 1}
                  className={`h-8 w-8 ${customButtonShadow}`}
                >
                  <span className="text-sm">−</span>
                </Button>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={matrixSize}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) handleMatrixSizeChange(val);
                  }}
                  className={`w-16 h-8 text-center text-sm ${customButtonShadow}`}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleMatrixSizeChange(matrixSize + 1)}
                  disabled={matrixSize >= 10}
                  className={`h-8 w-8 ${customButtonShadow}`}
                >
                  <span className="text-sm">+</span>
                </Button>
              </div>
            </div>
            <div className="border border-border rounded-md p-4 bg-background overflow-auto max-h-[60vh]">
              <div className="inline-block">
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <div className="w-8 h-6 flex items-center justify-center text-xs text-muted-foreground font-medium"></div>
                    {Array.from({ length: matrixSize }, (_, j) => (
                      <div
                        key={j}
                        className="w-12 h-6 flex items-center justify-center text-xs text-muted-foreground font-medium"
                      >
                        {String.fromCharCode(65 + j)}
                      </div>
                    ))}
                  </div>
                  {matrixData.map((row, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <div className="w-8 h-10 flex items-center justify-center text-xs text-muted-foreground font-medium">
                        {String.fromCharCode(65 + i)}
                      </div>
                      {row.map((cell, j) => (
                        <Input
                          key={`${i}-${j}`}
                          ref={(el) => {
                            inputRefs.current[`${i}-${j}`] = el;
                          }}
                          type="text"
                          value={cell}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || /^-?\d*\.?\d*$/.test(val)) {
                              const shouldMoveNext =
                                val.length > String(cell).length &&
                                val !== "-" &&
                                val !== ".";
                              handleMatrixCellChange(i, j, val, shouldMoveNext);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "ArrowRight") {
                              e.preventDefault();
                              let nextRow = i;
                              let nextCol = j + 1;
                              if (nextCol >= matrixSize) {
                                nextCol = 0;
                                nextRow = i + 1;
                                if (nextRow >= matrixSize) nextRow = 0;
                              }
                              const nextKey = `${nextRow}-${nextCol}`;
                              inputRefs.current[nextKey]?.focus();
                            } else if (e.key === "ArrowLeft") {
                              e.preventDefault();
                              let nextRow = i;
                              let nextCol = j - 1;
                              if (nextCol < 0) {
                                nextCol = matrixSize - 1;
                                nextRow = i - 1;
                                if (nextRow < 0) nextRow = matrixSize - 1;
                              }
                              const nextKey = `${nextRow}-${nextCol}`;
                              inputRefs.current[nextKey]?.focus();
                            } else if (e.key === "ArrowDown") {
                              e.preventDefault();
                              const nextRow = (i + 1) % matrixSize;
                              const nextKey = `${nextRow}-${j}`;
                              inputRefs.current[nextKey]?.focus();
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              const nextRow = (i - 1 + matrixSize) % matrixSize;
                              const nextKey = `${nextRow}-${j}`;
                              inputRefs.current[nextKey]?.focus();
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val === "-") {
                              handleMatrixCellChange(i, j, "", false);
                            }
                          }}
                          className={`w-12 h-10 text-center text-sm font-mono p-0 ${customButtonShadow} ${
                            i === j ? "bg-muted/30" : ""
                          }`}
                          placeholder="0"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const newMatrix: (number | string)[][] = [];
                  for (let i = 0; i < matrixSize; i++) {
                    const row: (number | string)[] = [];
                    for (let j = 0; j < matrixSize; j++) {
                      row.push("");
                    }
                    newMatrix.push(row);
                  }
                  setMatrixData(newMatrix);
                }}
                variant="outline"
                className={`flex-1 h-9 ${customButtonShadow}`}
                size="sm"
              >
                Xóa
              </Button>
              <Button
                onClick={handleMatrixSubmit}
                variant="outline"
                className={`flex-1 h-9 ${customButtonShadow}`}
                size="sm"
              >
                Tạo đồ thị
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
