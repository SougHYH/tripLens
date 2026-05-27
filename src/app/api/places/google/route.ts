import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const query = request.nextUrl.searchParams.get("query");
  const minRating = parseFloat(request.nextUrl.searchParams.get("minRating") || "3.5");
  const minReviews = parseInt(request.nextUrl.searchParams.get("minReviews") || "10");

  if (!query) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  const cacheKey = `${query}|${minRating}|${minReviews}`;

  // 캐시 확인
  const { data: cached } = await supabase
    .from("places_search_cache")
    .select("result")
    .eq("query", cacheKey)
    .single();

  if (cached) {
    return NextResponse.json(cached.result);
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.rating,places.userRatingCount,places.photos",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "ko",
      regionCode: "KR",
      maxResultCount: 15,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: "Google Places API 호출 실패", detail: err }, { status: res.status });
  }

  const data = await res.json();
  let places = (data.places || []) as {
    id: string;
    displayName: { text: string };
    formattedAddress: string;
    shortFormattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    photos?: { name: string }[];
  }[];

  places = places.filter(
    (p) => (p.rating ?? 0) >= minRating && (p.userRatingCount ?? 0) >= minReviews
  );

  const paged = places.slice(0, 20);

  // 사진 URL 병렬 조회 (API 키는 서버에서만 사용)
  const placesWithPhotos = await Promise.all(
    paged.map(async (place) => {
      if (!place.photos?.[0]) return { ...place, photoUrl: null };
      try {
        const photoRes = await fetch(
          `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxWidthPx=600&skipHttpRedirect=true&key=${apiKey}`
        );
        const photoData = await photoRes.json();
        return { ...place, photoUrl: photoData.photoUri ?? null };
      } catch {
        return { ...place, photoUrl: null };
      }
    })
  );

  const result = { places: placesWithPhotos };

  // 캐시 저장
  await supabase
    .from("places_search_cache")
    .upsert({ query: cacheKey, result, cached_at: new Date().toISOString() });

  return NextResponse.json(result);
}
