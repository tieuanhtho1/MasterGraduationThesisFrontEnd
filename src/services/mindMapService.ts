import { apiClient } from './api';
import type {
  MindMap,
  FullMindMapResponse,
  CreateMindMapDto,
  UpdateMindMapDto,
  MindMapNode,
  MindMapNodeWithFlashCard,
  CreateMindMapNodeDto,
  UpdateMindMapNodeDto,
} from '../types';

export const mindMapService = {
  // Get all user's mindmaps
  getAllMindMaps: async (userId: number): Promise<MindMap[]> => {
    const response = await apiClient.get('/mindmap', {
      params: { userId }
    });
    return response.data;
  },

  // Get mindmap by ID
  getMindMapById: async (id: number): Promise<MindMap> => {
    const response = await apiClient.get(`/mindmap/${id}`);
    return response.data;
  },

  // Get full mindmap with all nodes and flashcards (main endpoint for display)
  getFullMindMap: async (id: number): Promise<FullMindMapResponse> => {
    const response = await apiClient.get(`/mindmap/${id}/full`);
    return response.data;
  },

  // Create new mindmap
  createMindMap: async (data: CreateMindMapDto): Promise<MindMap> => {
    const response = await apiClient.post('/mindmap', data);
    return response.data;
  },

  // Update mindmap
  updateMindMap: async (id: number, data: UpdateMindMapDto): Promise<MindMap> => {
    const response = await apiClient.put(`/mindmap/${id}`, data);
    return response.data;
  },

  // Delete mindmap
  deleteMindMap: async (id: number): Promise<void> => {
    await apiClient.delete(`/mindmap/${id}`);
  },

  // Get node by ID
  getNodeById: async (nodeId: number): Promise<MindMapNodeWithFlashCard> => {
    const response = await apiClient.get(`/mindmap/nodes/${nodeId}`);
    return response.data;
  },

  // Create node
  createNode: async (mindMapId: number, data: CreateMindMapNodeDto): Promise<MindMapNode> => {
    const response = await apiClient.post(`/mindmap/${mindMapId}/nodes`, data);
    return response.data;
  },

  // Update node (position, color, hideChildren, parent)
  updateNode: async (nodeId: number, data: UpdateMindMapNodeDto): Promise<MindMapNode> => {
    const response = await apiClient.put(`/mindmap/nodes/${nodeId}`, data);
    return response.data;
  },

  // Delete node
  deleteNode: async (nodeId: number): Promise<void> => {
    await apiClient.delete(`/mindmap/nodes/${nodeId}`);
  },

  // Batch update multiple nodes (for saving positions)
  batchUpdateNodes: async (updates: Array<{ nodeId: number; data: UpdateMindMapNodeDto }>): Promise<void> => {
    await Promise.all(
      updates.map(({ nodeId, data }) => mindMapService.updateNode(nodeId, data))
    );
  },
};
