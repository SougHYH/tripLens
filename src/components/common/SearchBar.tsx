"use client"; // Next.js에서 사용자 상호작용(상태 변화, 라우팅)이 있는 컴포넌트에는 반드시 최상단에 붙여야 합니다.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  // 검색 실행 함수
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 시 페이지가 새로고침 되는 기본 현상을 막아줍니다.
    
    if (!keyword.trim()) {
      alert("검색어를 입력해주세요!"); // 빈칸 검색 방지
      return;
    }

    // 사용자가 입력한 키워드를 달고 검색 결과 페이지로 이동합니다. (예: /search?q=명지대맛집)
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className="flex w-full max-w-2xl items-center bg-white rounded-full border border-gray-300 shadow-sm hover:shadow-md transition-shadow px-4 py-3"
    >
      {/* 돋보기 아이콘 (SVG) */}
      <svg className="w-6 h-6 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>

      {/* 검색어 입력창 */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="어떤 장소의 진짜 리뷰가 궁금하신가요? (예: 강남역 카페)"
        className="flex-1 outline-none text-gray-700 bg-transparent text-lg"
      />

      {/* 검색 버튼 */}
      <button 
        type="submit" 
        className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-full transition-colors"
      >
        검색
      </button>
    </form>
  );
}