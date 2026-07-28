# Rate Limiter

## Foundation & Placement

- **Where does a rate limiter live?** At the API gateway / load balancer level, checks request before they hit actual services, avoid wasted compute and duplicated logic across microservices.

- **Not all limits are the same kind:**
  - Global limit (e.g. 10,000 req/sec platform-wide) -> enforced at the load balancer.
  - Per-user and per-endpoint limits -> enforced at the API/gateway level, since they need finer-grained identity/context.

- **How gateway identity users:** via JWT or cached token lookups, avoiding hits to the primary database on every request.

## Distributed Counters & Race Conditions

- **Why local in-memory counters fail:** if each gateway server keeps it's own counter, the effective rate limit silently multiplies by the number of gateway servers, a user could get N× their intended limit depending on load balancing. **Fix:** shared state via fast key-value store (Redis) at the gateway layer. Redis clustering discussed for fault tolerance.

- **Race condition:** two gateway doing separate READ-then-WRITE steps on the same counter can both read a stale value and both allow requests that should been rejected. This is a check-then-act / TOCTOU bug.

- **Why locking is the wrong fix:** serializes all gateway traffic through a single point, adding latency and creating a new bottleneck at scale.

- **Increment before checking the limit:** even rejected requests should increment the counter, otherwise bad actors get "free" unlimited retries the never count against them.

## Sliding Window Counter Algorithm

**Why it exists:** Middle ground between sliding window log (exact, but memory-heavy) and fixed window (cheap, but allows boundary bursting).

**How it works?**

- Divide the window into smaller sub-window buckets (e.g. six 10-second buckets for a 60-second window).
- Each bucket stores just a count of requests in that slice, not individual timestamps.
- To estimate requests in the true sliding window:
  - Fully-inside buckets count at face value.
  - The oldest bucket (partially outside the window) gets weighted by how much of it's time range overlaps the window.
  - Formula: `weighted_count = bucket_count * (overlap_fraction)`
  - Assume request are spread evenly within a bucket, that's the source of the approximation.

**Worked example**

- Bucket A (11:59:30-11:59:40, 5 requests), window starts 11:59:35 -> only 50% overlaps -> count as 2.5.
- Buckets B-E fully inside the window -> count in full.
- Current partial bucket (still filling) also included as-is.
- Total = 9.5 requests estimated for the last 60 seconds.

**Accuracy tradeoff**

- Smaller buckets -> closer to sliding window log's precision, but more counters to store/sum.
- Larger buckets -> cheaper, less precise
- It's a tunable dial, not a fixed choice.

**When to use smaller buckets:** sensitive endpoints (e.g. login attempts) where tight enforcement matters more than storage cost.

## Token Bucket

**Refill Mechanics & Atomacity Core Concept**

- Token bucket = a bucket holding tokens up to a max capacity; each request spends 1 token; tokens refill at a steady rate (e.g., 1 token/sec)
- Key behavior: allows burst up to bucket capacity, this is real difference from fixed window/sliding window (which smooth traffic over time instead)
- Example: capacity 10, rate 1/sec. Idle bucket = full(10). A burst of 20 request -> 10 allowed, 10 rejected instantly (no queueing).
- After draining to 0, tokens refill linearly: 5 seconds idle -> 5 tokens back.

**Refill strategy: lazy (on-request) vs. background ticking job**

- Naive idea: a background job ticks every seconds and adds a token to each bucket.
- Problem #1 (efficiency): wasteful to tick constantly across many buckets/users when most see no traffic.
- Problem # 2 (correctness bug - the important one): if multiple rate limiter servers each run their own independent ticking job against the same shared Redis bucket the effective refill rate multiplies. Example: 3 servers each adding 1 token/sec -> bucket actually gets 3 token/sec instead of 1. Rate limit becomes silently wrong, and scales/changes with server count.
- Fix: lazy refill. No ticking job at all. Store only `last_refill_timestamp` and `current_token_count` per user. On each request, compute `elapsed_time x refill_rate` fresh, capped at capacity. Since it's pure math from a timestamp, it gives the same answer no matter which server computes it.

**TOCTOU race condition (echo of session 5, but more complex)**

- Refill logic isn't a single atomic op like `INCR`, it's a multi-step sequence: read count + timestamp -> calculate new tokens -> check if enough -> deduct -> write back.
- Traced example: bucket = 5. Request A and B arrive simultaneously, both read 5, both calculated "enough", both deduct to 4, both write 4. Correct anwer should've been 3 (5 - 1 - 1).
- Danger: bucket's stored count drifts higher than reality over many concurrent requests -> rate limiter silently allows more traffic than configured, defeating the whole purpose of capping bursts.

