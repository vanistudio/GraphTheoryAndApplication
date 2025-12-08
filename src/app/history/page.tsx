"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import betterFetch from "@/lib/better-fetch";
import { Trash2, Calendar, History, Network, Link2 } from "lucide-react";
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

const customButtonShadow =
  "shadow-[0px_32px_64px_-16px_#0000004c,0px_16px_32px_-8px_#0000004c,0px_8px_16px_-4px_#0000003d,0px_4px_8px_-2px_#0000003d,0px_-8px_16px_-1px_#00000029,0px_2px_4px_-1px_#0000003d,0px_0px_0px_1px_#000000,inset_0px_0px_0px_1px_#ffffff14,inset_0px_1px_0px_#ffffff33]";

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
      <div className="flex flex-1 items-center justify-center p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className={`border border-border ${customButtonShadow}`}>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 rounded-md border border-border bg-background">
                  <History className="h-6 w-6" />
                </div>
                <p className="text-muted-foreground">
                  Vui lòng đăng nhập để xem lịch sử
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 lg:p-6 space-y-4 lg:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 lg:space-y-6"
      >
        <div className="flex items-center gap-3 pb-2">
          <div className="p-2 rounded-md border border-border bg-background">
            <History className="h-5 w-5" />
          </div>
          <h1 className="text-xl lg:text-2xl font-semibold">Lịch sử đồ thị</h1>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className={`border border-border ${customButtonShadow}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-48" />
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-9 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : graphs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className={`border border-border ${customButtonShadow}`}>
              <CardContent className="p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="p-4 rounded-md border border-border bg-background">
                    <History className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Chưa có đồ thị nào</h3>
                    <p className="text-sm text-muted-foreground">
                      Tạo đồ thị mới để bắt đầu sử dụng
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {graphs.map((graph, index) => (
                <motion.div
                  key={graph._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className={`border border-border ${customButtonShadow}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-base lg:text-lg mb-2">
                              {graph.name}
                            </h3>
                            <Separator />
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(graph.createdAt).toLocaleDateString("vi-VN", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Network className="h-3 w-3 mr-1" />
                              {Array.isArray(graph.nodes) ? graph.nodes.length : 0} đỉnh
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Link2 className="h-3 w-3 mr-1" />
                              {Array.isArray(graph.edges) ? graph.edges.length : 0} cạnh
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteClick(graph._id)}
                          variant="outline"
                          size="icon"
                          className={`h-9 w-9 shrink-0 ${customButtonShadow}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className={customButtonShadow}>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa đồ thị này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={customButtonShadow}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={`bg-destructive text-destructive-foreground hover:bg-destructive/90 ${customButtonShadow}`}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

