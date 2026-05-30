"use client";

import {
  useState,
  useEffect,
  useRef,
  KeyboardEvent,
  FormEvent,
} from "react";
import {
  Search,
  MapPin,
  CornerDownLeft,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface KakaoPlace {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
}

export default function SearchBar() {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KakaoPlace[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // ===== 자동완성 API =====
  useEffect(() => {
    const fetchPlaces = async () => {
      if (!keyword.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      try {
        const apiUrl = `/api/places/popular?query=${encodeURIComponent(
          keyword
        )}&size=15`;

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

  // ===== 바깥 클릭 시 닫기 =====
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===== 장소 클릭 =====
  const handleSelectPlace = (place: KakaoPlace) => {
    setIsOpen(false);
    setKeyword(place.place_name);

    const finalAddress =
      place.road_address_name ||
      place.address_name ||
      "주소 정보 없음";

    router.push(
      `/review?q=${encodeURIComponent(
        place.place_name
      )}&id=${place.id}&address=${encodeURIComponent(finalAddress)}`
    );
  };

  // ===== 엔터 검색 =====
  const handleSearch = (e?: FormEvent | KeyboardEvent) => {
    e?.preventDefault();

    if (!keyword.trim()) return;

    setIsOpen(false);

    router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <div className="relative w-full z-[100]" ref={wrapperRef}>
      {/* 검색창 */}
      <form onSubmit={handleSearch}>
        <div
          className={`
            flex items-center w-full h-16 bg-white rounded-full px-6
            transition-all duration-300 border
            ${
              isOpen
                ? "border-[#8C6F5A] shadow-[0_0_0_2px_#8C6F5A]"
                : "border-[#E8E1D5] shadow-sm"
            }
          `}
        >
          <Search
            className="w-6 h-6 text-[#8C6F5A] shrink-0"
            strokeWidth={2.5}
          />

          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(e);
              }
            }}
            placeholder="가고 싶은 장소, 맛집, 호텔을 검색해 보세요"
            className="
              w-full h-full bg-transparent border-none outline-none
              px-4 text-[#1A1C20] text-lg font-bold
              placeholder:text-[#A6ADB5]
              placeholder:font-medium
            "
          />

          {/* X 버튼 */}
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setResults([]);
                setIsOpen(false);
              }}
              className="
                p-1.5 hover:bg-[#F5F2EC]
                rounded-full transition-colors
              "
            >
              <X className="w-5 h-5 text-[#A6ADB5] hover:text-[#8C6F5A]" />
            </button>
          )}
        </div>
      </form>

      {/* 드롭다운 */}
      {isOpen && keyword && (
        <div
          className="
            absolute top-[calc(100%+12px)] left-0 right-0
            bg-white/95 backdrop-blur-2xl
            border border-[#E8E1D5]
            rounded-[2rem]
            shadow-[0_30px_60px_rgba(140,111,90,0.15)]
            overflow-hidden
            animate-in fade-in slide-in-from-top-4
            duration-300
            z-[999]
          "
        >
          {/* 스크롤 영역 */}
          <div
            className="
              max-h-[380px]
              overflow-y-auto
              overscroll-contain
              [&::-webkit-scrollbar]:w-2
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-track]:my-4
              [&::-webkit-scrollbar-thumb]:bg-[#E8E1D5]
              [&::-webkit-scrollbar-thumb]:rounded-full
              hover:[&::-webkit-scrollbar-thumb]:bg-[#D5C3A9]
              transition-colors
              p-3
            "
          >
            {results.length > 0 ? (
              <div className="space-y-1">
                {results.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="
                      w-full flex items-center justify-between
                      p-4 rounded-2xl
                      transition-all duration-300
                      hover:bg-[#F5F2EC]
                      group text-left
                    "
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      {/* 아이콘 */}
                      <div
                        className="
                          w-10 h-10 rounded-full
                          bg-[#FAF8F5]
                          border border-[#E8E1D5]
                          flex items-center justify-center
                          shrink-0
                          group-hover:bg-white
                          group-hover:border-transparent
                          group-hover:shadow-[0_4px_12px_rgba(140,111,90,0.1)]
                          transition-all duration-300
                        "
                      >
                        <MapPin
                          className="
                            w-5 h-5
                            text-[#8C6F5A]/60
                            group-hover:text-[#8C6F5A]
                            transition-colors
                          "
                        />
                      </div>

                      {/* 텍스트 */}
                      <div className="flex-1 min-w-0 pr-4">
                        <h4
                          className="
                            text-[16px] font-bold
                            text-[#1A1C20]
                            truncate
                            group-hover:text-[#8C6F5A]
                            transition-colors
                          "
                        >
                          {place.place_name}
                        </h4>

                        <p
                          className="
                            text-[13px]
                            font-medium
                            text-[#7A7E86]
                            truncate mt-0.5
                          "
                        >
                          {place.road_address_name ||
                            place.address_name}
                        </p>
                      </div>
                    </div>

                    {/* 호버 화살표 */}
                    <div
                      className="
                        opacity-0
                        group-hover:opacity-100
                        -translate-x-2
                        group-hover:translate-x-0
                        transition-all duration-300
                        text-[#8C6F5A]
                        shrink-0
                        bg-white
                        p-1.5
                        rounded-full
                        shadow-sm
                      "
                    >
                      <CornerDownLeft className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-[#7A7E86]">
                <MapPin className="w-8 h-8 text-[#E8E1D5] mb-3" />

                <p className="font-bold text-[#5C616A]">
                  검색 결과가 없습니다.
                </p>

                <p className="text-sm mt-1">
                  다른 키워드로 검색해 보세요.
                </p>
              </div>
            )}
          </div>

          {/* 하단 안내 */}
          <div
            className="
              border-t border-[#F0EBE1]
              p-4 bg-[#FAF8F5]/80
              flex items-center justify-between
              text-xs font-bold text-[#7A7E86]
            "
          >
            <span className="flex items-center gap-2">
              <span
                className="
                  px-2 py-1 bg-white rounded
                  border border-[#E8E1D5]
                  text-[#2C303A]
                  shadow-sm
                "
              >
                Enter
              </span>
              를 누르면 전체 목록을 볼 수 있습니다.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
