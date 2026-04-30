"use client";

import { Search, MapPin, Bed, Utensils} from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import Link from "next/link";

const mapNodes = [
  {
    id: 1,
    type: "travel",
    labelText: "여행지",
    top: "55.5%",
    left: "44.5%",
    title: "AI 여행지 분석",
    description: "볼거리, 분위기, 교통편 등 여행객들의 생생한 리뷰를 요약해 드려요.",
    icon: <MapPin className="w-8 h-8 text-white" />,
    bgColor: "bg-blue-500",
  },
  {
    id: 2,
    type: "hotel",
    labelText: "호텔",
    top: "51%",
    left: "88%",
    title: "AI 숙소 요약",
    description: "청결도, 서비스, 부대시설 등 실제 투숙객의 핵심 평가만 모아보세요.",
    icon: <Bed className="w-8 h-8 text-white" />,
    bgColor: "bg-indigo-500",
  },
  {
    id: 3,
    type: "restaurant",
    labelText: "식당",
    top: "90%",
    left: "60%",
    title: "AI 맛집 검증",
    description: "맛, 웨이팅, 추천 메뉴 등 방문자들의 진짜 후기를 한눈에 파악하세요.",
    icon: <Utensils className="w-8 h-8 text-white" />,
    bgColor: "bg-orange-500",
  },
];

export default function Home() {
  return (
    <main
      className="relative flex min-h-screen flex-col font-sans tracking-tight bg-[#EFECE5] bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/map10.png')" }}
    >

      {/* 스탬프 아이콘 */}
      <div className="absolute top-[81%] left-[86%] z-50 pointer-events-none opacity-40">
        <div className="relative flex items-center justify-center w-36 h-36 border-[6px] border-slate-900/100 rounded-2xl rotate-[-12deg]">
          <div className="flex flex-col items-center gap-1 text-slate-900/100 font-black">
            <Search className="w-10 h-10" strokeWidth={4} />
            <div className="text-[14px] tracking-tighter leading-tight text-center uppercase">
              AI 장소 리뷰<br />
              분석 완료!<br />
              <span className="text-[16px] text-slate-900/100">Completed</span>
            </div>
          </div>
          <div className="absolute inset-1.5 border-2 border-slate-900/90 rounded-xl"></div>
        </div>
      </div>



      {/* 네비게이션 */}
      <nav className="flex items-center justify-between p-6 px-12 border-b border-[#D7D3C8] bg-[#EFECE5]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter text-slate-900">
          여행 돋보기
        </div>

        <div className="flex items-center space-x-10 text-[13px] font-bold text-slate-500">
          <Link href="/mypage" className="hover:text-blue-600 transition-colors">
            MY PAGE
          </Link>
          <Link
            href="/login"
            className="border-2 border-slate-900 px-6 py-2 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
          >
            LOGIN
          </Link>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <div className="relative flex-1 w-full px-12 overflow-hidden">

        {/* 여행지 텍스트 */}
        <div className="absolute top-[52.5%] left-[36%] z-0">
          <span className="text-[54px] font-black text-slate-900/20 tracking-tighter select-none">
            여행지
          </span>
        </div>

        {/* 식당 텍스트) */}
        <div className="absolute top-[68%] left-[58%] z-0">
          <span className="text-[54px] font-black text-slate-900/20 tracking-tighter select-none">
            식당
          </span>
        </div>

        {/* 호텔 텍스트 */}
        <div className="absolute top-[53%] left-[82%] z-0">
          <span className="text-[54px] font-black text-slate-900/30 tracking-tighter select-none">
            호텔
          </span>
        </div>

        {mapNodes.map((node) => (
          <div
            key={node.id}
            className="absolute z-10 group cursor-pointer"
            style={{ top: node.top, left: node.left }}
          >
            <div className={`w-12 h-12 -ml-4 -mt-4 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${node.bgColor}`}>
              {node.icon}
            </div>

            {/* 툴팁 카드 */}
            <div className="absolute bottom-full left-6 -translate-x-1/2 mb-4 w-88 opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/50 relative">
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-r border-b border-white/50"></div>

                {/* 툴팁 내용 */}
                <div className="relative z-10">
                  <div className={`text-sm font-bold mb-1 uppercase ${node.type === 'travel' ? 'text-blue-600' :
                    node.type === 'hotel' ? 'text-indigo-600' : 'text-orange-600'
                    }`}>
                    {node.labelText}
                  </div>
                  <div className="text-lg font-extrabold text-slate-800 mb-2">
                    {node.title}
                  </div>
                  {/* 설명 문구*/}
                  <div className="text-lg font-medium text-slate-600 leading-relaxed break-keep">
                    {node.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* 좌측 히어로 텍스트 */}
        <div className="absolute left-10 top-1/4 z-10 flex flex-col gap-5 pointer-events-none">
          <h1 className="text-[135px] leading-[1.05] font-black text-slate-950 tracking-tighter drop-shadow-sm">
            여행<br />돋보기
          </h1>
          <p className="text-[28px] font-medium text-slate-700 ml-2 leading-relaxed">
            수백 건의 리뷰 일일이 확인하지 말고,<br />
            <span className="text-slate-900 font-bold">AI가 분석한 핵심 리뷰</span>만 확인하세요.
          </p>
        </div>

        {/* 검색바 */}
        <div className="absolute top-[25%] left-[53%] -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-[950px]">
          <SearchBar />
        </div>

      </div>

      {/* 푸터 */}
      < footer className="w-full pb-6 text-center text-sm text-slate-500 font-medium bg-transparent z-10 relative" >
        © 2026 캡스톤디자인 3조 코더사이저
      </footer>
    </main>
  );
}