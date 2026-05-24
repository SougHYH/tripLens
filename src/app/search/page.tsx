"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MapPin, Search, Loader2 } from "lucide-react";
import Link from "next/link";

interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  category_group_name: string;
  distance: string;
}

/* ───── 검색 기록 localStorage 유틸 ───── */
const SEARCH_HISTORY_KEY = 'tripLens_searchHistory';
const MAX_HISTORY = 30;

function saveSearchKeyword(keyword: string) {
  if (typeof window === 'undefined' || !keyword.trim()) return;
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const history: string[] = raw ? JSON.parse(raw) : [];
    const filtered = history.filter(h => h.toLowerCase() !== keyword.trim().toLowerCase());
    filtered.unshift(keyword.trim());
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
  } catch { /* localStorage 접근 불가 시 무시 */ }
}

const formatDistance = (meters: string) => {
  const m = parseInt(meters, 10);
  if (!m) return null;
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
};

function SearchResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [keyword, setKeyword] = useState(query);
  const [sort, setSort] = useState<"accuracy" | "distance">("accuracy");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  const handleSortChange = (value: "accuracy" | "distance") => {
    if (value === "distance" && !coords) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationError(false);
          setSort(value);
        },
        () => setLocationError(true)
      );
    } else {
      setSort(value);
    }
  };

  useEffect(() => {
    if (!query.trim()) return;

    setIsLoading(true);

    const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    url.searchParams.set("query", query);
    url.searchParams.set("size", "15");
    url.searchParams.set("sort", sort);
    if (sort === "distance" && coords) {
      url.searchParams.set("x", String(coords.lng));
      url.searchParams.set("y", String(coords.lat));
    }

    fetch(url.toString(), { headers: { Authorization: "KakaoAK cfa3881ae9ddb68212b45677d60c85ac" } })
      .then((r) => r.json())
      .then((data) => setResults(data.documents || []))
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [query, sort, coords]);

  const handleSelect = (place: KakaoPlace) => {
    // ★ 장소 클릭 시 검색어 저장
    saveSearchKeyword(place.place_name);

    const finalAddress = place.road_address_name || place.address_name || "주소 정보 없음";
    router.push(
      `/review?q=${encodeURIComponent(place.place_name)}&id=${place.id}&address=${encodeURIComponent(finalAddress)}`
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    // ★ 검색 시 키워드 저장
    saveSearchKeyword(keyword.trim());

    router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#EFECE5] font-sans tracking-tight">
      {/* 헤더 */}
      <nav className="flex items-center gap-6 px-12 py-5 border-b border-[#D7D3C8] bg-[#EFECE5]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/">
          <span className="text-2xl font-black text-slate-950 tracking-tighter hover:opacity-70 transition-opacity">
            여행 돋보기
          </span>
        </Link>

        {/* 검색바 */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 max-w-2xl items-center bg-white rounded-full px-6 py-3 shadow-sm border border-[#E2DFD6]"
        >
          <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="여행지, 호텔, 식당을 검색해보세요"
            className="flex-1 bg-transparent text-[16px] font-medium text-slate-800 placeholder:text-slate-400 outline-none"
          />
        </form>
      </nav>

      {/* 결과 영역 */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* 검색어 헤더 */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-sm font-bold text-slate-400 mb-1">검색 결과</p>
            <h1 className="text-3xl font-black text-slate-950 tracking-tighter">
              &apos;{query}&apos;
            </h1>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center bg-white rounded-full border border-[#F2F1EC] p-1 shadow-sm">
              <button
                onClick={() => handleSortChange("accuracy")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  sort === "accuracy" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                관련도순
              </button>
              <button
                onClick={() => handleSortChange("distance")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  sort === "distance" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                거리순
              </button>
            </div>
            {locationError && (
              <p className="text-[11px] text-red-400 font-medium">
                위치 권한을 허용해야 거리순 정렬이 가능합니다.
              </p>
            )}
          </div>
        </div>

        {/* 로딩 */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        )}

        {/* 결과 없음 */}
        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Search className="w-12 h-12 text-slate-300" />
            <p className="text-slate-400 font-medium">검색 결과가 없습니다.</p>
            <p className="text-slate-300 text-sm">다른 검색어를 입력해보세요.</p>
          </div>
        )}

        {/* 결과 목록 */}
        {!isLoading && results.length > 0 && (
          <ul className="space-y-3">
            {results.map((place) => (
              <li
                key={place.id}
                onClick={() => handleSelect(place)}
                className="flex items-start gap-5 bg-white rounded-[20px] px-7 py-6 border border-[#F2F1EC] shadow-sm hover:shadow-md hover:border-slate-200 cursor-pointer transition-all duration-200 group"
              >
                <div className="mt-0.5 p-2.5 bg-slate-100 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[18px] font-bold text-slate-900 leading-tight">
                    {place.place_name}
                  </h3>
                  {place.category_group_name && (
                    <span className="inline-block mt-1.5 text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                      {place.category_group_name}
                    </span>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-sm text-slate-400 font-medium truncate">
                      {place.road_address_name || place.address_name}
                    </p>
                    {sort === "distance" && formatDistance(place.distance) && (
                      <span className="text-[11px] font-bold text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full flex-shrink-0">
                        현위치에서 {formatDistance(place.distance)}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#EFECE5]">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      }
    >
      <SearchResultContent />
    </Suspense>
  );
}