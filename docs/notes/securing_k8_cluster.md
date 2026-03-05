# Securing K8 Cluster

## 1. Running kube-bench

```bash
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml

# Check if the pod exists
kubectl get pods

# Get the log of the pod
kubectl logs <pod_name>
```

## 2. Fixing `[FAIL] 4.1.1 Ensure that the kubelet service file permissions are set to 600 or more restrictive (Automated)`

```bash
# SSH to all the nodes
ssh <user>@<node>

# Set the permission of the kubelet service file to root access only
sudo chmod 600 /usr/lib/systemd/system/kubelet.service
```

## 3. Fixing `[FAIL] 4.1.9 If the kubelet config.yaml configuration file is being used validate permissions set to 600 or more restrictive (Automated)`

```bash
# SSH to all the nodes
ssh <user>@<node>

# Find the kubelet config file
ps -ef | grep kubelet | grep config

# Set the permission of the kubelet config file to root access only
sudo chmod 600 /var/lib/kubelet/config.yaml
```
