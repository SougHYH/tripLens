import traceback
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from models.review import ReviewAnalysis, ChatRequest, ChatResponse, SentimentBreakdown
from services.scraper import get_reviews, search_places
from services.ai import analyze_reviews, chat_with_summary, chat_with_web_search
from db import get_cached_review, save_review, upsert_place, get_or_create_qa_session, save_qa_message, get_qa_messages, get_place_by_name, save_raw_reviews

router = APIRouter()


def _build_from_cache(place_id: str, cached: dict) -> ReviewAnalysis:
    # places 테이블에서 thumbnail_url 조회
    from db import get_place as db_get_place
    place_row = db_get_place(place_id)
    thumbnail_url = (place_row or {}).get("thumbnail_url")

    return ReviewAnalysis(
        placeId=place_id,
        summary=cached.get("summary", []),
        tags=cached.get("tags", []),
        sentiment=SentimentBreakdown(
            positiveCount=cached.get("positive_count", 0),
            negativeCount=cached.get("negative_count", 0),
            positiveRatio=cached.get("positive_ratio", 0),
            positiveKeywords=cached.get("positive_keywords", []),
            negativeKeywords=cached.get("negative_keywords", []),
        ),
        rating=cached.get("rating", 0.0),
        reviewCount=cached.get("review_count", 0),
        analyzedAt=cached.get("analyzed_at", ""),
        thumbnailUrl=thumbnail_url,
    )


# ================================
# 공통: 리뷰 수집 + AI 분석
# ================================
async def _fetch_and_analyze(query: str, place: dict = None) -> ReviewAnalysis:
    # 1. 리뷰 수집
    reviews = await get_reviews(query)
    if not reviews:
        raise HTTPException(status_code=404, detail="리뷰 데이터를 찾을 수 없습니다.")

    # 2. 장소 정보 수집 (별점, 리뷰 수) — 외부에서 전달받은 경우 생략
    if place is None:
        places = await search_places(query, limit=1)
        place = places[0] if places else {}

    # 3. 장소 DB 저장
    if place:
        upsert_place(place)

    # 4. AI 분석
    analysis = await analyze_reviews(reviews, query)

    # 5. 분석 결과 + 원본 리뷰 DB 저장
    place_id = place.get("id", query)
    save_review(place_id, analysis, place)
    save_raw_reviews(place_id, reviews)

    return ReviewAnalysis(
        placeId=place_id,
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
        thumbnailUrl=place.get("thumbnailUrl") or place.get("thumbnail_url"),
    )


@router.get("/analysis/{place_id}", response_model=ReviewAnalysis)
async def get_review_analysis(place_id: str):
    """
    장소 ID로 AI 리뷰 분석 결과를 반환합니다.
    GET /reviews/analysis/{place_id}
    캐시 있으면 DB에서 반환, 없으면 AI 분석 후 저장
    """
    try:
        cached = get_cached_review(place_id)
        if cached:
            return _build_from_cache(place_id, cached)
        return await _fetch_and_analyze(place_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"리뷰 분석 중 오류 발생: {str(e)}")


@router.get("/analysis", response_model=ReviewAnalysis)
async def get_review_analysis_by_keyword(
    keyword: str = Query(..., description="검색 키워드"),
    kakao_id: str = Query(None, description="카카오 장소 ID"),
):
    """
    키워드로 AI 리뷰 분석 결과를 반환합니다.
    GET /reviews/analysis?keyword=장소명&kakao_id=카카오ID
    """
    try:
        # 카카오 ID로 캐시 확인 (가장 빠름)
        if kakao_id:
            cached = get_cached_review(kakao_id)
            if cached:
                return _build_from_cache(kakao_id, cached)

        # 카카오 ID 없으면 DB에서 이름으로 조회해서 기존 ID 재사용
        if not kakao_id:
            db_place = get_place_by_name(keyword)
            if db_place:
                existing_id = db_place.get("place_id", "")
                cached = get_cached_review(existing_id)
                if cached:
                    return _build_from_cache(existing_id, cached)
                kakao_id = existing_id

        # Outscraper 호출 후 카카오 ID로 저장
        places = await search_places(keyword, limit=1)
        place = places[0] if places else {}
        if kakao_id:
            place["id"] = kakao_id
            # Outscraper가 오매칭된 경우를 대비해 카카오 키워드를 정확한 이름으로 사용
            place["name"] = keyword
        return await _fetch_and_analyze(keyword, place=place)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"리뷰 분석 중 오류 발생: {str(e)}")


@router.get("/chat/history")
async def get_chat_history(user_id: str, place_id: str):
    """
    유저의 특정 장소 대화 기록을 반환합니다.
    GET /reviews/chat/history?user_id=...&place_id=...
    """
    try:
        return get_qa_messages(user_id, place_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"대화 기록 조회 중 오류 발생: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    리뷰 기반 AI 채팅 응답을 반환합니다.
    POST /reviews/chat
    """
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        cached = get_cached_review(request.placeId)
        if not cached:
            raise HTTPException(status_code=404, detail="리뷰 분석 데이터가 없습니다. 먼저 리뷰 분석을 실행해주세요.")
        result = await chat_with_summary(cached, request.placeId, messages)
        reply = result["answer"]
        found_in_reviews = result["found_in_reviews"]

        if not found_in_reviews:
            user_question = next(
                (m.content for m in reversed(request.messages) if m.role == "user"), ""
            )
            try:
                web_answer = await chat_with_web_search(request.placeId, user_question)
                reply = f"{reply}\n\n🌐 웹 검색 추가 정보\n{web_answer}"
            except Exception as e:
                print(f"[웹 검색 실패] {e}")

        if request.userId:
            try:
                session_id = get_or_create_qa_session(request.userId, request.placeId)
                last_user_msg = next((m for m in reversed(request.messages) if m.role == "user"), None)
                if last_user_msg:
                    save_qa_message(session_id, "user", last_user_msg.content)
                save_qa_message(session_id, "assistant", reply)
            except Exception as e:
                print(f"[채팅 저장 실패] {e}")

        return ChatResponse(message=reply, foundInReviews=found_in_reviews)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채팅 처리 중 오류 발생: {str(e)}")
