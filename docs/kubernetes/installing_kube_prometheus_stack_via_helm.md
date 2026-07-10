# Installing kube-prometheus via Helm

## Why kube-prometheus-stack (not just "Prometheus")

- Prometheus - metrics storage + query engine
- Grafana - visualization/dashboard
- Alertmanager - routes and dedupes alerts
- Prometheus Operator - manages Prometheus config via CRDs (ServiceMonitor, PodMonitor) instead of hand-edited scrape configs
- node-exporter - DaemonSet exposing host-level metrics (disk, network, CPU) per node
- kube-state-metrics - exposes cluster object state (deployment, pods, etc) as metrics

## API server / control plane health

```bash
# Point-in-time health check of apiserver + etcd + subsytems
kubectl get --raw='/healthz?verbose'
```

## Why is a pod/DaemonSet not showing up at all?

```bash
# DESIRED vs CURRENT vs READY tells you if pods are even being created
kubectl get daemonset -n <namespace>

# The Events section at the bottom is the fastest path to root cause
# shows admission rejection, scheduling failures, etc. in plain language
kubectl describe daemonset <name> -n <namespace>
kubectl describe deployment <name> -n <namespace>
```

## PodSecurity admission blocking a workload

```bash
# Check current enforcement level on a namespace
kubectl get namespace <namespace> --show-labels

# Relabel to allow privileged workloads (e.g. node-exporter, anything needing hostNetwork/hostPID/hostPath) - scope the exception to just this namespace rather than changing the cluster-wide default
kubectl label namespace <namespace> pod-security.kubernetes.io/enforce=privileged --overwrite

```

## Harbor ServiceMonitor

```bash
# Enable harbor metrics
helm upgrade harbor harbor/harbor -n harbor --reuse-values \
  --set metrics.enabled=true \
  --set metrics.serviceMonitor.enabled=true \
  --set metrics.serviceMonitor.additionalLabels.release=kube-prometheus-stack
```

`additionalLabels` is a field in Harbor's chart that get's copied verbatim onto the generated ServiceMonitor's `metadata.labels`, alongside the chart's own default labels. This matter because Prometheus Operator doesn't watch every ServiceMonitor in the cluster automatically, the Prometheus CR has a `serviceMonitorSelector` field that only watches objects matching a specific label.

```bash
# Confirm if harbor ServiceMonitor carries the right label
kubectl get servicemonitor -n harbor -o yaml | grep -A 10 labels
```
