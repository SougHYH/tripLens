from fastapi import APIRouter, HTTPException, Query
from models.place import Place, PlaceSearchResult
from services.scraper import search_places

router = APIRouter()


@router.get("/search", response_model=PlaceSearchResult)
async def search(keyword: str = Query(..., description="검색 키워드")):
    """
    키워드로 Google Maps 장소를 검색합니다.
    GET /places/search?keyword=카페
    """
    try:
        places_data = await search_places(keyword)
        places = [Place(**p) for p in places_data]
        return PlaceSearchResult(places=places, total=len(places), keyword=keyword)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"장소 검색 중 오류 발생: {str(e)}")


@router.get("/{place_id}", response_model=Place)
async def get_place(place_id: str):
    """
    장소 ID로 단건 조회합니다.
    GET /places/{place_id}
    TODO: Supabase DB 연결 후 캐시된 데이터 조회로 교체
    """
    try:
        places_data = await search_places(place_id, limit=1)
        if not places_data:
            raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
        return Place(**places_data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"장소 조회 중 오류 발생: {str(e)}")
