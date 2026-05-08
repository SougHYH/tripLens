import os
from outscraper import ApiClient
from dotenv import load_dotenv

load_dotenv()

client = ApiClient(api_key=os.getenv("OUTSCRAPER_API_KEY"))

# ================================
# 장소 검색
# ================================
async def search_places(keyword: str, limit: int = 5) -> list[dict]:
    """
    키워드로 Google Maps 장소를 검색합니다.
    반환: 장소 목록 (name, address, rating, reviews_count 등)
    """
    results = client.google_maps_search(
        keyword,
        limit=limit,
        language="ko",
        region="KR",
    )

    places = []
    for item in results:
        if not item:
            continue
        places.append({
            "id": item.get("place_id", ""),
            "name": item.get("name", ""),
            "address": item.get("full_address", item.get("address", "")),
            "category": item.get("type", ""),
            "rating": item.get("rating", 0.0),
            "reviewCount": item.get("reviews", 0),
            "tags": [],
        })
    return places


# ================================
# 리뷰 수집
# ================================
async def get_reviews(query: str, reviews_limit: int = 100) -> list[dict]:
    """
    장소명(또는 place_id)으로 Google Maps 리뷰를 수집합니다.
    반환: 리뷰 목록 (text, rating, author 등)
    수집 리뷰 갯수 default 100 이 후 조정 필요 TODO
    """
    results = client.google_maps_reviews(
        query,
        reviews_limit=reviews_limit,
        language="ko",
        sort="most_relevant",
    )

    reviews = []
    for place in results:
        if not place:
            continue
        for review in place.get("reviews_data", []):
            if not review.get("review_text"):
                continue
            reviews.append({
                "author": review.get("autor_name", "익명"),
                "rating": review.get("review_rating", 0),
                "text": review.get("review_text", ""),
                "date": review.get("review_datetime_utc", ""),
            })
    return reviews
