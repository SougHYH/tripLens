'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;
      window.location.href = '/login';
    } catch (err: unknown) {
  console.error(err);

  if (err instanceof Error) {
    if (err.message.includes('User already registered')) {
      setError('이미 가입된 이메일입니다.');
    } else if (err.message.includes('Password')) {
      setError('비밀번호는 6자 이상이어야 합니다.');
    } else if (err.message.includes('Invalid email')) {
      setError('올바른 이메일 형식이 아닙니다.');
    } else {
      setError(err.message);
    }
  } else {
    setError('회원가입에 실패했습니다.');
  }
} finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#efe9df]">

      {/* 회원가입 카드 */}
      <div className="relative w-full max-w-md px-6 sm:px-8">
        <div className="bg-[#faf8f4] rounded-[24px] shadow-lg overflow-hidden">

          <div className="px-6 sm:px-10 py-10 sm:py-12">
            {/* 타이틀 */}
            <div className="mb-8 text-center">
              {/* 3D 스타일 돋보기 아이콘 */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5">
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
                회원가입하고 AI 리뷰 분석을 시작하세요
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

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full px-4 py-3.5 rounded-2xl border border-[#e0dbd3] bg-white text-slate-900 placeholder-[#bbb5ab] focus:outline-none focus:border-[#a09888] focus:ring-2 focus:ring-[#d6cfc3]/40 transition-all text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-3.5 mt-4 font-bold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-2xl transition-colors disabled:opacity-50 text-sm tracking-wide"
              >
                {isLoading ? '가입 중...' : '회원가입 완료'}
              </button>
            </form>

            <p className="text-sm text-center text-[#9b9488] mt-4">
              이미 계정이 있으신가요?{' '}
              <a href="/login" className="text-slate-900 font-bold hover:underline">
                로그인
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}