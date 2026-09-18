# Load Balancing

5 identical instances of an Order service running behind something that distributes client traffic, since one server can no longer handle the load alone.

## Why clients can't pick a server directly

If clients cache or hardcode a specific server's address and that server goes down, the client has no way to detect the failure or reroute, there's no central point with visibility into which servers are actually healthy. A load balancer solves this by stting in front of all instances, clients only ever talk to the load balancer's address, and it decides per-request which healthy instance handles it.

## Health Checks

The load balancer needs to know which instances are actually alive before it can route to them. Periodic pings (often to a dedicated `/health` endpoint), with a timeout + consecutive-miss threshold before marking an instance unhealthy and pulling it out of rotation, adding it back once it responds again.

## Round Robin

Cycling through the healthy pool in strict repeating order gives every instance an equal count of requests, but not equal work. Two failure modes: (1) unequal server capacity, a beefier server gets the same request count as a weaker one, despite being able to handle more, (2) unpredictable request cost, if by chance one instance keeps landing expensive requests (e.g., report generation) while another keeps getting cheap ones (simple lookups), the "expensive" instance becomes overwhelmed and overloaded while the other sits underutilized, even though both received the same number of requests.

## Weighted Round Robin

Fixes capacity, not load spikes. A static, pre-configured weight (e.g., "instance A gets 2x the requests of instance B") fixes the unequal-capacity problem, but does nothing for the unpredictable expensive-vs-cheap request problem, since that's about which specific requests land where, not raw server capacity.

## Least connections

The live, self correcting fix. Instead of a static weight, the load balancer tracks how many requests each instance is currently handling (in-flight, not yet responded to) and routes each new request to whichever healthy instance has the fewest in-flight connections. This self-corrects both problems without any pre-configuration: a server stuck on an expensive request keeps an elevated in-flight count, naturally causing the load balancer to route subsequent requests elsewhere, a faster or beefier server churns through requests quicker, dropping it's in-flight count back down faster, so it naturally receives more over time proportional to it's actual throughput.

## Sticky sessions

The load balancer remembers which server a client was first routed to (via IP hash or a cookie) and pins all of that client's subsequent requests to that same server for the duration of their session. This fixes the immediate consistency problem, but at a real cost. For that specific client, the load balancer's dynamic, real-time rebalancing (least connections, etc.) is effectively disabled, if their pinned server becomes overloaded, or crashes entirely, that client has no fallback and either suffers degraded performance or loses their session outright, the same failure mode as the original problem, just delayed.

## Externalized session state

Instead of storing cart/session data in any server's local memory, store it in a shared, durable store (a database, or commonly Redis for fast shared access), keyed by something like a `session_id` or `cart_id` passed with each request. Every instance becomes stateless with respect to session data, any instance can handle any request for any client, since none of them hold anything locally. This keeps dynamic load balancing fully effective with no downside, and survives individual server crashes without losing session data.

## Why stick sessions still get used despite being the weaker fix

Sticky sessions require no application code changes (works with legacy code that assumes local-memory state), avoid the network round-trip cost of reading/writing shared state on every request (relevant for latency-sensitive cases), and are simpler/faster to implement than migrating an application to externalized state. Externalized state is the more correct, more resilient design and is generally preferred in modern in modern systems, but costs more upfront engineering effort.

> Health checks (accurate pool of eligible servers) -> round robin (simple, blind to load) -> weighted round robin (fixes static capacity, not dynamic spikes) -> least connections (live, self-adjusting signal, no pre-configuration required) -> sticky sessions (fixes session consistency, sacrifices dynamic rebalancing for that client) -> externalized state (fixes session consistency without sacrificing anything, at the cost of engineering effort).

## Layer 4 vs. Layer load balancing

Layer 4 routes based only on network-level info (source/destination IP and port), it never opens or reads the actual request content, just forwards TCP packets to a backend. Layer 7 operates at the application layer, actually parsing the HTTP request (URL path, headers, cookies, body), enabling routing decisions Layer 4 cannot make at all, like sending `/api/orders` to one set of servers and `api/payments` to a completely different set.

**Speed tradeoff:** Layer 4 is faster per-request since it does minimal parsing; Layer 7 cost more due to full request parsing, but that cost has become mostly a non-issue on modern hardware.

**The real reason Layer 7 became the practical default, even for simple single-service setups:** with HTTPS being the near-universal default, a Layer 4 load balancer is completely blind to everything inside every request, since it never decrypts anything, it can't do content-aware health checks (on;y "is the port open"), can't log which URL paths are erroring, and can't do cookie-based routing. Layer 7 typically terminates TLS itself, decrypts and inspects the request, and forwards on, giving real visibility and smarter routing/heath checks even for a single backend service. Layer 4 now mostly reserved for extremely high-throughput, non HTTP traffic (raw TCP streams, certain database protocols, gaming traffic) where content visibility isn't needed at all.

## Consistent Hashing

**The problem with plain hash-based routing:** `hash(ip)%N` (e.g., `%5` fro 5 servers) deterministically assigns each client to a server bucket without the load balancer needing to store a lookup table. But when N changes (e.g., scaling from 5 to servers), modulo arithmetic doesn't preserve nearby relationships, worked examples showed that changing the divisor reassigns nearly every client to a different bucket, with only roughly 1/N of clients coincidentally landing on the same server as before. Consequence: Adding or removing even one server triggers a mass, system-wide cache/session invalidation event, causing a flood of cache misses hitting the backend right at the moment you're trying to scale.

## Consistent hashing's ring model

- Instead of hashing into flat buckets 0 to N-1, imagine a circular ring of values.
- Each server is hashed (`hash("server-A")`, etc.) to determine it's position on the ring.
- Each client is hashed (`hash(client_ip)`) to determine its position on the same ring.
- Routing rule: starting from the client's ring position, walk clockwise until hitting the first server, that's the assigned server.