**Fix: Lua scripting in Redis**

- Plain `INCR` won't work, need conditional + time-based logic bundled into one atomic step.
- Redis solution: Lua scripts. You hand Redis a full script (read -> calculate -> check -> deduct -> write); Redis runs the entire script as one atomic unit, no other command can interleave partway through, regardless of how many servers are calling it.
- Python's role: Python (via redis-py or similar) is the app-code language that calls redis.eval(lua_script, keys, args), it ships the Lua script to Redis and gets back just the final result (allowed/rejected + new count). Python never sees the intermediate steps.
- Lua is required specifically because it's the only language Redis execute internally, Python code itself can't run inside Redis's atomic execution context.

## Leaky Bucket Algorithm

**Core concept**

Leaky bucket controls, not just admission. Picture a bucket with a fixed-size hole at the bottom: incoming requests are "poured in" (queued), and they "leak out" (get processed) at constant, steady rate, regardless of how bursty the input is.

**Two capacity concepts**

1. Queue capacity - max number of requests that can wait at once.
2. Leak rate - fixed pace at which requests are pulled from the queue and processed.

**Behavior under load**

- Requests arriving faster than the leak rate simply wait in the queue (no rejection yet).
- If the queue is completely full, new incoming requets are rejected (429), overflow.
- Requests that do fit in the queue are not processed instantly, they're processed on at a time at the fixed leak rate.
  - Example: leak rate = 5req/sec, burst 20 requests (all within queue capacity) all accepted, but takes 4 seconds to fully drain (20/5)

**Key contrast with token bucket**

Burst handling:

- Token bucket: allowed, processed instantly (if tokens available)
- Leaky bucket: allowed, but queued and drained at fixed rate

Output rate:

- Token bucket: variable/bursty
- Leaky bucket: constant/smooth

Latency under burst:

- Token bucket: low
- Leaky bucket: can be high (queuing delay)

Best for:

- Token bucket: APIs where instant response to legitimate burst matters
- Leaky bucket: protecting fragile downstream systems from spiky load

**Real world use case**

Leaky bucket act as a shock absorber, useful when a downstream dependency (e.g., a bank settlement system system or fraud-detection service behind a payment API) can only safely handle a steady rate of requests and would error out or degrade under a sudden burst. Leaky bucket smooths bursty client traffic into constant, predictable load on that downstream system, even delaying legitimate burst requests rather than rejecting them.

**Latency tradeoff**

Under a burst, later requests in the queue can experience significant added latency (waiting for their turn at the leak rate), whereas token bucket would let them through immediately if capacity allowed. This is the fundamental tradeoff between the two algorithms.

## Implementation Mechanics

**The core problem:**

Unlike fixed window, or token bucket where Redis only ever stores a count or timestamps leaky bucket needs to actually hold and delay requests, not just make an instant allow/deny decision. This means the "queue" needs to store real request data (payload, metadata, maybe a way to return a result later), not just a number.

**Client experience:**

Because leaky bucket processes requests on it's own schedule, the client doesn't stay blocked waiting. Instead, the clients gets an immediate "queued/accepted" response, and the actual result comes later via a webhook or polling. This decouples the caller from the bucket's internal drain rate.

**The durability gap in plain Redis:**

A simple Redis list (LPUSH/RPOP) is not safe against loss. RPOP is destructive the moment an item is popped, Redis has no record it ever existed. If a worker crashes between popping an item and finishing it's processing, that item is gone permanently, with no way to detect or retry it.

**What dedicated messages queues add:**

Systems like SQS, RabbitMQ, or Kafka provide at least-once delivery through an ack-based flow:

1. Consumer pulls a message
2. Message becomes invisible to other consumers (not deleted)
3. Consumer processes it
4. Consumer explicitly acknoledges success
5. Only then is the message deleted

If the consumer crashes before acking, the message becomes visible again and gets redelivered.

**Key insights, durability requirement depends on what's being rate limited, not on the algorithm itself:**

- Low stakes queues (e.g. login attempts): losing a queued item is cheap. The user notices instantly (stuck screen) and just retries manually. Plain Redis is fine here.

- High-stakes queues (e.g. payment submissions): losing a queued item is expensive and silent. The user believes they paid; nobody knows entry. This needs a dedicated MQ with at least once delivery guarantees.

**Big takeaway:**

The rate limiting algorithm (leaky bucket) governs how traffic is shaped/smoothed. That durability requirement (Redis list vs. dedicated MQ) is a separate, orthogonal decision governed by the cost of silently losing a queued item. "Should we use a third-party queue" isn't really a rate-limiting question, it's a data-criticality question.
