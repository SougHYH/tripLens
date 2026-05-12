"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
import { Star, MapPin, Trash2, Check, RotateCcw, Plane, Globe } from "lucide-react";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "name">("latest");
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; lastItem: any | null }>({
    visible: false,
    lastItem: null
  });

  // 1. 초기 데이터 로드: 로그인 확인 후 서버(API)에서 데이터 호출
  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        fetch(`${API_URL}/favorites/${uid}`)
          .then((r) => r.json())
          .then((data) => {
            const mapped = data.map((f: any) => ({
              name: f.places?.name ?? f.place_id,
              address: f.places?.address ?? "",
              placeId: f.place_id,
            }));
            setFavorites(mapped);
          })
          .catch((err) => {
            console.error("데이터 로딩 실패:", err);
            setFavorites([]);
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  // 2. 정렬 기능
  const sortedFavorites = useMemo(() => {
    let result = [...favorites];
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name, "ko"));
    } else {
      result.reverse();
    }
    return result;
  }, [favorites, sortBy]);

  // 3. 삭제 기능: UI에서 먼저 제거 후 서버에 DELETE 요청
  const handleDelete = (item: any) => {
    const updated = favorites.filter((f) => f.placeId !== item.placeId);
    setToast({ visible: true, lastItem: item });
    setFavorites(updated);

    if (userId && item.placeId) {
      fetch(`${API_URL}/favorites/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, place_id: item.placeId }),
      });
    }
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // 4. 실행 취소(복구): UI에 다시 추가 후 서버에 POST 요청
  const handleUndo = () => {
    if (!toast.lastItem) return;
    const restored = [...favorites, toast.lastItem];
    setFavorites(restored);

    if (userId && toast.lastItem.placeId) {
      fetch(`${API_URL}/favorites/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, place_id: toast.lastItem.placeId }),
      });
    }
    setToast({ visible: false, lastItem: null });
  };

  return (
    <div className="min-h-screen bg-[#EFECE5] text-slate-950 font-sans tracking-tight">
      <style>{`
        @keyframes scan { 0% { left: -10%; opacity: 0; } 50% { opacity: 1; } 100% { left: 110%; opacity: 0; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
        @keyframes plane-fly { 0% { transform: translateX(-20px) translateY(0); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(300px) translateY(-100px); opacity: 0; } }
        @keyframes globe-rotate { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
        .animate-scan { animation: scan 2s linear infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-plane { animation: plane-fly 3s infinite ease-in-out; }
        .animate-globe { animation: globe-rotate 4s linear infinite; }
      `}</style>

      {/* 헤더: 여행 돋보기 로고 (마이페이지와 통일) */}
      <nav className="flex items-center p-6 px-12 border-b border-[#D7D3C8] bg-[#EFECE5]/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="text-2xl font-black tracking-tighter text-slate-900" style={{ textDecoration: 'none' }}>
          여행 돋보기
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto p-8 lg:p-12">
        {/* 중앙 제목 영역 */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9D8F7B] text-white">
              <Check size={9} strokeWidth={4} />
            </div>
            <span className="text-[11px] font-extrabold text-[#9D8F7B] tracking-widest uppercase">My Collection</span>
          </div>
          <h1 className="text-3xl font-black text-slate-950 tracking-tighter mb-4">즐겨찾기 목록</h1>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#F2F1EC] shadow-sm">
            <Star size={16} className="fill-amber-400 text-amber-500" />
            <span className="text-sm font-bold text-slate-700">즐겨찾기 : {favorites.length}개</span>
          </div>
        </div>

        {isLoading ? (
          /* 로딩 화면 */
          <div className="flex flex-col items-center justify-center py-40 bg-[#FEFDFC] rounded-[48px] border border-[#F2F1EC] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
              <div className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-scan" />
            </div>
            <div className="relative mb-10">
              <div className="absolute inset-0 rounded-full border-4 border-[#9D8F7B]/20 animate-pulse-ring" />
              <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl relative z-10 rotate-3 overflow-hidden">
                <Globe size={40} className="text-white animate-globe" />
              </div>
              <Plane size={24} className="text-[#9D8F7B] absolute -right-12 -top-4 animate-plane" />
            </div>
            <div className="space-y-4 text-center px-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">기록을 불러오고 있습니다</h2>
            </div>
          </div>
        ) : (
          <>
            {/* 정렬 버튼 */}
            {favorites.length > 0 && (
              <div className="flex justify-center mb-10">
                <div className="flex items-center bg-white border border-[#F2F1EC] rounded-full p-1.5 shadow-sm">
                  <button onClick={() => setSortBy("latest")} className={`px-6 py-2 rounded-full text-[13px] font-black transition-all ${sortBy === "latest" ? "bg-slate-800 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}>최신순</button>
                  <button onClick={() => setSortBy("name")} className={`px-6 py-2 rounded-full text-[13px] font-black transition-all ${sortBy === "name" ? "bg-slate-800 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}>가나다순</button>
                </div>
              </div>
            )}

            {/* 목록이 없을 때 */}
            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-[#FEFDFC] rounded-[40px] border border-[#F2F1EC] shadow-sm">
                <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
                  <Star size={40} className="text-[#D1CFC8]" />
                </div>
                <p className="text-xl font-bold text-slate-400">저장된 장소가 없습니다.</p>
                <Link href="/" className="mt-8 bg-slate-800 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-900">장소 검색하러 가기</Link>
              </div>
            ) : (
              /* 장소 카드 리스트 */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedFavorites.map((item, index) => (
                  <div key={index} className="group bg-[#FEFDFC] p-8 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-[#F2F1EC] hover:shadow-[0_25px_50px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden hover:-translate-y-2">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#F9F7F2] rounded-full group-hover:scale-[3.5] transition-transform duration-700 ease-in-out opacity-50" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-[#F9F7F2] rounded-2xl text-[#9D8F7B] group-hover:bg-slate-800 group-hover:text-white transition-all"><MapPin size={20} /></div>
                        <button onClick={() => handleDelete(item)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{item.name}</h3>
                      <p className="text-[14px] text-slate-400 font-medium line-clamp-2 min-h-[40px]">{item.address}</p>
                    </div>
                    <div className="mt-10 relative z-10">
                      <Link href={`/review?q=${encodeURIComponent(item.name)}&id=${encodeURIComponent(item.placeId)}&address=${encodeURIComponent(item.address)}&from=favorites`} className="w-full bg-slate-800 text-white py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center hover:bg-slate-950 transition-all">상세 분석 리포트 보기</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* 실행 취소 토스트 */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <span className="text-sm font-bold text-red-400">삭제되었습니다.</span>
          <button onClick={handleUndo} className="flex items-center gap-1.5 text-blue-400 font-black text-sm uppercase"><RotateCcw size={14} /> 실행취소</button>
        </div>
      </div>

      <footer className="max-w-6xl mx-auto px-8 py-12 text-center opacity-60">
        <p className="text-[13px] font-bold text-[#9D8F7B] uppercase tracking-widest">Travel Lens • Archive</p>
      </footer>
    </div>
  );
}
