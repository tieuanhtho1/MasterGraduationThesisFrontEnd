import { apiClient } from './api';
import type {
  UserAnalytics,
  CollectionAnalytics,
  OverviewStats,
  LearningProgress,
} from '../types';

export const analyticsService = {
  /**
   * Get complete user analytics
   */
  getUserAnalytics: async (userId: number): Promise<UserAnalytics> => {
    const response = await apiClient.get<UserAnalytics>(`/analytics/${userId}`);
    return response.data;
  },

  /**
   * Get analytics for a specific collection
   */
  getCollectionAnalytics: async (userId: number, collectionId: number): Promise<CollectionAnalytics> => {
    const response = await apiClient.get<CollectionAnalytics>(`/analytics/${userId}/collection/${collectionId}`);
    return response.data;
  },

  /**
   * Get overview statistics
   */
  getOverviewStats: async (userId: number): Promise<OverviewStats> => {
    const response = await apiClient.get<OverviewStats>(`/analytics/${userId}/overview`);
    return response.data;
  },

  /**
   * Get learning progress
   */
  getLearningProgress: async (userId: number): Promise<LearningProgress> => {
    const response = await apiClient.get<LearningProgress>(`/analytics/${userId}/progress`);
    return response.data;
  },
};
