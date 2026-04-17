"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Star, MapPin, Send, ThumbsUp, ThumbsDown, GripVertical, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getReviewAnalysisByKeyword, sendChatMessage } from "@/services/reviewService";
import { ReviewAnalysis, ChatMessage } from "@/types";

export default function ReviewSplitPage() {
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q") ?? "";

  // ── 리뷰 분석 상태 ──
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── 채팅 상태 ──
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `"${keyword}"에 대해 무엇이든 물어보세요!\n예: '주차장 있어?', '아이랑 가기 좋아?'`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ── 리뷰 분석 데이터 fetch ──
  const fetchAnalysis = () => {
    if (!keyword) return;
    setIsLoadingAnalysis(true);
    setAnalysisError(null);

    getReviewAnalysisByKeyword(keyword)
      .then((data) => setAnalysis(data))
      .catch(() => setAnalysisError("리뷰 분석 데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoadingAnalysis(false));
  };

  useEffect(() => {
    fetchAnalysis();
  }, [keyword]);

  // ── 채팅 스크롤 ──
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
      const placeId = analysis?.placeId ?? "3";
      const reply = await sendChatMessage(placeId, updatedMessages);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "죄송해요, 잠시 오류가 발생했어요. 다시 시도해주세요." },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-950 font-sans tracking-tight overflow-hidden">

      {/* ── 좌측: 리뷰 분석 영역 (60%) ── */}
      <section className="w-full lg:w-[60%] h-full overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* 로딩 상태 */}
          {isLoadingAnalysis && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              <p className="text-slate-400 font-medium">"{keyword}" 리뷰 분석 중...</p>
            </div>
          )}

          {/* 에러 상태 */}
          {!isLoadingAnalysis && analysisError && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-red-400 font-medium">{analysisError}</p>
              <Button variant="outline" onClick={fetchAnalysis}>
                다시 시도
              </Button>
            </div>
          )}

          {/* 분석 데이터 표시 */}
          {!isLoadingAnalysis && analysis && (
            <>
              {/* 1. 장소 헤더 */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-3">
                    AI 리뷰 분석 완료
                  </span>
                  <h1 className="text-5xl font-black text-slate-950 tracking-tighter mb-2">
                    {keyword}
                  </h1>
                  <div className="flex items-center text-slate-500 font-medium text-sm">
                    <MapPin size={16} className="mr-1" />
                    {analysis.reviewCount}개의 리뷰 분석 완료
                  </div>
                </div>
                {/* 별점 */}
                <div className="bg-white px-6 py-4 rounded-[24px] shadow-sm border border-slate-50 flex flex-col items-center">
                  <div className="flex items-center text-amber-500 mb-1">
                    <Star className="w-6 h-6 fill-amber-500 mr-1.5" />
                    <span className="text-3xl font-black text-slate-950">{analysis.rating}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold">리뷰 {analysis.reviewCount}개</span>
                </div>
              </div>

              {/* 2. AI 핵심 요약 */}
              <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="bg-blue-600 text-white p-2 rounded-lg text-sm">✨</span>
                  AI 핵심 요약
                </h3>
                <p className="text-slate-700 text-xl leading-relaxed font-medium whitespace-pre-line">
                  {analysis.summary}
                </p>
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {analysis.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors cursor-default"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* 3. 긍정/부정 비율 */}
              <div className="bg-white rounded-[32px] px-8 py-6 shadow-sm border border-slate-50">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-slate-400 font-bold text-sm">방문자 반응 분석</h3>
                  <div className="text-2xl font-black text-blue-600">
                    긍정 {analysis.sentiment.positiveRatio}%
                  </div>
                </div>
                {/* 게이지 바 */}
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-700"
                    style={{ width: `${analysis.sentiment.positiveRatio}%` }}
                  />
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${100 - analysis.sentiment.positiveRatio}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 mt-3">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp size={14} />
                    {analysis.sentiment.positiveKeywords.join(", ")} ({analysis.sentiment.positiveCount}건)
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ThumbsDown size={14} />
                    {analysis.sentiment.negativeKeywords.join(", ")} ({analysis.sentiment.negativeCount}건)
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 우측: 채팅창 영역 (40%) ── */}
      <section className="hidden lg:flex w-[40%] bg-white border-l border-slate-100 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10">

        {/* 채팅 헤더 */}
        <div className="p-7 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-20 flex justify-between items-center">
          <div>
            <h2 className="text-[17px] font-black text-slate-950 flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={18} />
              여행 돋보기 어시스턴트
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">리뷰 데이터를 기반으로 답변합니다.</p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-500 rounded-full">
            <GripVertical size={20} />
          </Button>
        </div>

        {/* 채팅 내역 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAFAFA] custom-scrollbar">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3.5 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-blue-100">
                  <MessageSquare size={16} className="text-white" />
                </div>
              )}
              <div
                className={`p-5 rounded-[20px] shadow-sm border text-[14px] leading-relaxed max-w-[80%] whitespace-pre-line
                ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm border-blue-500 shadow-md shadow-blue-100"
                    : "bg-white text-slate-700 rounded-tl-sm border-slate-100"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* AI 답변 로딩 인디케이터 */}
          {isSending && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-100">
                <MessageSquare size={16} className="text-white" />
              </div>
              <div className="p-5 rounded-[20px] bg-white border border-slate-100 shadow-sm">
                <Loader2 size={16} className="text-blue-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* 채팅 입력창 */}
        <div className="p-7 bg-white border-t border-slate-100 mt-auto">
          <div className="relative flex items-center">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="궁금한 점을 물어보세요"
              disabled={isSending}
              className="w-full pr-16 pl-7 py-7 rounded-full bg-slate-50 border-transparent focus-visible:ring-2 focus-visible:ring-blue-100 text-[15px] font-medium text-slate-800 disabled:opacity-50"
            />
            <Button
              type="submit"
              onClick={handleSend}
              size="icon"
              disabled={isSending || !input.trim()}
              className="absolute right-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
