-- PLACES
CREATE TABLE places (
    place_id      TEXT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    address       VARCHAR(200) NOT NULL,
    latitude      FLOAT,
    longitude     FLOAT,
    rating        FLOAT,
    review_count  INT NOT NULL DEFAULT 0,
    tags          TEXT[],
    thumbnail_url TEXT,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REVIEWS (AI 요약 데이터)
CREATE TABLE reviews (
    review_id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    place_id          TEXT NOT NULL REFERENCES places(place_id) ON DELETE CASCADE,
    summary           TEXT NOT NULL,
    tags              TEXT[],
    positive_count    INT NOT NULL DEFAULT 0,
    negative_count    INT NOT NULL DEFAULT 0,
    positive_ratio    FLOAT NOT NULL DEFAULT 0,
    positive_keywords TEXT[],
    negative_keywords TEXT[],
    rating            FLOAT,
    review_count      INT NOT NULL DEFAULT 0,
    analyzed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CACHE
CREATE TABLE cache (
    cache_id   BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    place_id   TEXT NOT NULL UNIQUE REFERENCES places(place_id) ON DELETE CASCADE,
    review_id  BIGINT NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    cached_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- PROFILES
CREATE TABLE profiles (
    id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email      TEXT,
    name       TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAVORITES
CREATE TABLE favorites (
    favorite_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    place_id    TEXT NOT NULL REFERENCES places(place_id),
    memo        VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, place_id)
);

-- QA_SESSIONS
CREATE TABLE qa_sessions (
    session_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    place_id   TEXT NOT NULL REFERENCES places(place_id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- QA_MESSAGES
CREATE TABLE qa_messages (
    message_id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    session_id BIGINT NOT NULL REFERENCES qa_sessions(session_id) ON DELETE CASCADE,
    role       VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 신규 유저 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
