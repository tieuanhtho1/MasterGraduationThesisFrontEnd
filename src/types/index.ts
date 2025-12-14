export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
  email: string;
  role: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface FlashCardCollection {
  id: number;
  userId: number;
  parentId: number | null;
  title: string;
  description: string;
  flashCardCount: number;
  childrenCount: number;
}

export interface CreateFlashCardCollectionDto {
  userId: number;
  parentId: number;
  title: string;
  description: string;
}

export interface UpdateFlashCardCollectionDto {
  title?: string;
  description?: string;
  parentId?: number;
}

export interface FlashCard {
  id: number;
  term: string;
  definition: string;
  score: number;
  flashCardCollectionId: number;
}

export interface FlashCardResponse {
  flashCards: FlashCard[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface BulkUpdateFlashCardsDto {
  flashCardCollectionId: number;
  flashCards: Array<{
    id: number;
    term: string;
    definition: string;
    score: number;
  }>;
}

export interface LearnSessionResponse {
  collectionId: number;
  count: number;
  flashCards: FlashCard[];
}

export interface ScoreUpdate {
  flashCardId: number;
  scoreModification: number;
}

export interface UpdateScoresDto {
  scoreUpdates: ScoreUpdate[];
}
