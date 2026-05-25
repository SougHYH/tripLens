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
  road_address_name: string;
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
        const apiUrl = `/api/places/popular?query=${encodeURIComponent(keyword)}&size=15`;

        const response = await fetch(apiUrl);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPlace = (place: KakaoPlace) => {
    setIsOpen(false);
    setKeyword(place.place_name);
    
    const finalAddress = place.road_address_name || place.address_name || "주소 정보 없음";

    router.push(
      `/review?q=${encodeURIComponent(place.place_name)}&id=${place.id}&address=${encodeURIComponent(finalAddress)}`
    );
  };

  // [핵심 수정] 엔터 키를 눌렀을 때의 동작
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) return;

    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="relative w-full max-w-[950px] mx-auto" ref={dropdownRef}>
      <form
        onSubmit={handleSearch} // 여기서 이동 로직을 통제합니다.
        className="flex w-full items-center bg-white/95 backdrop-blur-md rounded-full p-5 px-10 shadow-[0_20px_60px_rgb(0,0,0,0.2)] border-4 border-[#E2DFD6] transition-all hover:shadow-[0_25px_70px_rgb(0,0,0,0.25)] relative z-[100]"
      >
        <Search className="w-10 h-10 text-slate-400 mr-5" />

        <Input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder="여행지, 호텔, 식당을 검색해보세요"
          className="flex-1 border-0 shadow-none focus-visible:ring-0 !text-[32px] font-bold h-20 bg-transparent text-slate-800 placeholder:text-slate-400"
        />
      </form>
	  
      {/*자동완성 드롭다운*/}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-4 bg-white/98 backdrop-blur-xl rounded-[40px] shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-[999] max-h-[500px] overflow-y-auto custom-scrollbar">
          <ul className="py-6">
            {results.map((place) => (
              <li
                key={place.id}
                onClick={() => handleSelectPlace(place)}
                className="px-10 py-6 hover:bg-blue-50/80 cursor-pointer flex items-start gap-6 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="mt-1 p-3 bg-slate-100 rounded-full text-slate-400">
                  <MapPin size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-[22px] font-bold text-slate-900 leading-tight">
                    {place.place_name}
                  </h4>
                  <p className="text-base text-slate-500 mt-2 font-medium">
                    {place.road_address_name || place.address_name}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}