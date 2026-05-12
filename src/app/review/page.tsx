"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Search,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  getReviewAnalysisByKeyword,
  sendChatMessage,
  getChatHistory,
} from "@/services/reviewService";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

import { ReviewAnalysis, ChatMessage } from "@/types";

// useSearchParams()를 사용하는 컴포넌트는 Suspense로 감싸야 빌드 통과
function ReviewContent() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q") || "";
  const placeId = searchParams.get("id") || "";
  const address = searchParams.get("address") || "";
  const fromFavorites = searchParams.get("from") === "favorites";

  const [placeName, setPlaceName] = useState(query || "장소 검색 중...");
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── 채팅 상태 ──
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `${query ? `'${query}'` : "이 장소"
        }에 대해 무엇이든 물어보세요!\n예: '주차장 있어?', '아이랑 가기 좋아?'`,
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
    const currentPlaceId = analysis?.placeId || placeId || "";

    if (userId && currentPlaceId) {
      if (isFavorite) {
        await fetch(`${API_URL}/favorites/`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, place_id: currentPlaceId }),
        });
        showToast("즐겨찾기가 취소되었습니다.");
      } else {
        await fetch(`${API_URL}/favorites/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, place_id: currentPlaceId }),
        });
        showToast("즐겨찾기에 추가되었습니다.");
      }
    } else {
      const saved = JSON.parse(localStorage.getItem("favorites") || "[]");
      const validAddress = address && address !== "undefined" ? address : "주소 정보가 없습니다.";
      let updated = [];
      if (isFavorite) {
        updated = saved.filter((f: any) => (typeof f === "string" ? f : f.name) !== query);
        showToast("즐겨찾기가 취소되었습니다.");
      } else {
        updated = [...saved, { name: query, address: validAddress, placeId: currentPlaceId }];
        showToast("즐겨찾기에 추가되었습니다.");
      }
      localStorage.setItem("favorites", JSON.stringify(updated));
    }

    setIsFavorite(!isFavorite);
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
        const analysisData = await getReviewAnalysisByKeyword(query);
        setAnalysis(analysisData);

        const targetPlaceId = placeId || analysisData?.placeId;

        // 즐겨찾기에서 넘어온 경우 채팅 내역 가져오기
        if (fromFavorites && currentUserId && targetPlaceId) {
          try {
            const history = await getChatHistory(currentUserId, targetPlaceId);
            if (history && history.length > 0) {
              setMessages([
                {
                  role: "assistant",
                  content: `${query ? `'${query}'` : "이 장소"}에 대해 무엇이든 물어보세요!\n예: '주차장 있어?', '아이랑 가기 좋아?'`,
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




  //── 리뷰 분석 데이터 fetch ──
  // const fetchAnalysis = () => {
  //   if (!query) {
  //     setIsLoadingAnalysis(false);
  //     return;
  //   }

  //   setPlaceName(query);

  //   setIsLoadingAnalysis(true);
  //   setAnalysisError(null);

  //   getReviewAnalysisByKeyword(query)
  //     .then((data) => setAnalysis(data))
  //     .catch(() =>
  //       setAnalysisError(
  //         "리뷰 분석 데이터를 불러오지 못했습니다."
  //       )
  //     )
  //     .finally(() => setIsLoadingAnalysis(false));
  // };

  // useEffect(() => {
  //   fetchAnalysis();
  // }, [query]);

  // // ── 이전 대화 기록 로드 ──
  // useEffect(() => {
  //   if (!userId || !analysis?.placeId || !fromFavorites) return;
  //   getChatHistory(userId, analysis.placeId)
  //     .then((history) => {
  //       if (history.length > 0) {
  //         setMessages((prev) => [...prev, ...history]);
  //       }
  //     })
  //     .catch(() => { });
  // }, [userId, analysis?.placeId]);




  // ── 채팅 자동 스크롤 ──
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ── 메시지 전송 ──
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);

    setInput("");
    setIsSending(true);

    try {
      const targetPlaceId = analysis?.placeId || placeId || query;

      const reply = await sendChatMessage(
        targetPlaceId,
        updatedMessages,
        userId ?? undefined
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
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
    <div className="flex h-screen w-full bg-[#EFECE5] text-slate-950 font-sans tracking-tight overflow-hidden relative">

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
        {/* 홈 화면으로 가는 로고 */}
        <div className="px-12 py-5 border-b border-[#dcd9d0] bg-[#EFECE5]/80 backdrop-blur-sm z-20 flex items-center">
          <Link href="/">
            <span className="text-2xl font-black text-slate-950 tracking-tighter hover:opacity-70 transition-opacity">
              여행 돋보기
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-12">

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
                        className="flex items-center justify-center p-1.5 rounded-full hover:bg-slate-100 transition-all active:scale-90 focus:outline-none"
                        aria-label="즐겨찾기 추가"
                      >
                        <Star
                          size={30}
                          strokeWidth={isFavorite ? 1.5 : 2}
                          className={`transition-all duration-300 ${isFavorite
                            ? "fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
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
                    <div className="flex items-center text-amber-500 mb-1">
                      <Star className="w-6 h-6 fill-amber-500 mr-1.5" />

                      <span className="text-3xl font-black text-slate-950">
                        {analysis.rating || "0.0"}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-bold">
                      리뷰 {analysis.reviewCount || 0}개
                    </span>
                  </div>
                </div>

                {/* 장소 이미지 */}
                {analysis.thumbnailUrl && (
                  <div className="w-full h-56 rounded-[28px] overflow-hidden shadow-sm border border-[#F2F1EC]">
                    <img
                      src={analysis.thumbnailUrl}
                      alt={placeName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* AI 핵심 요약 */}
                <div className="bg-[#FEFDFC] rounded-[40px] px-10 pb-10 pt-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#F2F1EC]">
                  <div className="mb-4 pb-5 border-b border-[#F2F1EC]">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-slate-400 font-bold text-sm">
                        방문자 반응 분석
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
                    <span className="bg-slate-800 text-white p-2 rounded-lg text-sm">
                      ✨
                    </span>
                    AI 핵심 요약
                  </h3>

                  <div className="space-y-8">
                    {analysis.summary &&
                      analysis.summary.length > 0 ? (
                      <>
                        {analysis.summary[0] && (
                          <div className="flex flex-col items-start gap-3">
                            <h4 className="text-[13px] font-bold text-[#8B7B6B] bg-[#F5F1E8] w-fit px-4 py-1.5 rounded-full tracking-wide">
                              분위기
                            </h4>

                            <p className="text-slate-700 text-[17px] leading-relaxed font-medium">
                              {analysis.summary[0]}
                            </p>
                          </div>
                        )}

                        {analysis.summary[1] && (
                          <div className="flex flex-col items-start gap-3">
                            <h4 className="text-[13px] font-bold text-[#8B7B6B] bg-[#F5F1E8] w-fit px-4 py-1.5 rounded-full tracking-wide">
                              시설&서비스
                            </h4>

                            <p className="text-slate-700 text-[17px] leading-relaxed font-medium">
                              {analysis.summary[1]}
                            </p>
                          </div>
                        )}

                        {analysis.summary[2] && (
                          <div className="flex flex-col items-start gap-3">
                            <h4 className="text-[13px] font-bold text-[#8B7B6B] bg-[#F5F1E8] w-fit px-4 py-1.5 rounded-full tracking-wide">
                              꿀팁
                            </h4>

                            <p className="text-slate-700 text-[17px] leading-relaxed font-medium">
                              {analysis.summary[2]}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-400">
                        요약 데이터를 불러오는 중입니다...
                      </p>
                    )}
                  </div>

                  {analysis.tags && (
                    <div className="mt-10 flex flex-wrap gap-2.5 pt-8 border-t border-slate-50">
                      {analysis.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors cursor-default"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 긍정 부정 비율 */}
                {/* <div className="bg-[#FEFDFC] rounded-[32px] px-8 py-6 shadow-sm border border-[#F2F1EC]">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-slate-400 font-bold text-sm">
                      방문자 반응 분석
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
                </div> */}
              </>
            )}
          </div>
        </div>
      </section>

      {/* [우측] 채팅창 */}
      <section className="hidden lg:flex w-[40%] bg-[#FEFDFC] border-l border-[#F2F1EC] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10">

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

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-slate-500 rounded-full"
          >
            <GripVertical size={20} />
          </Button>
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
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-slate-950">
                  <MessageSquare
                    size={16}
                    className="text-white"
                  />
                </div>
              )}

              <div
                className={`p-5 rounded-[20px] shadow-sm border text-[14px] leading-relaxed max-w-[80%] whitespace-pre-line
                ${msg.role === "user"
                    ? "bg-slate-800 text-white rounded-br-sm border-slate-100"
                    : "bg-white text-slate-700 rounded-tl-sm border-slate-100"
                  }`}
              >
                {msg.content}
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
              className="absolute right-2 rounded-full bg-slate-800 hover:bg-slate-900 text-white w-12 h-12 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send size={18} />
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
