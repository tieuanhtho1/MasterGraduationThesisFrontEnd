import { apiClient } from './api';
import type {
  MindMapResponse,
  MindMapDetailResponse,
  CreateMindMapDto,
  UpdateMindMapDto,
  MindMapNodeResponse,
  CreateMindMapNodeDto,
  UpdateMindMapNodeDto,
  BulkSaveNodesRequest,
  BulkSaveNodesResponse,
} from '../types';

export const mindMapService = {
  // ─── Mind Map CRUD ───────────────────────────────────────

  /** Get mind map metadata (no nodes) */
  getMindMapById: async (id: number): Promise<MindMapResponse> => {
    const response = await apiClient.get(`/MindMap/${id}`);
    return response.data;
  },

  /** Get full mind map detail with all nodes + flash card data */
  getMindMapDetail: async (id: number): Promise<MindMapDetailResponse> => {
    const response = await apiClient.get(`/MindMap/${id}/detail`);
    return response.data;
  },

  /** Get all mind maps belonging to a user */
  getMindMapsByUser: async (userId: number): Promise<MindMapResponse[]> => {
    const response = await apiClient.get(`/MindMap/user/${userId}`);
    return response.data;
  },

  /** Get all mind maps linked to a specific collection */
  getMindMapsByCollection: async (collectionId: number): Promise<MindMapResponse[]> => {
    const response = await apiClient.get(`/MindMap/collection/${collectionId}`);
    return response.data;
  },

  /** Create a new mind map */
  createMindMap: async (data: CreateMindMapDto): Promise<MindMapResponse> => {
    const response = await apiClient.post('/MindMap', data);
    return response.data;
  },

  /** Update mind map metadata */
  updateMindMap: async (id: number, data: UpdateMindMapDto): Promise<MindMapResponse> => {
    const response = await apiClient.put(`/MindMap/${id}`, data);
    return response.data;
  },

  /** Delete a mind map and all its nodes */
  deleteMindMap: async (id: number): Promise<void> => {
    await apiClient.delete(`/MindMap/${id}`);
  },

  // ─── Node CRUD ───────────────────────────────────────────

  /** Get a single node by ID */
  getNodeById: async (nodeId: number): Promise<MindMapNodeResponse> => {
    const response = await apiClient.get(`/MindMap/node/${nodeId}`);
    return response.data;
  },

  /** Create a single node */
  createNode: async (data: CreateMindMapNodeDto): Promise<MindMapNodeResponse> => {
    const response = await apiClient.post('/MindMap/node', data);
    return response.data;
  },

  /** Update a single node */
  updateNode: async (nodeId: number, data: UpdateMindMapNodeDto): Promise<MindMapNodeResponse> => {
    const response = await apiClient.put(`/MindMap/node/${nodeId}`, data);
    return response.data;
  },

  /** Delete a node and all its children */
  deleteNode: async (nodeId: number): Promise<void> => {
    await apiClient.delete(`/MindMap/node/${nodeId}`);
  },

  /** Bulk save all nodes for a mind map (replaces existing) */
  saveAllNodes: async (mindMapId: number, data: BulkSaveNodesRequest): Promise<BulkSaveNodesResponse> => {
    const response = await apiClient.put(`/MindMap/${mindMapId}/nodes`, data);
    return response.data;
  },
};
