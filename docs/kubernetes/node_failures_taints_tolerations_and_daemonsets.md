# Node Failures, Taints/Tolerations & DaemonSets

## 1. Two Different Node-Down Code Paths

A. Graceful shutdown (`talosctl shutdown`, no `--force`)

Talos proactively cordons and drains the node before powering off:

1. Node marked `SchedulingDisabled` immediately (cordon)
2. Pods evicted directly by kubelet as part of the drain, plain `Killing` events, no taint mechanism involved
3. Replacement pods scheduled on healthy nodes almost immediately
4. Result: near-zero downtime gap for Deployment-managed workloads

B. Abrupt/forced shutdown (`talosctl shutdown --force`)

No proactive drain, the node just disappears from the control plane's perspective:

1. `node-monitor-grace-period` (default 40s) - how long before kube-controller-manager marks the node `NotReady` after missed heartbeats

2. Node lifecycle controller applies `NoExecute` taints:
   `node.kubernetes.io/not-ready` and/or
   `node.kubernetes.io/unreachable`

3. Taints do not evict immediately, pods have a toleration for these taints (see below) that lets them "ride out" the taint for a grace period

4. Once that grace period expires, the taint manager evicts visible as a `TaintManagerEviction` event, distinct from kubelet-driven `Killing` events

5. ReplicaSet controller notices the pod is gone and creates a replacement, scheduled on a healthy node (fast seconds, especially if the image is already cached there)

Key empirical finding from this drill: even with `--force`, the node still showed `SchedulingDisabled`. This isn't from a Talos-side cordon (which --force skips), it's the Kubernetes control plane itself marking a detected-unreachable node unschedulable, independent of any drain. Cordon state can come from more than one source; don't assume `SchedulingDisabled` always means someone ran `kubectl cordon`.

## 2. Taints & Tolerations, The Node-Failure Mechanism

**Taints live on nodes and repel pods unless the pod has a matching**toleration. `NoExecute` is the taint effect relevant to failures, it evicts pods already running there (as opposed to `NoSchedule`, which only blocks new placement).

The two automatic failure-related taints:

- `node.kubernetes.io/not-ready` - applied when the node's `Ready` condition is unknown/false

- `node.kubernetes.io/unreachable` - applied when the node stops responding entirely

**Default tolerations, injected automatically, not something you normally write yourself:**

```yaml
tolerations:
  - effect: NoExecute
    key: node.kubernetes.io/not-ready
    operator: Exists
    tolerationSeconds: 300
  - effect: NoExecute
    key: node.kubernetes.io/unreachable
    operator: Exists
    tolerationSeconds: 300
```

The `DefaultTolerationSeconds` admission controller adds these to every pod unless the pod spec explicitly overrides them. 300 seconds (5 minutes) is the standard Kubernetes default.

What `tolerationSeconds:300` actually measures: not "time until pod is recreated", it's the window a pod is allowed to keep tolerating the taint before the taint manager evicts it. The recreate-and-reschedule step after eviction is fast (seconds); almost the entire 5 minutes is eviction delay, deliberately built in so a brief network blip doesn't trigger unnecessary churn (pod deletion, rescheduling, image pulls) if the nodes comes back quickly.

**Overriding per-workload:** latency-sensitive workloads can set a shorter `tolerationSeconds` explicitly in their own `tolerations` block to fail over faster, trading off again risk of premature eviction during transient blips.

## 3. DaemonSets, Node-Pinned Workloads

A DaemonSet runs exactly one pod per matching node (or per node in a selected subnet), fundamentally different from a Deployment which places N replicas wherever the scheduler decides.

**Replica count**

- Deployment: explicit `replicas: N`
- DaemonSet: automatic, one per matching node

**New node joins**

- Deployment: no automatic action
- DaemonSet: pod automatically scheduled there

**Node dies**

- Deployment: pod reschedules elsewhere
- DaemonSet: pod does not move, nowhere logical to move to

**Use case**

- Deployment: application workloads
- DaemonSet: node-level infrastructure/agents

**Observed in this cluster**: `kube-flannel` (CNI/networking), `kube-proxy` (per-node Service routing rules), `longhorn-manager` (storage agent), all DaemonSets, all tied to node-level concerns rather than application logic.

\*\*Why DaemonSet pods showed `Pending` (not `Terminating`/rescheduled) when a node went down: the DaemonSet controller recreated the pod object (hence a fresh, recent pod), but it can't be scheduled anywhere since it's specifically meant for that node, which is down. It just waits for the node to return. DaemonSets don't carry the `NoExecute` failure tolerations the same way, they're built to tolerate `not-ready`/`unreachable` indefinitely (no `tolerationSeconds`), since migrating would defeat their purpose.

**Pratical implication when diagnosing "why isn't this pod being reschduled":** first check if it's a DaemonSet. If so, "stuck" on a dead node might be entirely expected behavior, not a bug.

## 4. Reading Stale vs. Live Status

When a node stops reporting, the API server doesn't get live updates from it's kubelet, `kubectl get pods` can show stale cached status (e.g. Running, 2/2) that reflects that last known state, not current reality. Don't trust pod status alone as "current truth" once a node is `Notready`; cross-check against `kubectl get events` (which shows discrete state-change events with timestamps) and eventually the node's own `Conditions`.

## 5. Production HA Design, Why the 5-Minute Window Rarely Matters in Practice

The taint-eviction path is a last-resort safety net, not the primary defense against node failure in a well-architected setup. The real defenses operate faster and independently of it:

- `replicas: 3+`, spread across nodes, losing one node still leaves serving capacity

- `topologySpreadConstraints` or pod anti-affinity, explicitly prevents the scheduler from stacking all replicas on one node (nothing tops this by default)

- `PodDisriptionBudget` (PDB) protects against voluntary disruption (rolling updates, drains) taking down too much capacity at one; separate concern from unplanned node failure

- **Service + readiness probes** - traffic stops routing to a pod the moment it fails proves or its nodes' kube-proxy stops updating, well before the 5-minute taint eviction ever fires

By the time `TaintManagerEviction` happens, a properly spread, load-balanced service has typically already routed traffic around the failure. The 300s default is conservative on purpose, favoring stability (avoiding unnecessary churn from transient blips) over speed, since faster failover is usually handled at the Service/probe layer instead.

Tuning knobs, roughly in order of what's actually changed in production:

1. Readiness/liveness probe tuning (`periodSeconds`, `failureThreshold`), most direct effect on user-facing failover time

2. `node-monitor-grace-period` (default 40s), rarely changed, cluster-wide, affects `NotReady` detection speed

3. `tolerationSeconds` override per-workload, occasionally lowered for latency-sensitive services, accepting more premature-eviction risk.
