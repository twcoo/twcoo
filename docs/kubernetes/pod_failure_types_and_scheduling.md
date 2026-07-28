# Pod Failure Type & Scheduling

## CrashLoopBackoff

Occurs when a container starts, exit (any non-zero code = failure), and gets restarted repeatedly.

- Kubernetes treats a non-zero exit as failure, not "job done"
- Under `restartPolicy: Always` (the default for Deployment-managed pods), kubelet restarts the container every time it exits.
- Repeated fast failures trigger **exponential backoff** (10s -> 20s -> 40s up to 5 min between attempts), that's the "Backoff" in the name.

## Telling "supposed to exit" apart from "actually crashing"

Signal and What it tells you

`Owning controller (Job vs Deployment/ReplicaSet)` - Intent, a job designed to run-to-completion; a Deployment assumes the pod runs forever

`restartPolicy (Always/OnFailure/Never)` - Mechanism, governs whether/when a restart actually happens

Check with:

```bash
kubectl get pod -n <namespace> -o jsonpath='{.metadata.onwerReferences[0].kind}'
kubectl get pod -n <namespace> -o jsonpath='{.spec.restartPolicy}'
```

## Failure category quick-reference

Symptom and Meaning

`ImagePullBackoff` - Can't pull the image at all

`CreateContainerConfigError` - Image is fine, but config (env, secret/configmap) can't resolve

`CrashLoopBackoff` - Container starts, then dies repeatedly

`no matches for kind X in version Y` - `apiVersion` mismatch in the manifest, fail before a pod is even created

`FailedScheduling` - Pod can't be placed on any node

## Scheduling failures (FailedScheduling)

The scheduler evaluates every node against multiple independent filters and reports exactly which nodes failed which check. Example message:

```bash
0/12 nodes are available: 3 node(s) had untolerated taint(s), 9 node(s) didn't match Pod's node
affinity/selector. no new claims to deallocate, preemption: 0/12 nodes are available: 12 Preemption
is not helpful for scheduling.
```

**Two independent filtering mechanism, evaluated together**

1. **nodeSelector/node affinity** - the pod requests a node label; nodes without that label are filtered out.
2. **Taints/tolerations** - nodes (e.g. control-plane nodes, by default) can carry a taint like `node-role.kubernetes.io/control-plane: NoSchedule` to repel ordinary workloads. A pod needs a matching **toleration** to be allowed to schedule there regardless of labels.

The scheduler message already tells you which nodes failed which check, no need to `describe` each node individually to reconstruct this by hand.

**Preemption** (also mentioned in scheduling failure messages):

- Last-resort mechanism: if no node has a room, but the pending pod has a **higher** `PriorityClass` than a pod already running somewhere, the scheduler can evict the lower-priority pod to make space

- Pods without an explicit `PriorityClass` get an implicit default priority (0) - preemption only matters when priorities actually differ

- The scheduler tries preemption automatically any time normal scheduling fails, regardless of the reason, so it shows up in the message even when irrelevant.

- Preemption only helps with genuine resource contention. It cannot fix hard filter mismatches (missing tolerations, unmatched node selectors/labels), those are binary yes/no checks.

- Relevant command: `kubectl get priorityclass`
