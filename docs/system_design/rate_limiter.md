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
