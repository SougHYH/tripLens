// lib/recentPlaces.ts

export type RecentPlace = {
  id: string;
  name: string;
  address: string;
  visitedAt: number;
};

const STORAGE_KEY_PREFIX = "travel-recent-places";
const MAX_ITEMS = 4;

/**
 * 사용자별 localStorage 키 생성
 * userId가 없으면 비로그인 공용 키 사용
 */
function getStorageKey(userId?: string): string {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

export function getRecentPlaces(userId?: string): RecentPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentPlace(
  place: Omit<RecentPlace, "visitedAt">,
  userId?: string
): void {
  const key = getStorageKey(userId);
  const list = getRecentPlaces(userId);
  // 중복 제거
  const filtered = list.filter((item) => item.id !== place.id);
  // 맨 앞에 추가
  filtered.unshift({ ...place, visitedAt: Date.now() });
  // 최대 4개 유지
  localStorage.setItem(key, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}