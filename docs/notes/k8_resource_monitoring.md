# K8 Resource Monitoring

## 1. Install Metrics Server

```bash
# Check if metrics server is running
kubectl get deployment metrics-server -n kube-system

# Install metrics server if missing
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Ignore tls error for self hosted k8 cluster
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```
