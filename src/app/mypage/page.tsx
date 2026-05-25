'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ═══ 디자인 시스템 토큰 ═══ */
const DS = {
  radius: '24px',
  radiusSm: '14px',
  border: '1px solid rgba(224,219,211,0.5)',
  borderHover: '1px solid #d4cfc6',
  shadow: '0 4px 16px rgba(0,0,0,0.04)',
  shadowHover: '0 20px 40px rgba(0,0,0,0.10)',
  cardBg: 'rgba(255,255,255,0.6)',
  cardBgHover: '#fff',
  transition: 'all 0.3s cubic-bezier(.22,.61,.36,1)',
};

/* ═══ 추천 장소 더미 데이터 ═══ */
interface RecommendedPlace {
  id: string;
  name: string;
  description: string;
  region: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  placeId: string;
  address: string;
}

const SEARCH_HISTORY_KEY = 'tripLens_searchHistory';
const MAX_HISTORY = 30;

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function scorePlace(place: RecommendedPlace, history: string[]): number {
  if (history.length === 0) return 0;
  let score = 0;
  const lowerHistory = history.map(h => h.toLowerCase());
  for (const tag of place.tags) {
    const lowerTag = tag.toLowerCase();
    for (let i = 0; i < lowerHistory.length; i++) {
      const h = lowerHistory[i];
      if (h.includes(lowerTag) || lowerTag.includes(h)) {
        score += (MAX_HISTORY - i);
      }
    }
  }
  const lowerRegion = place.region.toLowerCase();
  for (let i = 0; i < lowerHistory.length; i++) {
    if (lowerHistory[i].includes(lowerRegion) || lowerRegion.includes(lowerHistory[i])) {
      score += (MAX_HISTORY - i) * 2;
    }
  }
  const lowerName = place.name.toLowerCase();
  for (let i = 0; i < lowerHistory.length; i++) {
    if (lowerHistory[i].includes(lowerName) || lowerName.includes(lowerHistory[i])) {
      score += (MAX_HISTORY - i) * 3;
    }
  }
  return score;
}

