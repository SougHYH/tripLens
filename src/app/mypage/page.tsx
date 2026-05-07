'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: '#efe9df' }}>
      {/* 헤더 */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(250,248,244,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e0dbd3'
      }}>
        <div style={{
          maxWidth: '1152px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#020617' }}>My Page</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a href="/" style={{
              padding: '8px 16px',
              color: '#9b9488',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}>
              홈으로
            </a>
            <button style={{
              padding: '8px 16px',
              background: '#1e293b',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '32px 24px 48px' }}>
        {/* 프로필 영역 */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{
            background: '#faf8f4',
            borderRadius: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            border: '1px solid #e0dbd3',
            padding: '32px'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              gap: '24px'
            }}>
              {/* 프로필 아이콘 */}
              <div style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                background: 'linear-gradient(to bottom right, #d6cfc3, #b8b0a2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                flexShrink: 0
              }}>
                <svg style={{ width: '48px', height: '48px' }} fill="none" stroke="#5a5347" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              {/* 프로필 정보 */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#020617', marginBottom: '8px' }}>
                  User Profile
                </h2>
                <p style={{ color: '#334155', fontWeight: 500, marginBottom: '16px' }}>
                  example@email.com
                </p>
                <p style={{ fontSize: '14px', color: '#9b9488', marginBottom: '24px' }}>
                  계정이 2026년부터 활성화되어 있습니다
                </p>
              </div>

              {/* 상태 배지 */}
              <div style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f0fdf4',
                borderRadius: '16px',
                border: '1px solid #bbf7d0'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#dcfce7',
                  color: '#166534'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    background: '#16a34a',
                    borderRadius: '50%',
                    marginRight: '6px'
                  }} />
                  활성 회원
                </span>
                <p style={{ fontSize: '12px', color: '#15803d', fontWeight: 500 }}>
                  정상 이용 중
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 즐겨찾기 이동 버튼 섹션 */}
        <section style={{ marginBottom: '48px' }}>
          <button
            onClick={() => router.push('/favorites')}
            style={{
              width: '100%',
              padding: '24px',
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
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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
          <button style={{
            width: '100%',
            padding: '16px 24px',
            background: '#fef2f2',
            color: '#dc2626',
            fontWeight: 600,
            borderRadius: '16px',
            border: '1px solid #fecaca',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background 0.2s'
          }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
          >
            로그아웃
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
