'use client';

import { useState, useEffect } from 'react';
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


export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [hoveredFav, setHoveredFav] = useState<number | null>(null);

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
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', marginBottom: 0, marginLeft: 0, marginRight: 0, letterSpacing: '0.2px' }}>
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

      </main>

      <footer style={{ borderTop: '1px solid #e0dbd3', background: 'rgba(250,248,244,0.5)', padding: '32px 0', marginTop: '48px' }}>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#9b9488' }}>© 2026 캡스톤디자인 3조 코더사이저</div>
      </footer>
    </div>
  );
}