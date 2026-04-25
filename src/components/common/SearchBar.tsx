"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
}

export default function SearchBar() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!keyword.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      try {
        // 카카오 API 키
        const KAKAO_API_KEY = "01eabd1f8454eb6cfd9346173fea0d31";
        // 키워드 정확도 기반 검색 (최대 15개)
        const apiUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}&size=15`;

        const response = await fetch(apiUrl, {
          headers: {
            "Authorization": `KakaoAK ${KAKAO_API_KEY}`,
          },
        });

        const data = await response.json();
        setResults(data.documents || []);
        setIsOpen(true);
      } catch (error) {
        console.error("문제가 발생했습니다. 다시 시도해주세요.", error);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchPlaces();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [keyword]);

  // 바깥쪽 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 리스트에서 장소 클릭 시 실행
  const handleSelectPlace = (place: KakaoPlace) => {
    setIsOpen(false);
    setKeyword(place.place_name);
    router.push(
      `/review?q=${encodeURIComponent(place.place_name)}&id=${place.id}`
    );
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      alert("검색어를 입력해주세요!");
      return;
    }
    router.push(`/review?q=${encodeURIComponent(keyword)}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={dropdownRef}>
      <form
        onSubmit={handleSearch}
        className="flex w-full items-center bg-white rounded-3xl border-2 border-slate-100 shadow-2xl shadow-blue-100 p-2 hover:border-blue-200 transition-colors relative z-20"
      >
        <Search className="w-8 h-8 text-slate-400 ml-4" strokeWidth={1.5} />

        <Input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="여행지, 호텔, 식당 등을 입력해보세요"
          className="flex-1 border-0 shadow-none focus-visible:ring-0 text-2xl lg:text-3xl font-bold h-auto py-8 px-6 text-slate-800 placeholder:text-slate-300 bg-transparent"
        />

        {/* <Button
          type="submit"
          className="rounded-[24px] px-14 py-8 text-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">
          리뷰 검색
        </Button> */}
      </form>

      {/* 자동 완성 드롭다운*/}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-50 overflow-hidden z-50 max-h-[450px] overflow-y-auto custom-scrollbar">
          <ul className="py-4">
            {results.map((place) => (
              <li
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="px-8 py-5 hover:bg-blue-50 cursor-pointer flex items-start gap-5 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="mt-1 p-2 bg-slate-100 rounded-full text-slate-400">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-slate-900 leading-tight">{place.place_name}</h4>
                  <p className="text-sm text-slate-500 mt-1.5 font-medium">{place.address_name}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
