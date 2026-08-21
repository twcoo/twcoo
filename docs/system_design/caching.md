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

## Redis Pub/Sub and the missing durability problem

Cache invalidation via Redis Pub/Sub has a gap when a subscriber misses a broadcast message due to a crash or disconnect. The root cause is that Pub/Sub doesn't store messages anywhere, it only delivers to whoever is connected at the exact instant of publish. If a subscriber isn't listening at the moment, the message is gone permanently, with no way to reclaim it later. This is different from the durable queues like SQS or RabbitMQ, where messages persist in queue until a consumer explicitly processes them, so a reconnecting consumer can always catch up.

The consequence of a missed invalidation is a cache that goes stale silently, no error, no alert, just wrong data being served. Without TTL as a backstop, that staleness can persist indefinitely. This is another instance of the recurring theme across all our topics: correctness problems trace back to non atomicity, silent failure, or missing feedback signals.

We ruled out some tempting but flawed fixes: publishing the invalidation message twice, or publishing more frequently. Neither helps, because the problem isn't message frequently, it's that a disconnected subscriber isn't listening at all during it's downtime, no matter how many messages are sent or how densely packed they are. More publishing just adds load without solving anything.

**The real fix: versioning plus a replayable log**

TTL remains the essential backstop, it puts a hard ceiling on staleness regardless of what else fails. On top of that, the fix is to give the subscriber a way to self-check on reconnect, rather than relying on the publisher to guarantee delivery.

**First piece**: attach a version number (not timestamps) to each piece of data, incremented atomically on every change. Version number are preferred over timestamps because of clock skew, different servers clock can drift relative to each other, so timestamps aren't reliable ordering signal in a distributed system, while a simple incrementing integer has no such ambiguity.

**Second piece:** checking every cached key's version one by one doesn't scale as the number of cached entries grows. The fix is a Redis Stream, an append-only log, distinct from Pub/Sub, where every entry persists after being added (via XADD) and can be range-scanned later (via XRANGE). Each entry gets a monotically increasing ID. The publisher appends a signal to the stream on every data change, just the key and new version, not the actual data itself. Pub/Sub still fires for anyone currently listening (handles the common case), but the stream is the durable trail.

A reconnecting subscriber remembers the last stream ID it successfully processed (it's "bookmark") and, on reconnect, does a single XRANGE from that bookmark to the present. This returns exactly the keys that changed while it was gone, no full scan needed. It then re-fetches current values for just those keys from the real source of truth. We call this Option A (signal-only in the stream), and contrasted it with Option B (embedding the actual changed data inline in the stream), which risks applying stale intermediate values out of order if a key changed multiple times during the gap. Signal-only avoids the risk entirely, since the subscriber always ends by fetching the current value fresh.

Because streams grow unboundedly, they need trimming (XTRIM), same table-bloat concern as message queues. This creates an open edge case.

## Redis Streams: handling trimmed bookmarks (gap detection)

What happens when a subscriber's bookmark points to a stream ID that's already been trimmed away, e.g. down for 3 days, but the stream only retains 24 hours of history.

Key realization: Redis doesn't error when you `XRANGE` from a trimmed-away ID, it silently returns whatever entries still exist from that point forward. This is dangerous because the result looks complete and valid, with no indication that anything is missing. The subscriber has no way to distinguish "nothing changed in that gap" from "something changed but got trimmed before I could see it."

The fix is to detect the gap before trusting the XRANGE result: fetch the oldest surviving entry ID in the stream cheaply (via `XRANGE stream - + COUNT 1` OR `XINFO STREAM`), and compare it against the subscriber bookmark. If the bookmark is older than the oldest surviving entry, there's an unrecoverable gap, some unknown set of keys changed and that history is gone. If the bookmark is still within range, proceed normally with `XRANGE bookmark +`.

Once a gap is detected, the subscriber cannot know precisely which key were affected, so partial/targeted recovery isn't possible. The only safe move is to widen scope: flush the entire local L1 cache (or bulk-resync from L2/database) and let it rebuild via normal cache-aside reads, then reset the bookmark to the current latest stream ID so the subscriber doesn't stay perpetually behind. This trades a bounded, visible cost (indefinite silent staleness), the same correctness-over-efficiency shape that's recurred across rate limiting, queues, and now caching.

**Why Option A (signal-only stream) beats Option B (data inline in stream)**

Beyond the ordering-safety issued covered earlier, two more reasons favor Option A (stream entries carry just key + version, not the full record):

- **Payload size:** Option B means every `XADD` carries the full record (name, price, description, etc.), even when only one field changed. This bloats Redis's in-memory storage, which is expensive per byte, especially as multiple versions accumulate before trim. Options A's entries are tiny and fixed-size regardless of the actual record's size.

- **Multiple subscriber:** With Option A, N subscriber all doing cheap `XRANGE` reads of small key+version entries, Redis cost stays flat regardless of subscriber count. With Option B, every subscriber pulls full payloads for every entry, even for products they may not care about, so cost scales with both subscriber count and record size. The real data movement in Option A happens as a standard, well-optimized DB point-read per subscriber when it actually needs fresh data, a much cheaper place to pay the cost than bloating the shared stream everyone reads through.
