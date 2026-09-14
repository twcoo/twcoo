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

> Health checks (accurate pool of eligible servers) -> round robin (simple, blind to load) -> weighted round robin (fixes static capacity, not dynamic spikes) -> least connections (live, self-adjusting signal, no pre-configuration required)