const RECOMMENDED_PLACES: RecommendedPlace[] = [
  {
    id: '1', name: '감천문화마을', description: '알록달록 지붕이 만드는 부산의 마추픽추', region: '부산',
    tags: ['부산', '마을', '문화', '사진', '여행지', '관광', '포토스팟'], rating: 4.5, reviewCount: 2847,
    imageUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&h=400&fit=crop',
    placeId: 'ChIJgUbEo8cfqwcR-gZb6Y2r-cQ', address: '부산 사하구 감내2로 203',
  },
  {
    id: '2', name: '경복궁', description: '600년 역사가 숨 쉬는 조선의 첫 궁궐', region: '서울',
    tags: ['서울', '궁궐', '역사', '한복', '여행지', '관광', '전통'], rating: 4.7, reviewCount: 12503,
    imageUrl: '/images/gyeongbokgung.jpg',
    placeId: 'ChIJm7oRy-OYfDUR5PKrM5K9Rp0', address: '서울 종로구 사직로 161',
  },
  {
    id: '3', name: '월정리 해변', description: '에메랄드빛 바다와 하얀 모래의 제주 명소', region: '제주',
    tags: ['제주', '해변', '바다', '자연', '여행지', '해수욕장', '서핑'], rating: 4.4, reviewCount: 3291,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop',
    placeId: 'ChIJ4Z2fO8rrDDURzPR8g4K-5eQ', address: '제주 제주시 구좌읍 월정리',
  },
  {
    id: '4', name: '안동 하회마을', description: '낙동강이 감싸는 유네스코 세계유산 마을', region: '경북',
    tags: ['안동', '경북', '마을', '전통', '역사', '유네스코', '여행지'], rating: 4.6, reviewCount: 1876,
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
    placeId: 'ChIJ-0kFUH6jfzUR4hLGEjq5mQo', address: '경북 안동시 풍천면 하회종가길 40',
  },
  {
    id: '5', name: '남이섬', description: '사계절 드라마처럼 펼쳐지는 자연 속 섬', region: '강원',
    tags: ['강원', '춘천', '자연', '섬', '드라마', '여행지', '데이트'], rating: 4.3, reviewCount: 5420,
    imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&h=400&fit=crop',
    placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4', address: '강원 춘천시 남산면 남이섬길 1',
  },
  {
    id: '6', name: '전주 한옥마을', description: '전통과 트렌드가 공존하는 한옥 거리', region: '전북',
    tags: ['전주', '전북', '한옥', '맛집', '전통', '비빔밥', '여행지'], rating: 4.4, reviewCount: 8763,
    imageUrl: '/images/jeonju_hanok.jpg',
    placeId: 'ChIJnUsfH2ZdYTURWJP4xBT9HwQ', address: '전북 전주시 완산구 기린대로 99',
  },
  {
    id: '7', name: '해운대 해수욕장', description: '도심 속 활기 넘치는 부산 대표 해변', region: '부산',
    tags: ['부산', '해변', '바다', '해수욕장', '여행지', '관광', '야경'], rating: 4.3, reviewCount: 15230,
    imageUrl: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=600&h=400&fit=crop',
    placeId: 'ChIJHaeunYKefDURtMJoiRpPbF0', address: '부산 해운대구 해운대해변로 264',
  },
  {
    id: '8', name: '북촌 한옥마을', description: '서울 도심에서 만나는 600년 한옥 골목', region: '서울',
    tags: ['서울', '한옥', '전통', '사진', '포토스팟', '관광', '골목'], rating: 4.5, reviewCount: 9841,
    imageUrl: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=600&h=400&fit=crop',
    placeId: 'ChIJBwWajuCYfDUR3PKrM8K2Abc', address: '서울 종로구 계동길 37',
  },
  {
    id: '9', name: '성산일출봉', description: '제주 동쪽 끝 장엄한 일출의 성지', region: '제주',
    tags: ['제주', '자연', '등산', '일출', '유네스코', '화산', '여행지'], rating: 4.6, reviewCount: 7654,
    imageUrl: 'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=600&h=400&fit=crop',
    placeId: 'ChIJQRyLrMrrDDURoCj2g6a8Xw0', address: '제주 서귀포시 성산읍 성산리',
  },
  {
    id: '10', name: '광장시장', description: '서울 한복판 활기 넘치는 전통 먹거리 천국', region: '서울',
    tags: ['서울', '맛집', '시장', '먹거리', '전통', '야시장', '길거리음식'], rating: 4.2, reviewCount: 6312,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop',
    placeId: 'ChIJuwtkpLiYfDURZhHmAl3p8Hc', address: '서울 종로구 창경궁로 88',
  },
  {
    id: '11', name: '속초 중앙시장', description: '동해 바다 향이 가득한 강원도 대표 시장', region: '강원',
    tags: ['강원', '속초', '맛집', '시장', '먹거리', '해산물', '여행지'], rating: 4.3, reviewCount: 4521,
    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    placeId: 'ChIJk6-FnN6kfDURdF91Lm2CAQs', address: '강원 속초시 중앙로 147번길 16',
  },
  {
    id: '12', name: '여수 밤바다', description: '노래처럼 낭만적인 남해안 야경 명소', region: '전남',
    tags: ['여수', '전남', '야경', '바다', '데이트', '낭만', '여행지'], rating: 4.5, reviewCount: 6890,
    imageUrl: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=600&h=400&fit=crop',
    placeId: 'ChIJE2vqOdxyZTUR4EGDaxKv3OQ', address: '전남 여수시 하멜로 50',
  },
];

