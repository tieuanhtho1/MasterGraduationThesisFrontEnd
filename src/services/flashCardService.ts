import { apiClient } from './api';
import type { FlashCardCollection, CreateFlashCardCollectionDto, UpdateFlashCardCollectionDto } from '../types';

export const flashCardService = {
  // Get all collections for a user
  getCollectionsByUserId: async (userId: number): Promise<FlashCardCollection[]> => {
    const response = await apiClient.get(`/FlashCardCollection/user/${userId}`);
    return response.data;
  },

  // Create a new collection
  createCollection: async (data: CreateFlashCardCollectionDto): Promise<FlashCardCollection> => {
    const response = await apiClient.post('/FlashCardCollection', data);
    return response.data;
  },

  // Update a collection
  updateCollection: async (id: number, data: UpdateFlashCardCollectionDto): Promise<FlashCardCollection> => {
    const response = await apiClient.put(`/FlashCardCollection/${id}`, data);
    return response.data;
  },

  // Delete a collection
  deleteCollection: async (id: number): Promise<void> => {
    await apiClient.delete(`/FlashCardCollection/${id}`);
  },

  // Get a single collection by ID
  getCollectionById: async (id: number): Promise<FlashCardCollection> => {
    const response = await apiClient.get(`/FlashCardCollection/${id}`);
    return response.data;
  },
};
