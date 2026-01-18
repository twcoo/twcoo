# Setting Up K8 Cluster

## 1. Create the VM's

- Three VM's to properly simulate HA
- A static IP address setup or reservation for the VM instances
- Controller should have at least 2GB RAM and 2 cores
- The node instances can have 1GB RAM and 1 core

## 2. Install containerd

```bash
sudo apt install containerd
```

## 3. Configure containerd

```bash
# Create config file
sudo mkdir /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml

# Enable SystemdCgroup
sudo vi /etc/containerd/config.toml

# Find this section in the config
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  # Make sure to set this to true
  SystemdCgroup = true
```

## 4. Disable SWAP

```bash
sudo swapoff -a
```

## 5. Enable bridging

```bash
sudo vi /etc/sysctl.conf

# Uncomment
net.ipv4.ip_forward=1
```

## 6. Enable BR_NETFILTER

```bash
sudo vi /etc/modules-load.d/k8s.conf

# Add this inside, file should be empty intially
br_netfilter
```

## 7. Install Kubernetes

[Official Kubernetes installation Docs](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/)

## 8. Install kubeadm, kubelet, and kubectl

[Official kubeadm, kubelet, and kubectl installation Docs](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)

## 9. Setup controller

```bash
# Setup controller
# This might take a few minutes and ensure to save the join command
sudo kubeadm init --control-plane-endpoint=<controller_ip> --node-name controller --pod-network-cidr=10.244.0.0/16

# Setup user
mkdir -p $HOME/.kubectl
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

# Install overlay network
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

## 10. Add nodes

```bash
ssh <user>@<node_vm>
sudo kubeadm join <controller_ip>:6443 --token <token>  --discovery-token-ca-cert-hash <hash>
```

## 11. Create nginx pod in the controller VM

```bash
vi pod.yml

apiVersion: v1
kind: Pod
metadata:
  name: nginx
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.14.2
    ports:
    - containerPort: 80
```

```bash
kubectl apply -f pod.yml

# Verify if the pod is running
kubectl get pods
```

## 12. Create nodeport service

```bash
vi service-nodeport.yml

apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
      nodePort: 30080
```

```bash
kubectl apply -f service-nodeport.yml

# Verify if the service is running
kubectl get service
```

## 13. Verify if the nginx service is running

```bash

# Both of these curl requests should return a successful response
# from the nginx server
curl http://<k8_ctrl_ip>:30080
curl http://<node_ip>:30080

# Example request response
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
    body {
        width: 35em;
        margin: 0 auto;
        font-family: Tahoma, Verdana, Arial, sans-serif;
    }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```
