# CAP Theorem

## Setup

A database replicated across two nodes (e.g., Manila and Cebu). A write lands on one node and needs to sync to the other. Until that sync completes, the second node is behind.

## The forced choice during a partition

If the network link between the two node fully severs (a genuine partition, not just a slow sync), the lagging node has exactly two options when it receives a read request, return the data currently has, which may be stale (favoring availability), or refuse to answer until can confirm it has current data, which may mean an error or indefinite downtime (favoring consistency). There is no third option, because the one thing the could resolve the conflict, confirming the other node's current state, exactly what the partition has removed.

## Why this is a theorem, not just a design tip

Consistency, Availability, and Partition tolerance can't all be guaranteed simultaneously, specifically because Partition tolerance means the system must keep functioning even when nodes can't communicate, and the moment that's true, a real partition forces the C vs A choice.

## The tradeoff only applies during an actual partition

When nodes are healthy and fully connected, there's nothing stopping a system from syncing a write to every node before confirming it to the client, giving both full consistency and full availability simultaneously. CAP doesn't mean "you must always sacrifice one," it means "the instant real partition occurs, you are mathematically forced to pick one, for as long as that partition lasts." The real design decision made ahead of time is what the system does in the moment a partition happens, not a permanent system-wide sacrifice.

## The CAP choice should be made per piece of data, not system wide

Different data within the same application carries different consequences for being wrong. A shopping cart update, a minor inconvenience, favors availability, since stale cart data is easily corrected and refusing service loses customers. A payment charge, risking double charges or financial errors, favors consistency, since correctness there matters more than uptime. This naturally maps onto a micro-services architecture, where different services can make different CAP tradeoffs for their own data (e.g., Cart/Order service favors availability, Payment service favors consistency).

## Eventually consistency as middle ground

Rather than strict binary (perfectly consistent or completely unavailable), eventual consistency allows a lagging node to serve stale data temporarily, while guaranteeing that, absent new writes, all nodes will eventually converge to the same correct value. It trades immediate consistency for availability while still promising correctness arrives, just without a strict time bound.

## The real danger of eventual consistency

"Eventually" has no fixed time limit. A concrete example: a customer updates their shipping address, then immediately places an order. If the address update hasn't propagated to the node handling the order yet, the order can be processed with the old, wrong address. Unlike a stale cart (which just needs to refresh), a package already shipped to the wrong address can't be undone, making this a case where unbounded staleness causes real, irreversible harm, not just a display glitch.
