# Setting Up K8 Context

## 1. SSH to the controller VM

```bash
ssh <user>@<controller_vm_ip>
```

## 2. Get kubernetes/admin.conf content

```bash
sudo cat /etc/kubernetes/admin.conf
```

## 3. Create the context yaml

```bash
# Copy the content of kubernetes/admin.conf to this file
nvim ~/kubeconfigs/<cluster_conf>.yaml

# Secure the file
chmod 600 ~/kubeconfigs/<cluster_conf>.yaml
```

## 4. Add the new cluster config

```bash
export KUBECONFIG=~/.kube/config:~/kubeconfigs/<cluster_conf>.yaml
```

## 5. Check if the context/cluster is now available

```bash
kubectl config get-contexts
```
