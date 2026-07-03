# Incident Diagnosis and Dependency Chain Failures

## How to Spot Pods with Restarts

```bash
# Show only pods with at least 1 restart
kubectl get pods -A | awk '$5 > 0'
# Column 5 = RESTARTS. awk '$5 > 0' = only show rows where restarts > 0
```

## grep-v (Invert Match)

```bash
kubectl get pods -A | grep -v Running
# -v means "exclude this pattern" - shows everything NOT Running
# Great for spotting Pending, Error, CrashLoopBackOff pods instantly
```

## Reading Logs from a Crashed Pod

```bash
kubectl logs <pod> -n <namespace> --previous
# --previous = logs from BEFORE the last restart (the crash itself)
# Without --previous you only see the current (restarted) instance
```

## What is a StatefulSet?

A StatefulSet is a Kubernetes workload type for apps that need persistent identity and stable storage - things like databases, caches, and distributed storage.

Unlike a regular Deployment where pods are interchangeable, each StatefulSet pod has:

- A stable name that never changes (e.g. harbor-redis-0, harbor-redis-1)
- A sticky PersistentVolume that follows it across restarts
- A predictable startup/shutdown order (pod 0 before pod 1, etc.)

> When a node goes down, StatefulSet pods on that node will NOT automatically reschedule
> to another node.

Kubernetes intentionally does this to protect data integrity - it doesn't want two copies of the same database pod running at once (which could corrupt data).

What you'll see:

- Pod status shows `Running` or `Terminating`
- But it's actually unreachable - traffic can't get to it
- Everything that depends on it's start crash looping
