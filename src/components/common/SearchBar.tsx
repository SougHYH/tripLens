"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SearchBar() {
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      alert("검색어를 입력해주세요!");
      return;
    }
    router.push(`/review?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="flex w-full items-center bg-white rounded-3xl border-2 border-slate-100 shadow-2xl shadow-blue-100 p-2 hover:border-blue-200 transition-colors"
    >
      <Search className="w-8 h-8 text-slate-400 ml-4" strokeWidth={1.5} />

      <Input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="여행지, 호텔, 식당 등을 입력해보세요"
        className="flex-1 border-0 shadow-none focus-visible:ring-0 text-2xl lg:text-3xl font-bold h-auto py-8 px-6 text-slate-800 placeholder:text-slate-300 bg-transparent"
      />

      {/* 검색 버튼 */}
      <Button
        type="submit"
        className="rounded-[24px] px-14 py-8 text-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
        리뷰 검색
      </Button>
    </form>
  );
}

