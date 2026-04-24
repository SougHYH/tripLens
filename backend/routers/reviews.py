from fastapi import APIRouter, HTTPException, Query
from models.review import ReviewAnalysis, ChatRequest, ChatResponse

router = APIRouter()


@router.get("/analysis/{place_id}", response_model=ReviewAnalysis)
async def get_review_analysis(place_id: str):
    """
    장소 ID로 AI 리뷰 분석 결과를 조회합니다.
    GET /reviews/analysis/{place_id}
    """
    # TODO: Supabase DB 연결 후 실제 쿼리로 교체
    raise HTTPException(status_code=501, detail="DB 연결 후 구현 예정")


@router.get("/analysis", response_model=ReviewAnalysis)
async def get_review_analysis_by_keyword(keyword: str = Query(..., description="검색 키워드")):
    """
    키워드로 AI 리뷰 분석 결과를 조회합니다.
    GET /reviews/analysis?keyword=카페명암
    """
    # TODO: Supabase DB + AI 분석 로직 연결 후 구현
    raise HTTPException(status_code=501, detail="DB 연결 후 구현 예정")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    리뷰 기반 AI 채팅 응답을 반환합니다.
    POST /reviews/chat
    """
    # TODO: AI 모델 연결 후 구현
    raise HTTPException(status_code=501, detail="AI 모델 연결 후 구현 예정")
