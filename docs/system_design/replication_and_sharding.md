# Replication and Sharding

Replication keeps copies of the same data on multiple nodes. It solves read scaling, availability, and failover. It does not solve capacity, because each replica holds the full dataset. Leader-follower replication has one leader accepting writes and followers applying the charge stream. The change stream is the replication log, and position in it are log sequence numbers (LSNs). LSN comparison tells two nodes where their histories last agreed.

Acknowledgement timing defines the mode. Asynchronous replication replies to the client before followers confirm, which is fast but can lost an acknowledge write on failover. Synchronous replication waits for followers, which is safer but slower and less available. Majority replication or, semi-synchronous, waits for a majority, which is the middle ground.

This connects to CAP. A partition forces a choice; refuse to serve on minority side (preserving consistency, sacrificing availability there), or serve on both sides (sacrificing consistency, accepting divergence). A system requiring a majority to write is CP. The core danger of async replication plus automatic failover is losing an acknowledge write: the old leader's divergent tail, everything after the last common LSN, is discarded on rejoin, not merged, because merging requires conflict resolution against writes the new leader made during the partition. The fix is to majority overlaps with the acknowledging majority and carries the write forward. The cost is a network round trip per write and unavailability when a majority cannot be formed. There is no configuration with low latency, high availability, and no lost acknowledge writes at once.

Sharding, or partitioning, splits data so no single node holds all of it. Each row is placed by one column, the shard key, which is a single per-table choice. The shard ID is not chosen by the user; Citus assigns it from a cluster-wide counter and uses it only as a label on the physical table.

Shard key choice criteria:

First, match the dominant access pattern. The most frequent and latency-sensitive query should filter on the shard key so it collapses to one shard. Every other query fans out.

Second, sufficient cardinality. Low-cardinality keys produce severe skew, one shard holding nearly everything while others idle.

Third, avoid hot data. Even high-cardinality keys can concentrate traffic if a few values dominate the workload. A large customer or viral product creates a hot shard even when row counts look balanced.

Fourth, co-location. Tables joined together should share a shard key so the join is local.

Fifth, growth and rebalancing. Many small shard are easier to rebalance than a few large ones.

A query filtered on the shard key hashes the literal value and looks up the owning shard range in pg_dist_shard, then the worker in pg_dist_shard_placement. A query not filtered on the shard key has nothing to hash and becomes a scatter-gather, sent to every shard and merged, with extra cost if it sorts or limits. Per-shard skew is measured in rows by counting physical shard tables on workers. The citus_shards.shard_size column is on-disk bytes, dominated by page allocation at small volumes, and should not be used to judge skew.

## Cross-Shard Joins and Co-Location

The lab is a Citus coordinator with two workers, citus-worker-1 and citus-worker-2, in a namespace replication-and-sharding. The orders table has 1000 rows distributed by customer_id across 32 shards, round-robin, 16 per worker. Shard ID's run orders_102008 to orders_102039. Physical shard tables are hidden from default psql listing and must be found via pg_class or Citus views.

State one, non-co-located. order_items was created with primary key (order_id, id) and distributed by order_id, so it was not co-located with orders. The join on i.order_id = o.id filtered by o.customer_id = 42 produced the error "the query contains a join that requires repartitioning." Enabling citus.enabled_repartition_joins per session produced a plan with two MapMergedJob blocks: the orders side had Map Task Count 1 (the customer filter narrowed it to one shard) and Merge Task Count 8; the order_items side had Map Task Count 32 (no order_items shard could be excluded) and Merge Task Count 8. Both sides were re-hashed by order_id into the same 8 temporary shards and joined locally, with results shipped back. The plan printed "Task Shown: None, not supported for re-partitioning queries." The cost is that every order_items row crossed the network despite the query touching one customer. This is the missing co-location made visible.

State two, co-located on customer_id. order_items was rebuilt with a customer_id column added, primary key (customer_id, order_id, id), and distributed by customer_id with colocate_with 'orders'. Both tables then shared colocationid = 2. The added customer_id column is denormalization, carrying a derivable value so related so related rows land together. The original order_id join still failed with the repartitioning error, which is the key finding: co-location only makes joins on the distribution column local. A join on customer_id, the distribution column, produced Task Count 1 on citus-worker-2, reading orders_102035 and order_items_102099 on the smae worker, no MapMergeJob, no shuffle. But the join returns a cross product within the customer, pairing every order with every item of the same customer, which is not intended order-scoped result. Cheap but semantically wrong.

State three, co-located on order_id. Both tables were rebuilt distributed by order_id, co-located via colocate_with. The original order_id join, filtered on id = 42 because the distribution column is now order_id, became local and correct, Task Count, no repartition. But customer_id is no longer the distribution column, so a query filtered on customer_id fans out across all shards. This is the mirror image of state two.

The tradeoff established by the three states: the distribution column fixes which joins are local and which filters route to one shard. Co-location is necessary for a local join but not sufficient, because the join condition must be on the distribution column itself. A join local but on the wrong column returns a cross product rather than the intended result. Choosing the distribution column chooses which access pattern gets the fast path, and no configuration makes every pattern fast.

Co-location status is checked by comparing colocationid in pg_dist_partition; equal values mean co-located. The distribution column is visible in the partkey column of the same view, where varattno gives the column position in the table.

Finally, connections: the client connects only to the coordinator. The coordinator receives SQL, fans out as needed, opens ordinary Postgres connections to the relevant workers, merges results, and returns one result set. The coordinator is both the routing later and the metadata store, since pg_dist_node, pg_dist_shard, and pg_dist_shard_replacement live in its database.
