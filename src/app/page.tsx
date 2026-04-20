"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import SearchBar from "@/components/common/SearchBar";
import FavoriteButton from "@/components/FavoriteButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#E0F2FE] text-slate-950 font-sans tracking-tight">

      {/* 네비게이션 */}
      <nav className="flex items-center justify-between p-6 px-12 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="text-2xl font-black tracking-tighter">여행 돋보기</div>

        <div className="flex items-center space-x-10 text-[13px] font-bold text-slate-500">
          <Link href="/mypage" className="hover:text-blue-600 transition-colors">
            마이페이지
          </Link>

          {/* 임시 제작한 즐겨찾기 버튼 */}
          <Link href="/favorites" className="hover:text-blue-600 transition-colors">
            즐겨찾기(임시버튼)
          </Link>

          <Link
            href="/login"
            className="border-2 border-slate-950 px-6 py-2 rounded-full text-slate-950 hover:bg-slate-950 hover:text-white transition-all"
          >
            로그인
          </Link>
        </div>
      </nav>

      {/* 검색 영역 */}
      <section className="w-full bg-white border-b border-slate-50 pt-8 pb-10 px-12">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <h2 className="text-4xl lg:text-5xl font-black text-slate-950 tracking-tighter mb-8 text-center leading-tight">
            궁금한 장소의 리뷰를 <br className="lg:hidden" />
            <span className="text-blue-600 underline underline-offset-8 decoration-8 decoration-blue-100">
              검색해보세요!
            </span>
          </h2>

          <div className="w-full shadow-2xl shadow-blue-100/50 rounded-3xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* 메인 콘텐츠 */}
      <section className="grid grid-cols-12 gap-12 px-12 py-24 max-w-[1600px] mx-auto w-full h-full items-center">

        {/* 왼쪽 */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-center">
          <h1 className="text-slate-950 leading-[1.1] font-black mb-10">
            <span className="block text-[11vw] lg:text-[140px] tracking-tight">
              여행
            </span>
            <div className="block text-[11vw] lg:text-[140px] tracking-tight flex items-center gap-4">
              돋보기
              <div className="bg-blue-600 p-4 lg:p-6 rounded-[30px] shadow-2xl shadow-blue-200 transform rotate-3 hover:rotate-0 transition-transform duration-300 inline-flex items-center justify-center">
                <Search className="w-12 h-12 lg:w-20 lg:h-20 text-white stroke-[3]" />
              </div>
            </div>
          </h1>

          <p className="text-xl lg:text-2xl text-slate-500 font-light max-w-lg leading-relaxed border-l-4 border-blue-600 pl-6">
            수백 건의 리뷰 일일이 확인하지 말고,<br />
            AI가 분석한 <span className="font-bold text-slate-800">핵심 리뷰</span>만 확인하세요.
          </p>
        </div>

        {/* 오른쪽 카드 */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8 pt-12 lg:pt-0">

          {/* 카드 1 */}
          <div className="bg-white p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
              POPULAR
            </span>

            <p className="text-xl font-bold text-slate-800 leading-tight">
              #명지대역 #분위기좋은 #조용한카페 <br />
              <span className="text-slate-400 font-normal text-sm mt-2 block">
                카페 명암 - 경기도 용인시 처인구 중부대로1299번길 12
              </span>
            </p>

            <FavoriteButton 
              name="카페 명암"
              address="경기도 용인시 처인구 중부대로1299번길 12"
            />
          </div>

          {/* 카드 2 */}
          <div className="bg-white p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50">
            <span className="inline-block bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1 rounded-full mb-4">
              POPULAR
            </span>

            <p className="text-xl font-bold text-slate-800 leading-tight">
              #베이커리 #베이글맛집 #웨이팅필수 <br />
              <span className="text-slate-400 font-normal text-sm mt-2 block">
                코타베이글 - 경기도 용인시 처인구 성산로169번길 5
              </span>
            </p>
            <FavoriteButton 
              name="코타베이글"
              address="경기도 용인시 처인구 성산로169번길 5"
            />
          </div>

        </div>
      </section>

      <footer className="mt-auto py-12 border-t border-slate-100 text-center text-slate-400 text-sm">
        © 2026 캡스톤디자인 3조 코더사이저
      </footer>

    </main>
  );
}