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