/* ═══ 별점 렌더 ═══ */
function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;
  const stars: React.ReactElement[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) {
      stars.push(<svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>);
    } else if (i === full && hasHalf) {
      stars.push(<svg key={i} width="13" height="13" viewBox="0 0 24 24"><defs><linearGradient id={`half-${i}`}><stop offset="50%" stopColor="#f59e0b" /><stop offset="50%" stopColor="#d4d0c8" /></linearGradient></defs><path fill={`url(#half-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>);
    } else {
      stars.push(<svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#d4d0c8"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>);
    }
  }
  return <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>{stars}</div>;
}


export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [recommendedPlaces, setRecommendedPlaces] = useState<RecommendedPlace[]>([]);

  const [hoveredFav, setHoveredFav] = useState<number | null>(null);

  useEffect(() => {
    const history = getSearchHistory();
    if (history.length === 0) {
      const sorted = [...RECOMMENDED_PLACES].sort((a, b) => b.rating - a.rating).slice(0, 8);
      setRecommendedPlaces(sorted);
    } else {
      const scored = RECOMMENDED_PLACES.map(p => ({ place: p, score: scorePlace(p, history) }));
      scored.sort((a, b) => b.score - a.score || b.place.rating - a.place.rating);
      setRecommendedPlaces(scored.map(s => s.place).slice(0, 8));
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) { router.push('/login'); return; }
      setEmail(user.email ?? '');
      const date = new Date(user.created_at);
      setJoinedAt(`${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`);
      fetch(`${API_URL}/favorites/${user.id}`)
        .then(r => r.json())
        .then(data => {
          const mapped = data.map((f: any) => ({
            name: f.places?.name ?? f.place_id,
            address: f.places?.address ?? "",
            placeId: f.place_id,
          }));
          setFavorites(mapped.slice(0, 4));
        })
        .catch(() => setFavorites([]))
        .finally(() => setIsLoading(false));
    });
  }, []);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowToast(true);
    setTimeout(() => { router.push("/"); }, 400);
  };

  const displayName = email ? email.split('@')[0] : '';
  // 이메일 마스킹
  const maskedEmail = (() => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 4) return local[0] + '****@' + domain;
    return local.slice(0, 4) + '****@' + domain;
  })();
  return (
    <div className="min-h-screen" style={{ background: '#f6f2eb' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hide-scroll::-webkit-scrollbar { display: none; }
        .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {showToast && (
        <div className="fixed inset-0 z-50 flex items-start pt-24 justify-center pointer-events-none">
          <div className="px-8 py-4 rounded-2xl shadow-lg bg-[#1e293b] text-[#faf8f4] text-base font-medium animate-fade-in">
            로그아웃되었습니다.
          </div>
        </div>
      )}

      {/* 헤더 */}
      <nav className="flex items-center p-6 px-12 border-b border-[#D7D3C8] bg-[#EFECE5]/80 backdrop-blur-md sticky top-0 z-50">
        <a href="/" className="text-2xl font-black tracking-tighter text-slate-900" style={{ textDecoration: 'none' }}>
          여행 돋보기
        </a>
      </nav>

      <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px 48px' }}>

        {/* ═══════════════════════════════════
            1. 프로필 헤더 — 존재감 + compact
            ═══════════════════════════════════ */}
        <section style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '44px',
          padding: '26px 30px',
          background: '#fff',
          borderRadius: DS.radius,
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: DS.shadow,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            {/* 아바타 — 화이트 링 + amber 포인트 */}
            <div style={{
              position: 'relative',
              width: '56px',
              height: '56px',
              flexShrink: 0,
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}>
                <svg style={{ width: '26px', height: '26px' }} fill="none" stroke="#f5f1ea" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              {/* 온라인 포인트 도트 */}
              <div style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#f59e0b',
                border: '2.5px solid #fff',
              }} />
            </div>
            {/* 텍스트 */}
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: '1.3', margin: 0 }}>
                {displayName}님, 오늘도 여행을 떠나볼까요?
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', margin: 0, letterSpacing: '0.2px' }}>
                {maskedEmail}
              </p>
            </div>
          </div>
          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: '1px solid #e8e4dc', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '99px',
              transition: DS.transition, color: '#94a3b8', fontSize: '13px', fontWeight: 600, flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#64748b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8e4dc'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 20H6a2 2 0 01-2-2V6a2 2 0 012-2h7" />
            </svg>
            로그아웃
          </button>
        </section>

        {/* ═══════════════════════════════════
            2. 즐겨찾기 — premium 카드 + 별 아이콘 + CTA
            ═══════════════════════════════════ */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: DS.radiusSm,
                background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg style={{ width: '16px', height: '16px' }} fill="#f59e0b" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>즐겨찾기</h2>
            </div>
            <button
              onClick={() => router.push('/favorites')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: 700, color: '#94a3b8',
                padding: '6px 10px', borderRadius: '8px', transition: DS.transition,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#1e293b'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; }}
            >
              전체보기
              <svg style={{ width: '14px', height: '14px' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', background: DS.cardBg, borderRadius: DS.radius, border: DS.border }}>
              장소를 불러오는 중...
            </div>
          ) : favorites.length > 0 ? (
            <div className="hide-scroll" style={{ display: 'flex', gap: '16px', padding: '4px 2px 12px', scrollSnapType: 'x mandatory' }}>
              {favorites.map((item, index) => {
                const isHov = hoveredFav === index;
                return (
                  <div
                    key={index}
                    onMouseEnter={() => setHoveredFav(index)}
                    onMouseLeave={() => setHoveredFav(null)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '200px',
                      maxWidth: '280px',
                      overflow: 'hidden',
                      scrollSnapAlign: 'start',
                      padding: '24px',
                      background: isHov ? DS.cardBgHover : DS.cardBg,
                      borderRadius: DS.radius,
                      border: isHov ? DS.borderHover : DS.border,
                      cursor: 'pointer',
                      transition: DS.transition,
                      transform: isHov ? 'translateY(-5px)' : 'translateY(0)',
                      boxShadow: isHov ? DS.shadowHover : DS.shadow,
                      animation: `fadeInUp 0.4s ease ${index * 0.06}s both`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      position: 'relative',
                    }}
                    onClick={() => router.push(`/review?q=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.placeId)}&address=${encodeURIComponent(item.address)}&from=mypage`)}
                  >
                    {/* 우측 상단 채워진 별 아이콘 */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      transition: 'transform 0.3s ease',
                      transform: isHov ? 'scale(1.15) rotate(15deg)' : 'scale(1) rotate(0deg)',
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" style={{ filter: 'drop-shadow(0 1px 3px rgba(245,158,11,0.3))' }}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>

                    {/* 핀 아이콘 + 장소 정보 */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingRight: '28px' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: DS.radiusSm,
                        background: isHov ? '#1e293b' : '#f4f1ec',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: DS.transition, flexShrink: 0,
                      }}>
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke={isHov ? '#f59e0b' : '#9b9488'} strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.2px' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.address}
                        </div>
                      </div>
                    </div>

                    {/* CTA 버튼 — AI 리포트 보기 capsule */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        alignSelf: 'flex-start',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '99px',
                        background: isHov ? '#1e293b' : '#f4f1ec',
                        color: isHov ? '#fff' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        transition: DS.transition,
                        letterSpacing: '0.2px',
                      }}
                    >
                      <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      AI 리포트 보기
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '48px', textAlign: 'center', background: DS.cardBg, borderRadius: DS.radius, border: DS.border }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>☆</div>
              <p style={{ color: '#9b9488', fontSize: '14px', fontWeight: 500 }}>아직 저장된 장소가 없습니다</p>
              <button
                onClick={() => router.push('/')}
                style={{ marginTop: '16px', padding: '10px 24px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: '99px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: DS.transition }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                장소 검색하러 가기
              </button>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════
            3. 추천 장소 캐러셀 (기존 유지 + radius 통일)
            ═══════════════════════════════════ */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: DS.radiusSm,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
              }}>
                <svg style={{ width: '17px', height: '17px' }} fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>당신을 위한 추천 장소</h2>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            {canScrollLeft && (
              <button onClick={() => scroll('left')} aria-label="이전" style={{
                position: 'absolute', left: '-16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                width: '40px', height: '40px', borderRadius: '50%', border: DS.border,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)', transition: DS.transition,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                <svg width="16" height="16" fill="none" stroke="#1e293b" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            {canScrollRight && (
              <button onClick={() => scroll('right')} aria-label="다음" style={{
                position: 'absolute', right: '-16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                width: '40px', height: '40px', borderRadius: '50%', border: DS.border,
                background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.08)', transition: DS.transition,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}>
                <svg width="16" height="16" fill="none" stroke="#1e293b" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            )}

            <div ref={scrollRef} className="hide-scroll" style={{ display: 'flex', gap: '20px', overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '8px 4px 16px' }}>
              {recommendedPlaces.map((place, idx) => {
                const isHovered = hoveredCard === place.id;
                return (
                  <div
                    key={place.id}
                    onClick={() => router.push(`/review?q=${encodeURIComponent(place.name)}&id=${encodeURIComponent(place.placeId)}&address=${encodeURIComponent(place.address)}&from=mypage`)}
                    onMouseEnter={() => setHoveredCard(place.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      flex: '0 0 280px', scrollSnapAlign: 'start',
                      borderRadius: DS.radius, overflow: 'hidden',
                      background: '#fff', border: isHovered ? DS.borderHover : DS.border,
                      cursor: 'pointer', transition: DS.transition,
                      transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
                      boxShadow: isHovered ? DS.shadowHover : DS.shadow,
                      animation: `fadeInUp 0.5s ease ${idx * 0.07}s both`,
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
                      <img src={place.imageUrl} alt={place.name} loading="lazy" style={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1)',
                        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                      }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px', background: 'linear-gradient(to top, rgba(0,0,0,0.35), transparent)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: '14px', left: '14px', padding: '5px 12px', borderRadius: '99px', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)', fontSize: '11px', fontWeight: 700, color: '#1e293b', letterSpacing: '0.3px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                        {place.region}
                      </div>
                      {place.reviewCount >= 5000 && (
                        <div style={{ position: 'absolute', top: '14px', right: '14px', padding: '5px 10px', borderRadius: '99px', background: 'rgba(245,158,11,0.90)', backdropFilter: 'blur(6px)', fontSize: '10px', fontWeight: 800, color: '#fff', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          인기
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '18px 20px 20px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.2px' }}>{place.name}</h3>
                      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.45', marginBottom: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{place.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <StarRating rating={place.rating} />
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{place.rating}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>리뷰 {place.reviewCount.toLocaleString()}개</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid #e0dbd3', background: 'rgba(250,248,244,0.5)', padding: '32px 0', marginTop: '48px' }}>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#9b9488' }}>© 2026 캡스톤디자인 3조 코더사이저</div>
      </footer>
    </div>
  );
}