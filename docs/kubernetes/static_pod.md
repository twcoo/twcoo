# Static Pod

- A static pod is a pod managed directly by the kubelet on a single node, not by the API server, scheduler, or any controller (ReplicaSet, Deployment, etc.)

- The kubelet reads the pod spec from a source outside the Kubernetes API, classically a manifest file in a directory it watches (commonly `/etc/kubernetes/manifests/` on kubeadm clusters), configured via `staticPodPath` in kubelete config (or the order `--pod-manifest-path` flag)

- The kubelet keeps whatever's defined there running, independent of the rest of the cluster

## Why static pod exist

- Solves the chicken and egg problem of bootstrapping a cluster, you can't have the API server manage itself via the API server, since the API server has to be running before anything talk to it

- This is literally how kubeadm-based cluster runs their own control plane, `kube-apiserver`, `kube-scheduler`, `kube-controller-manager`, and often `etcd` all runs as static pod on control-plane nodes

## How they show up in `kubectl`

- The kubelet mirrors a read-only copy into the API server, so `kubectl get pods` shows it like any other pod

- But you cannot truly delete or edit it via `kubectl`, deleting the mirror just makes the kubelet recreate it, because the real source of truth is the manifest file (or config source) on that node, not the API object

- To actually change a static pod, you edit/replace the manifest on that node, the kubelet detects the change and recreates the pod automatically

## How to identify a static/mirror pod in `kubectl describe`

- `Controlled By: Node/<node-name>`, instead of a normal controller like `ReplicaSet/...`

- No populated `ownerReferences` the normal way

- Annotations `kubenetes.io/config.mirror` and `kubernetes.io/config.hash`, the hash is computed from the manifest content, changing the manifest changes the hash and triggers a recreate

- `kubernetes.io/config.source`, shows where the kubelet is reading the spec from `file` on typical kubeadm nodes, can differ on other distros

- Pod name gets the node hostname appended automatically, e.g. `kube-apiserver-<node-name>`
