// gemini free tier quota with a 20% safety buffer (80% of the real limit).
// each embedded text counts as 1 request, the worst case, since we don't know how google counts batch calls
export const AI_QUOTA = {
    // gemini-3.5-flash-lite: 15 rpm, 500 rpd
    llm: { perMinute: 12, perDay: 400 },
    // gemini-embedding-2: 100 rpm, 1k rpd. shared by chat and ingestion
    embedding: { perMinute: 80, perDay: 800 },
    // ingestion's max share of the embedding quota. the rest is always left for chat, so chat has priority
    ingestion: { perMinute: 60, perDay: 600 },
} as const

// a chat waits at most this long for quota, then fails with AI_BUSY
export const CHAT_MAX_WAIT_MS = 10_000
// max chats waiting for quota at once. more fail with AI_BUSY
export const CHAT_MAX_WAITING = 5

// texts embedded per ingestion batch. must stay below AI_QUOTA.ingestion.perMinute
export const INGESTION_BATCH_SIZE = 20
// tries per ingestion batch when gemini sends a 429
export const INGESTION_MAX_ATTEMPTS = 3
// first backoff wait. doubles on each retry
export const INGESTION_BACKOFF_MS = 5_000

// pause used when gemini sends a 429 without a retry delay
export const GEMINI_DEFAULT_COOLDOWN_MS = 30_000
