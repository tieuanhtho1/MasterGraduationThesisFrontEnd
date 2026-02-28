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
  TimesLearned: number;
}

export interface UpdateScoresDto {
  scoreUpdates: ScoreUpdate[];
}

// Analytics Types
export interface OverviewStats {
  totalCollections: number;
  totalFlashCards: number;
  totalFlashCardsLearned: number;
  averageScore: number;
}

export interface LearningProgress {
  cardsToReview: number;
  cardsMastered: number;
  cardsInProgress: number;
  cardsNeedWork: number;
  completionRate: number;
}

export interface TopCollection {
  collectionId: number;
  collectionTitle: string;
  flashCardCount: number;
  cardsLearned: number;
  totalTimesLearned: number;
  averageScore: number;
  completionRate: number;
}

export interface AverageScoreDistribution {
  scoreMinus5ToMinus3: number;
  scoreMinus3ToMinus1: number;
  scoreMinus1To1: number;
  score1To3: number;
  score3To5: number;
}

export interface UserAnalytics {
  overview: OverviewStats;
  learningProgress: LearningProgress;
  topCollections: TopCollection[];
  averageScoreDistribution: AverageScoreDistribution;
}

export interface FlashCardDetail {
  id: number;
  term: string;
  score: number;
  timesLearned: number;
  averageScore: number;
}

export interface CollectionAnalytics {
  collectionId: number;
  collectionTitle: string;
  description: string;
  totalFlashCards: number;
  flashCardsLearned: number;
  averageScore: number;
  completionRate: number;
  averageScoreDistribution: AverageScoreDistribution;
  topPerformingCards: FlashCardDetail[];
  cardsNeedingReview: FlashCardDetail[];
}

// MindMap Types
export interface MindMapResponse {
  id: number;
  title: string;
  description: string;
  userId: number;
  flashCardCollectionId: number;
  collectionTitle: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MindMapNodeFlashCard {
  id: number;
  term: string;
  definition: string;
  score: number;
  timesLearned: number;
  flashCardCollectionId: number;
}

export interface MindMapNodeResponse {
  id: number;
  positionX: number;
  positionY: number;
  color: string;
  hideChildren: boolean;
  mindMapId: number;
  flashCardId: number;
  flashCard: MindMapNodeFlashCard;
}

export interface MindMapEdgeResponse {
  id: number;
  sourceNodeId: number;
  targetNodeId: number;
  sourceHandle: string;
  targetHandle: string;
  mindMapId: number;
}

export interface MindMapDetailResponse {
  id: number;
  title: string;
  description: string;
  userId: number;
  flashCardCollectionId: number;
  collectionTitle: string;
  createdAt: string;
  updatedAt: string;
  nodes: MindMapNodeResponse[];
  edges: MindMapEdgeResponse[];
}

export interface CreateMindMapDto {
  title: string;
  description?: string;
  userId: number;
  flashCardCollectionId: number;
}

export interface UpdateMindMapDto {
  title: string;
  description?: string;
  flashCardCollectionId?: number;
}

export interface CreateMindMapNodeDto {
  positionX: number;
  positionY: number;
  color?: string;
  hideChildren?: boolean;
  mindMapId: number;
  flashCardId: number;
}

export interface UpdateMindMapNodeDto {
  positionX: number;
  positionY: number;
  color?: string;
  hideChildren?: boolean;
}

export interface BulkSaveNodeDto {
  id: number | null;
  positionX: number;
  positionY: number;
  color?: string;
  hideChildren?: boolean;
  flashCardId: number;
}

export interface BulkSaveEdgeDto {
  id: number | null;
  sourceNodeId: number;
  targetNodeId: number;
  sourceHandle: string;
  targetHandle: string;
}

export interface BulkSaveNodesRequest {
  nodes: BulkSaveNodeDto[];
  edges: BulkSaveEdgeDto[];
}

export interface BulkSaveNodesResponse {
  message: string;
  nodes: MindMapNodeResponse[];
  edges: MindMapEdgeResponse[];
}
