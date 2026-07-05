# Installing kube-prometheus via Helm

## Why kube-prometheus-stack (not just "Prometheus")

- Prometheus - metrics storage + query engine
- Grafana - visualization/dashboard
- Alertmanager - routes and dedupes alerts
- Prometheus Operator - manages Prometheus config via CRDs (ServiceMonitor, PodMonitor) instead of hand-edited scrape configs
- node-exporter - DaemonSet exposing host-level metrics (disk, network, CPU) per node
- kube-state-metrics - exposes cluster object state (deployment, pods, etc) as metrics
