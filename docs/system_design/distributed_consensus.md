Distributed Consensus (Raft Algorithm)

## 1. Strict Majority Quorum & Split-Brain Prevention

- Formula: Quorum size = [N/2] + 1 (e.g., 3 nodes out of 5)
- Mechanism: A candidate must secure votes from a strict majority to become leader, and a leader must receive majority acknowledgments to commit any log entry.
- Split-Brain Defense: In a network partition, minority partitions (e.g., 2 nodes out of 5) cannot reach a majority. They automatically reject/pause writes, while the majority partition (3 nodes) elects a new leader continues committing safely.

## 2. Term Numbers as Logical Clocks

- Mechanism: Terms are monotonically increasing integers that act as logical time in Raft.
- Stale Leader Step-Down: Whenever any node (including an isolated leader) sees an RPC containing a term higher that its own, it immediately updates its term and steps down to the Follower state.

## 3. Log Matching & Reconciliation

- Leader Authority: The leader's log is the absolute source of truth. Uncommitted follower logs that conflict with the leader are forcefully overwritten.

- `AppendEntries` Consistency Check: Each replication request carries `prevLogIndex` and `prevLogTerm`. Followers verify this index/term pair matches their log:
  - Match: Follower appends the new entry and overwrites any conflicting entries following `prevLogIndex`
  - Mismatch: Follower rejects the request; the leader decrements `nextIndex` and retries until finding the exact divergence point.

- Cross-Term Commit Rule: A leader never commits log entries from previous terms by counting replicas. It only commits entries from it's current term by majority count, which implicitly commits all preceding log entries due to the Log Matching Property.

## 4. Catch-Up via Log Compaction (InstallSnapshot RPC)

- Problem: When a follower goes offline for a long period, missing log entries may be deleted from the leader's disk during routine log compaction (WAL cleanup).

- Solution: The leader falls back to sending an `InstallSnapshot` RPC.
  - The leader streams a point-in-time snapshot of the state machine to the stale node.
  - The follower discards its entire old log, resets its state machine to the snapshot point, and resumes standard `AppendEntries` replication for all subsequent entries.
