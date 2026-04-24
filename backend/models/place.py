from pydantic import BaseModel
from typing import List, Optional


class Place(BaseModel):
    id: str
    name: str
    address: str
    category: str
    rating: float
    reviewCount: int
    tags: List[str]
    thumbnailUrl: Optional[str] = None


class PlaceSearchResult(BaseModel):
    places: List[Place]
    total: int
    keyword: str
