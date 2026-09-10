# Storage Engine Internals

Writes must be durable (survive a crash the instant the database says "committed"), but writing directly to disk in an organized, indexed form is dramatically slower than writing to RAM, roughly a million-times difference in raw speed. The database has to give disk-level durability without paying full disk-level latency on every single write.

## The Write-Ahead Log (WAL)

The key insights is that not all disk writes are equally expensive, the slowness comes mainly from seeking (finding the right organized location to write into), not from writing to disk. A sequential append to the end of a simple log file avoids seeing entirely and is dramatically faster than a random write into an organized structure. So every write first gets appended, sequentially, to a WAL on disk, durable and fast before the database ever tells the client "committed". The write is only applied into the "proper" organized data structure later, lazily or in batches.

## Crash recovery via WAL replay

If the server crashes after a WAL append but before the write was applied to the main data structure, no data is lost on restart, the database replays the WAL from the last know safe point, brute-force reapplying every entry, even ones that may have already been applied. This is safe because WAL entries are typically written in a "set this to this final value" style rather than "adjust by this amount", making them naturally inherently idempotent, so reapplying an already-applied entry causes no harm and lands in the same correct state either way.

## Why the WAL is bad for reads

The WAL is a raw, unorganized append-only sequence of operations, answering "what's the current value of record X" from the WAL alone would require scanning the entire log for the most recent matching entry. This is fin for it's purpose (crash insurance but useless for fast lookups), which is why a separate, read-optimized structure is needed.

## B-trees (B+ trees) as the read-optimized structure

Real database engines organized data on disk using a B-tree a balanced, wide, branching structure where a small number of "signpost" values at each level narrow the search space, ending at leaf nodes holding the actual data. This gives fast lookups (typically only 3-4 levels deep even across millions of rows) without the "shift everything" cost of a plain sorted array on insert, and preserves order so range queries ("everything between X and Y") are efficient by walking sideways through neighboring leaves.

## Why B-tree updates get batched, not applied immediately

Unlike WAL appends, B-tree inserts require finding the correct leaf (a seek) and possibly splitting/adjusting neighboring nodes, real random I/O, the exact cost the WAL was built to avoid paying synchronously. Since the WAL already guarantees durability the instant a write is appended, there's no correctness need to apply it to the B-tree immediately. Real engines buffer recent writes in an in-memory structure (memtable) and periodically flush a batch of accumulated writes into the on-disk B-tree together, amortizing seek cost across many writes at once.

## Read path during normal operation

A live read checks the memory buffer (memtable) first, since it always holds the freshest writes, then falls through to the on-disk B-tree only if not found in the buffer. Checking disk first risk returning a stale value while a newer one silently sits on memory. Critically, the WAL is never consulted during normal reads, it's write-only insurance, relevant only during crash recovery.

## Full architecture assembled

**Write path:** Append to WAL (durable, sequential, fast) -> write to in-memory buffer -> acknowledge "committed" -> periodically flush buffered writes in a batch into the on-disk B-tree.

**Read path:** Check memory buffer first (freshest) -> fall through to on-disk structure if not found.

**Crash recovery:** Replay WAL from last safe checkpoint, brute-force reapplying every entry, safe due to natural idempotency of "set to value" operations.

This general shape (WAL + in-memory buffer + batched flush to sorted on-disk structure) is close to the LSM-tree (Log-Structure Merge-tree) family of storage engines, used by systems like Cassandra, RocksDB, and LevelDB, as distinct from the more direct B-tree-only approach (no separate memtable, updates go more directly into the tree with in-place page management) used by PostgresSQL and MySQL's InnoDB.

## The pre-crash state

For any write not yet flushed, the true sequence before a crash is: write arrives -> appended to WAL (durable, on disk) -> written into the memtable (RAM) -> client told "committed". At the moment of crash, the WAL has the entry, the memtable has the entry, and the B-tree does NOT have it yet, that's the exact state we need recovery to reproduce.

Replay must not write recovered entries directly into the B-tree, even though that's the "final" destination, doing so would skip ahead and effectively perform a flush that hadn't actually happened yet, producing different state than what existed right before the crash. Instead, replayed WAL entries must repopulate a freshly rebuilt, empty memtable, exactly recreating the pre-crash state (memtable populated with unflushed writes, B-tree untouched). Only after that reconstruction completes does the database resume normal operation, with the rebuilt memtable eventually flushing to the B-tree the same way it normally would.

The WAL isn't just insurance for the B-tree specifically, it's insurance for any in-memory state sitting between "commited" and "durably organized", which in this system is the memtable.

## Checkpoints, avoiding full WAL replay from the beginning of time

Replaying the entire WAL history from the start on every crash would be wasteful. The fix is a checkpoint (sometimes called a flush LSN, log sequence number). Every time a memtable flush to the B-tree completes, the database durably records "everything in the WAL up to this point is now safely reflected in the B-tree". On restart, recovery reads the last checkpoint and replays only WAL entries after that point, repopulating a fresh memtable, much cheaper than replaying from the beginning.

## WAL truncation, bounding WAL growth

Any WAL entry older than the last checkpoint is probably redundant, since it's already durably reflected in the B-tree and will never be needed by replay again. This cleanup process is called WAL truncation (or log recycling).

## Complete storage engine picture

**Write path:**

Write arrives -> append to WAL (druable, sequential, fast) -> write to memtable (RAM) -> acknowledge "committed" -> periodically flush memtable as a batch into the on-disk B-tree -> record a checkpoint marking "WAL up to here is safe" -> truncate WAL entries older than the checkpoint.

**Read path:**

Check memtable first (freshest) -> fall through to on-disk B-tree if not found.

**Crash recovery:**

Read the last checkpoint -> replay only WAL entries after that point -> repopulate a fresh memtable with those entries -> resume normal operation.
