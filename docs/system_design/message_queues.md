# Message Queues

Session notes: Message queues - motivation and delivery semantics

**Why queues exist:** Direct producer to consumer calls (like HTTP request/response) fail when producer rate exceeds consumer rate, causing dropped requests or an overwhelmed consumer. A rate limiter alone doesn't solve this well either, it just pushes the problem back onto the client as forced retries. A queue instead accepts the work and takes responsibility for eventually completing it.

**Decoupling:** Queues provide two distinct benefits bundled together, temporal decoupling (producer and consumer don't need to be online/available) at the same time; work waits safely if the consumer crashes or slow) and load decoupling (consumer processes at its own sustainable pace regardless of producer burstiness).

**Remove then process is broken:** If a consumer deletes a message from the queue before finishing the work, a crash mid-processing loses the work permanently with no trace.

**Visibility timeout mechanism:** Real queues don't delete on fetch, they hide the message from other consumers for a window (e.g. 30 seconds). Two outcomes: consumer acks successfully -> message permanently deleted; timeout expires with no ack -> queue assumes the consumer died and makes the message visible again for redelivery. This gives at-least-once delivery: guaranteed processing, at the cost of possible duplicate processing (e.g. ack lost in transit even though work succeeded).

**Idempotency:** An operation is idempotent if running it once has the same end effect as running it many times (e.g. resizing an image to 200x200). Non-idempotent operations (e.g. charging a card) produce a different, worse outcome each time they're repeated this is exactly why at-least-once delivery is dangerous for payment-like operations and harmless for operations like resizing.

**Check-then-act race condition:** Checking "has this key been processed?" and then acting as two separate steps is a race condition when two consumers process a redelivered duplicate concurrently.

**Atomic claim via unique constraint:** Fix a single atomic insert with a unique constraint on `idempotency_key`. Only one concurrent insert can succeed; the database itself enforces the exclusivity, closing the race.

**Claimed != done:** A successful insert only proves the key was claimed first, it does NOT prove the underlying operation (the charge) actually completed. Treating "insert succeeded" as "safe to skip" is wrong, because the winning consumer could crash between claiming the key and finishing the charge, permanently orphaning that payment with no retry path.

**Status field needed:** The idempotency record needs more than existence, it needs a status such as `PENDING/PROCESSING` (claimed, not yet finished) versus `COMPLETED` (done, never, repeat).

**Stuck PENDING rows and staleness detection:** A crash can leave a row stuck at `PENDING` forever. Solution mirrors the leaky bucket visibility timeout: store a `claimed_at` timestamp with the pending row. A second consumer compares elapsed time (`now - claimed_at`) against a reasonable ceiling for how long the real operation should ever take. Under the threshold -> assume genuinely in-flight, back off. Over the threshold -> assume the original worker died, safe to take over.

**Read-then-write is unsafe:** Checking `claimed_at` and then separately updating the row to claim it is a check-then-act race. Two consumer can both see the row as stale at nearly the same instance and both attempt to take it over.

**Atomic conditional UPDATE is the fix:** Instead of a separate read and write, fold the check into the UPDATE's WHERE clause itself:

```sql
UPDATE ... SET status = 'PROCESSING', claimed_at = NOW(), owner = 'consumer_B'
WHERE idempotency_key = 'xyz' and status = 'PENDING' AND claimed_at < NOW () - INTERNAL 'threshold';
```

**Why this is safe, row-level locking:** A database processes concurrent UPDATEs targeting the same row one at a time, not simultaneously. The first UPDATE to arrive locks the row, evaluates it's WHERE clause (true), applies the SET, and releases the lock. The second UPDATE then acquires the lock and re-evaluates its own WHERE clause fresh, but the row no longer says PENDING, so the condition is false and it matches zero rows. The lock is what serializes tow "simultaneous" attempts into a strict first and second.
