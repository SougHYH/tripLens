"use client";

import { useEffect, useState } from "react";
import { Search, MapPin, Bed, Utensils, HelpCircle, Sparkles, MessageSquare, Map, ChevronRight, ChevronLeft, Loader2, Star, Compass, Navigation } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/common/SearchBar"; // ★ 교체하신 SearchBar 임포트
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
  { label: "명소", query: "명소", icon: <Compass className="w-4 h-4" /> },
  { label: "호텔", query: "호텔", icon: <Bed className="w-4 h-4" /> },
  { label: "맛집", query: "맛집", icon: <Utensils className="w-4 h-4" /> },
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
    labelText: "Travel",
    top: "38%",
    left: "24%",
    title: "AI 여행지 분석",
    description: "볼거리, 분위기, 교통편 등 생생한 리뷰 요약",
    icon: <MapPin size="1.6vw" className="text-[#8C6F5A]" />,
  },
  {
    id: 2,
    type: "hotel",
    labelText: "Hotel",
    top: "28%",
    left: "76%",
    title: "AI 숙소 요약",
    description: "청결도, 서비스 등 투숙객 핵심 평가",
    icon: <Bed size="1.6vw" className="text-[#8C6F5A]" />,
  },
  {
    id: 3,
    type: "restaurant",
    labelText: "Dining",
    top: "65%",
    left: "70%",
    title: "AI 맛집 검증",
    description: "맛, 웨이팅, 추천 메뉴 등 진짜 후기",
    icon: <Utensils size="1.6vw" className="text-[#8C6F5A]" />,
  },
];

