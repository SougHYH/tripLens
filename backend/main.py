from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import places, reviews

load_dotenv()

app = FastAPI(
    title="TripLens API",
    description="여행 돋보기 백엔드 API",
    version="0.1.0",
)

# CORS 설정 (Next.js 개발 서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(places.router, prefix="/places", tags=["places"])
app.include_router(reviews.router, prefix="/reviews", tags=["reviews"])


@app.get("/")
def health_check():
    return {"status": "ok", "message": "TripLens API is running"}
