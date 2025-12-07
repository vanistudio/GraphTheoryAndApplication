import mongoose, { Schema, Document } from "mongoose";

export interface IGraphNode {
  id: string;
  label: string;
  position: { x: number; y: number };
}

export interface IGraphEdge {
  id: string;
  source: string;
  target: string;
  weight: number;
  label?: string;
}

export interface IGraph extends Document {
  name: string;
  userId: string;
  nodes: IGraphNode[];
  edges: IGraphEdge[];
  createdAt: Date;
  updatedAt: Date;
}

const GraphNodeSchema = new Schema<IGraphNode>({
  id: { type: String, required: true },
  label: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
});

const GraphEdgeSchema = new Schema<IGraphEdge>({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  weight: { type: Number, required: true },
  label: { type: String },
});

const GraphSchema = new Schema<IGraph>(
  {
    name: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    nodes: [GraphNodeSchema],
    edges: [GraphEdgeSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Graph || mongoose.model<IGraph>("Graph", GraphSchema);

