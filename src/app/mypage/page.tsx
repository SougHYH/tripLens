'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { Star, MapPin } from "lucide-react";
import { addRecentPlace } from "@/lib/recentPlaces";
import { getRecentPlaces, RecentPlace } from "@/lib/recentPlaces";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ═══ 디자인 시스템 토큰 ═══ */
const DS = {
  radius: '24px',
  radiusSm: '14px',
  border: '1px solid rgba(224,219,211,0.5)',
  borderHover: '1px solid #d4cfc6',
  shadow: '0 4px 16px rgba(0,0,0,0.04)',
  shadowHover: '0 20px 40px rgba(0,0,0,0.10)',
  cardBg: 'rgba(255,255,255,0.92)',
  cardBgHover: 'rgba(255,255,255,0.98)',
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
  const [recentPlaces, setRecentPlaces] = useState<RecentPlace[]>([]);
  const [hoveredRecent, setHoveredRecent] = useState<number | null>(null);

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
      setRecentPlaces(getRecentPlaces());
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
    <div className="min-h-screen bg-[#F0E8DE] text-slate-950 font-sans tracking-tight relative overflow-hidden flex flex-col">
      <style>{`
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .hide-scroll::-webkit-scrollbar { display: none; }
  .hide-scroll { -ms-overflow-style: none; scrollbar-width: none; }

  .map-paper {
    background:
      radial-gradient(circle at 18% 16%, rgba(255,255,255,0.74), transparent 28%),
      radial-gradient(circle at 82% 20%, rgba(221,183,150,0.34), transparent 30%),
      radial-gradient(circle at 68% 82%, rgba(97,126,110,0.16), transparent 32%),
      linear-gradient(135deg, #f6eee5 0%, #eadfd4 50%, #f5eadf 100%);
  }
  .lens {
    box-shadow:
      inset 10px 10px 26px rgba(92, 69, 57, 0.18),
      inset -10px -10px 22px rgba(255, 255, 255, 0.72),
      0 26px 70px rgba(72, 50, 42, 0.24);
  }
  .photo-rich {
    filter: saturate(1.13) contrast(1.07) brightness(0.98);
  }
`}</style>
      {/* ── 배경 레이어 시작 ── */}

      {/* 레이어1: 기본 그라데이션 배경 */}
      <div className="fixed inset-0 map-paper pointer-events-none" />

      {/* 레이어2: SVG 지도 패턴 */}
      <div className="fixed inset-0 pointer-events-none z-[1]">
        <svg className="w-full h-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="mainGrid" width="96" height="96" patternUnits="userSpaceOnUse">
              <path d="M 96 0 L 0 0 0 96" fill="none" stroke="#b9aaa0" strokeWidth="1.4" opacity="0.46" />
            </pattern>
            <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#5b4136" floodOpacity="0.18" />
            </filter>
          </defs>
          <rect width="1600" height="1000" fill="url(#mainGrid)" />
          <g opacity="0.3" fill="none" stroke="#9a887d" strokeLinecap="round">
            <path d="M-70,110 C25,80 36,155 95,118 C145,88 154,40 220,58 C280,75 270,140 352,116" strokeWidth="2" />
            <path d="M-60,770 C38,720 80,832 160,778 C248,718 250,650 365,686 C445,710 452,805 560,760" strokeWidth="2" />
            <path d="M1280,36 C1362,112 1478,26 1532,92 C1590,165 1478,198 1538,250 C1592,298 1665,248 1692,330" strokeWidth="2" />
            <path d="M1215,870 C1305,815 1372,906 1448,850 C1520,796 1585,812 1668,748" strokeWidth="2" />
          </g>
          <g filter="url(#routeShadow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-70 235 C55 235 170 235 275 235 C365 235 420 290 420 380 C420 468 430 535 407 594 C386 648 356 674 316 692 C298 700 281 706 268 713 C210 734 172 782 118 806 C58 833 -2 860 -60 886" stroke="#9C877F" strokeWidth="16" />
            <path d="M460 104 C555 104 612 154 650 225 C684 288 716 353 752 415 C780 468 830 498 890 498 C970 498 1050 498 1125 498 C1180 498 1218 475 1248 430 C1278 386 1308 339 1338 294 C1376 236 1430 218 1496 218 C1560 218 1625 218 1690 218" stroke="#B88A62" strokeWidth="16" />
            <path d="M570 1010 C604 940 632 884 662 835 C690 780 732 752 792 752 C838 752 885 752 930 752 C985 752 1024 724 1048 675 C1068 633 1086 595 1106 560 C1136 500 1185 470 1252 470 C1302 470 1360 470 1410 470 C1505 470 1600 470 1690 470" stroke="#8C6F5A" strokeWidth="16" />
          </g>
          <g fill="#fffaf6" stroke="#3F2E2A" strokeWidth="7">
            <circle cx="420" cy="235" r="18" />
            <circle cx="268" cy="713" r="18" />
            <circle cx="1248" cy="430" r="18" />
            <circle cx="1410" cy="470" r="18" />
            <circle cx="1496" cy="218" r="18" />
            <circle cx="792" cy="752" r="18" />
          </g>
          <g opacity="0.24" stroke="#8c7b72" strokeWidth="2" fill="none">
            <path d="M235 130 H420 M235 130 V315" />
            <path d="M1250 105 H1455 M1455 105 V305" />
            <path d="M1125 835 C1185 800 1238 845 1294 812 C1356 776 1412 818 1470 790 C1528 762 1580 786 1645 748" />
            <path d="M1175 888 C1230 858 1286 902 1342 868 C1396 836 1448 872 1505 842 C1565 810 1618 834 1685 798" />
          </g>
        </svg>
      </div>

      {/* 레이어3: 별 장식 (데스크톱만) */}
      <div className="fixed inset-0 pointer-events-none z-[2] hidden lg:block">
        <Star size={152} className="absolute left-[6%] top-[32%] rotate-[-14deg] fill-[#D8A63A] text-[#B8861D] opacity-30 drop-shadow-[0_18px_34px_rgba(86,64,28,0.18)]" strokeWidth={1.35} />
        <Star size={124} className="absolute right-[15%] bottom-[15%] rotate-[10deg] fill-[#E7BE63] text-[#B8861D] opacity-28 drop-shadow-[0_18px_34px_rgba(86,64,28,0.16)]" strokeWidth={1.35} />
        <Star size={118} className="absolute left-[37%] bottom-[18%] rotate-[-8deg] fill-[#C89535] text-[#8C6F5A] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
        <Star size={194} className="absolute right-[32%] top-[19%] rotate-[18deg] fill-[#F0C969] text-[#B88A62] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
      </div>

      {/* 레이어4: 원형 사진 + 텍스트 장식 (데스크톱만) */}
      <div className="fixed inset-0 pointer-events-none z-[2] hidden lg:block">
        <div className="absolute left-[19%] top-[11%] h-64 w-64 rounded-full border-[10px] border-[#9C877F]/85 bg-white/16 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=700&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-[#f4e6dc]/12" />
        </div>
        <div className="absolute left-[16.8%] top-[42%] text-[72px] font-black tracking-tighter text-[#7e7773]/32">여행지</div>
        <div className="absolute left-[29.2%] top-[45%] flex h-20 w-20 items-center justify-center rounded-full bg-[#8C6F5A] shadow-[0_18px_45px_rgba(140,111,90,0.35)]">
          <MapPin size={38} className="text-white" strokeWidth={2.6} />
        </div>
        <div className="absolute right-[3.4%] top-[14%] h-[350px] w-[350px] rounded-full border-[16px] border-[#c4b0a5]/90 bg-white/16 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-84" />
          <div className="absolute inset-0 bg-[#f1ded3]/24" />
          <div className="absolute inset-[64px] rounded-full border-[16px] border-[#a98f87]/42 border-b-transparent" />
        </div>
        <div className="absolute right-[20%] top-[20%] text-[72px] font-black tracking-tighter text-[#7e7773]/32">호텔</div>
        <div className="absolute left-[46%] bottom-[4.5%] h-56 w-56 rounded-full border-[10px] border-[#c4b0a5]/90 bg-white/14 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-86" />
          <div className="absolute inset-0 bg-[#f4e6dc]/18" />
          <div className="absolute inset-[48px] rounded-full border-[12px] border-[#a98f87]/42 border-b-transparent" />
        </div>
        <div className="absolute left-[48.5%] bottom-[25%] text-[64px] font-black tracking-tighter text-[#7e7773]/30">식당</div>
        <div className="absolute right-[2%] top-[41%] h-24 w-24 rounded-full bg-[#9C877F]/36 blur-sm" />
        <div className="absolute left-[24%] bottom-[2%] h-28 w-28 rounded-full bg-[#9C877F]/26 blur-sm" />
      </div>

      {/* 레이어5: 오버레이 그라데이션 + 블러 */}
      <div className="fixed inset-0 pointer-events-none z-[3] bg-gradient-to-b from-[#F0E8DE]/85 via-[#F0E8DE]/70 to-[#F0E8DE]/85" />
      <div className="fixed left-1/2 top-[92px] z-[4] h-60 w-[760px] max-w-[92vw] -translate-x-1/2 rounded-full bg-[#f3ebe2]/72 blur-3xl pointer-events-none" />

      {/* ── 배경 레이어 끝 ── */}
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-start pt-24 justify-center pointer-events-none">
          <div className="px-8 py-4 rounded-2xl shadow-lg bg-[#1e293b] text-[#faf8f4] text-base font-medium animate-fade-in">
            로그아웃되었습니다.
          </div>
        </div>
      )}

      {/* 헤더 */}
      <nav className="flex items-center p-6 px-12 border-b border-[#EAE6DC] bg-[#FEFDFC]/90 backdrop-blur-md sticky top-0 z-50 shadow-[0_4px_24px_rgba(92,69,57,0.04)]">
        <a href="/" className="text-2xl font-black tracking-tighter text-slate-900" style={{ textDecoration: 'none' }}>
          여행 돋보기
        </a>
      </nav>

      <main className="relative z-10 flex-1" style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px 48px' }}>

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
          background: 'rgba(255,255,255,0.95)',
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
                fontSize: '13px', fontWeight: 700, color: '#1e293b',
                padding: '6px 10px', borderRadius: '8px', transition: DS.transition,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
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
                      padding: '28px',
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
                      gap: '20px',
                      position: 'relative',
                    }}
                    onClick={() => {
                      addRecentPlace({ id: item.placeId, name: item.name, address: item.address });
                      router.push(`/review?q=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.placeId)}&address=${encodeURIComponent(item.address)}&from=mypage`);
                    }}
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
            3. 최근 본 여행지 — 그라데이션 카드
            ═══════════════════════════════════ */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: DS.radiusSm,
                background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="#a5b4fc" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>최근 본 여행지</h2>
            </div>
          </div>

          {recentPlaces.length > 0 ? (
            <div className="hide-scroll" style={{ display: 'flex', gap: '16px', padding: '4px 2px 12px', overflowX: 'auto', scrollSnapType: 'x mandatory' }}>
              {recentPlaces.map((item, index) => {
                const isHov = hoveredRecent === index;

                // 장소 이름 기반 고유 색상 생성
                const hash = item.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                const gradients = [
                  ['#f0d9d9', '#e8c4c4'],
                  ['#e8d5df', '#ddc4d4'],
                  ['#ddd5e8', '#d0c4dd'],
                  ['#d5dde8', '#c4d0dd'],
                  ['#d5e5e0', '#c4d8d0'],
                  ['#e8ddd5', '#ddd0c4'],
                  ['#e5d5d9', '#d8c4cc'],
                  ['#ddd5d9', '#d0c8cc'],
                ];

                const [from, to] = gradients[hash % gradients.length];

                const emojis = ['🏛️', '🌊', '🏔️', '🌸', '🎡', '🏰', '⛩️', '🌅'];
                const emoji = emojis[hash % emojis.length];

                const timeAgo = (() => {
                  const diff = Date.now() - item.visitedAt;
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return '방금 전';
                  if (mins < 60) return `${mins}분 전`;
                  const hours = Math.floor(mins / 60);
                  if (hours < 24) return `${hours}시간 전`;
                  const days = Math.floor(hours / 24);
                  return `${days}일 전`;
                })();

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredRecent(index)}
                    onMouseLeave={() => setHoveredRecent(null)}
                    onClick={() => router.push(`/review?q=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.id)}&address=${encodeURIComponent(item.address)}&from=mypage`)}
                    style={{
                      flex: '1 1 0',
                      minWidth: '200px',
                      maxWidth: '280px',
                      borderRadius: '28px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: DS.transition,
                      transform: isHov ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                      boxShadow: isHov
                        ? '0 24px 48px rgba(0,0,0,0.15)'
                        : '0 8px 24px rgba(0,0,0,0.06)',
                      animation: `fadeInUp 0.4s ease ${index * 0.08}s both`,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    {/* 상단 그라데이션 영역 */}
                    <div style={{
                      position: 'relative',
                      height: '120px',
                      background: `linear-gradient(135deg, ${from}, ${to})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {/* 장식 원들 */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.15)',
                      }} />
                      <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '-10px',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                      }} />

                      {/* 이모지 */}
                      <span style={{
                        fontSize: '50px',
                        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                        transition: 'transform 0.4s ease',
                        transform: isHov ? 'scale(1.15) rotate(-5deg)' : 'scale(1) rotate(0deg)',
                      }}>
                        {emoji}
                      </span>

                      {/* 시간 태그 */}
                      <div style={{
                        position: 'absolute',
                        top: '14px',
                        right: '14px',
                        background: 'rgba(255,255,255,0.55)',
                        backdropFilter: 'blur(8px)',
                        color: '#5c4a42',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '99px',
                      }}>
                        {timeAgo}
                      </div>
                    </div>

                    {/* 하단 정보 영역 */}
                    <div style={{
                      padding: '16px 18px',
                      background: isHov ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.94)',
                      transition: DS.transition,
                    }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#0f172a',
                        letterSpacing: '-0.3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '6px',
                      }}>
                        {item.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '14px',
                      }}>
                        {item.address || '주소 정보 없음'}
                      </div>

                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '99px',
                        background: isHov ? '#1e293b' : '#f4f1ec',
                        color: isHov ? '#fff' : '#64748b',
                        fontSize: '12px',
                        fontWeight: 700,
                        transition: DS.transition,
                      }}>
                        <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        AI 리포트 보기
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.92)',
              borderRadius: DS.radius,
              border: DS.border,
              boxShadow: DS.shadow,
            }}>
              <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>🕐</div>
              <p style={{ color: '#9b9488', fontSize: '14px', fontWeight: 500 }}>최근 본 여행지가 없습니다</p>
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

      <footer className="relative z-10" style={{ borderTop: '1px solid #e0dbd3', background: 'rgba(250,248,244,0.5)', padding: '32px 0', marginTop: '48px' }}>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#9b9488' }}>© 2026 캡스톤디자인 3조 코더사이저</div>
      </footer>
    </div>
  );
}