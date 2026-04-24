from fastapi import APIRouter, HTTPException, Query
from models.place import Place, PlaceSearchResult

router = APIRouter()


@router.get("/search", response_model=PlaceSearchResult)
async def search_places(keyword: str = Query(..., description="검색 키워드")):
    """
    키워드로 장소를 검색합니다.
    GET /places/search?keyword=카페
    """
    # TODO: Supabase DB 연결 후 실제 쿼리로 교체
    raise HTTPException(status_code=501, detail="DB 연결 후 구현 예정")


@router.get("/{place_id}", response_model=Place)
async def get_place(place_id: str):
    """
    장소 ID로 단건 조회합니다.
    GET /places/{place_id}
    """
    # TODO: Supabase DB 연결 후 실제 쿼리로 교체
    raise HTTPException(status_code=501, detail="DB 연결 후 구현 예정")
