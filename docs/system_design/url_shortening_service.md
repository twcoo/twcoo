# URL Shortening Service

## 1. Core Operations & Read/Write Separation

```text
Two operations: shorten (write,rare) and redirect (read, extremely frequent).
Redirects dominate traffic -> design is read optimized.
Read and write infrastructure should be separated (CQRS pattern), write path can have lower
resources, read path needs to handle massive concurrent load.
Redirect must be sub-milliseconds from the user's perspective.
```

## 2. Caching With Redis

```text
Redis sits in front of the database to serve redirects from memory.
Cache entries are invalidated on update or expire TTL.
LRU eviction keeps hot/frequently-clicked URLS in memory automatically.
Redis is the most critical component - if it goes down, all redirect traffic hits the database directly,
risking a cascading failure.
Run a redis Cluster (primary/replica + sharding) to eliminate single point of failure.
On Redis failure: alert immediately, fall back gracefully to database, vertically scale DB as short-term fix.
```

## 3. Short Code Generation

```text
Random Base62 - unpredictable but suffers collision checks at scale (birthday problem).
Sequential ID - collision-free but enumerable (security risk, business info leakage).
Best approach: Sequential ID + Hashids - bijective encoding, collision free by design, looks random, non-enumerable.
Use Base62 (a-z, A-Z, 0-9) - URL-safe, excludes + and / from Base64
Store only the code (not the full short URL) - domain is constructed at runtime for portability
```

## 4. Database Schema

```text
Two tables:
  urls: id, code, original_url, user_id, created_at, expires_at
  clicks: id, url_id, clicked_at, ip, country, device

Separate clicks table prevents urls table from bloating.
Clicks table is write heavy, every redirect is a new insert
Primary/replica setup: writes -> primary, reads -> replicas.
```

## 5. Async Click Recording

```text
Don't make the user wait for analytics to be written.
Flow: redirect immediately -> publish click event to queue -> worker consumes -> write to DB.
Tools: Celery + RabbitMQ, or cloud alternatives (GCP Pub/Sub, AWS SQS).
Protects the clicks table from becoming a write bottleneck on the hot path.
```

## 6. API Design & Redirect Behaviour

```text
Shorten: POST with body {"url":"..."} - creates a record, not idempotent safe as GET.
Redirect: use 302 (not 301) - browser does not cache, so every click hits your server.
301 would break analytics (browser skips your server after first visit) and prevent URL updates/expiry.
```

## 7. Rate Limiting

```text
POST - limits junk URL creation, protects database writes.
GET - limits DDoS amplication (your service used to flood a third party target) and phishing link abuse.
Layer multiple keys simultaneously: per IP + per link + global
Enforect at the gateway layer (nginx-gateway RateLimitPolicy) - reject cheaply before traffic reaches django pods.
Return 429 Too Many Requests + Retry-After header so well-behaved clients back off correctly.

```

## 8. Global Scale

```text
Deploy regional edge nodes close to users (e.g. Singapore for PH users) to reduce latency.
Each region has its own local Redis cluster for fast cache hits.
All region write back to a central primary database (or globally distributed DB like CockroachDB).
Consistent hashing distributed data across Redis nodes.
```
