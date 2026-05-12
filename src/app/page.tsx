"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Bed, Utensils } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/common/SearchBar";
import Link from "next/link";

const mapNodes = [
  {
    id: 1,
    type: "travel",
    labelText: "여행지",
    top: "57%",
    left: "44.7%",
    title: "AI 여행지 분석",
    description: "볼거리, 분위기, 교통편 등 여행객들의 생생한 리뷰를 요약해 드려요.",
    icon: <MapPin size="1.8vw" className="text-white" />,
    bgColor: "bg-blue-500",
  },
  {
    id: 2,
    type: "hotel",
    labelText: "호텔",
    top: "53%",
    left: "88%",
    title: "AI 숙소 요약",
    description: "청결도, 서비스, 부대시설 등 실제 투숙객의 핵심 평가만 모아보세요.",
    icon: <Bed size="1.8vw" className="text-white" />,
    bgColor: "bg-indigo-500",
  },
  {
    id: 3,
    type: "restaurant",
    labelText: "식당",
    top: "89%",
    left: "60.5%",
    title: "AI 맛집 검증",
    description: "맛, 웨이팅, 추천 메뉴 등 방문자들의 진짜 후기를 한눈에 파악하세요.",
    icon: <Utensils size="1.8vw" className="text-white" />,
    bgColor: "bg-orange-500",
  },
];

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  useEffect(() => {
    // 처음 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    // 로그인 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return (
    <main
      className="relative flex min-h-screen flex-col font-sans tracking-tight bg-[#EFECE5] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/map10.png')" }}
    >
      {showToast && (
        <div className="fixed inset-0 z-50 flex items-start pt-24 justify-center pointer-events-none">
          <div className="px-8 py-4 rounded-2xl shadow-lg bg-[#1e293b] text-[#faf8f4] text-base font-medium animate-fade-in">
            로그아웃되었습니다.
          </div>
        </div>
      )}

      

      {/* 네비게이션 */}
      <nav className="flex items-center justify-between p-6 px-12 border-b border-[#D7D3C8] bg-[#EFECE5]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter text-slate-900">
          여행 돋보기
        </div>

        <div className="flex items-center space-x-6 text-[13px] font-bold text-slate-500">
          {isLoggedIn ? (
            <>
              <Link
                href="/mypage"
                className="border-2 border-slate-900 px-5 py-2 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
              >
                MY PAGE
              </Link>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setIsLoggedIn(false);
                  setShowToast(true);
                  setTimeout(() => { setShowToast(false); }, 400);
                }}
                className="hover:text-red-500 transition-colors"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="border-2 border-slate-900 px-6 py-2 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
            >
              LOGIN
            </Link>
          )}
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <div className="relative flex-1 w-full flex justify-center items-center">
        <div 
          className="relative aspect-[16/9] w-full bg-center"
          style={{ 
            backgroundImage: "url('/images/map10.png')", 
            backgroundSize: '100% 100%', 
            height: 'calc(100vh - 80px)' 
          }}
        >

          {/* 스탬프 아이콘 */}
          <div className="absolute top-[81%] left-[86%] z-50 pointer-events-none opacity-40">
            <div className="relative flex items-center justify-center w-[8vw] h-[8vw] border-[0.4vw] border-slate-900/100 rounded-[1.5vw] rotate-[-12deg]">
              <div className="flex flex-col items-center gap-[0.2vw] text-slate-900/100 font-black">
                <Search className="w-[2.5vw] h-[2.5vw]" strokeWidth={4} />
                <div className="text-[0.9vw] tracking-tighter leading-tight text-center uppercase">
                  AI 장소 리뷰<br />
                  분석 완료!<br />
                  <span className="text-[1vw] text-slate-900/100">Completed</span>
                </div>
              </div>
              <div className="absolute inset-[0.4vw] border-[0.15vw] border-slate-900/90 rounded-[1vw]"></div>
            </div>
          </div>

        {/* 배경 텍스트들 */}
          <div className="absolute top-[52.5%] left-[36%] z-0">
            <span className="text-[2.8vw] font-black text-slate-900/20 tracking-tighter select-none">여행지</span>
          </div>
          <div className="absolute top-[68%] left-[58%] z-0">
            <span className="text-[2.8vw] font-black text-slate-900/20 tracking-tighter select-none">식당</span>
          </div>
          <div className="absolute top-[53%] left-[82%] z-0">
            <span className="text-[2.8vw] font-black text-slate-900/30 tracking-tighter select-none">호텔</span>
          </div>

         {/* 툴팁 */}
          {mapNodes.map((node) => (
            <div
              key={node.id}
              className="absolute z-10 group cursor-pointer"
              style={{ top: node.top, left: node.left }}
            >
              <div className={`w-[3.2vw] h-[3.2vw] -ml-[1.6vw] -mt-[1.6vw] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${node.bgColor}`}>
                <div className="scale-[1.0]">{node.icon}</div>
              </div>

              <div className="absolute bottom-full left-[50%] -translate-x-1/2 mb-[1.5vw] w-[20vw] opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-sm p-[1.5vw] rounded-[1.2vw] shadow-xl border-[0.1vw] border-white/50 relative">
                  <div className="absolute -bottom-[0.5vw] left-1/2 -translate-x-1/2 w-[1vw] h-[1vw] bg-white rotate-45 border-r-[0.1vw] border-b-[0.1vw] border-white/50"></div>
                  <div className="relative z-10">
                    <div className={`text-[0.8vw] font-bold mb-[0.2vw] uppercase ${node.type === 'travel' ? 'text-blue-600' : node.type === 'hotel' ? 'text-indigo-600' : 'text-orange-600'}`}>
                      {node.labelText}
                    </div>
                    <div className="text-[1.1vw] font-extrabold text-slate-800 mb-[0.4vw]">
                      {node.title}
                    </div>
                    <div className="text-[0.9vw] font-medium text-slate-600 leading-relaxed break-keep">
                      {node.description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        {/* 좌측 히어로 텍스트 */}
          <div className="absolute left-[5%] top-[25%] z-10 flex flex-col gap-[1vw] pointer-events-none">
            <h1 className="text-[6.8vw] leading-[1.05] font-black text-slate-950 tracking-tighter drop-shadow-sm">
              여행<br />돋보기
            </h1>
            <p className="text-[1.5vw] font-medium text-slate-700 ml-1 leading-relaxed">
              수백 건의 리뷰 일일이 확인하지 말고,<br />
              <span className="text-slate-900 font-bold">AI가 분석한 핵심 리뷰</span>만 확인하세요.
            </p>
          </div>

          {/* 검색바 */}
          <div className="absolute top-[28%] left-[53%] -translate-x-1/2 -translate-y-1/2 z-20 w-[45%] max-w-[950px]">
            <SearchBar />
          </div>

        </div>
      </div>

      {/* 푸터 */}
      <footer className="w-full pb-6 text-center text-sm text-slate-500 font-medium bg-[#EFECE5] z-10 relative">
        © 2026 캡스톤디자인 3조 코더사이저
      </footer>
    </main>
  );
}