# Load Balancer Services And MetalLB

## 1. Cloud vs. Bare Metal

On a cloud provider (GKE, EKS, AKS), creating as Service with `type: LoadBalancer` triggers the cloud's own controller to provision a real external load balancer automatically. On bare metal (e.g. a Talos homelab), there's no cloud API to call, without something filling that role, a LoadBalancer Service just sits with `EXTERNAL-IP: <pending>` forever.

### MetalLB

1. IP allocation, given a pool of IPs from the local network (that aren't used by anything else), MetalLB assigns one to each `LoadBalancer` Service as it's `EXTERNAL-IP`

2. Announcing that IP to the network, makes the IP actually reachable, via one two modes:

- Layer 2 mode - one node answers ARP requests for the IP ("traffic for this IP comes to me"). Simple, no special network hardware.
- BGP mode - nodes peer with the router/switch via BGP and properly advertise the IP as a route. More robust, real load-balancing across nodes, needs BGP-capable network gear.

Key point: the `Service` YAML itself doesn't change between cloud and bare-metal, `type: LoadBalancer` is a standard Kubernetes field. What differs is who's watching for that type and fulfilling it. This is Kubernetes extensibility model in action: the API expresses intent, any controller (cloud-native, or something self-installed like MetalLB) can fulfill it.

### Checking MetalLB config

```bash
kubectl get ipaddresspool -n metallb-system -o wide
kubectl get l2advertisement -n metallb-system -o wide
```

## 2. LoadBalancer is Built on Top of ClusterIP, Not a Separate Mechanism

A `type: LoadBalancer` Service is not a fundamentally different object from a `ClusterIP` Service, it's the same mechanism with layer added on top.

**The full layer stack, outside-in:**

```bash
External client -> MetalLB (L2/ARP of BGP) -> Node Port -> ClusterIP -> Endpoints -> Pod
```

- **ClusterIP** (`10.104.145.6`) - every Service gets one, even `LoadBalancer` type. This is the external routing address.

- **NodePort** (`31941` in `80:31941/TCP`) - a port opened on every node in the cluster (default range 30000-32767). When external traffic hits the MetalLB-announced IP, it's forwarded to this `NodePort` on whichever node is currently answering for that IP.

- **Endpoints** - same mechanism as any Service, populated only from Ready pods matching the selector. Internal load-balancing-across-pods behavior is identical regardless of Service type, `type: LoadBalancer` only adds an external entry point on top, it doesn't change how traffic is distributed once inside the cluster.

## 3. Minimal LoadBalancer Service Example

```yaml
apiVersion: v1
kind: Service
metadata:
  name: drill4-web-lb
  namespace: cka-drill
spec:
  type: LoadBalancer
  selector:
    app: drill4-web
  ports:
    - port: 80
      targetPort: 80
```

## 4. Service DNS (Internal vs. External)

**Internal (automatic):** CoreDNS watches the API and auto-creates a DNS record for every Service:

```bash
<service-name>.<namespace>.svc.cluster.local
```

Only resolves from inside the cluster (any pod can look it up). Within the same namespace, the short form works too (`nslookup drill4-web-lb` resolves without the full suffix, via DNS search domains).

This is the real reason Service exist even beyond load balancing, a stable DNS name + stable IP means other pods/apps never needed to track individual pod IPs (which constantly change), just resolve the Service name.

**External (not automatic)**: the MetalLB-assigned external IP has no hostname by default, nothing creates one automatically. A real hostname for it would need to be added manually in whatever DNS server serves the local network (e.g. a self hosted DNS server running in-cluster).

## 5. Ingress vs. LoadBalancer

- `type: LoadBalancer` - L4 (TCP/IP level), one external IP per Servic, not HTTP awareness
- **Ingress** - L7 (HTTP-aware), sits on top of Services, does host/path-based routing and TLS termination, lets many Service share one external entrypoint.
