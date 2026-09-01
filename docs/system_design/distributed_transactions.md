# Distributed Transactions

An e-commerce checkout spanning three independent services, each with its own database, `Inventory (decrements stocks`, `Payment (charges the card)`, `Order (creates the order record)`. All three need to succeed together, but they can't share one atomic transaction that way tables in a single database can.

## Why single-database atomicity doesn't extend across services

A single database can guarantee atomic commit because one engine has full authority over one transaction log and lock manager for everything inside it. Across separate services, each has it's own independent database, transaction log, and commit process, with no shared coordinator that has visibility or control over all of them at once.

## Partial failure, the core danger

If Inventory and Payment both commit successfully but Order's commit fails (e.g, it's database is down), you're left with inventory decremented and a customer charged, but no order record anywhere. This is called partial failure, some of the operations that were meant to succeed or fail together did commit, and nothing automatically undoes the ones that already succeeded.

## Why rollback doesn't apply here

In a single database, rollback works by discarding uncommitted changes. But in this scenario, Inventory's decrement and Payment's charge are already fully committed, real, durable, externally visible (the charge may have already moved real money through an external processor). There's nothing "uncommitted" to discard.

## Compensating transactions

Instead of undoing history, you issue a new, forward-moving operation whose effects cancels out the original one, a refund transaction for Payment, a restock/increment for Inventory. This is the standard fix for already committed operations that need to be reversed.

## Orchestration and the saga pattern

Since no individual service (Inventory, Payment, Order) has visibility into the others, some coordinating layer needs to track which steps succeeded and decide what compensating actions to trigger or failure. This coordinator is called an orchestrator, and the overall pattern, breaking a distributed transaction into a sequence of local transactions, each with a corresponding compensating action, is called the saga pattern. On failure at any step, the orchestrator walks backward through already-completed steps and fires their compensation.

## Compensation can fail too

If a compensation action itself fails (e.g., the refund call times out), the fix isn't new, it's the same machinery already built in the message queue topic, retries with an idempotency key (e.g, `refund_for_charge_id_XYZ`) so repeated retries don't double-refund, and a dead letter queue for compensations that keeps failing even after retries, giving an engineer a durable place to investigate and decide whether to re-drive or diagnose further.

> Sagas aren't a new toolkit, they're existing pieces (idempotency, retry-with-backoff, DLQs) recombined in a new context. The orchestrator itself also needs to durably track "which step am I on" in a database (no just in-memory), so that if the orchestrator process itself crashes mid-saga, a replacement can safely resume, the same "in-flight work must survive a crash via durable state, not memory" problem already solved in the leader-election topic.
