'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.href = '/';
    } catch (err: unknown) {
      setError('로그인에 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#efe9df]">

      {/* 로그인 카드 */}
      <div className="relative w-full max-w-md px-6 sm:px-8">
        <div className="bg-[#faf8f4] rounded-[24px] shadow-lg overflow-hidden">

          <div className="px-6 sm:px-10 py-10 sm:py-12">
            {/* 타이틀 */}
            <div className="mb-8 text-center">
              {/* 3D 스타일 돋보기 아이콘 */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#d6cfc3] to-[#b8b0a2] flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e8e2d8] to-[#cdc5b8] flex items-center justify-center shadow-inner">
                    <svg className="w-7 h-7 text-[#5a5347]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="6" />
                      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                    </svg>
                  </div>
                </div>
              </div>

              <h1 className="text-[28px] font-black text-slate-950 tracking-tight leading-tight mb-2">
                여행 돋보기
              </h1>

              <p className="text-[#9b9488] text-sm">
                로그인하고 AI 리뷰 분석을 시작하세요
              </p>
            </div>

            {/* 에러 */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  이메일
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#e0dbd3] bg-white text-slate-900 placeholder-[#bbb5ab] focus:outline-none focus:border-[#a09888] focus:ring-2 focus:ring-[#d6cfc3]/40 transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#e0dbd3] bg-white text-slate-900 placeholder-[#bbb5ab] focus:outline-none focus:border-[#a09888] focus:ring-2 focus:ring-[#d6cfc3]/40 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3.5 mt-4 font-bold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-2xl transition-colors disabled:opacity-50 text-sm tracking-wide"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <p className="text-sm text-center text-[#9b9488] mt-4">
              아직 계정이 없으신가요?{' '}
              <a href="/signup" className="text-slate-900 font-bold hover:underline">
                회원가입
              </a>
            </p>

            {/* 소셜 로그인 */}
            <div className="space-y-2.5 mt-6">
              <button
                type="button"
                className="w-full px-4 py-3 border border-[#e0dbd3] bg-white hover:bg-[#f5f2ed] text-slate-900 rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                구글로 계속하기
              </button>

              <button
                type="button"
                className="w-full px-4 py-3 bg-[#FEE500] hover:bg-[#f5dc00] text-[#3C1E1E] rounded-2xl font-semibold text-sm transition-colors flex items-center justify-center gap-2.5"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="#3C1E1E">
                  <path d="M12 2C6.48 2 2 5.58 2 10c0 2.54 1.19 4.85 3.1 6.4L4.09 20l4.32-2.88c.56.11 1.14.17 1.73.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                </svg>
                카카오로 계속하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}