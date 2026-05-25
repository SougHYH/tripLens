"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Bed, Utensils, HelpCircle, Sparkles, MessageSquare, Map, ChevronRight, Loader2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/common/SearchBar";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GooglePlace {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  shortFormattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  photoUrl?: string | null;
}

const CATEGORIES = [
  { label: "관광지", query: "관광지", icon: "🗺️" },
  { label: "호텔", query: "호텔", icon: "🏨" },
  { label: "맛집", query: "맛집", icon: "🍽️" },
];

const REGION_DATA: Record<string, string[]> = {
  "서울": [],
  "경기": ["수원", "인천", "용인", "고양", "가평", "성남"],
  "강원": ["속초", "강릉", "춘천", "양양", "평창", "태백"],
  "충청": ["대전", "천안", "공주", "보령", "충주", "청주"],
  "전라": ["여수", "전주", "순천", "담양", "광주", "목포"],
  "경상": ["부산", "경주", "통영", "거제", "대구", "안동"],
  "제주": ["제주시", "서귀포", "성산", "애월"],
};

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

// 상세 도움말 데이터 및 테마 컬러 설정
const helpDetails = {
  0: {
    title: "장소 검색하기",
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    lightBg: "bg-blue-50",
    steps: [
      "메인 페이지 중앙에 위치한 검색창을 확인하세요.",
      "가고 싶은 장소 맛집 이름, 혹은 호텔명을 입력합니다.",
      "장소이름을 클릭하면 AI 분석이 시작됩니다.",
    ]
  },
  1: {
    title: "AI 리뷰 요약",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500",
    lightBg: "bg-indigo-50",
    steps: [
      "수천 개의 리뷰를 읽을 필요가 없습니다.",
      "AI가 긍정/부정 키워드를 분석해 한 줄 요약을 제공합니다.",
      "장소의 핵심 특징(분위기, 서비스 등)을 바로 파악하세요.",
    ]
  },
  2: {
    title: "AI 질의응답",
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    lightBg: "bg-orange-50",
    steps: [
      "리뷰에 없는 내용이 궁금하신가요?",
      "채팅창에 '주차장 자리가 넓어?' 처럼 질문해 보세요.",
      "AI가 기존 리뷰 데이터를 바탕으로 답변을 찾아드립니다.",
    ]
  },
  3: {
    title: "상세 정보 확인",
    color: "text-slate-600",
    bgColor: "bg-slate-600",
    lightBg: "bg-slate-100",
    steps: [
      "상세정보를 한 곳에서 확인하세요.",
      "AI 추천 점수와 별점 분포를 함께 제공합니다.",
    ]
  }
};

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedProvince, setSelectedProvince] = useState("서울");
  const [selectedRegion, setSelectedRegion] = useState("서울");
  const [popularPlaces, setPopularPlaces] = useState<GooglePlace[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  useEffect(() => {
    const { query } = CATEGORIES[selectedCategory];
    const keyword = `${selectedRegion} ${query}`;
    setIsLoadingPlaces(true);

    const url = new URL("/api/places/google", window.location.origin);
    url.searchParams.set("query", keyword);

    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => setPopularPlaces(data.places || []))
      .catch(() => setPopularPlaces([]))
      .finally(() => setIsLoadingPlaces(false));
  }, [selectedCategory, selectedRegion]);

  useEffect(() => {
    // 처음 세션 확인
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    // 로그인 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });


    return () => { subscription.unsubscribe(); };
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
      <nav className="flex items-center justify-between p-6 px-12 border-b border-[#EAE6DC] bg-[#FEFDFC]/90 backdrop-blur-md sticky top-0 z-50 text-left shadow-[0_4px_24px_rgba(92,69,57,0.04)]">
        <div className="text-2xl font-black tracking-tighter text-slate-900">여행 돋보기</div>
        <div className="flex items-center space-x-6 text-[13px] font-bold text-slate-500">
          {isLoggedIn ? (
            <>
              <Link href="/mypage" className="border-2 border-slate-900 px-5 py-2 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all">MY PAGE</Link>
              <button onClick={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); setShowToast(true); setTimeout(() => { setShowToast(false); }, 400); }} className="hover:text-red-500 transition-colors">LOGOUT</button>
            </>
          ) : (
            <Link href="/login" className="border-2 border-slate-900 px-6 py-2 rounded-full text-slate-900 hover:bg-slate-900 hover:text-white transition-all">LOGIN</Link>
          )}
        </div>
      </nav>



      {/* 히어로 섹션 */}
      <div className="relative flex-1 w-full flex justify-center items-center">
        <div className="relative aspect-[16/9] w-full bg-center" style={{ backgroundImage: "url('/images/map10.png')", backgroundSize: '100% 100%', height: 'calc(100vh - 80px)' }}>
          {/* 스탬프 아이콘 */}
          <div className="absolute top-[81%] left-[86%] z-50 pointer-events-none opacity-40">
            <div className="relative flex items-center justify-center w-[8vw] h-[8vw] border-[0.4vw] border-slate-900/100 rounded-[1.5vw] rotate-[-12deg]">
              <div className="flex flex-col items-center gap-[0.2vw] text-slate-900/100 font-black">
                <Search className="w-[2.5vw] h-[2.5vw]" strokeWidth={4} />
                <div className="text-[0.9vw] tracking-tighter leading-tight text-center uppercase">
                  AI 장소 리뷰<br />
                  분석 완료!<br /><span className="text-[1vw] text-slate-900/100">Completed</span></div>
              </div>
              <div className="absolute inset-[0.4vw] border-[0.15vw] border-slate-900/90 rounded-[1vw]"></div>
            </div>
          </div>

          {/* 배경 텍스트들 */}
          <div className="absolute top-[52.5%] left-[36%] z-0"><span className="text-[2.8vw] font-black text-slate-900/20 tracking-tighter select-none">여행지</span></div>
          <div className="absolute top-[68%] left-[58%] z-0"><span className="text-[2.8vw] font-black text-slate-900/20 tracking-tighter select-none">식당</span></div>
          <div className="absolute top-[53%] left-[82%] z-0"><span className="text-[2.8vw] font-black text-slate-900/30 tracking-tighter select-none">호텔</span></div>

          {/* 툴팁 노드 */}
          {mapNodes.map((node) => (
            <div key={node.id} className="absolute z-10 group cursor-pointer" style={{ top: node.top, left: node.left }}>
              <div className={`w-[3.2vw] h-[3.2vw] -ml-[1.6vw] -mt-[1.6vw] rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${node.bgColor}`}>
                <div className="scale-[1.0]">{node.icon}</div>
              </div>
              <div className="absolute bottom-full left-[50%] -translate-x-1/2 mb-[1.5vw] w-[20vw] opacity-0 translate-y-2 pointer-events-none transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-sm p-[1.5vw] rounded-[1.2vw] shadow-xl border-[0.1vw] border-white/50 relative text-left">
                  <div className="absolute -bottom-[0.5vw] left-1/2 -translate-x-1/2 w-[1vw] h-[1vw] bg-white rotate-45 border-r-[0.1vw] border-b-[0.1vw] border-white/50"></div>
                  <div className="relative z-10">
                    <div className={`text-[0.8vw] font-bold mb-[0.2vw] uppercase ${node.type === 'travel' ? 'text-blue-600' : node.type === 'hotel' ? 'text-indigo-600' : 'text-orange-600'}`}>{node.labelText}</div>
                    <div className="text-[1.1vw] font-extrabold text-slate-800 mb-[0.4vw]">{node.title}</div>
                    <div className="text-[0.9vw] font-medium text-slate-600 leading-relaxed break-keep">{node.description}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* 히어로 텍스트 & 검색바 */}
          <div className="absolute left-[5%] top-[25%] z-10 flex flex-col gap-[1vw] pointer-events-none text-left">
            <h1 className="text-[6.8vw] leading-[1.05] font-black text-slate-950 tracking-tighter drop-shadow-sm">여행<br />돋보기</h1>
            <p className="text-[1.5vw] font-medium text-slate-700 ml-1 leading-relaxed">수백 건의 리뷰 일일이 확인하지 말고,<br /><span className="text-slate-900 font-bold">AI가 분석한 핵심 리뷰</span>만 확인하세요.</p>
          </div>
          <div className="absolute top-[28%] left-[53%] -translate-x-1/2 -translate-y-1/2 z-20 w-[45%] max-w-[950px]">
            <SearchBar />
          </div>
        </div>
      </div>




      {/* 추천 장소 섹션 */}

      {/* 기존 */}
      {/* <section className="w-full bg-[#EFECE5] px-12 py-20 z-10 relative border-t border-[#D7D3C8]"> */}




      <section className="w-full px-12 pt-10 pb-20 z-10 relative border-t border-[#D7D3C8] overflow-hidden bg-transparent min-h-[800px]">

        <style>{`
    @keyframes scan { 0% { left: -10%; opacity: 0; } 50% { opacity: 1; } 100% { left: 110%; opacity: 0; } }
    @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
    @keyframes plane-fly { 0% { transform: translateX(-20px) translateY(0); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(300px) translateY(-100px); opacity: 0; } }
    @keyframes globe-rotate { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
    @keyframes random-pop { 0% { transform: scale(0.84) translateY(24px); opacity: 0; } 70% { transform: scale(1.04) translateY(-4px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
    @keyframes random-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
    @keyframes random-shine { 0% { transform: translateX(-130%) rotate(18deg); opacity: 0; } 35% { opacity: 1; } 100% { transform: translateX(150%) rotate(18deg); opacity: 0; } }
    @keyframes sparkle-spin { 0% { transform: rotate(0deg) scale(1); opacity: 0.55; } 50% { transform: rotate(180deg) scale(1.22); opacity: 1; } 100% { transform: rotate(360deg) scale(1); opacity: 0.55; } }
    
    .lens {
      box-shadow: inset 10px 10px 26px rgba(92, 69, 57, 0.18), inset -10px -10px 22px rgba(255, 255, 255, 0.72), 0 26px 70px rgba(72, 50, 42, 0.24);
    }
    .photo-rich {
      filter: saturate(1.13) contrast(1.07) brightness(0.98);
    }
    .map-paper-section {
      background: radial-gradient(circle at 18% 16%, rgba(255,255,255,0.74), transparent 28%), radial-gradient(circle at 82% 20%, rgba(221,183,150,0.34), transparent 30%), radial-gradient(circle at 68% 82%, rgba(97,126,110,0.16), transparent 32%), linear-gradient(135deg, #f6eee5 0%, #eadfd4 50%, #f5eadf 100%);
    }
  `}</style>

        <div className="absolute top-0 left-0 w-full h-[1100px] overflow-hidden pointer-events-none z-0 ">
          <div className="absolute inset-0 map-paper-section" />

          <div className="absolute inset-0 opacity-60 -translate-y-[30px] -translate-x-[30px]">
            <svg className="w-full h-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <defs>
                <pattern id="sectionGrid" width="96" height="96" patternUnits="userSpaceOnUse">
                  <path d="M 96 0 L 0 0 0 96" fill="none" stroke="#b9aaa0" strokeWidth="1.4" opacity="0.46" />
                </pattern>
                <filter id="sectionRouteShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#5b4136" floodOpacity="0.18" />
                </filter>
              </defs>

              <rect width="1600" height="1000" fill="url(#sectionGrid)" />

              <g opacity="0.3" fill="none" stroke="#9a887d" strokeLinecap="round">
                <path d="M-70,110 C25,80 36,155 95,118 C145,88 154,40 220,58 C280,75 270,140 352,116" strokeWidth="2" />
                <path d="M-60,770 C38,720 80,832 160,778 C248,718 250,650 365,686 C445,710 452,805 560,760" strokeWidth="2" />
                <path d="M1280,36 C1362,112 1478,26 1532,92 C1590,165 1478,198 1538,250 C1592,298 1665,248 1692,330" strokeWidth="2" />
                <path d="M1215,870 C1305,815 1372,906 1448,850 C1520,796 1585,812 1668,748" strokeWidth="2" />
              </g>

              <g filter="url(#sectionRouteShadow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M460 104 C555 104 612 154 650 225 C684 288 716 353 752 415 C780 468 830 498 890 498 C970 498 1050 498 1125 498 C1180 498 1218 475 1248 430 C1278 386 1308 339 1338 294 C1376 236 1430 218 1496 218 C1560 218 1625 218 1690 218" stroke="#B88A62" strokeWidth="16" />
                <path d="M570 1010 C604 940 632 884 662 835 C690 780 732 752 792 752 C838 752 885 752 930 752 C985 752 1024 724 1048 675 C1068 633 1086 595 1106 560 C1136 500 1185 470 1252 470 C1302 470 1360 470 1410 470 C1505 470 1600 470 1690 470" stroke="#8C6F5A" strokeWidth="16" />
              </g>

              <g opacity="0.24" stroke="#8c7b72" strokeWidth="2" fill="none">
                <path d="M235 130 H420 M235 130 V315" />
                <path d="M1250 105 H1455 M1455 105 V305" />
                <path d="M1125 835 C1185 800 1238 845 1294 812 C1356 776 1412 818 1470 790 C1528 762 1580 786 1645 748" />
                <path d="M1175 888 C1230 858 1286 902 1342 868 C1396 836 1448 872 1505 842 C1565 810 1618 834 1685 798" />
              </g>
            </svg>
          </div>

          <div className="absolute inset-0 hidden lg:block -translate-y-[30px] -translate-x-[30px]">
            <Star size={152} className="absolute left-[6%] top-[32%] rotate-[-14deg] fill-[#D8A63A] text-[#B8861D] opacity-30 drop-shadow-[0_18px_34px_rgba(86,64,28,0.18)]" strokeWidth={1.35} />
            <Star size={124} className="absolute right-[15%] bottom-[15%] rotate-[10deg] fill-[#E7BE63] text-[#B8861D] opacity-28 drop-shadow-[0_18px_34px_rgba(86,64,28,0.16)]" strokeWidth={1.35} />
            <Star size={118} className="absolute left-[37%] bottom-[18%] rotate-[-8deg] fill-[#C89535] text-[#8C6F5A] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
            <Star size={194} className="absolute right-[32%] top-[19%] rotate-[18deg] fill-[#F0C969] text-[#B88A62] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />

            {/* <div className="absolute left-[19%] top-[11%] h-64 w-64 rounded-full border-[10px] border-[#9C877F]/85 bg-white/16 lens overflow-hidden">
              <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=700&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-[#f4e6dc]/12" />
            </div> */}
            {/* <div className="absolute left-[16.8%] top-[42%] text-[72px] font-black tracking-tighter text-[#7e7773]/20">여행지</div> */}
            {/* <div className="absolute left-[29.2%] top-[45%] flex h-20 w-20 items-center justify-center rounded-full bg-[#8C6F5A] shadow-[0_18px_45px_rgba(140,111,90,0.35)]">
              <MapPin size={38} className="text-white" strokeWidth={2.6} />
            </div> */}

            <div className="absolute right-[3.4%] top-[14%] h-[350px] w-[350px] rounded-full border-[16px] border-[#c4b0a5]/90 bg-white/16 lens overflow-hidden">
              <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-84" />
              <div className="absolute inset-0 bg-[#f1ded3]/24" />
              <div className="absolute inset-[64px] rounded-full border-[16px] border-[#a98f87]/42 border-b-transparent" />
            </div>
            {/* <div className="absolute right-[20%] top-[20%] text-[72px] font-black tracking-tighter text-[#7e7773]/20">호텔</div> */}

            <div className="absolute left-[46%] bottom-[4.5%] h-56 w-56 rounded-full border-[10px] border-[#c4b0a5]/90 bg-white/14 lens overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-86" />
              <div className="absolute inset-0 bg-[#f4e6dc]/18" />
              <div className="absolute inset-[48px] rounded-full border-[12px] border-[#a98f87]/42 border-b-transparent" />
            </div>
            <div className="absolute left-[48.5%] bottom-[25%] text-[64px] font-black tracking-tighter text-[#7e7773]/20">식당</div>

            <div className="absolute right-[2%] top-[41%] h-24 w-24 rounded-full bg-[#9C877F]/36 blur-sm" />
            <div className="absolute left-[24%] bottom-[2%] h-28 w-28 rounded-full bg-[#9C877F]/26 blur-sm" />
          </div>

          <div className="absolute inset-0 bg-gradient-to-b from-[#F0E8DE]/58 via-[#F0E8DE]/18 to-[#F0E8DE]/68" />
          <div className="absolute left-1/2 top-[92px] z-[4] h-60 w-[760px] max-w-[92vw] -translate-x-1/2 rounded-full bg-[#f3ebe2]/72 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">

          {/* 헤더 */}
          <div className="mb-6">
            <h2 className="flex flex-col gap-1 text-5xl font-black text-slate-900 tracking-tighter">
              <span>지역별</span>
              <span>추천 장소</span>
            </h2>
          </div>

          {/* 필터 바 */}
          <div className="mb-0.5">
            {/* 카테고리 + 도 선택 */}
            <div className="flex items-center justify-between pb-2">
              <div className="flex gap-2">
                {CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedCategory(idx)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-[12px] font-bold transition-all duration-200 ${selectedCategory === idx
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white/40 text-slate-500 hover:text-slate-800 hover:bg-white/80"
                      }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-white/85 backdrop-blur-sm p-1 rounded-full border border-white/60 shadow-[0_4px_14px_rgba(92,69,57,0.04)]">
                {Object.keys(REGION_DATA).map((province) => (
                  <button
                    key={province}
                    onClick={() => {
                      setSelectedProvince(province);
                      setSelectedRegion(REGION_DATA[province].length > 0 ? REGION_DATA[province][0] : province);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${selectedProvince === province
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                  >
                    {province}
                  </button>
                ))}
              </div>
            </div>
            {/* 시/군 선택 */}
            {REGION_DATA[selectedProvince].length > 0 && (
              <div className="flex w-fit gap-0.5 mt-1 mb-3 bg-white/85 backdrop-blur-sm p-1 rounded-full border border-white/60 shadow-[0_4px_14px_rgba(92,69,57,0.04)]">
                {REGION_DATA[selectedProvince].map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedRegion(city)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${selectedRegion === city
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>



          {/* 장소 카드 */}
          {isLoadingPlaces ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
            </div>
          ) : popularPlaces.length === 0 ? (
            <div className="flex justify-center items-center h-64 text-slate-400 text-sm">
              장소 정보를 불러올 수 없습니다.
            </div>
          ) : (


            <div className="grid grid-cols-3 gap-4">
              {popularPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => router.push(`/review?q=${encodeURIComponent(place.displayName.text)}&id=${place.id}&address=${encodeURIComponent(place.shortFormattedAddress || place.formattedAddress)}`)}
                  className="relative bg-white text-left rounded-[1.8rem] hover:bg-white transition-all duration-300 group overflow-hidden flex flex-col shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1"
                >
                  <div className="w-full h-44 overflow-hidden bg-slate-100 shrink-0">
                    {place.photoUrl ? (
                      <img
                        src={place.photoUrl}
                        alt={place.displayName.text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E8E5DE] flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                          {CATEGORIES[selectedCategory].label}
                        </p>
                        {place.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-amber-400 text-xs">★</span>
                            <span className="text-xs font-bold text-slate-600">{place.rating.toFixed(1)}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({place.userRatingCount?.toLocaleString()})</span>
                          </div>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 text-lg mb-1 leading-snug line-clamp-1">
                        {place.displayName.text}
                      </h3>

                      <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-1">
                        {place.shortFormattedAddress || place.formattedAddress}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-1">
                      <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-900 transition-colors duration-300">리뷰 분석</span>
                      <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all duration-300" />
                    </div>
                  </div>
                </button>
              ))}
            </div>




            /* 기존 디자인 */
            // <div className="grid grid-cols-3 gap-px bg-[#D7D3C8] border-b border-[#D7D3C8]">
            //   {popularPlaces.map((place) => (
            //     <button
            //       key={place.id}
            //       onClick={() => router.push(`/review?q=${encodeURIComponent(place.displayName.text)}&id=${place.id}&address=${encodeURIComponent(place.shortFormattedAddress || place.formattedAddress)}`)}
            //       className="relative bg-[#EFECE5] text-left hover:bg-white transition-colors duration-300 group overflow-hidden flex flex-col"
            //     >
            //       {/* 사진 */}
            //       <div className="w-full h-40 overflow-hidden bg-slate-100 shrink-0">
            //         {place.photoUrl ? (
            //           <img
            //             src={place.photoUrl}
            //             alt={place.displayName.text}
            //             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            //           />
            //         ) : (
            //           <div className="w-full h-full bg-[#E8E5DE] flex items-center justify-center">
            //             <MapPin className="w-6 h-6 text-slate-300" />
            //           </div>
            //         )}
            //       </div>
            //       {/* 텍스트 */}
            //       <div className="px-7 py-6 flex flex-col flex-1">
            //         <div className="flex items-center justify-between mb-3">
            //           <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] uppercase">
            //             {CATEGORIES[selectedCategory].label}
            //           </p>
            //           {place.rating && (
            //             <div className="flex items-center gap-1">
            //               <span className="text-amber-400 text-xs">★</span>
            //               <span className="text-xs font-bold text-slate-500">{place.rating.toFixed(1)}</span>
            //               <span className="text-[10px] text-slate-300 font-medium">({place.userRatingCount?.toLocaleString()})</span>
            //             </div>
            //           )}
            //         </div>
            //         <h3 className="font-black text-slate-900 text-lg mb-1.5 leading-snug line-clamp-1">
            //           {place.displayName.text}
            //         </h3>
            //         <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-1">
            //           {place.shortFormattedAddress || place.formattedAddress}
            //         </p>
            //         <div className="mt-5 flex items-center gap-1.5">
            //           <span className="text-[11px] font-bold text-slate-300 group-hover:text-slate-600 transition-colors duration-300">리뷰 분석</span>
            //           <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
            //         </div>
            //       </div>
            //     </button>
            //   ))}
            // </div>


          )}
        </div>
      </section>

      {/* 가이드 모달 */}
      {showHelp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#5C584F]/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => { setShowHelp(false); setActiveStep(null); }} />

          <div className={`relative flex gap-4 transition-all duration-500 ease-in-out ${activeStep !== null ? 'max-w-4xl' : 'max-w-lg'} w-full`}>
            {/* 왼쪽 리스트 */}
            <div className="w-full max-w-lg bg-[#F9F7F2] rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden text-left z-10 relative">
              {/* 자연스러운 그라데이션 라인 배치 */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-400 to-orange-400" />

              <div className="p-10 pt-12 space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">서비스 이용 방법</h3>
                  <p className="text-slate-500 font-medium">항목을 클릭하여 상세 내용을 확인하세요.</p>
                </div>
                <div className="grid gap-4">
                  {[
                    { icon: <Search className="text-blue-500 w-5 h-5" />, title: "장소 검색하기" },
                    { icon: <Sparkles className="text-indigo-500 w-5 h-5" />, title: "AI 리뷰 요약" },
                    { icon: <MessageSquare className="text-orange-500 w-5 h-5" />, title: "AI 질의응답" },
                    { icon: <Map className="text-slate-600 w-5 h-5" />, title: "상세 정보 확인" }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveStep(idx)}
                      className={`flex items-center justify-between p-5 rounded-3xl border transition-all group ${activeStep === idx ? 'bg-slate-900 border-slate-900' : 'bg-white/50 border-[#D7D3C8]/30 hover:bg-white hover:translate-x-2'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${activeStep === idx ? 'bg-white/20' : 'bg-white shadow-sm'}`}>{item.icon}</div>
                        <h4 className={`font-bold text-base ${activeStep === idx ? 'text-white' : 'text-slate-800'}`}>{item.title}</h4>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${activeStep === idx ? 'text-white translate-x-1' : 'text-slate-400'}`} />
                    </button>
                  ))}
                </div>
                <button onClick={() => { setShowHelp(false); setActiveStep(null); }} className="w-full py-5 bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all hover:bg-slate-300">닫기</button>
              </div>
            </div>

            {/* 오른쪽 상세창 */}
            {activeStep !== null && (
              <div className="flex-1 bg-white rounded-[3rem] shadow-2xl border border-white/50 p-10 animate-in slide-in-from-left-8 fade-in duration-500 text-left self-center relative overflow-hidden">
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-10 ${helpDetails[activeStep as keyof typeof helpDetails].bgColor}`}></div>
                <div className="relative space-y-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${helpDetails[activeStep as keyof typeof helpDetails].lightBg}`}>
                    <div className={`w-2 h-2 rounded-full animate-pulse ${helpDetails[activeStep as keyof typeof helpDetails].bgColor}`}></div>
                    <span className={`text-xs font-black uppercase tracking-widest leading-none ${helpDetails[activeStep as keyof typeof helpDetails].color}`}>도움말 세션</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">{helpDetails[activeStep as keyof typeof helpDetails].title}</h2>
                  <div className="space-y-4">
                    {helpDetails[activeStep as keyof typeof helpDetails].steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-4">
                        <span className={`font-black italic text-lg opacity-40 ${helpDetails[activeStep as keyof typeof helpDetails].color}`}>0{sIdx + 1}</span>
                        <p className="text-slate-600 font-medium leading-relaxed break-keep">{step}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">* 실제 서비스 화면에서 위 순서대로 진행해 보세요!</p>
                    <div className={`w-8 h-1 rounded-full opacity-30 ${helpDetails[activeStep as keyof typeof helpDetails].bgColor}`}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 도움말 버튼 */}
      <div className="fixed bottom-12 right-12 z-[100] group">
        <button onClick={() => setShowHelp(true)} className="relative flex items-center justify-center w-20 h-20 bg-slate-900 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.3)] transition-all duration-300 group-hover:bg-[#8C877B] active:scale-90">
          <div className="absolute inset-[-4px] border-2 border-dashed border-[#8C877B] rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-[spin_10s_linear_infinite] transition-opacity"></div>
          <div className="relative flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1">
            <div className="absolute w-3 h-1 bg-white rounded-full translate-x-4 translate-y-4 rotate-45 transition-all duration-300 group-hover:translate-x-5 group-hover:translate-y-5 group-hover:scale-125"></div>
            <HelpCircle className="w-10 h-10 text-white transition-all duration-300 group-hover:scale-110" strokeWidth={2.5} />
          </div>
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-[#D7D3C8] opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out pointer-events-none flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black text-slate-800 whitespace-nowrap uppercase tracking-widest">도움말</span>
          </div>
        </button>
      </div>
      {/* 푸터 */}
      <footer className="w-full pb-6 text-center text-sm text-slate-500 font-medium bg-[#EFECE5] z-10 relative">© 2026 캡스톤디자인 3조 코더사이저</footer>
    </main>
  );
}
