# Change Data Capture

## 1. Low-Impact Extraction

- Mechanism: Tail the Write-Ahead Log (WAL)(PostgresSQL), Binlog (MySQL), or Redo Log (Oracle) directly at the storage level.
- Why: Bypasses heavy `SELECT` polling and database triggers, preserving database write throughput.

## 2. Trnsaction Atomicity & Buffering

- Problem: Uncommited or aborted transaction are physically written to the WAL first.
  Streaming them immediately causes phantom/ghost writes downstream.

- Solution (Transaction Buffering): Buffer records in memory grouped by Transaction ID (XID)
  - On `COMMIT`: Flush the ordered sequence of events downstream as a batch.
  - On `ABORT`: Discard the buffer immediately.

## 3. Handling Large Transactions (Memory Pressure)

- Problem: Massive transactions (e.g., 50M rows updates) exceed RAM, causing Out-of-Memory (OOM) crashes in CDC connectors.
- Solution: (Spill-to-Disk): Set a RAM threshold (e.g., 64 MB). Once exceeded, spill incoming transaction records to local disk storage (e.g., RocksDB), reading and flushing them downstream only upon commit.

## 4. Crash Resilience & Delivery Guarantees

- Offset Tracking: Store the active position using the Log Sequence Number (LSN) or GTID. Resume from the last acknowledged LSN on restart.

- At-Least-Once Delivery: CDC guarantees at-least-once delivery, which can produce duplicates after a crash.

- Idempotency: Downstream systems must use idempotent writes (e.g., Priamry Key + LSN versioning / `UPSERT`) to handle duplicate events safely.

## 5. Cold Start & Initial Snapshot (DBLog Algorithm)

- Problem: Copying historical data (e.g., 10 TB) while live WAL writes continue, without locking the database or creating race conditions.

- Solution:
  1. PK Chunkking: Read historical data in small Primary Key ranges (e.g., 10k rows).
  2. Watermark Windowing: Emit a Low Watermark (LW) signal to WAL -> `SELECT` Chunk -> Emit a High Watermark (HW) signal.
  3. Deduplication: If a live WAL event occurs between `LW` and `HW` for a row in the chunk, discard the snapshot row (the WAL event holds the newer state).
