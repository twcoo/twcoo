# Consensus And Leader Election

## Why not a hardcoded, permanent leader

A fixed leader creates a single point of failure, if that one server crashes or reboots, the job stops entirely with no fallback, making the whole cluster's availability hostage to one machine's uptime.

## Failure detection, heartbeats

Followers need a way to detect a dead leader without any centralized status service (a centralized log/database just relocates the single-point-of-failure problem). The mechanism is a heartbeat, periodic liveness pings between leader and followers. A single missed heartbeat is ambiguos (could be a network blip, GC pause, temporary slowness), so real systems use a timeout duration plus a consecutive-miss threshold before declaring a leader dead, the same "how long do you wait before concluding something's not back" shape as visibility timeouts in message queues.

## The core tradeoff, detection speed vs false positives

To agressive (e.g. declare dead after 1 missed ping) risk false failure detection during ordinary network blips, causing uncessarry leader chrun ("flapping"). Too conservative (e.g., 10-minute threshold) means real outages go unaddressed longer, extending actual downtime. This threshold is a tunable dial, not a fixed constant.

## Split-brain, the central danger

If followers wrongly declare the leader dead during a temporary partition (leader is actually alive, just unreachble), they may elect a new leader while the old one is still acting on its old belief. Not two servers simultaneously believe they're the leader, both may assign order IDs, run jobs, or write conflicting data at the same time, causing genuine data corruption, not just ineffeciency.

## Quorum, the fix for split brain

Require a majority of the total server count (not just "whoever reachable") to agree before a new leader is validated. With 3 total servers, majority = 2. Under any network partition, only one resulting group can ever contain a strict majority of the total, it is mathematically impossible for two separate groups to both reach majority simultaneously, since majority means "more than half" of the same fixed total.

## Why odd numbers of servers

With an even total (e.g., 4 split 2-and-2), a partition can produce a tie where neither side reaches majority, safe from split-brain, but the system becomes fully unable to elect any leader untile the partition heals, sacrficing availability. Odd totals (3,5,7) guarantee any split always leaves one side with strict majority, giving both correctness (no split-brain) and availability (a decisive outcome is always possible).

## Terms (epochs), resolving stale leader ambiguity

A monotonically increasing counter, incremented on every new election, attached to everything a leader does. Rule: any server that sees a term number higher than waht it currently knows immediately defers and treats it's own leadership/knowledge as stale, no need to know why the change happened, just needs the numberic comparison. This is the direct structural analog of the version-number pattern from caching. When a paritioned leader (e.g., A, still on term 5) reconnects and hears about term 6, it must immediately step down, bounding the split brain damage window to just the time until reconnection and term comparison, rather than indefinite.

## Election mechanics, randomized election timeouts

If all followers use identical fixed timeouts before declaring candidacy, they tend to jump into candidacy simultaneously, causing repeated split votes (each votes for itself, no one reaches majority, since each server can cast only one vote per term). The fix: each server waits a randomized timeout before declaring candidacy. Whoever's random timer fires sends vote requets; other who haven't yet declared candidacy themselves grant their vote to the first asker, quickly reaching majority. This randomized makes true simultaneously ties rare rather than the norm, and is deliberately randomized per-server specifically to break symmetry.
