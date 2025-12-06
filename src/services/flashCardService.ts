import { apiClient } from './api';
import type { 
  FlashCardCollection, 
  CreateFlashCardCollectionDto, 
  UpdateFlashCardCollectionDto,
  FlashCardResponse,
  BulkUpdateFlashCardsDto
} from '../types';

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

  // Get flashcards for a collection with pagination
  getFlashCardsByCollection: async (
    collectionId: number, 
    pageNumber: number = 1, 
    pageSize: number = 10,
    searchText?: string
  ): Promise<FlashCardResponse> => {
    const response = await apiClient.get(`/FlashCard/collection/${collectionId}`, {
      params: { pageNumber, pageSize, searchText }
    });
    return response.data;
  },

  // Bulk update/create flashcards
  bulkUpdateFlashCards: async (data: BulkUpdateFlashCardsDto): Promise<void> => {
    await apiClient.post('/FlashCard/Bulk', data);
  },

  // Bulk delete flashcards
  bulkDeleteFlashCards: async (flashCardIds: number[]): Promise<void> => {
    await apiClient.delete('/FlashCard/Bulk', {
      data: { flashCardIds }
    });
  },
};
