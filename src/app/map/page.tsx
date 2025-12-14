"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MapView = dynamic(() => import("@/components/contents/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-4">
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 h-full">
        <div className="lg:col-span-1">
          <Skeleton className="h-full w-full rounded-md" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-full w-full rounded-md" />
        </div>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return <MapView />;
}

