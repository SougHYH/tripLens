"use client";

export default function FavoriteButton({
  name,
  address,
}: {
  name: string;
  address: string;
}) {
  const save = () => {
    let saved = JSON.parse(localStorage.getItem("favorites") || "[]");

    // 기존 데이터가 문자열일 수도 있어서 방어 코드
    saved = saved.map((item: any) =>
      typeof item === "string" ? { name: item, address: "" } : item
    );

    // 중복 체크 (name 기준)
    if (!saved.find((f: any) => f.name === name)) {
      saved.push({ name, address });

      localStorage.setItem("favorites", JSON.stringify(saved));
      alert("즐겨찾기 추가됨!");
    } else {
      alert("이미 있음");
    }
  };

  return (
    <button
      onClick={save}
      className="mt-4 text-xs text-blue-600 hover:underline"
    >
      ⭐ 즐겨찾기 추가
    </button>
  );
}