const helpDetails = {
  0: {
    title: "장소 검색하기",
    color: "text-[#8C6F5A]",
    steps: [
      "메인 페이지 중앙에 위치한 검색창을 확인하세요.",
      "가고 싶은 장소, 맛집 이름 혹은 호텔명을 입력합니다.",
      "장소 이름을 클릭하면 AI 분석이 시작됩니다.",
    ]
  },
  1: {
    title: "AI 리뷰 요약",
    color: "text-[#8C6F5A]",
    steps: [
      "수천 개의 리뷰를 읽을 필요가 없습니다.",
      "AI가 긍정/부정 키워드를 분석해 한 줄 요약을 제공합니다.",
      "장소의 핵심 특징(분위기, 서비스 등)을 바로 파악하세요.",
    ]
  },
  2: {
    title: "AI 질의응답",
    color: "text-[#8C6F5A]",
    steps: [
      "리뷰에 없는 내용이 궁금하신가요?",
      "채팅창에 '주차장 자리가 넓어?' 처럼 질문해 보세요.",
      "AI가 기존 리뷰 데이터를 바탕으로 답변을 찾아드립니다.",
    ]
  },
  3: {
    title: "상세 정보 확인",
    color: "text-[#8C6F5A]",
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const PAGE_SIZE = 3;
  const STEP = 1;

  useEffect(() => {
    const { query } = CATEGORIES[selectedCategory];
    const keyword = `${selectedRegion} ${query}`;
    setCurrentIndex(0);
    setIsLoadingPlaces(true);

    const url = new URL("/api/places/google", window.location.origin);
    url.searchParams.set("query", keyword);

    fetch(url.toString())
      .then((r) => r.json())
      .then((data) => setPopularPlaces(data.places || []))
      .catch(() => setPopularPlaces([]))
      .finally(() => setIsLoadingPlaces(false));
  }, [selectedCategory, selectedRegion]);

  const handlePrev = () => setCurrentIndex((prev) => Math.max(0, prev - STEP));
  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + STEP, popularPlaces.length - PAGE_SIZE));

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col font-sans tracking-tight text-[#2C303A] selection:bg-[#8C6F5A] selection:text-white overflow-x-hidden">
      
      {/* 여행 테마 SVG 배경 (고정 요소이므로 overflow-hidden 유지해도 무방) */}
      <div className="fixed inset-0 z-0 bg-[#F4F0E6] overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="skyline-bg-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EADCC9" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#D5C3A9" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="skyline-fg-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DECBAF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#A68B6D" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="premium-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#E2CAAA" />
              <stop offset="50%" stopColor="#BFA37E" />
              <stop offset="100%" stopColor="#8C6F5A" />
            </linearGradient>
            <linearGradient id="handle-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5C4636" />
              <stop offset="70%" stopColor="#2C1F16" />
              <stop offset="100%" stopColor="#110A06" />
            </linearGradient>
            <radialGradient id="lens-reflection" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <stop offset="85%" stopColor="#8C6F5A" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#8C6F5A" stopOpacity="0.2" />
            </radialGradient>
            <filter id="ultra-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="10" dy="20" stdDeviation="15" floodColor="#4A3B32" floodOpacity="0.25" />
            </filter>
            <filter id="pin-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.15" />
            </filter>
            <linearGradient id="pin-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E76F51" />
              <stop offset="100%" stopColor="#B54A30" />
            </linearGradient>
            <linearGradient id="contrail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8C6F5A" stopOpacity="0" />
              <stop offset="50%" stopColor="#8C6F5A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8C6F5A" stopOpacity="0.05" />
            </linearGradient>
            <pattern id="map-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E6DEC9" strokeWidth="1"/>
              <circle cx="0" cy="0" r="1.5" fill="#D2C7A9" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill="url(#map-grid)" />

          <g transform="translate(180, 220) scale(1.3)" opacity="0.45" filter="url(#pin-shadow)">
            <circle cx="0" cy="0" r="95" stroke="url(#premium-gold)" strokeWidth="1.5" fill="none" />
            <circle cx="0" cy="0" r="85" stroke="#D3C5A3" strokeWidth="1" strokeDasharray="6 3" fill="none" />
            <path d="M0 -85 L0 -75 M0 85 L0 75 M-85 0 L-75 0 M85 0 L75 0" stroke="#8C6F5A" strokeWidth="2" />
            <polygon points="0,-82 12,0 0,-10" fill="url(#premium-gold)" />
            <polygon points="0,-82 -12,0 0,-10" fill="#A68B6D" />
            <polygon points="0,82 12,0 0,10" fill="#D5C3A9" />
            <polygon points="0,82 -12,0 0,10" fill="#BFA37E" />
            <circle cx="0" cy="0" r="5" fill="#5C4636" />
          </g>

          <path d="M-100 250 C 200 120, 450 380, 700 220 S 1100 450, 1600 280" stroke="#DECBAF" strokeWidth="2.5" fill="none" />
          <path d="M-50 400 C 250 320, 500 580, 850 390 S 1150 220, 1600 350" stroke="#DECBAF" strokeWidth="1.5" fill="none" strokeDasharray="12 6" />

          <g>
            <path d="M -100 750 Q 500 80, 1550 160" stroke="url(#contrail-grad)" strokeWidth="5" fill="none" />
            <path d="M -90 753 Q 500 83, 1550 163" stroke="#FFFFFF" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
            <g transform="translate(1120, 142) rotate(10)" filter="url(#pin-shadow)">
              <path d="M0,0 L-22,-18 L-14,-3 L-32,0 L-14,3 L-22,18 Z" fill="#8C6F5A" />
              <path d="M0,0 L20,0 L0,0" stroke="#5C4636" strokeWidth="2" />
            </g>
            <path d="M 1550 620 Q 750 850, -100 420" stroke="url(#contrail-grad)" strokeWidth="4" fill="none" />
            <g transform="translate(320, 525) rotate(-155)" filter="url(#pin-shadow)">
              <path d="M0,0 L-18,-14 L-11,-2 L-26,0 L-11,2 L-18,14 Z" fill="#BFA37E" />
            </g>
          </g>

          <g transform="translate(950, 360)" filter="url(#ultra-shadow)">
            <path d="M 130 130 L 290 290" stroke="url(#handle-grad)" strokeWidth="32" strokeLinecap="round" />
            <path d="M 125 125 L 285 285" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.15" />
            <circle cx="135" cy="135" r="18" fill="url(#premium-gold)" />
            <circle cx="0" cy="0" r="175" fill="none" stroke="url(#premium-gold)" strokeWidth="14" />
            <circle cx="0" cy="0" r="167" fill="none" stroke="#5C4636" strokeWidth="1.5" strokeOpacity="0.4" />
            <circle cx="0" cy="0" r="166" fill="url(#lens-reflection)" />
            <circle cx="0" cy="0" r="150" fill="none" stroke="#8C6F5A" strokeWidth="1" strokeDasharray="20 10" strokeOpacity="0.15" />
          </g>

          <g filter="url(#pin-shadow)">
            <g transform="translate(420, 210) scale(1.2)">
              <path d="M0,0 C-10,-10 -15,-22 -15,-32 C-15,-45 -5,-52 0,-52 C5,-52 15,-45 15,-32 C15,-22 10,-10 0,0 Z" fill="url(#pin-grad)" />
              <circle cx="0" cy="-32" r="6" fill="#FFFFFF" />
            </g>
            <g transform="translate(1220, 580) scale(1)">
              <path d="M0,0 C-10,-10 -15,-22 -15,-32 C-15,-45 -5,-52 0,-52 C5,-52 15,-45 15,-32 C15,-22 10,-10 0,0 Z" fill="url(#premium-gold)" />
              <circle cx="0" cy="-32" r="5" fill="#FFFFFF" />
            </g>
            <g transform="translate(790, 110) scale(0.9)">
              <path d="M0,0 C-10,-10 -15,-22 -15,-32 C-15,-45 -5,-52 0,-52 C5,-52 15,-45 15,-32 C15,-22 10,-10 0,0 Z" fill="#8C6F5A" />
              <circle cx="0" cy="-32" r="4.5" fill="#F4F0E6" />
            </g>
          </g>

          <path d="M 0 900 L 0 680 L 50 680 L 50 640 L 110 640 L 110 670 L 170 670 L 170 590 L 220 590 L 220 630 L 300 630 L 300 560 L 360 560 L 360 650 L 440 650 L 440 530 L 520 530 L 520 670 L 600 670 L 600 580 L 680 580 L 680 640 L 760 640 L 760 490 L 840 490 L 840 670 L 930 670 L 930 560 L 990 560 L 990 620 L 1070 620 L 1070 530 L 1150 530 L 1150 650 L 1230 650 L 1230 570 L 1310 570 L 1310 630 L 1390 630 L 1390 580 L 1440 580 L 1440 900 Z" fill="url(#skyline-bg-grad)" />
          <path d="M 0 900 L 0 740 L 40 740 L 40 700 L 90 700 L 90 750 L 150 750 L 150 660 L 200 660 L 200 710 L 270 710 L 270 630 L 330 630 L 330 730 L 400 730 L 400 660 L 480 660 L 480 750 L 570 750 L 570 630 L 640 630 L 640 710 L 720 710 L 720 580 L 800 580 L 800 730 L 870 730 L 870 660 L 950 660 L 950 740 L 1020 740 L 1020 600 L 1100 600 L 1100 740 L 1190 740 L 1190 660 L 1270 660 L 1270 720 L 1350 720 L 1350 640 L 1410 640 L 1410 740 L 1440 740 L 1440 900 Z" fill="url(#skyline-fg-grad)" />

          <g fill="#FFF4D4" opacity="0.65">
            <rect x="25" y="750" width="3" height="5"/><rect x="32" y="750" width="3" height="5"/><rect x="25" y="760" width="3" height="5"/>
            <rect x="105" y="715" width="4" height="4"/><rect x="115" y="715" width="4" height="4"/><rect x="105" y="725" width="4" height="4"/>
            <rect x="225" y="650" width="3" height="6"/><rect x="235" y="650" width="3" height="6"/><rect x="245" y="650" width="3" height="6"/>
            <rect x="425" y="680" width="4" height="4"/><rect x="435" y="680" width="4" height="4"/><rect x="445" y="680" width="4" height="4"/>
            <rect x="665" y="650" width="3" height="5"/><rect x="675" y="650" width="3" height="5"/><rect x="665" y="660" width="3" height="5"/>
            <rect x="975" y="680" width="4" height="4"/><rect x="985" y="680" width="4" height="4"/><rect x="975" y="692" width="4" height="4"/>
            <rect x="1125" y="620" width="3" height="6"/><rect x="1135" y="620" width="3" height="6"/><rect x="1145" y="620" width="3" height="6"/>
            <rect x="1365" y="660" width="4" height="4"/><rect x="1375" y="660" width="4" height="4"/>
          </g>
        </svg>
        <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.75%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }} />
      </div>

      {/* 컨텐츠 레이어 */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {showToast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="px-8 py-3 rounded-full shadow-[0_12px_40px_rgba(140,111,90,0.2)] bg-white/95 backdrop-blur-xl border border-[#D3C9B3] text-[#8C6F5A] text-sm font-bold tracking-wider">
              안전하게 로그아웃 되었습니다.
            </div>
          </div>
        )}

        <nav className="flex items-center justify-between p-5 px-12 border-b border-[#E8E1D5]/60 bg-white/50 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(140,111,90,0.02)]">
          <div className="text-2xl font-black tracking-tighter text-[#2C303A] flex items-center gap-2">
            <Search className="w-5 h-5 text-[#8C6F5A]" strokeWidth={3.5} />
            <span>여행 돋보기</span>
          </div>
          <div className="flex items-center space-x-6 text-[12px] font-bold text-[#5C616A] tracking-widest uppercase">
            {isLoggedIn ? (
              <>
                <Link href="/mypage" className="hover:text-[#8C6F5A] transition-colors duration-300">My Page</Link>
                <button onClick={async () => { await supabase.auth.signOut(); setIsLoggedIn(false); setShowToast(true); setTimeout(() => { setShowToast(false); }, 400); }} className="px-6 py-2.5 rounded-full bg-white text-[#2C303A] shadow-sm hover:shadow-md hover:text-[#8C6F5A] transition-all duration-300">Logout</button>
              </>
            ) : (
              <Link href="/login" className="px-6 py-2.5 rounded-full bg-[#2C303A] text-white hover:bg-[#8C6F5A] hover:shadow-[0_8px_20px_rgba(140,111,90,0.3)] transition-all duration-300">Login</Link>
            )}
          </div>
        </nav>
        
        <div className="relative w-full h-[calc(100vh-80px)] flex flex-col justify-center items-center z-20">
          <div className="absolute inset-0 pointer-events-none">
            {mapNodes.map((node) => (
              <div key={node.id} className="absolute z-10 group cursor-pointer pointer-events-auto" style={{ top: node.top, left: node.left }}>
                <div className="absolute -inset-4 bg-white/60 rounded-full blur-md animate-pulse"></div>
                <div className="relative w-[3.8vw] h-[3.8vw] rounded-full flex items-center justify-center bg-white/90 backdrop-blur-md border border-white/80 shadow-[0_10px_30px_rgba(140,111,90,0.2)] transition-all duration-500 group-hover:scale-110 group-hover:bg-white">
                  {node.icon}
                </div>
                
                <div className="absolute bottom-full left-[50%] -translate-x-1/2 mb-[1.5vw] w-[20vw] opacity-0 translate-y-4 pointer-events-none transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                  <div className="bg-white/95 backdrop-blur-xl p-[1.5vw] rounded-2xl border border-white shadow-[0_20px_40px_rgba(140,111,90,0.15)] relative text-left">
                    <div className="absolute -bottom-[0.5vw] left-1/2 -translate-x-1/2 w-[1vw] h-[1vw] bg-white/95 rotate-45 border-r border-b border-white"></div>
                    <div className="relative z-10">
                      <div className="text-[0.7vw] font-black tracking-[0.2em] uppercase text-[#8C6F5A] mb-1">{node.labelText}</div>
                      <div className="text-[1.2vw] font-black text-[#2C303A] tracking-tight mb-1.5">{node.title}</div>
                      <div className="text-[0.85vw] font-medium text-[#7A7E86] leading-relaxed break-keep">{node.description}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 중앙 타이틀 및 SearchBar 래퍼 */}
          <div className="relative z-[100] flex flex-col items-center w-full max-w-4xl px-8 text-center -mt-16">
            <div className="inline-flex items-center gap-2 px-7 py-7 rounded-full border border-[#8C6F5A]/20 bg-white/70 backdrop-blur-sm mb-6 shadow-sm">
               <Search className="w-7 h-7 text-[#8C6F5A]" strokeWidth={5} />
               <span className="text-4xl font-bold tracking-widest text-[#8C6F5A]">여행 돋보기</span>
            </div>
            
            <h1 className="text-[4.5rem] md:text-[5.5rem] leading-[1.1] font-black text-[#1A1C20] tracking-tighter mb-6">
              완벽한 여행을 위한<br />
              <span className="text-[#8C6F5A] font-serif italic pr-2">Insight</span> 경험하기
            </h1>
            
            <p className="text-lg md:text-xl font-medium text-[#5C616A] mb-12 max-w-2xl leading-relaxed bg-white/40 backdrop-blur-md py-2 px-6 rounded-2xl border border-white/50 shadow-sm">
              넘쳐나는 리뷰 속에서 더 이상 헤매지 마세요.<br />
              당신만을 위해 <strong className="text-[#2C303A] font-bold border-b-2 border-[#8C6F5A]/40 pb-0.5">정제된 핵심 요약</strong>을 AI가 분석해 드립니다.
            </p>

            
            <div className="w-full max-w-3xl p-2.5 bg-white/70 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_rgba(140,111,90,0.18)] border border-white/80 relative group pointer-events-auto z-[150]">
              <div className="absolute inset-0 bg-[#8C6F5A]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              <div className="relative z-10 w-full">
                <SearchBar />
              </div>
            </div>
          </div>
        </div>

        {/* 추천 스팟 슬라이더 */}
        <section className="w-full px-8 md:px-16 pt-16 pb-32 z-10 relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-10 flex flex-col items-center text-center">
              <span className="text-xs font-bold text-[#8C6F5A] tracking-[0.3em] uppercase mb-2">지역 베스트 스팟</span>
              <h2 className="text-4xl font-black text-[#1A1C20] tracking-tighter">지역별 추천 스팟</h2>
            </div>

            <div className="mb-10">
              <div className="flex flex-col md:flex-row items-center justify-between pb-5 border-b border-[#E8E1D5] gap-4">
                <div className="flex gap-2">
                  {CATEGORIES.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCategory(idx)}
                      className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all duration-300 shadow-sm ${selectedCategory === idx
                        ? "bg-[#2C303A] text-white"
                        : "bg-white/80 text-[#5C616A] border border-white hover:bg-white hover:text-[#2C303A]"
                        }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-1 p-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white shadow-sm">
                  {Object.keys(REGION_DATA).map((province) => (
                    <button
                      key={province}
                      onClick={() => {
                        setSelectedProvince(province);
                        setSelectedRegion(REGION_DATA[province].length > 0 ? REGION_DATA[province][0] : province);
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${selectedProvince === province
                        ? "bg-white text-[#8C6F5A] shadow-[0_2px_8px_rgba(140,111,90,0.1)]"
                        : "text-[#7A7E86] hover:text-[#2C303A]"
                        }`}
                    >
                      {province}
                    </button>
                  ))}
                </div>
              </div>
              
              {REGION_DATA[selectedProvince].length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {REGION_DATA[selectedProvince].map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedRegion(city)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${selectedRegion === city
                        ? "bg-[#8C6F5A] text-white border-[#8C6F5A] shadow-md"
                        : "bg-white/70 text-[#7A7E86] border-white hover:bg-white hover:text-[#2C303A]"
                        }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoadingPlaces ? (
              <div className="flex justify-center items-center h-80 bg-white/50 backdrop-blur-md rounded-3xl border border-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#8C6F5A]" />
              </div>
            ) : popularPlaces.length === 0 ? (
               <div className="flex justify-center items-center h-80 bg-white/50 backdrop-blur-md rounded-3xl border border-white text-[#7A7E86] text-sm font-medium">
                해당 지역의 추천 장소가 없습니다.
              </div>
            ) : (
              <div className="relative group/slider mt-4">
                <div className="overflow-hidden py-8 px-4 -mx-4">
                  <div
                    className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] gap-6"
                    style={{ transform: `translateX(calc(-${currentIndex * (100 / PAGE_SIZE)}% - ${currentIndex * (24 / PAGE_SIZE)}px))` }}
                  >
                    {popularPlaces.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => router.push(`/review?q=${encodeURIComponent(place.displayName.text)}&id=${place.id}&address=${encodeURIComponent(place.shortFormattedAddress || place.formattedAddress)}`)}
                        className="relative bg-white/95 backdrop-blur-xl text-left rounded-[2.2rem] transition-all duration-500 group overflow-hidden flex flex-col flex-shrink-0 shadow-[0_12px_32px_rgba(140,111,90,0.06)] hover:shadow-[0_32px_64px_rgba(140,111,90,0.18)] hover:-translate-y-3 border border-white/80"
                        style={{ width: `calc(${100 / PAGE_SIZE}% - ${(PAGE_SIZE - 1) * 24 / PAGE_SIZE}px)` }}
                      >
                        <div className="w-full h-56 overflow-hidden bg-[#E8E1D5] shrink-0 relative">
                          {place.photoUrl ? (
                            <img src={place.photoUrl} alt={place.displayName.text} className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="w-8 h-8 text-[#8C6F5A]/40" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4 bg-[#2C303A]/80 backdrop-blur-sm px-3.5 py-1 rounded-full text-[10px] font-black text-white tracking-widest uppercase">
                            {CATEGORIES[selectedCategory].label}
                          </div>
                        </div>
                        
                        <div className="p-7 flex flex-col flex-1 justify-between z-10 bg-gradient-to-b from-white/50 to-white">
                          <div>
                            <div className="flex items-center justify-between mb-3.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8C6F5A] tracking-wider">
                                
                                <span>베스트 추천</span>
                              </div>
                              {place.rating && (
                                <div className="flex items-center gap-1 bg-[#F5F2EC] px-2.5 py-1 rounded-full border border-[#E8E1D5]/40">
                                  <Star className="w-3 h-3 fill-[#FFD700] text-[#8C6F5A]" />
                                  <span className="text-xs font-black text-[#2C303A]">{place.rating.toFixed(1)}</span>
                                  <span className="text-[10px] text-[#7A7E86] font-medium">({place.userRatingCount?.toLocaleString()})</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-black text-[#1A1C20] text-xl mb-2.5 leading-snug line-clamp-1 group-hover:text-[#8C6F5A] transition-colors duration-300">{place.displayName.text}</h3>
                            <p className="text-xs text-[#7A7E86] font-medium leading-relaxed line-clamp-1 flex items-center gap-1">
                              <Navigation className="w-3 h-3 shrink-0 text-[#8C6F5A]/60" />
                              <span>{place.shortFormattedAddress || place.formattedAddress}</span>
                            </p>
                          </div>
                          <div className="mt-8 flex items-center justify-between border-t border-[#F0EBE1] pt-4.5">
                            <span className="text-[11px] font-black text-[#2C303A] tracking-widest uppercase group-hover:text-[#8C6F5A] transition-colors">상세 리포트 확인하기</span>
                            <div className="w-7 h-7 rounded-full bg-[#FAF8F5] flex items-center justify-center group-hover:bg-[#2C303A] group-hover:text-white transition-all duration-300">
                              <ChevronRight className="w-4 h-4 text-[#8C6F5A] group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 z-20">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="w-14 h-14 rounded-full bg-white shadow-[0_10px_30px_rgba(140,111,90,0.15)] border border-white flex items-center justify-center text-[#2C303A] hover:bg-[#2C303A] hover:text-white transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </div>
                <div className="absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                  <button
                    onClick={handleNext}
                    disabled={currentIndex + STEP + PAGE_SIZE > popularPlaces.length}
                    className="w-14 h-14 rounded-full bg-white shadow-[0_10px_30px_rgba(140,111,90,0.15)] border border-white flex items-center justify-center text-[#2C303A] hover:bg-[#2C303A] hover:text-white transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {showHelp && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#2C303A]/70 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => { setShowHelp(false); setActiveStep(null); }} />

            <div className={`relative flex gap-6 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${activeStep !== null ? 'max-w-5xl' : 'max-w-lg'} w-full`}>
              <div className="w-full max-w-lg bg-[#FAF8F5] border border-white rounded-[2.5rem] shadow-2xl overflow-hidden text-left z-10 relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#8C6F5A] to-[#2C303A]" />
                
                <div className="p-10 md:p-12 space-y-10">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-[#8C6F5A] tracking-widest uppercase">도움말 가이드</span>
                    <h3 className="text-3xl font-black text-[#1A1C20] tracking-tight">서비스 이용 안내</h3>
                    <p className="text-[#7A7E86] font-medium text-sm">항목을 선택하여 상세한 이용 방법을 확인하세요.</p>
                  </div>
                  <div className="grid gap-4">
                    {[
                      { icon: <Search className="w-5 h-5" />, title: "장소 검색하기" },
                      { icon: <Sparkles className="w-5 h-5" />, title: "AI 리뷰 요약" },
                      { icon: <MessageSquare className="w-5 h-5" />, title: "AI 질의응답" },
                      { icon: <Map className="w-5 h-5" />, title: "상세 정보 확인" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveStep(idx)}
                        className={`flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group ${activeStep === idx ? 'bg-white border-[#8C6F5A]/30 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-white/50'}`}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${activeStep === idx ? 'bg-[#8C6F5A] text-white shadow-md' : 'bg-white text-[#7A7E86] shadow-sm group-hover:text-[#8C6F5A]'}`}>{item.icon}</div>
                          <h4 className={`font-bold text-[15px] ${activeStep === idx ? 'text-[#1A1C20]' : 'text-[#5C616A] group-hover:text-[#1A1C20]'}`}>{item.title}</h4>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${activeStep === idx ? 'text-[#8C6F5A] translate-x-1' : 'text-[#C4C4C4]'}`} />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setShowHelp(false); setActiveStep(null); }} className="w-full py-4 bg-white border border-[#E8E1D5] text-[#2C303A] font-bold rounded-xl transition-all hover:bg-[#F5F2EC] tracking-wide">닫기</button>
                </div>
              </div>

              {activeStep !== null && (
                <div className="flex-1 bg-white border border-white rounded-[2.5rem] shadow-2xl p-10 md:p-14 animate-in slide-in-from-left-8 fade-in duration-500 text-left self-center relative overflow-hidden">
                  <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#8C6F5A] rounded-full blur-[100px] opacity-[0.08] pointer-events-none"></div>
                  <div className="relative space-y-8 z-10">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#FAF8F5] border border-[#E8E1D5]">
                      <div className="w-2 h-2 rounded-full bg-[#8C6F5A] animate-pulse"></div>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C6F5A]">가이드{activeStep + 1}</span>
                    </div>
                    <h2 className="text-3xl font-black text-[#1A1C20] leading-tight">{helpDetails[activeStep as keyof typeof helpDetails].title}</h2>
                    <div className="space-y-6 pt-4">
                      {helpDetails[activeStep as keyof typeof helpDetails].steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex gap-6 items-start bg-[#FAF8F5] p-5 rounded-2xl border border-white">
                          <span className="font-serif italic text-2xl text-[#8C6F5A] mt-0.5 opacity-80">0{sIdx + 1}</span>
                          <p className="text-[#5C616A] font-medium text-base leading-relaxed break-keep">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="fixed bottom-12 right-12 z-[100] group">
          <button onClick={() => setShowHelp(true)} className="relative flex items-center justify-center w-16 h-16 bg-[#2C303A] rounded-full shadow-[0_10px_30px_rgba(44,48,58,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 border border-[#4A4E58]">
            <HelpCircle className="w-7 h-7 text-white group-hover:text-[#F3E5AB] transition-colors duration-300" strokeWidth={2} />
            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-[#2C303A] px-5 py-2.5 rounded-full shadow-xl opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-out pointer-events-none border border-[#4A4E58] whitespace-nowrap">
              <span className="text-xs font-bold text-white tracking-widest uppercase">도움말</span>
            </div>
          </button>
        </div>
        
        <footer className="w-full bg-white/60 backdrop-blur-md text-[#7A7E86] pt-20 pb-12 z-10 relative border-t border-[#E8E1D5] mt-auto">
          <div className="max-w-7xl mx-auto px-8 md:px-16">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-2xl font-black text-[#2C303A]">
                  <div className="p-1.5 bg-white rounded-lg shadow-sm">
                    <Search className="w-5 h-5 text-[#8C6F5A]" strokeWidth={3} />
                  </div>
                  <span>여행 돋보기</span>
                </div>
                <p className="text-sm leading-relaxed font-medium break-keep">
                  수많은 리뷰 속에서 당신에게 꼭 맞는 완벽한 여행의 순간을 찾아드립니다. AI가 제안하는 새로운 차원의 프리미엄 여행 인텔리전스 서비스.
                </p>
              </div>
              
              <div className="space-y-6">
                <h4 className="text-xs font-bold text-[#2C303A] tracking-[0.2em] uppercase">서비스 기능</h4>
                <ul className="space-y-4 text-sm font-medium">
                  <li><Link href="#" className="hover:text-[#8C6F5A] transition-colors">AI 장소 분석 및 요약</Link></li>
                  <li><Link href="#" className="hover:text-[#8C6F5A] transition-colors">AI 질의응답</Link></li>
                  <li><Link href="#" className="hover:text-[#8C6F5A] transition-colors">리뷰기반 정보 확인가능</Link></li>
                </ul>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-bold text-[#2C303A] tracking-[0.2em] uppercase">개발팀</h4>
                <ul className="space-y-4 text-sm font-medium">
                  <li>캡스톤디자인 3조</li>
                  <li>팀 코더사이저 (CoderSizer)</li>
                  <li className="text-[#8C6F5A] font-bold">Capstone Project</li> 
                </ul>
              </div>
            </div>
            
            <div className="border-t border-[#E8E1D5] pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-bold">
              <p>© 2026 CoderSizer.</p>
              <div className="flex gap-8">
                <Link href="#" className="hover:text-[#2C303A] transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-[#2C303A] transition-colors">Privacy Policy</Link>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}
