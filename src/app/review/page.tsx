"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Star, MapPin, Send, ThumbsUp, ThumbsDown, GripVertical, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getReviewAnalysisByKeyword, sendChatMessage } from "@/services/reviewService";
import { ReviewAnalysis, ChatMessage } from "@/types";

// useSearchParams()를 사용하는 컴포넌트는 Suspense로 감싸야 빌드 통과
function ReviewContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const placeId = searchParams.get("id") || "";
  const address = searchParams.get("address") || "";

  const [placeName, setPlaceName] = useState(query || "장소 검색 중...");
  const [isFavorite, setIsFavorite] = useState(false);

  // ── 리뷰 분석 상태 ──
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── 채팅 상태 ──
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `${query ? `'${query}'` : "이 장소"}에 대해 무엇이든 물어보세요!\n예: '주차장 있어?', '아이랑 가기 좋아?'`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── 리뷰 분석 데이터 fetch ──
  const fetchAnalysis = () => {
    if (!query) {
      setIsLoadingAnalysis(false);
      return;
    }
    setPlaceName(query);
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    getReviewAnalysisByKeyword(query)
      .then((data) => setAnalysis(data))
      .catch(() => setAnalysisError("리뷰 분석 데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoadingAnalysis(false));
  };

  useEffect(() => {
    fetchAnalysis();
  }, [query]);

  // ── 채팅 자동 스크롤 ──
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 메시지 전송 ──
  const handleSend = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);

    try {
      const targetPlaceId = placeId || analysis?.placeId || query;
      const reply = await sendChatMessage(targetPlaceId, updatedMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "서버와 연결이 끊어졌습니다. 다시 시도해주세요." },
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
            <span className="text-slate-800">'{placeName}'</span>
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
    <div className="flex h-screen w-full bg-[#EFECE5] text-slate-950 font-sans tracking-tight overflow-hidden">

      {/*[좌측] 리뷰 분석 영역 (60%)*/}
      <section className="w-full lg:w-[60%] h-full overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* 에러 상태 */}
          {analysisError && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-red-400 font-medium">{analysisError}</p>
              <Button variant="outline" onClick={fetchAnalysis}>
                다시 시도
              </Button>
            </div>
          )}

          {/* 분석 데이터 표시 */}
          {!analysisError && analysis && (
            <>
              {/* 장소 헤더 */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="flex items-center gap-1.5 mb-2.5 select-none">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-[#9D8F7B] text-white shadow-sm">
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-[13px] font-extrabold text-[#9D8F7B] tracking-wide">
                      AI 리뷰 분석 완료
                    </span>
                  </div>

                  {/* 장소 이름과 즐겨찾기 별 */}
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter leading-none">
                      {placeName}
                    </h1>
                    <button
                      onClick={() => setIsFavorite(!isFavorite)}
                      className="flex items-center justify-center p-1.5 rounded-full hover:bg-slate-100 transition-all focus:outline-none"
                      aria-label="즐겨찾기 추가"
                    >
                      <Star
                        size={30}
                        strokeWidth={isFavorite ? 1.5 : 2}
                        className={`transition-all duration-300 ${
                          isFavorite
                            ? "fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                            : "text-slate-300 hover:text-slate-400"
                        }`}
                      />
                    </button>
                  </div>

                  {address && (
                    <div className="flex items-center text-slate-500 font-medium text-sm mt-2">
                      <MapPin size={16} className="mr-1" />
                      {address}
                    </div>
                  )}
                </div>

                {/* 별점 및 리뷰 수 */}
                <div className="bg-[#FEFDFC] px-6 py-4 rounded-[24px] shadow-sm border border-[#F2F1EC] flex flex-col items-center">
                  <div className="flex items-center text-amber-500 mb-1">
                    <Star className="w-6 h-6 fill-amber-500 mr-1.5" />
                    <span className="text-3xl font-black text-slate-950">{analysis.rating || "0.0"}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold">리뷰 {analysis.reviewCount || 0}개</span>
                </div>
              </div>

              {/* AI 핵심 요약 */}
              <div className="bg-[#FEFDFC] rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#F2F1EC]">
                <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
                  <span className="bg-slate-800 text-white p-2 rounded-lg text-sm">✨</span>
                  AI 핵심 요약
                </h3>

                <div className="space-y-8">
                  {analysis.summary && analysis.summary.length > 0 ? (
                    <>
                      {/* 1단락: 장소 전반적인 분위기 및 핵심 특징 */}
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

                      {/* 2단락: 시설, 서비스, 청결도 등 구체적인 이용 만족도 */}
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

                      {/* 3단락: 주차, 예약, 대기시간 등 방문 전 알아야 하는 정보 */}
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
                    <p className="text-slate-400">요약 데이터를 불러오는 중입니다...</p>
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
              <div className="bg-[#FEFDFC] rounded-[32px] px-8 py-6 shadow-sm border border-[#F2F1EC]">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-slate-400 font-bold text-sm">방문자 반응 분석</h3>
                  <div className="text-2xl font-black text-slate-800">
                    긍정 {analysis.sentiment?.positiveRatio || 0}%
                  </div>
                </div>

                {/* 게이지 바 */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${analysis.sentiment?.positiveRatio || 0}%` }}
                  />
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${100 - (analysis.sentiment?.positiveRatio || 0)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs font-bold text-slate-400 mt-3">
                  <div className="flex items-center gap-1.5 line-clamp-1 flex-1 pr-2">
                    <ThumbsUp size={14} className="flex-shrink-0" />
                    {analysis.sentiment?.positiveKeywords?.join(", ") || "데이터 없음"} ({analysis.sentiment?.positiveCount || 0}건)
                  </div>
                  <div className="flex items-center gap-1.5 line-clamp-1 text-right flex-shrink-0">
                    <ThumbsDown size={14} className="flex-shrink-0" />
                    {analysis.sentiment?.negativeKeywords?.join(", ") || "데이터 없음"} ({analysis.sentiment?.negativeCount || 0}건)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/*[우측] 채팅창 영역 (40%)*/}
      <section className="hidden lg:flex w-[40%] bg-[#FEFDFC] border-l border-[#F2F1EC] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10">
        <div className="p-7 border-b border-[#F2F1EC] bg-[#FEFDFC]/80 backdrop-blur-sm z-20 flex justify-between items-center">
          <div>
            <h2 className="text-[17px] font-black text-slate-950 flex items-center gap-2">
              <MessageSquare className="text-slate-800" size={18} />
              여행 돋보기 어시스턴트
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">리뷰 데이터를 기반으로 답변합니다.</p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-500 rounded-full">
            <GripVertical size={20} />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#F9F7F2] custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3.5 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-slate-950">
                  <MessageSquare size={16} className="text-white" />
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
                <MessageSquare size={16} className="text-white" />
              </div>
              <div className="p-5 rounded-[20px] shadow-sm border bg-white text-slate-700 rounded-tl-sm border-slate-100">
                <Loader2 size={16} className="text-slate-400 animate-spin" />
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
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={`'${placeName}'에 대해 무엇이든 물어보세요`}
              className="w-full pr-16 pl-7 py-7 rounded-full bg-[#F2F1EC] border-transparent focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-0 focus-visible:border-transparent text-[15px] font-medium text-slate-800 outline-none"
              disabled={isSending}
            />
            <Button
              type="submit"
              onClick={handleSend}
              size="icon"
              disabled={isSending || !input.trim()}
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

// Suspense 래퍼 — useSearchParams() 빌드 오류 방지
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
