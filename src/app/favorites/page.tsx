"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
import { Star, MapPin, Trash2, Check, Search, RotateCcw, Compass, Plane, Globe } from "lucide-react";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"latest" | "name">("latest");
  const [userId, setUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; lastItem: any | null }>({
    visible: false,
    lastItem: null
  });

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
          .catch(() => {
            const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
            setFavorites(saved);
          })
          .finally(() => setIsLoading(false));
      } else {
        const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
        setFavorites(saved);
        setIsLoading(false);
      }
    });
  }, []);

  const sortedFavorites = useMemo(() => {
    let result = [...favorites];
    if (sortBy === "name") {
      result.sort((a, b) => {
        const nameA = typeof a === "string" ? a : a.name;
        const nameB = typeof b === "string" ? b : b.name;
        return nameA.localeCompare(nameB, "ko");
      });
    } else {
      result.reverse();
    }
    return result;
  }, [favorites, sortBy]);

  const handleDelete = (item: any) => {
    const targetName = typeof item === "string" ? item : item.name;
    const updated = favorites.filter((f) => (typeof f === "string" ? f : f.name) !== targetName);
    setToast({ visible: true, lastItem: item });
    setFavorites(updated);
    if (userId && item.placeId) {
      fetch(`${API_URL}/favorites/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, place_id: item.placeId }),
      });
    } else {
      localStorage.setItem("favorites", JSON.stringify(updated));
    }
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

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
    } else {
      localStorage.setItem("favorites", JSON.stringify(restored));
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

      <header className="bg-[#FEFDFC]/80 backdrop-blur-md border-b border-[#F2F1EC] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 grid grid-cols-3 items-center">
          
          {/* 왼쪽: 로고 + 툴팁 토스트 */}
          <div className="flex justify-start">
            <div className="relative group/logo">
              <Link href="/" className="flex items-center gap-2 transition-transform active:scale-95">
                <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover/logo:rotate-6 transition-transform">
                  <Search size={18} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-lg font-black tracking-tighter text-slate-900">
                  여행 <span className="text-[#9D8F7B]">돋보기</span>
                </span>
              </Link>
              
              {/* 로고 마우스 오버 시 나타나는 토스트 */}
              <div className="absolute top-full left-0 mt-3 px-4 py-2 bg-slate-900 text-white text-[12px] font-bold rounded-xl shadow-2xl opacity-0 invisible group-hover/logo:opacity-100 group-hover/logo:visible transition-all duration-300 translate-y-2 group-hover/logo:translate-y-0 z-[100] whitespace-nowrap flex items-center gap-2.5 pointer-events-none">
                <Compass size={14} className="text-sky-400 group-hover/logo:animate-spin" strokeWidth={2.5} />
                메인 페이지로 이동합니다.
                <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9D8F7B] text-white">
                <Check size={9} strokeWidth={4} />
              </div>
              <span className="text-[11px] font-extrabold text-[#9D8F7B] tracking-widest uppercase">My Collection</span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tighter">즐겨찾기 목록</h1>
          </div>

          <div className="flex justify-end items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#F2F1EC] shadow-sm shrink-0">
              <Star size={16} className="fill-amber-400 text-amber-500" />
              <span className="text-sm font-bold text-slate-700">즐겨찾기 : {favorites.length}개</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 lg:p-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 bg-[#FEFDFC] rounded-[48px] border border-[#F2F1EC] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 overflow-hidden">
              <div className="absolute top-0 h-full w-24 bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-scan" />
            </div>
            
            <div className="relative mb-10">
              <div className="absolute inset-0 rounded-full border-4 border-[#9D8F7B]/20 animate-pulse-ring" />
              <div className="absolute inset-0 rounded-full border-4 border-[#9D8F7B]/10 animate-pulse-ring delay-700" />
              <div className="w-24 h-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl relative z-10 rotate-3 overflow-hidden">
                <Globe size={40} className="text-white animate-globe" />
              </div>
              <Plane size={24} className="text-[#9D8F7B] absolute -right-12 -top-4 animate-plane" />
            </div>

            <div className="space-y-4 text-center px-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F9F7F2] rounded-full border border-[#F2F1EC]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9D8F7B] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9D8F7B]"></span>
                </span>
                <span className="text-[12px] font-black text-[#9D8F7B] uppercase tracking-wider">“당신의 공간으로 향하는 여정, 설레는 마음과 함께 걷고 있습니다.”</span>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">여행의 기록을 연결하는 중</h2>
                <p className="text-slate-400 font-medium">당신이 찜한 소중한 장소들을 안전하게 불러오고 있어요.</p>
              </div>
            </div>

            <div className="mt-12 w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-[#F2F1EC]">
              <div className="h-full bg-slate-900 w-1/3 rounded-full animate-[scan_1.5s_infinite_ease-in-out]" />
            </div>
          </div>
        ) : (
          <>
            {favorites.length > 0 && (
              <div className="flex justify-center mb-10">
                <div className="flex items-center bg-white border border-[#F2F1EC] rounded-full p-1.5 shadow-sm">
                  <button onClick={() => setSortBy("latest")} className={`px-6 py-2 rounded-full text-[13px] font-black transition-all ${sortBy === "latest" ? "bg-slate-800 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}>최신순</button>
                  <button onClick={() => setSortBy("name")} className={`px-6 py-2 rounded-full text-[13px] font-black transition-all ${sortBy === "name" ? "bg-slate-800 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}>가나다순</button>
                </div>
              </div>
            )}

            {favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 bg-[#FEFDFC] rounded-[40px] border border-[#F2F1EC] shadow-sm">
                <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
                  <Star size={40} className="text-[#D1CFC8]" />
                </div>
                <p className="text-xl font-bold text-slate-400">아직 저장된 장소가 없어요.</p>
                <Link href="/" className="mt-8 bg-slate-800 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-900 transition-transform hover:scale-105">장소 검색하러 가기</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedFavorites.map((item, index) => {
                  const name = typeof item === "string" ? item : item.name;
                  const address = (typeof item === "object" && item.address) ? item.address : "주소 정보가 없습니다.";
                  return (
                    <div key={index} className="group bg-[#FEFDFC] p-8 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-[#F2F1EC] hover:shadow-[0_25px_50px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden hover:-translate-y-2 active:scale-[0.98]">
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#F9F7F2] rounded-full group-hover:scale-[3.5] transition-transform duration-700 ease-in-out opacity-50" />
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2.5 bg-[#F9F7F2] rounded-2xl text-[#9D8F7B] group-hover:bg-slate-800 group-hover:text-white transition-all"><MapPin size={20} /></div>
                          <button onClick={() => handleDelete(item)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{name}</h3>
                        <p className="text-[14px] text-slate-400 font-medium line-clamp-2 min-h-[40px]">{address}</p>
                      </div>
                      <div className="mt-10 relative z-10">
                        <Link href={`/review?q=${encodeURIComponent(name)}&id=${encodeURIComponent(typeof item === "object" && item.placeId ? item.placeId : "")}&address=${encodeURIComponent(address)}&from=favorites`} className="w-full bg-slate-800 text-white py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center hover:bg-slate-950 transition-all">상세 분석 리포트 보기</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

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
