import { apiClient } from "@/lib/apiClient";
import { ApiResponse, ReviewAnalysis, ChatMessage, ChatResponse } from "@/types";

// ================================
// 목업 데이터 (백엔드 연결 전 사용)
// 백엔드 완성 후 USE_MOCK = false 로 변경
// ================================
const USE_MOCK = false;

const MOCK_REVIEW_ANALYSIS: Record<string, ReviewAnalysis> = {
  "1": {
    placeId: "1",
    summary: "조용하고 분위기 좋은 카페입니다.\n공부하거나 대화하기 좋은 환경이에요.",
    tags: ["#분위기맛집", "#조용한카페", "#공부카페"],
    sentiment: {
      positiveCount: 82,
      negativeCount: 7,
      positiveRatio: 92,
      positiveKeywords: ["분위기", "인테리어", "음료"],
      negativeKeywords: ["주차", "가격"],
    },
    rating: 4.7,
    reviewCount: 89,
    analyzedAt: new Date().toISOString(),
  },
  "2": {
    placeId: "2",
    summary: "베이글이 정말 맛있는 베이커리입니다.\n주말에는 웨이팅이 필수예요.",
    tags: ["#베이글맛집", "#웨이팅필수", "#베이커리"],
    sentiment: {
      positiveCount: 197,
      negativeCount: 16,
      positiveRatio: 92,
      positiveKeywords: ["맛", "신선함", "친절도"],
      negativeKeywords: ["웨이팅", "협소한 공간"],
    },
    rating: 4.9,
    reviewCount: 213,
    analyzedAt: new Date().toISOString(),
  },
  "3": {
    placeId: "3",
    summary: "분위기가 좋은 식당입니다.\n주말에는 웨이팅이 필수입니다.",
    tags: ["#분위기맛집", "#웨이팅필수"],
    sentiment: {
      positiveCount: 114,
      negativeCount: 10,
      positiveRatio: 92,
      positiveKeywords: ["맛", "분위기", "친절도"],
      negativeKeywords: ["주차", "웨이팅"],
    },
    rating: 4.8,
    reviewCount: 124,
    analyzedAt: new Date().toISOString(),
  },
};

// ================================
// 리뷰 분석 조회
// GET /reviews/analysis/:placeId
// ================================
export async function getReviewAnalysis(placeId: string): Promise<ReviewAnalysis> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    const analysis = MOCK_REVIEW_ANALYSIS[placeId] ?? MOCK_REVIEW_ANALYSIS["3"];
    return analysis;
  }

  const res = await apiClient.get<ReviewAnalysis>(
    `/reviews/analysis/${placeId}`
  );
  return res;
}

// ================================
// 키워드 검색으로 리뷰 분석 조회 (검색 직후 바로 분석 보여줄 때)
// GET /reviews/analysis?keyword=...
// ================================
export async function getReviewAnalysisByKeyword(keyword: string): Promise<ReviewAnalysis> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    // 목업: 키워드에 매칭되는 장소 찾아서 반환
    return MOCK_REVIEW_ANALYSIS["3"];
  }

  const res = await apiClient.get<ReviewAnalysis>(
    `/reviews/analysis?keyword=${encodeURIComponent(keyword)}`
  );
  return res;
}

// ================================
// AI 채팅
// POST /reviews/chat
// ================================
export async function sendChatMessage(
  placeId: string,
  messages: ChatMessage[]
): Promise<string> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const lastMsg = messages[messages.length - 1]?.content ?? "";
    if (lastMsg.includes("주차")) return "이 장소는 주차 공간이 협소하다는 리뷰가 일부 있어요. 근처 공영주차장을 이용하시는 분들도 있더라고요.";
    if (lastMsg.includes("웨이팅") || lastMsg.includes("대기")) return "주말 점심 시간대에는 30분~1시간 웨이팅이 있다는 후기가 많아요. 평일 오전에 방문하시면 바로 입장 가능해요!";
    if (lastMsg.includes("아이") || lastMsg.includes("가족")) return "가족 단위 방문객 후기가 꽤 있어요. 아이 동반도 괜찮다는 평이 많습니다 😊";
    return "리뷰 데이터를 분석한 결과, 방문객 대부분이 만족스러운 경험을 했다고 해요. 더 궁금한 점이 있으신가요?";
  }

  const res = await apiClient.post<ChatResponse>("/reviews/chat", {
    placeId,
    messages,
  });
  return res.message;
}
