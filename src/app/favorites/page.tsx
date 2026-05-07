"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Star, MapPin, Trash2, ArrowLeft, Check, Search, X, RotateCcw, ChevronDown, ListFilter } from "lucide-react";

/** 
 * 초성 추출 함수 (ㄱㄴㄷ 검색 지원)
 */
const getChosung = (str: string) => {
  const cho = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) result += cho[Math.floor(code / 588)];
    else result += str.charAt(i);
  }
  return result;
};

/** 
 * [B] 하이라이트 컴포넌트: 갈색톤(#9D8F7B) 배경 적용
 */
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>;
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() 
          ? <span key={i} className="text-white bg-[#9D8F7B] px-1 rounded-md mx-0.5">{part}</span> 
          : part
      )}
    </>
  );
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "name">("latest");
  // [추가] 삭제 알림 및 실행 취소 데이터 관리
  const [toast, setToast] = useState<{ visible: boolean; lastItem: any | null }>({
    visible: false,
    lastItem: null
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
    setFavorites(saved);
  }, []);

  const filteredFavorites = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = [...favorites];

    if (query) {
      result = result.filter((item) => {
        const name = (typeof item === "string" ? item : item.name).toLowerCase();
        const chosung = getChosung(name);
        return name.includes(query) || chosung.includes(query);
      });
    }

    // 정렬 로직 적용
    if (sortBy === "name") {
      result.sort((a, b) => {
        const nameA = typeof a === "string" ? a : a.name;
        const nameB = typeof b === "string" ? b : b.name;
        return nameA.localeCompare(nameB, "ko");
      });
    } else {
      result.reverse(); // 최신순 (역순)
    }

    return result;
  }, [favorites, searchQuery, sortBy]);

  const handleDelete = (item: any) => {
    const targetName = typeof item === "string" ? item : item.name;
    const updated = favorites.filter((f) => (typeof f === "string" ? f : f.name) !== targetName);
    
    setToast({ visible: true, lastItem: item });
    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));

    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // [A] 삭제 취소 (Undo) 기능
  const handleUndo = () => {
    if (!toast.lastItem) return;
    const restored = [...favorites, toast.lastItem];
    setFavorites(restored);
    localStorage.setItem("favorites", JSON.stringify(restored));
    setToast({ visible: false, lastItem: null });
  };

  return (
    <div className="min-h-screen bg-[#EFECE5] text-slate-950 font-sans tracking-tight">
      <header className="bg-[#FEFDFC]/80 backdrop-blur-md border-b border-[#F2F1EC] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-[#F2F1EC] rounded-full transition-colors">
              <ArrowLeft size={24} className="text-slate-600" />
            </Link>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9D8F7B] text-white">
                  <Check size={9} strokeWidth={4} />
                </div>
                <span className="text-[11px] font-extrabold text-[#9D8F7B] tracking-widest uppercase">My Collection</span>
              </div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tighter">즐겨찾기 목록</h1>
            </div>
          </div>

          <div className="flex-1 max-w-md relative group mx-4 hidden md:block">
            <div className={`
              flex items-center w-full px-5 py-2.5 rounded-2xl transition-all duration-300
              ${searchQuery 
                ? 'bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] border-slate-900/10 scale-[1.02]' 
                : 'bg-[#F2F1EC]/80 border-transparent hover:bg-white hover:shadow-lg focus-within:bg-white focus-within:shadow-xl focus-within:scale-[1.02]'}
              border-2 focus-within:border-slate-950/5
            `}>
              <Search 
                size={18} 
                className={`transition-colors duration-300 ${searchQuery ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600"}`} 
              />
              <input 
                type="text"
                placeholder="원하는 장소를 찾아보세요."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full ml-3 text-[15px] font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-medium"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="ml-2 p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 정렬 버튼이 헤더에서 삭제되었습니다. */}
            
            {favorites.length > 0 && (
              <div className="relative group/tooltip shrink-0">
                <Link href="/" className="bg-slate-800 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-900 transition-all block">
                  + 장소 추가
                </Link>
                <div className="absolute top-full right-0 mt-3 w-64 p-4 bg-slate-900 text-white text-[13px] rounded-2xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 translate-y-2 group-hover/tooltip:translate-y-0 z-[100] pointer-events-none">
                  <div className="flex gap-2">
                    <Star size={14} className="text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">상세 페이지에서 <span className="text-amber-400 font-bold">별 아이콘</span>을 누르면 저장됩니다!</p>
                  </div>
                  <div className="absolute -top-1 right-6 w-3 h-3 bg-slate-900 rotate-45" />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-[#F2F1EC] shadow-sm shrink-0">
              <Star size={16} className="fill-amber-400 text-amber-500" />
              <span className="text-sm font-bold text-slate-700">{favorites.length}개</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 lg:p-12">
        {/* [위치 조정] 장소추가 밑 블록 느낌으로 정렬 버튼 배치 */}
        {favorites.length > 0 && (
          <div className="flex justify-center mb-10">
            <div className="flex items-center bg-white border border-[#F2F1EC] rounded-full p-1.5 shadow-sm">
              <button 
                onClick={() => setSortBy("latest")}
                className={`px-6 py-2 rounded-full text-[13px] font-black transition-all ${sortBy === "latest" ? "bg-slate-800 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}
              >
                최신순
              </button>
              <button 
                onClick={() => setSortBy("name")}
                className={`px-6 py-2 rounded-full text-[13px] font-black transition-all ${sortBy === "name" ? "bg-slate-800 text-white shadow-md scale-105" : "text-slate-400 hover:text-slate-600"}`}
              >
                가나다순
              </button>
            </div>
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#FEFDFC] rounded-[40px] border border-[#F2F1EC] shadow-sm">
            <div className="w-20 h-20 bg-[#F9F7F2] rounded-full flex items-center justify-center mb-6">
              <Star size={40} className="text-[#D1CFC8]" />
            </div>
            <p className="text-xl font-bold text-slate-400">아직 저장된 장소가 없어요.</p>
            <Link href="/" className="mt-8 bg-slate-800 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-900 transition-transform hover:scale-105">
              장소 검색하러 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredFavorites.map((item, index) => {
              const name = typeof item === "string" ? item : item.name;
              const address = (typeof item === "object" && item.address) ? item.address : "주소 정보가 없습니다.";

              return (
                <div key={index} className="group bg-[#FEFDFC] p-8 rounded-[32px] shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-[#F2F1EC] hover:shadow-[0_25px_50px_rgba(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between relative overflow-hidden hover:-translate-y-2 active:scale-[0.98]">
                  <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#F9F7F2] rounded-full group-hover:scale-[3.5] transition-transform duration-700 ease-in-out opacity-50" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2.5 bg-[#F9F7F2] rounded-2xl text-[#9D8F7B] group-hover:bg-slate-800 group-hover:text-white group-hover:rotate-12 transition-all duration-300">
                        <MapPin size={20} />
                      </div>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 hover:scale-110 active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight group-hover:text-slate-950 transition-colors duration-300">
                      <HighlightText text={name} query={searchQuery} />
                    </h3>
                    <p className="text-[14px] text-slate-400 font-medium line-clamp-2 min-h-[40px] group-hover:text-slate-600 transition-colors duration-300">
                      {address}
                    </p>
                  </div>
                  
                  <div className="mt-10 relative z-10">
                    <Link 
                      href={`/review?q=${encodeURIComponent(name)}&address=${encodeURIComponent(address)}`}
                      className="w-full bg-slate-800 text-white py-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2 hover:bg-slate-950 hover:gap-4 transition-all active:scale-[0.96] shadow-sm hover:shadow-lg"
                    >
                      상세 분석 리포트 보기
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 실행 취소(Undo) 토스트 알림창 */}
      <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ${toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trash2 size={16} className="text-red-400" />
            <span className="text-sm font-bold">삭제되었습니다.</span>
          </div>
          <div className="w-[1px] h-4 bg-white/20" />
          <button 
            onClick={handleUndo}
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors text-sm font-black uppercase tracking-tighter"
          >
            <RotateCcw size={14} />
            실행취소
          </button>
        </div>
      </div>

      <footer className="max-w-6xl mx-auto px-8 py-12 text-center">
        <p className="text-[13px] font-bold text-[#9D8F7B] uppercase tracking-widest opacity-60">
          Travel Lens • Archive
        </p>
      </footer>
    </div>
  );
}
