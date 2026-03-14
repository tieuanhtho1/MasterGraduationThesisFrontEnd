import { apiClient } from './api';
import type { GenerateFlashCardsResponse, GenerateMindMapResponse, GenerateAllResponse } from '../types';

export interface GenerateFlashCardsParams {
  file: File;
  parentCollectionId: number;
  userId: number;
  provider: string;
  model: string;
}

export interface GenerateMindMapParams {
  collectionId: number;
  userId: number;
  provider: string;
  model: string;
}

export interface GenerateAllParams {
  file: File;
  parentCollectionId: number;
  userId: number;
  provider: string;
  model: string;
}

export const aiGenerationService = {
  generateFlashCards: async (params: GenerateFlashCardsParams): Promise<GenerateFlashCardsResponse> => {
    const formData = new FormData();
    formData.append('File', params.file);
    formData.append('ParentCollectionId', params.parentCollectionId.toString());
    formData.append('UserId', params.userId.toString());
    formData.append('Provider', params.provider);
    formData.append('Model', params.model);

    const response = await apiClient.post('/AIGeneration/flashcards', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  generateMindMap: async (params: GenerateMindMapParams): Promise<GenerateMindMapResponse> => {
    const response = await apiClient.post('/AIGeneration/mindmap', params);
    return response.data;
  },

  generateAll: async (params: GenerateAllParams): Promise<GenerateAllResponse> => {
    const formData = new FormData();
    formData.append('File', params.file);
    formData.append('ParentCollectionId', params.parentCollectionId.toString());
    formData.append('UserId', params.userId.toString());
    formData.append('Provider', params.provider);
    formData.append('Model', params.model);

    const response = await apiClient.post('/AIGeneration/all', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

