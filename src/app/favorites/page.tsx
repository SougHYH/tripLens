'use client';

import { useEffect, useState } from "react";

export default function FavoritesPage() {

  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    let saved = JSON.parse(localStorage.getItem("favorites") || "[]");

    // 더미 데이터
    if (saved.length === 0) {
      saved = ["명지대 더미 카페", "용인 더미 치킨", "수원 닭발", "용인 명지대 라멘집"];
      localStorage.setItem("favorites", JSON.stringify(saved));
    }

    setFavorites(saved);
  }, []);

  // 문자열 + 객체 둘 다 삭제 가능
  const handleDelete = (target: any) => {
    const updated = favorites.filter((f: any) => {
      const a = typeof f === "string" ? f : f.name;
      const b = typeof target === "string" ? target : target.name;
      return a !== b;
    });

    localStorage.setItem("favorites", JSON.stringify(updated));
    setFavorites(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">

      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              ⭐
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              즐겨찾기한 장소들
            </h1>
          </div>

          <a
            href="/mypage"
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
          >
            마이페이지로
          </a>

        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <h2 className="text-3xl font-bold text-slate-900 mb-10">
          ⭐ 내 즐겨찾기
        </h2>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-10 text-center">
            <p className="text-slate-500 text-lg">
              아직 즐겨찾기한 장소가 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {favorites.map((item: any, index: number) => {

              // 문자열이면 객체로 변환
              const data =
                typeof item === "string"
                  ? { name: item, address: "" }
                  : item;

              return (
                <div
                  key={data.name + index}
                  className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition-all"
                >

                  {/* 이름 */}
                  <p className="font-bold text-lg text-slate-800">
                    {data.name}
                  </p>

                  {/* 주소 */}
                  <p className="text-sm text-slate-400 mt-2">
                    {data.address || "주소 정보 없음"}
                  </p>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => handleDelete(item)}
                    className="mt-4 text-sm text-red-500 hover:text-red-600 font-semibold"
                  >
                    삭제
                  </button>

                </div>
              );
            })}

          </div>
        )}

      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-200 bg-white/50 py-8 mt-12">
        <div className="text-center text-sm text-slate-600">
          © 2026
        </div>
      </footer>
    </div>
  );
}