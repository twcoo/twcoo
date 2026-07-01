# Metrics Server and Reading The Cluster

## Installing metrics-server on Talos

> Talos kubelets use self-signed certs, so metrics-server needs a specific flag or it fails TLS verification.

```bash
# Install
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Patch for Talos
kubectl patch deployment metrics-server -n kube-system \
  --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'

# Verify
kubectl top nodes
kubectl top pods -A
```

## Reading CPU & Memory Units

| Value     | Means                           |
| --------- | ------------------------------- |
| 1m CPU    | 0.1 % of one core (1 millicore) |
| 500m CPU  | Half a core                     |
| 1000m CPU | One full core                   |
| Mi        | Mebibytes (~1.05 MB)            |
| Gi        | Gibibytes (~1.07 GB)            |

## Reading `kubectl top nodes`

```bash
kubectl top nodes
# CPU(%) and MEMORY (%) = %  of that node's total capacity
# Over 80% memory = watch closely
# Over 100% memory = OOM killer risk (kernel starts killing processes)
```

## Investigating a High Memory Node

```bash
# See what's running on a specific node
kubectl get pods -A --field-selector spec.nodeNames=<node-name>

# Check node details + capacity
kubectl describe node <node-name> | grep -E "Capacity:|memory:"

# Check events for warnings
kubectl describe node <node-name> | grep -A 20 "Events:"

```

## Reading Pod Restarts

```bash
kubectl get pods -A # shows RESTART column
kubectl logs <pod> -n <namespace> --previous # logs from before last restart
```

> Not all restarts are emergencies. Key questions:
>
> 1. Is it still restarting? (is the count climbing)
> 2. Did it restart recently?
> 3. Are there symptoms? (broken services, unreachable endpoints)
