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
