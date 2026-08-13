# Caching

**Why caching works**: A cache trades storage + lookup cost for skipping recomputation. This only pays off when data has locality, the same value gets requested repeatedly. Long-tail data (free-text search, fully personalized results) has little to no locality, so caching barely helps there. Shared data (trending articles, top-10 lists) has huge locality, so caching helps enormously, cache effectiveness scales with how many requests can share one cached value

**Where a cache can live**, moving from narrow sharing to wide sharing:

- Browser cache: only benefits a single user, limited storage, low control.
- CDN/proxy cache: can be geographically distributed, shared across many users.
- App server in-memory cache (L1): extremely fast (nanosecond reads), but private to that one server process.

**Cache fragmentation:** With multiple app server instances behind a load balancer, each running it's own in-memory cache, you end up with many small disconnected caches instead of one shared one, wasting memory (duplicated data) and hit rate ( a "hit" on server 7 is still a "miss" on server 3)

**Fix: Shared/distributed cache tier (L2):** A separate service like Redis, reachable by all app servers, restores one-copy-shared-by-everyone. Cost: every read now pays a network round trip (sub-millisecond, but 100-1000x slower than local memory) plus the expense of running the service.

**Combining L1 + L2:** Check local in-memory cache first (fast path); fall through to shared Redis cache on a miss; fall through to the database only if both miss. Gets you speed most of the time and a high shared hit rate as backup.

**The real cost of layering caches, invalidation:** When underlying data changes, it may now live in three places: database, L2, and multiple L1s. Keeping them consistent is famously one of the hardest problems in caching.

**Two invalidation strategies, matched to the cost of staleness for that data (not a universal default):**

- TTL-based expiration: data simply expires after a set time and gets refetched. No coordination needed, but staleness can persist up to the TTL window. Good fit for low stakes data like a trending list.

- Active invalidation: the moment data changes, explicitly notify every cache to drop/update it's copy. Needed when staleness is costly (e.g., decision-critical data).

**Broadcast pattern (pub/sub), contrasted with our queue series:** Point to point queues (from the message queue series) deliver a message to exactly one consumer, that's why idempotency and atomic claiming mattered. Pub/sub instead delivers a message to every subscriber simultaneously (e.g., Redis Pub/Sub), useful for telling all 10 app servers "invalidate this key" at once.

**Pub/sub's weakness, fire and forget:** No persistence, no delivery guarantee, no redelivery. If a subscriber is briefly disconnected when a message is published, that message is gone for it permanently, no future event will fix that specific staleness.

**The fix: TTL as a safety net when using active invalidation:** Layer both. Pub/sub gives speed (near-instant invalidation in the happy path); TTL gives a guarantee (a hard ceiling on staleness even if a pub/sub message is dropped). Same principle as replay_count in the DLQ work, never rely on a single mechanism alone for something that matters.

**TTL length tradeoff:** Short TTL -> fresher data but lower hit rate (may evict before reuse happens, defeating the point of caching). Long TTL -> better hit rate/reuse but a longer possible staleness window if invalidation fails or isn't used. The right TTL depends on how often the data actually changes and how much it hurts to serve a stale version.
