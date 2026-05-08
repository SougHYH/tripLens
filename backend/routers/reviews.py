from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from models.review import ReviewAnalysis, ChatRequest, ChatResponse, SentimentBreakdown
from services.scraper import get_reviews, search_places
from services.ai import analyze_reviews, chat_about_place

router = APIRouter()


# ================================
# 공통: 리뷰 수집 + AI 분석
# ================================
async def _fetch_and_analyze(query: str) -> ReviewAnalysis:
    # 1. 리뷰 수집
    reviews = await get_reviews(query)
    if not reviews:
        raise HTTPException(status_code=404, detail="리뷰 데이터를 찾을 수 없습니다.")

    # 2. 장소 정보 수집 (별점, 리뷰 수)
    places = await search_places(query, limit=1)
    place = places[0] if places else {}

    # 3. AI 분석
    analysis = await analyze_reviews(reviews, query)

    return ReviewAnalysis(
        placeId=place.get("id", query),
        summary=analysis.get("summary", []),
        tags=analysis.get("tags", []),
        sentiment=SentimentBreakdown(
            positiveCount=analysis.get("positiveCount", 0),
            negativeCount=analysis.get("negativeCount", 0),
            positiveRatio=analysis.get("positiveRatio", 0),
            positiveKeywords=analysis.get("positiveKeywords", []),
            negativeKeywords=analysis.get("negativeKeywords", []),
        ),
        rating=place.get("rating", 0.0),
        reviewCount=len(reviews),
        analyzedAt=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/analysis/{place_id}", response_model=ReviewAnalysis)
async def get_review_analysis(place_id: str):
    """
    장소 ID로 AI 리뷰 분석 결과를 반환합니다.
    GET /reviews/analysis/{place_id}
    TODO: Supabase 연결 후 캐시 조회 추가
    """
    try:
        return await _fetch_and_analyze(place_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리뷰 분석 중 오류 발생: {str(e)}")


@router.get("/analysis", response_model=ReviewAnalysis)
async def get_review_analysis_by_keyword(keyword: str = Query(..., description="검색 키워드")):
    """
    키워드로 AI 리뷰 분석 결과를 반환합니다.
    GET /reviews/analysis?keyword=카페명암
    """
    try:
        return await _fetch_and_analyze(keyword)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리뷰 분석 중 오류 발생: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    리뷰 기반 AI 채팅 응답을 반환합니다.
    POST /reviews/chat
    """
    try:
        # 리뷰 수집
        reviews = await get_reviews(request.placeId)

        # 채팅 메시지 변환
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        # AI 응답 생성
        reply = await chat_about_place(reviews, request.placeId, messages)
        return ChatResponse(message=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 처리 중 오류 발생: {str(e)}")
