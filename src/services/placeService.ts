import { apiClient } from "@/lib/apiClient";
import { ApiResponse, Place, PlaceSearchResult } from "@/types";

// ================================
// 목업 데이터 (백엔드 연결 전 사용)
// 백엔드 완성 후 USE_MOCK = false 로 변경
// ================================
const USE_MOCK = true;

const MOCK_PLACES: Place[] = [
  {
    id: "1",
    name: "카페 명암",
    address: "경기도 용인시 처인구 중부대로1299번길 12",
    category: "카페",
    rating: 4.7,
    reviewCount: 89,
    tags: ["#명지대역", "#분위기좋은", "#조용한카페"],
  },
  {
    id: "2",
    name: "코타베이글",
    address: "경기도 용인시 처인구 성산로169번길 5",
    category: "베이커리",
    rating: 4.9,
    reviewCount: 213,
    tags: ["#베이커리", "#베이글맛집", "#웨이팅필수"],
  },
  {
    id: "3",
    name: "용인 대장금",
    address: "경기도 용인시 처인구 김량장로 123",
    category: "식당",
    rating: 4.5,
    reviewCount: 124,
    tags: ["#한식맛집", "#가족식사", "#넓은주차장"],
  },
];

// ================================
// 장소 검색
// GET /places/search?keyword=...
// ================================
export async function searchPlaces(keyword: string): Promise<PlaceSearchResult> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 시뮬레이션
    const filtered = MOCK_PLACES.filter(
      (p) =>
        p.name.includes(keyword) ||
        p.address.includes(keyword) ||
        p.tags.some((t) => t.includes(keyword))
    );
    return {
      places: filtered.length > 0 ? filtered : MOCK_PLACES,
      total: filtered.length > 0 ? filtered.length : MOCK_PLACES.length,
      keyword,
    };
  }

  const res = await apiClient.get<ApiResponse<PlaceSearchResult>>(
    `/places/search?keyword=${encodeURIComponent(keyword)}`
  );
  return res.data;
}

// ================================
// 장소 단건 조회
// GET /places/:id
// ================================
export async function getPlaceById(id: string): Promise<Place> {
  if (USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const place = MOCK_PLACES.find((p) => p.id === id);
    if (!place) throw new Error("장소를 찾을 수 없습니다.");
    return place;
  }

  const res = await apiClient.get<ApiResponse<Place>>(`/places/${id}`);
  return res.data;
}
