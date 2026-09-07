-- Database migrations run through pg-migrate or a SQL file
-- Since we define the schema here, this folder keeps versioned SQL DDL.

-- ============================================
-- SCHEMA: url_shortener
-- ============================================

-- ============ users ============
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url    TEXT,
    role          VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============ urls ============
CREATE TABLE IF NOT EXISTS urls (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_url  TEXT NOT NULL,
    short_code    VARCHAR(10) NOT NULL UNIQUE,
    title         VARCHAR(255),
    expires_at    TIMESTAMPTZ,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    click_count   INTEGER NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_urls_user_id    ON urls(user_id);
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at DESC);

-- ============ clicks (analytics) ============
CREATE TABLE IF NOT EXISTS clicks (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_id     UUID NOT NULL REFERENCES urls(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    country    VARCHAR(2),
    device     VARCHAR(20),
    browser    VARCHAR(50),
    referer    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clicks_url_id    ON clicks(url_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created_at ON clicks(created_at DESC);

-- ============ refresh_tokens ============
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token        TEXT NOT NULL UNIQUE,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
