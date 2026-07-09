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
