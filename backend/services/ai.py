import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"


# ================================
# 리뷰 텍스트 전처리
# ================================
def _format_reviews(reviews: list[dict]) -> str:
    """리뷰 목록을 GPT 프롬프트용 텍스트로 변환 (수집된 리뷰 전체 전달)"""
    lines = []
    for i, r in enumerate(reviews, 1):
        lines.append(f"{i}. [별점 {r.get('rating', '?')}] {r.get('text', '')}")
    return "\n".join(lines)


# ================================
# 리뷰 분석 (요약 + 태그 + 감성)
# ================================
async def analyze_reviews(reviews: list[dict], place_name: str) -> dict:
    """
    수집된 리뷰를 GPT-4o-mini로 분석합니다.
    반환: summary, tags, sentiment (positiveRatio, keywords 등)
    """
    review_text = _format_reviews(reviews)
    total = len(reviews)

    prompt = f"""
다음은 '{place_name}'에 대한 Google Maps 리뷰 {total}개입니다.

{review_text}

아래 JSON 형식으로 분석 결과를 반환해주세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.
"summary" 필드는 반드시 아래 3가지 테마에 맞춘 3개의 문자열을 가진 배열(List)이어야 합니다.

{{
  "summary": [
    "1단락: 장소의 전반적인 분위기 및 핵심 특징",
    "2단락: 시설, 서비스, 청결도 등 구체적인 이용 만족도",
    "3단락: 주차, 예약, 대기시간 등 방문 전 꼭 알아야 할 정보"
  ],
  "tags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5"],
  "positiveCount": 긍정 리뷰 수,
  "negativeCount": 부정 리뷰 수,
  "positiveRatio": 긍정 비율 (0~100 정수),
  "positiveKeywords": ["긍정 키워드1", "긍정 키워드2", "긍정 키워드3"],
  "negativeKeywords": ["부정 키워드1", "부정 키워드2"]
}}
"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "당신은 여행지 리뷰 분석 전문가입니다. 요청한 JSON 형식만 반환합니다."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    return result


# ================================
# AI 채팅 (원본 리뷰 기반)
# ================================
async def chat_about_place(
    reviews: list[dict],
    place_name: str,
    messages: list[dict],
) -> str:
    """
    리뷰 데이터를 컨텍스트로 사용해 사용자 질문에 답변합니다.
    """
    review_text = _format_reviews(reviews)

    system_prompt = f"""
당신은 '{place_name}'의 리뷰 데이터를 기반으로 답변하는 여행 도우미입니다.
아래는 실제 방문자들의 리뷰입니다. 이 데이터를 바탕으로 사용자 질문에 친절하고 간결하게 답변해주세요.
리뷰에 없는 내용은 "리뷰에서 확인되지 않았어요"라고 솔직하게 말해주세요.

[리뷰 데이터]
{review_text}
"""

    chat_messages = [{"role": "system", "content": system_prompt}]
    chat_messages.extend(messages)

    response = client.chat.completions.create(
        model=MODEL,
        messages=chat_messages,
        temperature=0.7,
        max_tokens=500,
    )

    return response.choices[0].message.content


# ================================
# AI 채팅 (요약 데이터 기반)
# ================================
async def chat_with_summary(
    summary_data: dict,
    place_name: str,
    messages: list[dict],
) -> str:
    """
    AI가 분석한 요약 데이터를 컨텍스트로 사용해 답변합니다.
    원본 리뷰 대비 토큰 사용량이 매우 적어 응답이 빠릅니다.
    """
    summary_text = "\n".join(summary_data.get("summary", []))
    tags = ", ".join(summary_data.get("tags", []))
    pos_keywords = ", ".join(summary_data.get("positive_keywords", []))
    neg_keywords = ", ".join(summary_data.get("negative_keywords", []))
    rating = summary_data.get("rating", "N/A")
    review_count = summary_data.get("review_count", 0)
    positive_ratio = summary_data.get("positive_ratio", 0)

    system_prompt = f"""
당신은 '{place_name}'의 리뷰 분석 데이터를 기반으로 답변하는 여행 도우미입니다.
아래 분석 데이터를 바탕으로 사용자 질문에 친절하고 간결하게 답변해주세요.
데이터에서 확인되지 않는 내용은 "리뷰에서 확인되지 않았어요"라고 솔직하게 말해주세요.

[기본 정보]
별점: {rating} / 5.0 | 리뷰 수: {review_count}개 | 긍정 비율: {positive_ratio}%

[AI 요약]
{summary_text}

[태그]
{tags}

[긍정 키워드]
{pos_keywords}

[부정 키워드]
{neg_keywords}
"""

    chat_messages = [{"role": "system", "content": system_prompt}]
    chat_messages.extend(messages)

    response = client.chat.completions.create(
        model=MODEL,
        messages=chat_messages,
        temperature=0.7,
        max_tokens=500,
    )

    return response.choices[0].message.content
