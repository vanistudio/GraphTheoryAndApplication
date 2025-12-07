"use client";

import { useCallback, useState, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  NodeChange,
  EdgeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface GraphEditorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export default function GraphEditor({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
}: GraphEditorProps) {
  const [nodes, setNodes, onNodesStateChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesStateChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [edgeWeight, setEdgeWeight] = useState<string>("1");
  const [newNodeLabel, setNewNodeLabel] = useState<string>("");
  const nodeIdCounter = useRef(0);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const weight = parseFloat(edgeWeight) || 1;
      const newEdge: Edge = {
        id: `e${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        label: weight.toString(),
        data: { weight },
        type: "default",
      };
      setEdges((eds) => addEdge(newEdge, eds));
      setEdgeWeight("1");
    },
    [edgeWeight, setEdges]
  );

  const addNode = useCallback(() => {
    if (!newNodeLabel.trim()) return;
    const newNode: Node = {
      id: `n${nodeIdCounter.current++}`,
      type: "default",
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      data: { label: newNodeLabel },
    };
    setNodes((nds) => [...nds, newNode]);
    setNewNodeLabel("");
  }, [newNodeLabel, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesStateChange(changes);
      setTimeout(() => {
        setNodes((currentNodes) => {
          onNodesChange(currentNodes);
          return currentNodes;
        });
      }, 0);
    },
    [onNodesStateChange, onNodesChange, setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesStateChange(changes);
      setTimeout(() => {
        setEdges((currentEdges) => {
          onEdgesChange(currentEdges);
          return currentEdges;
        });
      }, 0);
    },
    [onEdgesStateChange, onEdgesChange, setEdges]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 border border-neutral-200 rounded-md">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
        >
          <Controls className="border border-neutral-200" />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-left" className="bg-white border border-neutral-200 p-4 rounded-md">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Tên node"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNode()}
                  className="border border-neutral-300 bg-white text-black focus:border-neutral-800"
                />
                <Button
                  onClick={addNode}
                  className="border border-black bg-white text-black hover:bg-black hover:text-white"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Trọng số"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(e.target.value)}
                  className="border border-neutral-300 bg-white text-black focus:border-neutral-800"
                />
                <Label className="text-sm text-neutral-600 self-center">
                  Kéo từ node này sang node khác để tạo cạnh
                </Label>
              </div>
              {selectedNode && (
                <Card className="border border-neutral-200 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{selectedNode.data.label}</span>
                    <Button
                      onClick={deleteSelectedNode}
                      variant="ghost"
                      size="sm"
                      className="text-neutral-600 hover:text-black"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

