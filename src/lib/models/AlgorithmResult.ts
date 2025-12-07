import mongoose, { Schema, Document } from "mongoose";

export interface IAlgorithmResult extends Document {
  graphId: string;
  userId: string;
  algorithm: "dijkstra" | "bellman-ford" | "kruskal" | "prim" | "graph-coloring" | "connected-components" | "cycle-detection";
  result: {
    path?: string[];
    distance?: number;
    mst?: Array<{ source: string; target: string; weight: number }>;
    colors?: Record<string, number>;
    steps?: unknown[];
    components?: Array<{ nodes: string[]; size: number }>;
    isConnected?: boolean;
    componentCount?: number;
    cycles?: Array<{ nodes: string[]; edges: string[] }>;
    hasCycle?: boolean;
    cycleCount?: number;
    distances?: Record<string, number>;
  };
  sourceNode?: string;
  targetNode?: string;
  createdAt: Date;
}

const AlgorithmResultSchema = new Schema<IAlgorithmResult>(
  {
    graphId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    algorithm: {
      type: String,
      enum: ["dijkstra", "bellman-ford", "kruskal", "prim", "graph-coloring", "connected-components", "cycle-detection"],
      required: true,
    },
    result: { type: Schema.Types.Mixed, required: true },
    sourceNode: { type: String },
    targetNode: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AlgorithmResult ||
  mongoose.model<IAlgorithmResult>("AlgorithmResult", AlgorithmResultSchema);

