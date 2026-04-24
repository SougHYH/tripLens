from pydantic import BaseModel
from typing import List, Literal


class SentimentBreakdown(BaseModel):
    positiveCount: int
    negativeCount: int
    positiveRatio: float
    positiveKeywords: List[str]
    negativeKeywords: List[str]


class ReviewAnalysis(BaseModel):
    placeId: str
    summary: str
    tags: List[str]
    sentiment: SentimentBreakdown
    rating: float
    reviewCount: int
    analyzedAt: str


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    placeId: str
    messages: List[ChatMessage]


class ChatResponse(BaseModel):
    message: str
