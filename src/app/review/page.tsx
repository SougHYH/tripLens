"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, Star, MapPin, Send, ThumbsUp, ThumbsDown, GripVertical, Bookmark, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SentimentBreakdown {
  positiveCount: number;
  negativeCount: number;
  positiveRatio: number;
  positiveKeywords: string[];
  negativeKeywords: string[];
}

interface ReviewAnalysis {
  placeId: string;
  summary: string[];
  tags: string[];
  sentiment: SentimentBreakdown;
  rating: number;
  reviewCount: number;
  analyzedAt: string;
}

const COLORS = {
  bg: "#EFECE5",
  white: "#FEFDFC",
  slate950: "#0F172A",
  slate500: "#64748B",
  slate100: "#F2F1EC",
  blue600: "#1E293B",
  blue50: "#F1F5F9",
  amber500: "#F59E0B",
};

export default function ReviewSplitPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const placeId = searchParams.get("id") || "";

  const address = searchParams.get("address") || "";

  const [placeName, setPlaceName] = useState(query || "장소 검색 중...");
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  const [analysisData, setAnalysisData] = useState<ReviewAnalysis | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `${query ? `'${query}'` : '이 장소'}에 대해 무엇이든 물어보세요! \n예: '주차장 있어?', '아이랑 가기 좋아?'`,
    },
  ]);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!query) {
        setIsLoading(false);
        return;
      }

      setPlaceName(query);
      setIsLoading(true);

      try {
        const backendUrl = placeId
          ? `http://localhost:8000/reviews/analysis/${placeId}`
          : `http://localhost:8000/reviews/analysis?keyword=${encodeURIComponent(query)}`;

        const response = await fetch(backendUrl);

        if (!response.ok) {
          throw new Error(`백엔드 에러 발생: ${response.status}`);
        }

        const data: ReviewAnalysis = await response.json();
        setAnalysisData(data);

      } catch (error) {
        console.error("데이터 로딩 실패:", error);
        alert("리뷰 분석 데이터를 가져오지 못했습니다. 서버를 확인해주세요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, [query, placeId]);

  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim() || isChatLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsChatLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("http://localhost:8000/reviews/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeId: placeId || query,
          messages: chatHistory
        }),
      });

      if (!response.ok) throw new Error("채팅 응답 실패");

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);

    } catch (error) {
      console.error("채팅 에러:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "서버와 연결이 끊어졌습니다." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 스켈레톤 로딩 화면
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-[#EFECE5]">
        <div className="animate-pulse flex flex-col items-center">
          <h2 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-4 text-center">
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
                    className={`transition-all duration-300 ${isFavorite
                      ? "fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" // 즐겨찾기된 상태
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
                <span className="text-3xl font-black text-slate-950">{analysisData?.rating || "0.0"}</span>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">리뷰 {analysisData?.reviewCount || 0}개</span>
            </div>
          </div>

          {/* ai 핵심 요약 */}
          <div className="bg-[#FEFDFC] rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-[#F2F1EC]">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-2">
              <span className="bg-slate-800 text-white p-2 rounded-lg text-sm">✨</span>
              AI 핵심 요약
            </h3>

            <div className="space-y-6">
              {analysisData?.summary && analysisData.summary.length > 0 ? (
                <>
                  {/* 1단락: 장소 전반적인 분위기 및 핵심 특징 */}
                  {analysisData.summary[0] && (
                    <div className="flex items-start gap-4">
                      <p className="text-slate-700 text-lg leading-relaxed font-medium flex-1">
                        {analysisData.summary[0]}
                      </p>
                    </div>
                  )}
                  {/* 2단락: 시설, 서비스, 청결도 등 구체적인 이용 만족도 */}
                  {analysisData.summary[1] && (
                    <div className="flex items-start gap-4">
                      <p className="text-slate-700 text-lg leading-relaxed font-medium flex-1">
                        {analysisData.summary[1]}
                      </p>
                    </div>
                  )}
                  {/* 3단락: 주차, 예약, 웨이팅 여부 등 방문 전 알아야 하는 정보 */}
                  {analysisData.summary[2] && (
                    <div className="flex items-start gap-4">
                      <p className="text-slate-700 text-lg leading-relaxed font-medium flex-1">
                        {analysisData.summary[2]}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-400">요약 데이터를 불러오는 중입니다...</p>
              )}
            </div>
          </div>

          {/* 긍정 부정 비율 */}
          <div className="bg-[#FEFDFC] rounded-[32px] px-8 py-6 shadow-sm border border-[#F2F1EC]">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-slate-400 font-bold text-sm">방문자 반응 분석</h3>
              <div className="text-2xl font-black text-slate-800">긍정 {analysisData?.sentiment.positiveRatio || 0}%</div>
            </div>

            {/* 게이지 바 */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${analysisData?.sentiment.positiveRatio || 0}%` }} />
              <div className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${100 - (analysisData?.sentiment.positiveRatio || 0)}%` }} />
            </div>

            {/* 긍정/부정 키워드 및 카운트 연결 */}
            <div className="flex justify-between text-xs font-bold text-slate-400 mt-3">
              <div className="flex items-center gap-1.5 line-clamp-1 flex-1 pr-2">
                <ThumbsUp size={14} className="flex-shrink-0" />
                {analysisData?.sentiment.positiveKeywords?.join(", ") || "데이터 없음"} ({analysisData?.sentiment.positiveCount || 0}건)
              </div>
              <div className="flex items-center gap-1.5 line-clamp-1 text-right flex-shrink-0">
                <ThumbsDown size={14} className="flex-shrink-0" />
                {analysisData?.sentiment.negativeKeywords?.join(", ") || "데이터 없음"} ({analysisData?.sentiment.negativeCount || 0}건)
              </div>
            </div>
          </div>

        </div>
      </section >

      {/*[우측] 채팅창 영역 (40%)*/}
      < section className="hidden lg:flex w-[40%] bg-[#FEFDFC] border-l border-[#F2F1EC] shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10" >
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
            <div key={index} className={`flex items-start gap-3.5 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-slate-950">
                  <MessageSquare size={16} className="text-white" />
                </div>
              )}
              <div className={`p-5 rounded-[20px] shadow-sm border text-[14px] leading-relaxed max-w-[80%] whitespace-pre-line 
                ${msg.role === "user"
                  ? "bg-slate-800 text-white rounded-br-sm border-slate-100"
                  : "bg-white text-slate-700 rounded-tl-sm border-slate-100"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* 채팅 로딩 */}
          {isChatLoading && (
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-slate-950">
                <MessageSquare size={16} className="text-white" />
              </div>
              <div className="p-5 rounded-[20px] shadow-sm border bg-white text-slate-700 rounded-tl-sm border-slate-100">
                <span className="animate-pulse">...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-7 bg-[#FEFDFC] border-t border-[#F2F1EC] mt-auto">
          <div className="relative flex items-center">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`'${placeName}'에 대해 무엇이든 물어보세요`}
              className="w-full pr-16 pl-7 py-7 rounded-full bg-[#F2F1EC] border-transparent focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-0 focus-visible:border-transparent text-[15px] font-medium text-slate-800 outline-none"
              disabled={isChatLoading}
            />
            <Button
              type="submit"
              onClick={handleSend}
              size="icon"
              className="absolute right-2 rounded-full bg-slate-800 hover:bg-slate-900 text-white w-12 h-12 transition-transform hover:scale-105 disabled:opacity-50"
              disabled={isChatLoading}
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </section >

    </div >
  );
}