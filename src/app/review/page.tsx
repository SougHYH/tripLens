"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation"; // useRouter 추가
import Link from "next/link";
import {
  MessageSquare,
  Star,
  MapPin,
  Send,
  ThumbsUp,
  ThumbsDown,
  GripVertical,
  Check,
  Loader2,
  Building,
  Lightbulb,
  Bookmark,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  getReviewAnalysisByKeyword,
  sendChatMessage,
  getChatHistory,
} from "@/services/reviewService";
import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

import { ReviewAnalysis, ChatMessage } from "@/types";

// useSearchParams()를 사용하는 컴포넌트는 Suspense로 감싸야 빌드 통과
function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const placeId = searchParams.get("id") || "";
  const address = searchParams.get("address") || "";
  const from = searchParams.get("from");
  const fromFavorites = from === "favorites" || from === "mypage";

  const [placeName, setPlaceName] = useState(query || "장소 검색 중...");
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // ─────────────────────────────────────
  // 로그인 유도 팝업 상태
  // ─────────────────────────────────────
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ─────────────────────────────────────
  // 토스트 상태 추가
  // ─────────────────────────────────────
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: "",
    visible: false,
  });

  // ── 리뷰 분석 상태 ──
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── 채팅 상태 ──
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `${query ? `'${query}'` : "이 장소"
        }에 대해 무엇이든 물어보세요!`,
    },
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────
  // 토스트 표시 함수
  // ─────────────────────────────────────
  const showToast = (msg: string) => {
    setToast({
      message: msg,
      visible: true,
    });

    setTimeout(() => {
      setToast({
        message: "",
        visible: false,
      });
    }, 1500);
  };

  // ─────────────────────────────────────
  // 즐겨찾기 초기 로드
  // ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);

      if (uid && placeId) {
        fetch(`${API_URL}/favorites/${uid}`)
          .then((r) => r.json())
          .then((data) => {
            const exists = data.some((f: any) => f.place_id === placeId);
            setIsFavorite(exists);
          })
          .catch(() => {
            const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
            setIsFavorite(saved.some((f: any) => (typeof f === "string" ? f : f.name) === query));
          });
      } else {
        const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
        setIsFavorite(saved.some((f: any) => (typeof f === "string" ? f : f.name) === query));
      }
    });
  }, [query, placeId]);

  // ─────────────────────────────────────
  // 즐겨찾기 토글
  // ─────────────────────────────────────
  const toggleFavorite = async () => {
    if (!userId) {
      setShowLoginModal(true);
      return;
    }

    const currentPlaceId = analysis?.placeId || placeId || "";

    if (userId && currentPlaceId) {
      try {
        if (isFavorite) {
          const res = await fetch(`${API_URL}/favorites/`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, place_id: currentPlaceId }),
          });
          if (!res.ok) throw new Error(await res.text());
          setIsFavorite(false);
          showToast("즐겨찾기가 취소되었습니다.");
        } else {
          const res = await fetch(`${API_URL}/favorites/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, place_id: currentPlaceId }),
          });
          if (!res.ok) throw new Error(await res.text());
          setIsFavorite(true);
          showToast("즐겨찾기에 추가되었습니다.");
        }
      } catch (err) {
        console.error("즐겨찾기 오류:", err);
        showToast("오류가 발생했습니다. 다시 시도해주세요.");
      }
    } else {
      const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
      const validAddress = address && address !== "undefined" ? address : "주소 정보가 없습니다.";
      let updated = [];
      if (isFavorite) {
        updated = saved.filter((f: any) => (typeof f === "string" ? f : f.name) !== query);
        setIsFavorite(false);
        showToast("즐겨찾기가 취소되었습니다.");
      } else {
        updated = [...saved, { name: query, address: validAddress, placeId: currentPlaceId }];
        setIsFavorite(true);
        showToast("즐겨찾기에 추가되었습니다.");
      }
      localStorage.setItem("favorites", JSON.stringify(updated));
    }
  };


  // 리뷰 분석 + 채팅 내역 통합 로드
  useEffect(() => {
    const loadAllData = async () => {
      if (!query) {
        setIsLoadingAnalysis(false);
        return;
      }

      setPlaceName(query);
      setIsLoadingAnalysis(true);
      setAnalysisError(null);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUserId = session?.user?.id ?? null;
        if (currentUserId && !userId) {
          setUserId(currentUserId);
        }

        // 리뷰 분석 데이터 가져오기
        const analysisData = await getReviewAnalysisByKeyword(query, placeId);
        setAnalysis(analysisData);
        setThumbnailUrl(analysisData.thumbnailUrl ?? null);

        const targetPlaceId = placeId || analysisData?.placeId;

        // 즐겨찾기에서 넘어온 경우 채팅 내역 가져오기
        if (fromFavorites && currentUserId && targetPlaceId) {
          try {
            const history = await getChatHistory(currentUserId, targetPlaceId);
            if (history && history.length > 0) {
              setMessages([
                {
                  role: "assistant",
                  content: `${query ? `'${query}'` : "이 장소"}에 대해 무엇이든 물어보세요!`,
                },
                ...history
              ]);
            }
          } catch (chatError) {
            console.error("채팅 내역을 불러오지 못했습니다 (리뷰는 정상 표시됨):", chatError);
          }
        }
      } catch (error) {
        console.error("데이터 로드 중 에러 발생:", error);
        setAnalysisError("리뷰 분석 데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoadingAnalysis(false);
      }
    };

    loadAllData();
  }, [query, placeId, fromFavorites]);


  // ── 채팅 자동 스크롤 ──
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ── 메시지 전송 ──
  // const handleSend = async () => {
  //   if (!input.trim() || isSending) return;

  //   const userMessage: ChatMessage = {
  //     role: "user",
  //     content: input,
  //   };


  const handleSend = async (textToSend?: string) => {
    const targetText = textToSend !== undefined ? textToSend : input;
    if (!targetText.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: targetText,
    };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    setInput("");
    setIsSending(true);

    try {
      const targetPlaceId = analysis?.placeId || placeId || query;

      const { message: reply, foundInReviews } = await sendChatMessage(
        targetPlaceId,
        updatedMessages,
        userId ?? undefined
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          foundInReviews,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "서버와 연결이 끊어졌습니다. 다시 시도해주세요.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // 로딩 화면
  if (isLoadingAnalysis) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[#EFECE5]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-slate-600 animate-spin" />

          <h2 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight text-center">
            <span className="text-slate-800">
              '{placeName}'
            </span>
            <br />
            리뷰를 분석하고 있어요...
          </h2>

          <p className="text-slate-400 font-medium text-sm lg:text-base">
            잠시만 기다려주세요
          </p>
        </div>
      </div>
    );
  }

  return (

    // 기존
    // <div className="flex h-screen w-full bg-[#EFECE5] text-slate-950 font-sans tracking-tight overflow-hidden relative">

    // ---------배경 여기부터-------
    <div className="flex h-screen w-full bg-transparent text-slate-950 font-sans tracking-tight overflow-hidden relative">

      <style>{`
        @keyframes scan { 0% { left: -10%; opacity: 0; } 50% { opacity: 1; } 100% { left: 110%; opacity: 0; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }
        @keyframes plane-fly { 0% { transform: translateX(-20px) translateY(0); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { transform: translateX(300px) translateY(-100px); opacity: 0; } }
        @keyframes globe-rotate { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes random-pop { 0% { transform: scale(0.84) translateY(24px); opacity: 0; } 70% { transform: scale(1.04) translateY(-4px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes random-float { 0%, 100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes random-shine { 0% { transform: translateX(-130%) rotate(18deg); opacity: 0; } 35% { opacity: 1; } 100% { transform: translateX(150%) rotate(18deg); opacity: 0; } }
        @keyframes sparkle-spin { 0% { transform: rotate(0deg) scale(1); opacity: 0.55; } 50% { transform: rotate(180deg) scale(1.22); opacity: 1; } 100% { transform: rotate(360deg) scale(1); opacity: 0.55; } }
        @keyframes shuffle-bounce { 0%, 100% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-5px) rotate(-8deg); } 60% { transform: translateY(3px) rotate(7deg); } }
        @keyframes folder-panel-in { 0% { transform: translateX(18px); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        @keyframes list-soft-in { 0% { transform: translateY(14px); opacity: 0; filter: blur(3px); } 100% { transform: translateY(0); opacity: 1; filter: blur(0); } }
        @keyframes folder-glow { 0%, 100% { box-shadow: 0 18px 45px rgba(92,69,57,0.08); } 50% { box-shadow: 0 24px 60px rgba(92,69,57,0.14); } }
        @keyframes sort-panel-pulse { 0%, 100% { box-shadow: 0 6px 16px rgba(31,41,55,0.06); } 50% { box-shadow: 0 12px 28px rgba(31,41,55,0.11); } }
        @keyframes sort-text-pop { 0% { transform: scale(0.96); } 60% { transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes add-place-glow { 0%, 100% { box-shadow: 0 8px 18px rgba(79,139,105,0.04); } 50% { box-shadow: 0 14px 30px rgba(37,99,235,0.14); } }
        @keyframes add-place-icon { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-2px) rotate(-8deg); } }
        @keyframes add-modal-card { 0% { transform: translateY(10px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }

        .animate-scan { animation: scan 2s linear infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-plane { animation: plane-fly 3s infinite ease-in-out; }
        .animate-globe { animation: globe-rotate 4s linear infinite; }
        .animate-random-pop { animation: random-pop 0.52s cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        .animate-random-float { animation: random-float 3s ease-in-out infinite; }
        .animate-random-shine { animation: random-shine 1.45s ease-in-out infinite; }
        .animate-sparkle-spin { animation: sparkle-spin 2.4s linear infinite; }
        .animate-shuffle-bounce { animation: shuffle-bounce 0.52s ease-in-out infinite; }
        .animate-folder-panel-in { animation: folder-panel-in 0.34s ease-out both; }
        .animate-list-soft-in { animation: list-soft-in 0.38s ease-out both; }
        .animate-folder-glow { animation: folder-glow 3s ease-in-out infinite; }
        .animate-sort-panel-pulse { animation: sort-panel-pulse 2.8s ease-in-out infinite; }
        .animate-sort-text-pop { animation: sort-text-pop 0.24s ease-out both; }
        .animate-add-place-glow { animation: add-place-glow 2.2s ease-in-out infinite; }
        .animate-add-place-icon { animation: add-place-icon 1.2s ease-in-out infinite; }
        .animate-add-modal-card { animation: add-modal-card 0.24s ease-out both; }

        .folder-scroll {
          scrollbar-width: thin;
          scrollbar-color: #CDBBA8 rgba(249, 244, 238, 0.72);
        }

        .folder-scroll::-webkit-scrollbar { width: 10px; }
        .folder-scroll::-webkit-scrollbar-track {
          background: rgba(249, 244, 238, 0.72);
          border-radius: 999px;
          margin: 10px 0;
        }
        .folder-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #DCCDBC 0%, #BFA994 100%);
          border: 3px solid rgba(249, 244, 238, 0.92);
          border-radius: 999px;
        }
        .folder-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #CBB7A2 0%, #A98F7B 100%);
        }
        .folder-scroll::-webkit-scrollbar-corner { background: transparent; }

        .map-paper {
          background:
            radial-gradient(circle at 18% 16%, rgba(255,255,255,0.74), transparent 28%),
            radial-gradient(circle at 82% 20%, rgba(221,183,150,0.34), transparent 30%),
            radial-gradient(circle at 68% 82%, rgba(97,126,110,0.16), transparent 32%),
            linear-gradient(135deg, #f6eee5 0%, #eadfd4 50%, #f5eadf 100%);
        }

        .lens {
          box-shadow:
            inset 10px 10px 26px rgba(92, 69, 57, 0.18),
            inset -10px -10px 22px rgba(255, 255, 255, 0.72),
            0 26px 70px rgba(72, 50, 42, 0.24);
        }

        .photo-rich {
          filter: saturate(1.13) contrast(1.07) brightness(0.98);
        }
      `}</style>

      <div className="fixed inset-0 map-paper pointer-events-none" />

      <div className="fixed inset-0 pointer-events-none z-[1] -translate-y-[50px]">
        <svg className="w-full h-full" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="mainGrid" width="96" height="96" patternUnits="userSpaceOnUse">
              <path d="M 96 0 L 0 0 0 96" fill="none" stroke="#b9aaa0" strokeWidth="1.4" opacity="0.46" />
            </pattern>
            <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#5b4136" floodOpacity="0.18" />
            </filter>
          </defs>

          <rect width="1600" height="1000" fill="url(#mainGrid)" />

          <g opacity="0.3" fill="none" stroke="#9a887d" strokeLinecap="round">
            <path d="M-70,110 C25,80 36,155 95,118 C145,88 154,40 220,58 C280,75 270,140 352,116" strokeWidth="2" />
            <path d="M-60,770 C38,720 80,832 160,778 C248,718 250,650 365,686 C445,710 452,805 560,760" strokeWidth="2" />
            <path d="M1280,36 C1362,112 1478,26 1532,92 C1590,165 1478,198 1538,250 C1592,298 1665,248 1692,330" strokeWidth="2" />
            <path d="M1215,870 C1305,815 1372,906 1448,850 C1520,796 1585,812 1668,748" strokeWidth="2" />
          </g>

          <g filter="url(#routeShadow)" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M-70 235 C55 235 170 235 275 235 C365 235 420 290 420 380 C420 468 430 535 407 594 C386 648 356 674 316 692 C298 700 281 706 268 713 C210 734 172 782 118 806 C58 833 -2 860 -60 886" stroke="#9C877F" strokeWidth="16" />
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

      <div className="fixed inset-0 pointer-events-none z-[2] hidden lg:block">
        <Star size={152} className="absolute left-[6%] top-[32%] rotate-[-14deg] fill-[#D8A63A] text-[#B8861D] opacity-30 drop-shadow-[0_18px_34px_rgba(86,64,28,0.18)]" strokeWidth={1.35} />
        <Star size={124} className="absolute right-[15%] bottom-[15%] rotate-[10deg] fill-[#E7BE63] text-[#B8861D] opacity-28 drop-shadow-[0_18px_34px_rgba(86,64,28,0.16)]" strokeWidth={1.35} />
        <Star size={118} className="absolute left-[37%] bottom-[18%] rotate-[-8deg] fill-[#C89535] text-[#8C6F5A] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
        <Star size={194} className="absolute right-[32%] top-[19%] rotate-[18deg] fill-[#F0C969] text-[#B88A62] opacity-24 drop-shadow-[0_18px_34px_rgba(86,64,28,0.14)]" strokeWidth={1.35} />
      </div>

      <div className="fixed inset-0 pointer-events-none z-[2] hidden lg:block">
        <div className="absolute left-[19%] top-[11%] h-64 w-64 rounded-full border-[10px] border-[#9C877F]/85 bg-white/16 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=700&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-[#f4e6dc]/12" />
        </div>
        <div className="absolute left-[16.8%] top-[42%] text-[72px] font-black tracking-tighter text-[#7e7773]/32">여행지</div>
        <div className="absolute left-[29.2%] top-[45%] flex h-20 w-20 items-center justify-center rounded-full bg-[#8C6F5A] shadow-[0_18px_45px_rgba(140,111,90,0.35)]">
          <MapPin size={38} className="text-white" strokeWidth={2.6} />
        </div>

        <div className="absolute right-[3.4%] top-[14%] h-[350px] w-[350px] rounded-full border-[16px] border-[#c4b0a5]/90 bg-white/16 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-84" />
          <div className="absolute inset-0 bg-[#f1ded3]/24" />
          <div className="absolute inset-[64px] rounded-full border-[16px] border-[#a98f87]/42 border-b-transparent" />
        </div>
        <div className="absolute right-[20%] top-[20%] text-[72px] font-black tracking-tighter text-[#7e7773]/32">호텔</div>

        <div className="absolute left-[46%] bottom-[4.5%] h-56 w-56 rounded-full border-[10px] border-[#c4b0a5]/90 bg-white/14 lens overflow-hidden">
          <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80" alt="" className="photo-rich h-full w-full object-cover opacity-86" />
          <div className="absolute inset-0 bg-[#f4e6dc]/18" />
          <div className="absolute inset-[48px] rounded-full border-[12px] border-[#a98f87]/42 border-b-transparent" />
        </div>
        <div className="absolute left-[48.5%] bottom-[25%] text-[64px] font-black tracking-tighter text-[#7e7773]/30">식당</div>

        <div className="absolute right-[2%] top-[41%] h-24 w-24 rounded-full bg-[#9C877F]/36 blur-sm" />
        <div className="absolute left-[24%] bottom-[2%] h-28 w-28 rounded-full bg-[#9C877F]/26 blur-sm" />
      </div>

      <div className="fixed inset-0 pointer-events-none z-[3] bg-gradient-to-b from-[#F0E8DE]/58 via-[#F0E8DE]/18 to-[#F0E8DE]/68" />
      <div className="fixed left-1/2 top-[92px] z-[4] h-60 w-[760px] max-w-[92vw] -translate-x-1/2 rounded-full bg-[#f3ebe2]/72 blur-3xl pointer-events-none" />

      {/* ------여기까지 배경------- */}



      {/* ───────────────────────────────────── */}
      {/* 로그인 유도 모달 */}
      {/* ───────────────────────────────────── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="text-amber-500 fill-amber-500" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">즐겨찾기는 로그인이 필요해요</h3>
            <p className="text-slate-500 text-center text-sm mb-8 leading-relaxed">
              로그인하시면 나만의 여행 장소를 저장하고<br />언제든 다시 꺼내볼 수 있습니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="rounded-full py-6 border-slate-200 text-slate-500 font-bold"
                onClick={() => setShowLoginModal(false)}
              >
                나중에
              </Button>
              <Button
                className="rounded-full py-6 bg-slate-900 hover:bg-slate-800 text-white font-bold"
                onClick={() => router.push("/login")}
              >
                로그인하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────── */}
      {/* 토스트 */}
      {/* ───────────────────────────────────── */}
      {toast.visible && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 border border-slate-700 animate-in fade-in zoom-in slide-in-from-top-4">
            <Check
              size={16}
              className="text-blue-400"
            />
            {toast.message}
          </div>
        </div>
      )}

      {/* [좌측] 리뷰 분석 영역 */}
      <section className="w-full lg:w-[60%] h-full flex flex-col z-10">
        {/* 홈 화면으로 가는 로고 + 상단 바 */}
        <div className="px-12 py-5 border-b border-[#EAE6DC] bg-[#FEFDFC]/90 backdrop-blur-sm z-20 flex items-center justify-between shadow-[0_4px_24px_rgba(92,69,57,0.04)]">
          <Link href="/">
            <span className="text-2xl font-black text-slate-950 tracking-tighter hover:opacity-70 transition-opacity">
              여행 돋보기
            </span>
          </Link>

          {/* 상단 버튼 세트 삭제됨 */}
          <div className="flex items-center gap-3"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-12">

            {/* 에러 상태 */}
            {analysisError && (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <p className="text-red-400 font-medium">
                  {analysisError}
                </p>

                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  다시 시도
                </Button>
              </div>
            )}

            {/* 분석 데이터 표시 */}
            {!analysisError && analysis && (
              <>
                {/* 장소 헤더 */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2.5 select-none">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full bg-[#9D8F7B] text-white shadow-sm">
                        <Check
                          size={10}
                          strokeWidth={4}
                        />
                      </div>

                      <span className="text-[13px] font-extrabold text-[#9D8F7B] tracking-wide">
                        AI 리뷰 분석 완료
                      </span>
                    </div>

                    {/* 장소 이름 + 즐겨찾기 */}
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">
                        {placeName}
                      </h1>

                      <button
                        onClick={toggleFavorite}
                        className="flex items-center justify-center p-2 rounded-full bg-white/85 backdrop-blur-sm border border-[#EAE6DC] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-white hover:border-[#9D8F7B]/40 transition-all active:scale-90 focus:outline-none"
                        aria-label="즐겨찾기 추가"
                      >

                        <Bookmark
                          size={31}
                          strokeWidth={isFavorite ? 1.5 : 2}
                          className={`transition-all duration-300 ${isFavorite
                            ? "fill-[#9D8F7B] text-[#9D8F7B] drop-shadow-[0_2px_6px_rgba(157,143,123,0.3)]"
                            : "text-slate-300 hover:text-slate-400"
                            }`}
                        />
                      </button>
                    </div>

                    {/* 주소 fallback 추가 */}
                    <div className="flex items-center text-slate-500 font-medium text-sm mt-2">
                      <MapPin
                        size={16}
                        className="mr-1"
                      />

                      {address &&
                        address !== "undefined"
                        ? address
                        : "주소 정보가 없습니다."}
                    </div>
                  </div>

                  {/* 별점 및 리뷰 수 */}
                  <div className="bg-[#FEFDFC] px-6 py-4 rounded-[24px] shadow-sm border border-[#F2F1EC] flex flex-col items-center">
                    <div className={`flex items-center mb-1 ${analysis.rating > 0 ? "text-amber-500" : "text-slate-300"}`}>
                      <Star className={`w-6 h-6 mr-1.5 ${analysis.rating > 0 ? "fill-amber-500" : "fill-slate-300"}`} />
                      <span className="text-3xl font-black text-slate-950">
                        {analysis.rating > 0 ? analysis.rating.toFixed(1) : "—"}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-bold">
                      {analysis.rating > 0 ? `리뷰 ${analysis.reviewCount || 0}개` : "평점 정보 없음"}
                    </span>
                  </div>
                </div>

                {/* 장소 이미지 */}
                {thumbnailUrl && (
                  <div className="w-full h-56 rounded-[28px] overflow-hidden shadow-sm border border-[#F2F1EC]">
                    <img
                      src={thumbnailUrl}
                      alt={placeName}
                      className="w-full h-full object-cover"
                      onError={async () => {
                        const currentPlaceId = analysis.placeId || placeId;
                        try {
                          const res = await fetch(`${API_URL}/places/${currentPlaceId}/refresh-thumbnail`, { method: "POST" });
                          if (res.ok) {
                            const data = await res.json();
                            setThumbnailUrl(data.thumbnailUrl);
                          } else {
                            setThumbnailUrl(null);
                          }
                        } catch {
                          setThumbnailUrl(null);
                        }
                      }}
                    />
                  </div>
                )}

                {/* AI 핵심 요약 */}
                <div className="-mt-8 bg-[#FEFDFC] rounded-[40px] px-10 pb-10 pt-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#F2F1EC]">
                  <div className="mb-4 pb-5 border-b border-[#F2F1EC]">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-slate-400 font-bold text-sm">
                        방문자 반응 분석 {((analysis.sentiment?.positiveCount || 0) + (analysis.sentiment?.negativeCount || 0)).toLocaleString()}건 완료
                      </h3>


                      <div className="text-2xl font-black text-slate-800">
                        긍정{" "}
                        {analysis.sentiment?.positiveRatio || 0}%
                      </div>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${analysis.sentiment?.positiveRatio || 0}%`,
                        }}
                      />

                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${100 -
                            (analysis.sentiment?.positiveRatio || 0)
                            }%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs font-bold text-slate-400 mt-3">
                      <div className="flex items-center gap-1.5 line-clamp-1 flex-1 pr-2">
                        <ThumbsUp
                          size={14}
                          className="flex-shrink-0"
                        />

                        {analysis.sentiment?.positiveKeywords?.join(
                          ", "
                        ) || "데이터 없음"}{" "}
                        (
                        {analysis.sentiment?.positiveCount || 0}
                        건)
                      </div>

                      <div className="flex items-center gap-1.5 line-clamp-1 text-right flex-shrink-0">
                        <ThumbsDown
                          size={14}
                          className="flex-shrink-0"
                        />

                        {analysis.sentiment?.negativeKeywords?.join(
                          ", "
                        ) || "데이터 없음"}{" "}
                        (
                        {analysis.sentiment?.negativeCount || 0}
                        건)
                      </div>
                    </div>
                  </div>


                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                    <span className="bg-blue-500 text-white p-2 rounded-lg text-sm">
                      ✈️
                    </span>
                    AI 핵심 요약
                  </h3>


                  {/*세로 정렬*/}
                  {/* <div className="flex flex-col mt-6 divide-y divide-slate-200/60">
                    {analysis.summary[0] && (
                      <div className="py-6 space-y-3.5 first:pt-0">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-50 text-blue-600 w-9 h-9 flex items-center justify-center rounded-xl text-base font-semibold">✨</span>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">분위기</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2 list-disc pl-5 marker:text-slate-300">
                          {analysis.summary[0].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.summary[1] && (
                      <div className="py-6 space-y-3.5">
                        <div className="flex items-center gap-3">
                          <span className="bg-sky-50 text-sky-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">🏢</span>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">시설 & 서비스</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2 list-disc pl-5 marker:text-slate-300">
                          {analysis.summary[1].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.summary[2] && (
                      <div className="py-6 space-y-3.5 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="bg-amber-50 text-amber-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">💡</span>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">꿀팁</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2 list-disc pl-5 marker:text-slate-300">
                          {analysis.summary[2].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div> */}


                  {/* 가로 정렬 */}
                  <div className="grid grid-cols-3 mt-8 divide-x divide-slate-200/70">
                    {analysis.summary[0] && (
                      <div className="px-8 py-2 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-blue-50 text-blue-600 w-9 h-9 flex items-center justify-center rounded-xl text-base font-semibold">✨</span>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">분위기</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2.5 list-disc pl-4 marker:text-slate-300">
                          {analysis.summary[0].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.summary[1] && (
                      <div className="px-8 py-2 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-sky-50 text-sky-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">🏢</span>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">시설 & 서비스</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2.5 list-disc pl-4 marker:text-slate-300">
                          {analysis.summary[1].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.summary[2] && (
                      <div className="px-8 py-2 space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="bg-amber-50 text-amber-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">💡</span>
                          <h4 className="text-lg font-bold text-slate-900 tracking-tight">꿀팁</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2.5 list-disc pl-4 marker:text-slate-300">
                          {analysis.summary[2].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>


                  {/* 가로 정렬 다른 버전 */}
                  {/* <div className="grid grid-cols-3 mt-6 bg-[#FEFDFC] rounded-[24px] shadow-sm border border-[#F2F1EC] overflow-hidden divide-x divide-[#F2F1EC]">
                    {analysis.summary[0] && (
                      <div className="p-6 space-y-4 relative pt-7">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
                        <div className="flex items-center gap-2.5">
                          <span className="bg-blue-50 text-blue-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">✨</span>
                          <h4 className="text-xl font-bold text-slate-900 tracking-tight">분위기</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2 list-disc pl-4 marker:text-slate-300">
                          {analysis.summary[0].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.summary[1] && (
                      <div className="p-6 space-y-4 relative pt-7">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-sky-400" />
                        <div className="flex items-center gap-2.5">
                          <span className="bg-sky-50 text-sky-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">🏢</span>
                          <h4 className="text-xl font-bold text-slate-900 tracking-tight">시설 & 서비스</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2 list-disc pl-4 marker:text-slate-300">
                          {analysis.summary[1].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysis.summary[2] && (
                      <div className="p-6 space-y-4 relative pt-7">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
                        <div className="flex items-center gap-2.5">
                          <span className="bg-amber-50 text-amber-600 w-9 h-9 flex items-center justify-center rounded-xl text-base">💡</span>
                          <h4 className="text-xl font-bold text-slate-900 tracking-tight">꿀팁</h4>
                        </div>
                        <ul className="text-slate-600 text-[17px] leading-relaxed font-medium space-y-2 list-disc pl-4 marker:text-slate-300">
                          {analysis.summary[2].split(".").map((s) => s.trim()).filter((s) => s.length > 0).map((sentence, idx) => (
                            <li key={idx} className="tracking-tight">{sentence}.</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div> */}


                  {analysis.tags && (
                    <div className="mt-10 flex flex-wrap gap-3 pt-6 border-t border-slate-100">
                      {analysis.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[13px] font-semibold text-slate-700 bg-[#F2F1EC] px-4 py-2 rounded-tr-xl rounded-bl-xl rounded-tl-none rounded-br-none hover:bg-slate-950 hover:text-white transition-all duration-200 cursor-default tracking-tight flex items-center gap-1"
                        >
                          <span className="text-amber-600 font-black text-xs">#</span>
                          {tag.replace("#", "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section >




      {/* [우측] 채팅창 */}
      {/* 기존 디자인 */}
      {/* < section className="hidden lg:flex w-[40%] bg-[#FEFDFC] border-l border-[#F2F1EC] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10" >

        <div className="p-7 border-b border-[#F2F1EC] bg-[#FEFDFC]/80 backdrop-blur-sm z-20 flex justify-between items-center">
          <div>
            <h2 className="text-[17px] font-black text-slate-950 flex items-center gap-2">
              <MessageSquare
                className="text-slate-800"
                size={18}
              />
              여행 돋보기 어시스턴트
            </h2>

            <p className="text-xs text-slate-400 mt-0.5">
              리뷰 데이터를 기반으로 답변합니다.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F9F7F2] custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3.5 ${msg.role === "user"
                ? "justify-end"
                : ""
                }`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-[#9D8F7B] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_4px_12px_rgba(157,143,123,0.25)]">
                  <MessageSquare
                    size={16}
                    className="text-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5 max-w-[80%]">
                {msg.role === "assistant" && msg.foundInReviews === false && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit">
                    수집된 리뷰에 없는 정보 · AI 일반 답변
                  </span>
                )}
                <div
                  className={`p-4 px-5 rounded-[22px] text-[14px] leading-relaxed whitespace-pre-line tracking-tight transition-all
                  ${msg.role === "user"
                      ? "bg-[#9D8F7B] text-white shadow-[0_4px_14px_rgba(157,143,123,0.2)]"
                      : "bg-white text-slate-800 border border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-slate-950">
                <MessageSquare
                  size={16}
                  className="text-white"
                />
              </div>

              <div className="p-5 rounded-[20px] shadow-sm border bg-white text-slate-700 rounded-tl-sm border-slate-100">
                <Loader2
                  size={16}
                  className="text-slate-400 animate-spin"
                />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        <div className="p-7 bg-[#FEFDFC] border-t border-[#F2F1EC] mt-auto">
          <div className="relative flex items-center">
            <Input
              type="text"
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                !e.shiftKey &&
                handleSend()
              }
              placeholder={`'${placeName}'에 대해 무엇이든 물어보세요`}
              className="w-full pr-16 pl-7 py-7 rounded-full bg-[#F2F1EC] border-transparent focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-0 focus-visible:border-transparent text-[15px] font-medium text-slate-800 outline-none"
              disabled={isSending}
            />

            <Button
              type="submit"
              onClick={handleSend}
              size="icon"
              disabled={
                isSending || !input.trim()
              }
              className="absolute right-2 rounded-full bg-[#9D8F7B] hover:bg-[#8B7B6B] text-white w-12 h-12 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-sm"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </section >
    </div >
  );
} */}

      <section className="hidden lg:flex w-[40%] bg-[#FEFDFC] border-l border-[#F2F1EC] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10">
        <div className="p-7 border-b border-[#F2F1EC] bg-[#FEFDFC]/80 backdrop-blur-sm z-20 flex justify-between items-center">
          <div>
            <h2 className="text-[17px] font-black text-slate-950 flex items-center gap-2">
              <MessageSquare className="text-slate-800" size={18} />
              여행 돋보기 어시스턴트
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              리뷰 데이터를 기반으로 답변합니다.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F9F7F2] custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3.5 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-[#9D8F7B] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_4px_12px_rgba(157,143,123,0.25)]">
                  <MessageSquare size={16} className="text-white" />
                </div>
              )}

              <div className={`flex flex-col gap-1.5 ${msg.role === "user" ? "max-w-[80%]" : "max-w-[82%]"}`}>
                {msg.role === "assistant" && msg.foundInReviews === false && (
                  <span className="text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full w-fit mb-0.5">
                    수집된 리뷰에 없는 정보 · AI 일반 답변
                  </span>
                )}

                <div
                  className={`text-[14.5px] leading-relaxed whitespace-pre-line tracking-tight transition-all
                  ${msg.role === "user"
                      ? "bg-[#9D8F7B] text-white p-3.5 px-5 rounded-[20px] shadow-[0_4px_12px_rgba(157,143,123,0.15)] font-medium"
                      : "bg-transparent text-slate-800 pt-0.5 font-normal"
                    }`}
                >
                  {msg.content}
                </div>

                {/* 말풍선 있는 버전 */}
                {/* <div
                  className={`text-[14.5px] leading-relaxed whitespace-pre-line tracking-tight transition-all
                  ${msg.role === "user"
                      ? "bg-[#9D8F7B] text-white p-3.5 px-5 rounded-[20px] shadow-[0_4px_12px_rgba(157,143,123,0.15)] font-medium"
                      : "bg-white text-slate-800 border border-slate-200/60 shadow-[0_4px_12px_rgba(0,0,0,0.02)] p-4 px-5 rounded-[22px]"
                    }`}
                >
                  {msg.content}
                </div> */}

                {index === 0 && (
                  <div className="grid grid-cols-2 gap-2.5 mt-4 max-w-[460px] w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {[
                      "🚗 주차장 이용 팁이 궁금해",
                      "🚶‍♂️ 근처에 같이 갈 만한 곳은?",
                      "🍰 가장 인기 있는 메뉴 추천해줘",
                      "👨‍👩‍👧‍👦 가족과 같이 가기 괜찮아?"
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSend(prompt)}
                        className="text-left text-[13px] font-semibold text-slate-600 bg-white border border-slate-200/80 p-3.5 rounded-xl hover:border-[#9D8F7B] hover:bg-[#FEFDFC] hover:text-[#9D8F7B] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#9D8F7B] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_4px_12px_rgba(157,143,123,0.25)]">
                <MessageSquare size={16} className="text-white" />
              </div>
              <div className="pt-2 pl-1 max-w-full">
                <Loader2 size={18} className="text-slate-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        <div className="p-6 bg-[#FEFDFC] border-t border-[#F2F1EC] mt-auto">
          <div className="relative flex items-center bg-[#F5F3EC] border border-[#EFECE5] rounded-2xl p-1.5 focus-within:ring-4 focus-within:ring-[#9D8F7B]/10 focus-within:border-[#9D8F7B]/60 focus-within:bg-white transition-all duration-200">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`'${placeName}'에 대해 무엇이든 물어보세요`}
              className="w-full pr-14 pl-4 py-4 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] font-medium text-slate-800 outline-none placeholder:text-slate-400"
              disabled={isSending}
            />

            <Button
              type="submit"
              onClick={() => handleSend()}
              size="icon"
              disabled={isSending || !input.trim()}
              className="rounded-xl bg-[#9D8F7B] hover:bg-[#8B7B6B] text-white w-10 h-10 transition-all disabled:opacity-30 shadow-none flex-shrink-0"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


// Suspense 래퍼
export default function ReviewSplitPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen w-full items-center justify-center bg-[#EFECE5]">
          <Loader2 className="w-10 h-10 text-slate-600 animate-spin" />
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
