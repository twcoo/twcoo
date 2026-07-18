# State nginx-gateway-fabric upstream

## Symptom

- `502 Bad Gateway` on a hostname served through nginx-gateway-fabric.
- nginx error log shows something like:

```bash
connect() failed (113: Host is unreachable) while connecting to upstream, ...
  upstream: "http://<pod-ip>:<port>/..."
```

- The upstream IP in the error doesn't match any current running pod.

**Root Cause**

nginx-gateway-fabric has two separate components:

1. Controller (`nginx-gateway-fabric` deployment) - watches Gateway API resources (HTTPRoute, Service, EndpointSlice) and pushes config to the data plane.

2. Data plane (`<gateway-name>-nginx` deployment) - the actual pod handling traffic, using whatever config was last pushed to it.

If the data plane doesn't receive an update config push (e.g. due to a dropped/failed gRPC connection between controller and data plane, often around a controller restart), it keeps serving **stale upstream IPs** even though the Services and EndpointSlice are already correct. This is a data-plane sync issue, not a Kubernetes networking or Service misconfiguration.

## Diagnosis Steps

1. **Confirm current pod/Service state is actually correct:**

```bash
kubectl get pods -n <namespace> -o wide
kubectl get svc -n <namespace> -o wide
kubectl get endpointslices -n <namespace>
```

If EndpointSlice IPs match running pod IPs, the problem is downstream of the Service layer.

2. **Check what the data plane pod actually has loaded** (source of truth for real routing):

```bash
kubectl get pods -n nginx-gateway
kubectl exec -n nginx-gateway <data-plane-pod> -- cat /etc/nginx/conf.d/http.conf | grep -A5 "<namespace>_<service-name>"
```

Compare the `server <ip>:<port>` lines against the actual pod/EndpointSlice IPs from step 1.

3. **Check pod ages for a clue on staleness**

```bash
kubectl get pods -n nginx-gateway
```

Compare the age of the data plane pod vs the controller pod vs when the affected app's pods were last scheduled. A data plane pod that's much older than a recent pod reschedule is a red flag.

4. **Check controller log for dropped/failed config pushes**, especially around controller restarts:

```bash
kubectl logs -n nginx-gateway <controller-pod> --since=24h | grep -i -E "reload|error|grpc|conn"
```

Look for grPC connection drops (e.g. `Closing grpc connection`) coinciding with the time the stale config would have been introduced.

## Fix

Restart the data plane deployment (not the controller) to force it to pull a full fresh config on boot:

```bash
kubectl get deploy -n nginx-gateway
kubectl rollout restart deployment <data-plane-deployment-name> -n nginx-gateway
kubectl rollout status deployment <data-plane-deployment-name> -n nginx-gateway
```

Then re-verify:

```bash
kubectl get pods -n nginx-gateway
kubectl exec -n nginx-gateway <new-data-plane-pod> -- cat /etc/nginx/conf.d/http.conf | grep -A5 "<namespace>_<service-name>"
curl -I https://<hostname>/<path>
```

**Pattern Recognition (for faster future diagnosis)**

- If only one app's upstream is stale while others in the same nginx config are current, it means the staleness correlates with the app's pod rescheduling during a specific window (e.g. controller restart or gRPC hiccup) -- not a systemic sync failure.

- Multiple stale upstreams across different apps would point more toward a broader controller/data-plane sync bug or resource pressure issue - worth checking controller logs more and possibly restarting the controller too.

- Always check the actual rendered nginx config (`/etc/nginx/conf.d/http.conf` or similar) before assuming a Service/HTTPRoute/selector misconfiguration - the Gateway API resources can be 100% correct while the data is simply out of sync.

**Prevention/Follow up**

- After any node drain, pod reschedule, or rollout, if you notice issue right after a nginx-gateway-fabric controller restart, check the controller-to-data-plane gRPC channel health.

- Consider checking your installed nginx-gateway-fabric version against upstream GitHub issues for known bugs in config push reliability after controller restarts.

- If this recurs frequently, consider a periodic health check that diffs data plane upstream IPs against live EndpointSlices, or simply restart the data plane pod as part of routine maintenance after major reschedules.
