'use client';

import { useEffect, useState } from "react";


export default function MyPage() {

  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(saved);
  }, []);

  const handleDelete = (item: string) => {
    const updated = favorites.filter((f) => f !== item);
    localStorage.setItem("favorites", JSON.stringify(updated));
    setFavorites(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">

      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <h1 className="text-xl font-bold text-slate-900">My Page</h1>
          </div>

          <div className="flex items-center gap-3">
            <a href="/" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm">
              홈으로
            </a>

            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* 프로필 */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  User Profile
                </h2>

                <p className="text-slate-600 font-medium mb-4">
                  example@email.com
                </p>

                <p className="text-sm text-slate-500 mb-6">
                  계정이 2026년부터 활성화되어 있습니다
                </p>

                <button className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-medium text-sm transition-colors">
                  프로필 수정
                </button>
              </div>

              <div className="inline-flex flex-col items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5" />
                  활성 회원
                </span>
                <p className="text-xs text-green-700 font-medium">
                  정상 이용 중
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 새로 추가된 즐겨찾기 버튼 */}
        <section className="mb-12">
          <a
            href="/favorites"
            className="block bg-white rounded-2xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  ⭐ 즐겨찾기
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  당신이 원하는 모든 장소들을 확인해보세요
                </p>
              </div>

              <div className="text-blue-500 font-semibold">
                이동 →
              </div>
            </div>
          </a>
        </section>

        {/* 내 활동 */}
        <section className="mb-12">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">내 활동</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
              <h4 className="font-semibold">최근 본 장소</h4>
              <p className="text-3xl font-bold mt-2">12</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
              <h4 className="font-semibold">즐겨찾기</h4>
              <p className="text-3xl font-bold mt-2">{favorites.length}</p>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6">
              <h4 className="font-semibold">AI 질문</h4>
              <p className="text-3xl font-bold mt-2">24</p>
            </div>
          </div>
        </section>

        {/* 로그아웃 */}
        <section>
          <button className="w-full px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl border border-red-200">
            로그아웃
          </button>
        </section>

      </main>

      <footer className="border-t border-slate-200 bg-white/50 py-8 mt-12">
        <div className="text-center text-sm text-slate-600">
          © 2026
        </div>
      </footer>
    </div>
  );
}