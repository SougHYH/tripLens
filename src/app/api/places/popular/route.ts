import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "카카오 API 키가 설정되지 않았습니다." }, { status: 500 });
  }

  const incoming = request.nextUrl.searchParams;
  if (!incoming.get("query")) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다." }, { status: 400 });
  }

  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  incoming.forEach((value, key) => url.searchParams.set(key, value));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "카카오 API 호출 실패" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
