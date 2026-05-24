from fastapi import APIRouter, HTTPException, Query
from models.place import Place, PlaceSearchResult
from services.scraper import search_places
from db import get_place as db_get_place, upsert_place, update_thumbnail

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
    DB 캐시 있으면 반환, 없으면 외부 API 조회 후 저장
    """
    try:
        cached = db_get_place(place_id)
        if cached:
            return Place(
                id=cached["place_id"],
                name=cached["name"],
                address=cached["address"],
                category="",
                rating=cached.get("rating", 0.0),
                reviewCount=cached.get("review_count", 0),
                tags=cached.get("tags") or [],
                thumbnailUrl=cached.get("thumbnail_url"),
            )
        places_data = await search_places(place_id, limit=1)
        if not places_data:
            raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
        upsert_place(places_data[0])
        return Place(**places_data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"장소 조회 중 오류 발생: {str(e)}")


@router.post("/{place_id}/refresh-thumbnail")
async def refresh_thumbnail(place_id: str):
    try:
        place = db_get_place(place_id)
        if not place:
            raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")

        name = place.get("name", "")
        if not name:
            raise HTTPException(status_code=400, detail="장소 이름이 없습니다.")

        places_data = await search_places(name, limit=1)
        if not places_data:
            raise HTTPException(status_code=404, detail="썸네일을 가져올 수 없습니다.")

        new_url = places_data[0].get("thumbnailUrl", "")
        if not new_url:
            raise HTTPException(status_code=404, detail="썸네일을 가져올 수 없습니다.")

        update_thumbnail(place_id, new_url)
        return {"thumbnailUrl": new_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"썸네일 갱신 중 오류 발생: {str(e)}")
