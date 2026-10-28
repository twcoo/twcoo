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

## Cross-Shard Transaction and Two-Phase Commit

Single-node atomicity relies on the write-ahead log. Changes are written to the WAL and flushed before they touch table files. A transaction commits when its commit record is durable in the WAL, not when the table files update. Recovery replays the WAL to finish or undo. This works because one process on one machine owns both the log and the data and can enforce ordering.

This does not work across shards. If a transaction updates a row on worker 1 and a row on worker 2, each worker has its own WAL. There is no single log containing both changes in order. If one worker commits and the other crashes before commiting, the transaction is partially commited and no local WAL replay can fix it, because each worker only knows its own half.

Two-phase commit prevents this by making workers agree before any of them commits.

Phase one, prepare. The coordinator sends the transaction to every participating worker. Each worker writes the change to its own WAL durably but does not write the commit record. It replies yes or no. A yes means it can still commit or abort, and is forbidden to do either on its own until it hears the decision.

Phase two, commit. Once all yes votes are collected, the coordinator decides commit or abort and writes that decision durably to its own storage before informing any worker. It then sends the decision to every worker, which commits or rolls back.

The coordinator's durable decision record is essential. A worker that crashes after preparing and restarts cannot infer the outcome from its own WAL, because its WAL only records that it prepared. It must ask the coordinator, which must have the decision recorded. This means the coordinator must have persistent storage, and in production is usually replicated.

The cost of two-phase commit is lock hold time and fragility. A prepared worker holds locks on the affected rows until it receives the decision. If the coordinator is slow and unreachable, those locks are held indefinitely and other transactions block. This is an in-doubt transaction. Compared to a single-node transaction, locks are held across network round trips and depend on a remote coordinator, so there are more locks, longer hold times, and more failure modes.

The way to avoid two-phase commit is co-location. If all rows a transaction must update live on the same shard, the transaction is an ordinary local single-node transaction with one WAL and one commit record. No coordinator, no prepare phase, no in-doubt state. Co-location is the same property that makes joins local: tables distributed by the same column put related rows on the same shard.

The shard key threfore does triple duty. It decides which queries route to one shard, which joins are local, and which transaction avoid two-phase commit. All three follow from the same one-column-per-table choice.

Operations that inherently span shards, such as transfer between two customers on different shards, force two-phase commit or a redesign. Common redesigns include making the operation asynchronous, splitting it into two locally atomic steps with a compensating action, or using a saga that records progress and reverses completed steps on failure, trading strict atomicity for availability.

## Sagas and Compensating Transactions

A saga is the alternative to two-phase commit for operations that span multiple shards or services. It gives up strict atomicity in exchange for availability and the ability to span slow, external calls. Instead of locking all the participants and committing together, a saga executes a sequence of local transactions, each atomic on its own shard, and records progress durably so the operation can be completed or reversed after a failure.

A saga provides eventual consistency of the overall outcome, not atomicity. If a step fails, the already-completed steps are undone by explicit compensating actions, so the final state is as if the operation never started. Between the failure and completion of compensation, the system is in a partially-applied state, and the state is visible unless the read path hides it.

A compensation is not a rollback. A rollback undoes a change as if it never happened, because the database still holds the original value of the WAL. A compensation applies a new change that offsets the earlier one. It is a new business action with its own risks: it can fail, it can be retries, it can be partially applied. The canonical example is a payment that has already settled at a third-party gateway. It cannot be un-sent. It is compensated by issuing a refund, which is a second transaction with its own timing and fees. The original charge stays in the ledger and the refund offsets it.

Because steps and compensations both fail and must be retries, each step must be idempotent. An idempotency key is sent with the step, and the downstream service de-duplicates on it, so performing the step twice has the same effect as performing it once. This is not optional. Retries are the only way to recover from a lost acknowledgement, and retries are only safe if the operation is idempotent.

A missing acknowledgement is ambiguous. It does not distinguish "the step never ran" from "the step ran and the response was lost." Retrying is the only way forward, and idempotency is what makes the retry safe.

The saga log is the durable record which steps have completed and which are pending. The saga orchestrator is the component that reads the log and drives forward progress or compensation. It may be a dedicated service or logic inside one of the participants.

The ordering of "do the step" versus "record that the step succeeded" matters. The safe order is to record after the step succeeds. If the orchestrator records success before the step actually runs, and then crashes, on restart it trusts the log and skips work that never happened, producing a wrong final state with no retry to correct it. If it records after, and crashes in between, the retry re-executes an idempotent step, which is safe. A crash should lead to doing work again, not to believing work was done that was not. Redundant work is recoverable. A false record of completion is not.

Idempotency depends on the downstream service actually de-duplicating on the key. If a third-party gateway does not support idempotency keys, a retry can double-charge, and the saga needs another mechanism such as query-before-retry or a reconciliation job. Idempotency is a property of th step and its dependencies, not a free assumption.

The intermediate state of a saga is visible to reads unless hidden. There are two broad approaches. One is to hide it from reads: mark records with a status such as pending, and have reads count only settled records, or stage the work in a pending table and move it to the visible tables only after the saga completes. The other is to order the steps so that every intermediate state is legitimate on its own; authorize rather than capture a payment, reserve than ship inventory, create an order as pending, and commit the consequence action last. Good systems do both.

Choosing between two-phase commit and saga depends on the operation. Two-phase commit is appropriate when the operation is short, all participants are databases under the same control, and the intermediate state cannot be allowed to exist even briefly, such as moving money between two internal accounts. A saga is appropriate when the operation spans services not under the same control, takes seconds or longer, and each step has a meaningful business-level offset, such as an order placement that calls a third-party card gateway. The deciding properties are whether the participants can be locked together for the duration without unacceptable cost, and whether the intermediate state can be made harmless.

Two-phase commit fails by holding locks and getting stuck in-doubt. A saga avoids that failure but has its own worst outcome: a compensation that itself fails, or a step retries in a way that was not designed for, can leave the system in a partially-applied state that no automated process converges out of. Two-phase commit cannot structurally produce that because it never commits partial work.
