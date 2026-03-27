import SearchBar from "@/components/common/SearchBar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          여행돋보기 🔍
        </h1>
        <p className="text-lg text-gray-600">
          AI가 구글 맵스 리뷰를 분석해 진짜 장단점만 요약해 드립니다.
        </p>
      </div>

      {/* 방금 만든 SearchBar 컴포넌트를 여기에 꽂아 넣습니다. */}
      <SearchBar />
    </main>
  );
}