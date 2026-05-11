'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MyPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [joinedAt, setJoinedAt] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user;
      if (!user) { router.push('/login'); return; }
      setEmail(user.email ?? '');
      const date = new Date(user.created_at);
      setJoinedAt(
        `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
      );
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowToast(true);
    setTimeout(() => { router.push("/"); }, 400);
  };
  return (
    <div className="min-h-screen" style={{ background: '#f6f2eb' }}>
      {/* 로그아웃 토스트 */}
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

      {/* 메인 콘텐츠 */}
      <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px 48px' }}>
        {/* 페이지 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="white" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#020617' }}>My Page</h1>
        </div>
        {/* 프로필 영역 */}
        <section style={{ marginBottom: '32px' }}>
          <div style={{
            background: 'transparent',
            borderRadius: '24px',
            padding: '24px 24px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}>
              {/* 프로필 아이콘 */}
              <div style={{
                width: '82px',
                height: '82px',
                borderRadius: '50%',
                background: 'linear-gradient(to bottom right, #b7aea0, #978d7f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                marginBottom: '16px'
              }}>
                <svg
                  style={{ width: '42px', height: '42px' }}
                  fill="none"
                  stroke="#f5f1ea"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>

              {/* 닉네임 */}
              <h2 style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#020617',
                marginBottom: '6px'
              }}>
                {email.split('@')[0]}
              </h2>

              {/* 이메일 */}
              <p style={{
                color: '#475569',
                fontWeight: 500,
                marginBottom: '8px',
                fontSize: '15px'
              }}>
                {email}
              </p>

              {/* 가입일 */}
              <p style={{
                fontSize: '14px',
                color: '#9b9488',
                letterSpacing: '0.3px'
              }}>
                가입일 {joinedAt}
              </p>
            </div>
          </div>
        </section>

        {/* 즐겨찾기 이동 버튼 섹션 */}
        <section style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/favorites')}
            style={{
              width: '100%',
              padding: '18px 22px',
              background: '#faf8f4',
              borderRadius: '20px',
              border: '1px solid #e0dbd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg
                  style={{ width: '24px', height: '24px' }}
                  fill="#f59e0b"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#020617' }}>내 즐겨찾기</div>
                <div style={{ fontSize: '14px', color: '#9b9488' }}>저장한 항목들을 확인해보세요</div>
              </div>
            </div>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="#9b9488" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* 로그아웃 */}
        <section>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '18px 22px',
              background: '#faf8f4',
              borderRadius: '20px',
              border: '1px solid #e0dbd3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

              {/* 아이콘 */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#fce8e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg
                  style={{ width: '22px', height: '22px' }}
                  fill="none"
                  stroke="#c24135"
                  strokeWidth={2.2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H9"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 20H6a2 2 0 01-2-2V6a2 2 0 012-2h7"
                  />
                </svg>
              </div>

              {/* 텍스트 */}
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#020617'
                }}>
                  로그아웃
                </div>

                <div style={{
                  fontSize: '14px',
                  color: '#9b9488'
                }}>
                  안전하게 로그아웃합니다
                </div>
              </div>
            </div>

            {/* 화살표 */}
            <svg
              style={{ width: '20px', height: '20px' }}
              fill="none"
              stroke="#9b9488"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </section>
      </main>

      {/* 푸터 */}
      <footer style={{
        borderTop: '1px solid #e0dbd3',
        background: 'rgba(250,248,244,0.5)',
        padding: '32px 0',
        marginTop: '48px'
      }}>
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#9b9488' }}>
          © 2026 캡스톤디자인 3조 코더사이저
        </div>
      </footer>
    </div>
  );
}
