import os
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

CACHE_TTL_HOURS = 24


# ── PLACES ──────────────────────────────────────────────

def upsert_place(place: dict) -> dict:
    res = supabase.table("places").upsert({
        "place_id":      place.get("id") or place.get("place_id"),
        "name":          place.get("name", ""),
        "address":       place.get("address", ""),
        "rating":        place.get("rating", 0.0),
        "review_count":  place.get("reviewCount") or place.get("review_count", 0),
        "tags":          place.get("tags", []),
        "thumbnail_url": place.get("thumbnailUrl") or place.get("thumbnail_url"),
    }).execute()
    return res.data[0] if res.data else None


def get_place(place_id: str) -> dict:
    res = supabase.table("places").select("*").eq("place_id", place_id).execute()
    return res.data[0] if res.data else None


# ── REVIEWS & CACHE ──────────────────────────────────────

def get_cached_review(place_id: str) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    res = (
        supabase.table("cache")
        .select("review_id, expires_at, reviews(*)")
        .eq("place_id", place_id)
        .gt("expires_at", now)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]["reviews"]


def save_review(place_id: str, analysis: dict, place: dict = None) -> dict:
    review_res = supabase.table("reviews").insert({
        "place_id":          place_id,
        "summary":           analysis.get("summary", ""),
        "tags":              analysis.get("tags", []),
        "positive_count":    analysis.get("positiveCount", 0),
        "negative_count":    analysis.get("negativeCount", 0),
        "positive_ratio":    analysis.get("positiveRatio", 0.0),
        "positive_keywords": analysis.get("positiveKeywords", []),
        "negative_keywords": analysis.get("negativeKeywords", []),
        "rating":            (place or {}).get("rating", 0.0),
        "review_count":      (place or {}).get("reviewCount", 0),
    }).execute()

    review = review_res.data[0]
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=CACHE_TTL_HOURS)).isoformat()

    supabase.table("cache").upsert({
        "place_id":  place_id,
        "review_id": review["review_id"],
        "expires_at": expires_at,
    }).execute()

    return review


# ── FAVORITES ────────────────────────────────────────────

def get_favorites(user_id: str) -> list:
    res = (
        supabase.table("favorites")
        .select("*, places(name, address, thumbnail_url, rating)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


def add_favorite(user_id: str, place_id: str, memo: str = None) -> dict:
    res = supabase.table("favorites").upsert({
        "user_id":  user_id,
        "place_id": place_id,
        "memo":     memo,
    }).execute()
    return res.data[0] if res.data else None


def delete_favorite(user_id: str, place_id: str) -> None:
    supabase.table("favorites").delete().match({
        "user_id":  user_id,
        "place_id": place_id,
    }).execute()


# ── PROFILES ─────────────────────────────────────────────

def get_profile(user_id: str) -> dict:
    res = supabase.table("profiles").select("*").eq("id", user_id).execute()
    return res.data[0] if res.data else None
