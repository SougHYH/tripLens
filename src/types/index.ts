// ================================
// 공통 API 응답 래퍼
// ================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode: number;
}

// ================================
// 장소 (Place)
// ================================
export interface Place {
  id: string;
  name: string;
  address: string;
  category: string; // 예: "카페", "식당", "관광지"
  rating: number;   // 0.0 ~ 5.0
  reviewCount: number;
  tags: string[];   // 예: ["#분위기맛집", "#웨이팅필수"]
  thumbnailUrl?: string;
}

export interface PlaceSearchResult {
  places: Place[];
  total: number;
  keyword: string;
}

// ================================
// 리뷰 분석 (Review Analysis)
// ================================
export interface SentimentBreakdown {
  positiveCount: number;
  negativeCount: number;
  positiveRatio: number; // 0 ~ 100 (%)
  positiveKeywords: string[]; // 예: ["맛", "분위기", "친절도"]
  negativeKeywords: string[]; // 예: ["주차", "웨이팅"]
}

export interface ReviewAnalysis {
  placeId: string;
  summary: string[];           // AI 핵심 요약 텍스트 (단락별 배열)
  tags: string[];            // 예: ["#분위기맛집", "#웨이팅필수"]
  sentiment: SentimentBreakdown;
  rating: number;
  reviewCount: number;
  analyzedAt: string;        // ISO 날짜 문자열
}

// ================================
// 채팅 (Chat)
// ================================
export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  placeId: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: string;
}
