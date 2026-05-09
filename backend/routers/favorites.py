from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from db import get_favorites, add_favorite, delete_favorite

router = APIRouter()


class FavoriteRequest(BaseModel):
    user_id: str
    place_id: str
    memo: str = None


@router.get("/{user_id}")
def list_favorites(user_id: str):
    try:
        return get_favorites(user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_favorite(req: FavoriteRequest):
    try:
        return add_favorite(req.user_id, req.place_id, req.memo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/")
def remove_favorite(req: FavoriteRequest):
    try:
        delete_favorite(req.user_id, req.place_id)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
