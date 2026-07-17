# Troubleshooting

The core discipline: narrow from broad to specific, letting each command's output tell you where to look next, rather than guessing.

1. **Triage first**, `kubectl get pods -n <namespace> -o wide` Tells you the failure category at a glance: `Pending`, `CrashLoopBackoff`, `ImagePullBackoff`, `CreateContainerConfigError`, `Running` but not `Ready`, etc. Each points down a different path.

2. `describe` - the single best diagnostic command `kubectl describe pod <pod-name> -n <namespace>`

- **Events** (bottom of output) surface scheduling failures, image pull errors, volume mount failures, and probe failures first, often before logs would show anything.

- **Conditions** and **container statuses** pinpoint which container failed and why.

3. **Logs** - once a container has actually started

```bash
kubectl logs <pod-name> -n <namespace>
kubectl logs <pod-name> -n <namespace> --previous # crash before this restart
kubectl logs <pod-name> -n <namespace> -c <container> # multi-container pods
```

`--previous` is easy to forget, if a container has already crash-looped, the current log stream may just show a fresh restart; `--previous` shows the actual crash.

4. **Exec in** - when the pod is **Running/Ready** but the app itself is wrong `kubectl exec -it <pod-name> -n <namespace> -- sh` Useful for bad config, unreachable dependencies, wrong env vars, check these live from inside.
5. **Zoom out if the pod-level story doesn't explain it**

- Node-level: `kubectl describe node <node>`, check Conditions, Taints, allocatable resources.
- Cluster level: `kubectl get events -A --sort-by=.lastTimestamp`, catches node/quota-level problems affecting many pods at once

**Key mental model:** Events tell you what Kubernetes tried and failed to do; log tell you what your application did once it started. Jumping straight to logs is the most common mistake, it misses scheduling and mount failures that never got that far.
