// lib/recentPlaces.ts

export type RecentPlace = {
  id: string;
  name: string;
  address: string;
  visitedAt: number;
};

const STORAGE_KEY = "travel-recent-places";
const MAX_ITEMS = 4;

export function getRecentPlaces(): RecentPlace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentPlace(place: Omit<RecentPlace, "visitedAt">): void {
  const list = getRecentPlaces();
  // 중복 제거
  const filtered = list.filter((item) => item.id !== place.id);
  // 맨 앞에 추가
  filtered.unshift({ ...place, visitedAt: Date.now() });
  // 최대 4개 유지
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}