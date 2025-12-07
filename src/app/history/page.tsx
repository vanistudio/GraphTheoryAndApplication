"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import betterFetch from "@/lib/better-fetch";
import { TrashIcon, CalendarIcon } from "@/components/icons/glass-icons";
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

interface Graph {
  _id: string;
  name: string;
  createdAt: string;
  nodes: unknown[];
  edges: unknown[];
}

export default function HistoryPage() {
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [graphToDelete, setGraphToDelete] = useState<string | null>(null);
  const session = authClient.useSession();

  useEffect(() => {
    if (session.data?.user) {
      fetchGraphs();
    }
  }, [session.data?.user]);

  const fetchGraphs = async () => {
    try {
      const { data } = await betterFetch.get<{ graphs: Graph[] }>("/api/graphs");
      setGraphs(data?.graphs || []);
    } catch (error) {
      console.error("Error fetching graphs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setGraphToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!graphToDelete) return;

    try {
      await betterFetch.delete(`/api/graphs/${graphToDelete}`);
      toast.success("Đã xóa đồ thị");
      fetchGraphs();
      setDeleteDialogOpen(false);
      setGraphToDelete(null);
    } catch (error) {
      console.error("Error deleting graph:", error);
      const errorMessage = error instanceof Error ? error.message : "Lỗi khi xóa đồ thị";
      toast.error(errorMessage);
      setDeleteDialogOpen(false);
      setGraphToDelete(null);
    }
  };

  if (!session.data?.user) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <p className="text-center text-white/70">
              Vui lòng đăng nhập để xem lịch sử
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-white/70">Đang tải...</p>
        </div>
      ) : graphs.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <p className="text-center text-white/70">
                Chưa có tuyến đường nào được lưu
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4">
          {graphs.map((graph) => (
            <Card key={graph._id}>
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{graph.name}</h3>
                  <div className="mt-2 flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" size={16} />
                      {new Date(graph.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                    <span>{Array.isArray(graph.nodes) ? graph.nodes.length : 0} địa điểm</span>
                    <span>{Array.isArray(graph.edges) ? graph.edges.length : 0} đường đi</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleDeleteClick(graph._id)}
                  variant="ghost"
                  size="icon"
                >
                  <TrashIcon className="h-4 w-4" size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa đồ thị này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
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
  );
}

