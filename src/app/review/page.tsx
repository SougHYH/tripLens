"use client";

import { useState } from "react";
import { MessageSquare, Star, MapPin, Send, ThumbsUp, ThumbsDown, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// 컬러 상수
const COLORS = {
  bg: "#F8FAFC",
  white: "#FFFFFF",
  slate950: "#0F172A",
  slate500: "#64748B",
  slate100: "#F1F5F9",
  blue600: "#2563EB",
  blue50: "#EFF6FF",
  amber500: "#F59E0B",
};

export default function ReviewSplitPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "~에 대해 무엇이든 물어보세요! \n예: '주차장 있어?', '아이랑 가기 좋아?'",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    // 추후 AI 답변 로직 연결
  };

  return (
    // 1. 전체 높이 고정
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-950 font-sans tracking-tight overflow-hidden">
      
      {/*[좌측] 리뷰 분석 영역 (60%)*/}
      <section className="w-full lg:w-[60%] h-full overflow-y-auto p-12 custom-scrollbar">
        <div className="max-w-3xl mx-auto space-y-12">
          
          {/* 1. 장소 헤더 */}
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-3">AI 리뷰 분석 완료</span>
              <h1 className="text-5xl font-black text-slate-950 tracking-tighter mb-2">식당</h1>
              <div className="flex items-center text-slate-500 font-medium text-sm">
                <MapPin size={16} className="mr-1" />
                경기도 용인시
              </div>
            </div>
            {/* 별점 */}
            <div className="bg-white px-6 py-4 rounded-[24px] shadow-sm border border-slate-50 flex flex-col items-center">
              <div className="flex items-center text-amber-500 mb-1">
                <Star className="w-6 h-6 fill-amber-500 mr-1.5" />
                <span className="text-3xl font-black text-slate-950">4.8</span>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">리뷰 124개</span>
            </div>
          </div>

          {/* 2. ai 핵심 요약 영역 */}
          <div className="bg-white rounded-[40px] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-2 rounded-lg text-sm">✨</span>
              AI 핵심 요약
            </h3>
            <p className="text-slate-700 text-xl leading-relaxed font-medium">
              분위기가 좋은 식당입니다. <br/>
              주말에는 웨이팅이 필수입니다.
            </p>
            {/*태그 추가*/}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["#분위기맛집", "#웨이팅필수"].map(tag => (
                <span key={tag} className="text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full hover:bg-slate-100 transition-colors cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          
          {/* 3. 긍정 부정 비율 */}
          <div className="bg-white rounded-[32px] px-8 py-6 shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-slate-400 font-bold text-sm">방문자 반응 분석</h3>
              <div className="text-2xl font-black text-blue-600">긍정 92%</div>
            </div>
            {/* 게이지 바 */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: "92%" }} />
              <div className="h-full bg-red-500 rounded-full" style={{ width: "8%" }} />
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 mt-3">
              <div className="flex items-center gap-1.5"><ThumbsUp size={14}/> 맛, 분위기, 친절도 (114건)</div>
              <div className="flex items-center gap-1.5"><ThumbsDown size={14}/> 주차, 웨이팅 (10건)</div>
            </div>
          </div>

          {/* 스크롤 테스트용 */}
          {/* <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-50 h-60 flex items-center justify-center text-slate-300 font-bold">
            [스크롤 테스트]
          </div> */}
          {/* 하단 여백 */}
          {/* <div className="h-20"></div> */}
        </div>
      </section>

      {/*[우측] 채팅창 영역 (40%)*/}
      <section className="hidden lg:flex w-[40%] bg-white border-l border-slate-100 shadow-[-20px_0_40px_-15px_rgba(0,0,0,0.03)] flex-col h-full z-10">
        
        {/* 1. 채팅 헤더 */}
        <div className="p-7 border-b border-slate-100 bg-white/80 backdrop-blur-sm z-20 flex justify-between items-center">
          <div>
            <h2 className="text-[17px] font-black text-slate-950 flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={18} />
              여행 돋보기 어시스턴트
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">리뷰 데이터를 기반으로 답변합니다.</p>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-500 rounded-full">
            <GripVertical size={20}/>
          </Button>
        </div>

        {/* 2. 채팅 내역 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#FAFAFA] custom-scrollbar">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3.5 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-blue-100">
                  <MessageSquare size={16} className="text-white" />
                </div>
              )}
              <div className={`p-5 rounded-[20px] shadow-sm border text-[14px] leading-relaxed max-w-[80%] whitespace-pre-line 
                ${msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-sm border-blue-500 shadow-md shadow-blue-100" 
                  : "bg-white text-slate-700 rounded-tl-sm border-slate-100"}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* 3. 채팅 입력창 */}
        <div className="p-7 bg-white border-t border-slate-100 mt-auto">
          <div className="relative flex items-center">
            <Input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="~에 대해 무엇이든 물어보세요"
              className="w-full pr-16 pl-7 py-7 rounded-full bg-slate-50 border-transparent focus-visible:ring-2 focus-visible:ring-blue-100 text-[15px] font-medium text-slate-800"
            />
            <Button 
              type="submit" 
              onClick={handleSend}
              size="icon"
              className="absolute right-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 transition-transform hover:scale-105"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>

      </section>

    </div>
  );
}