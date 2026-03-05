# K8 Cert Manager Cluster Issuer

## 1. Create the cloudflare api token secret manifest

```bash
vi cloudflare-api-token-secret.yaml

apiVersion: v1
kind: Secret
metadata:
  name: cloudflare-api-token-secret
  namespace: cert-manager
type: Opaque
stringData:
  API_TOKEN: <API_TOKEN>
```

> Note: In order for the cluster issuer to get this secret, it needs to be in the same namespace where the cert-manager is installed

## 2. Apply the secret manifest

```bash
kubectl apply -f cloudflare-api-token-secret.yaml
```

## 3. Create the cert manager cluster issuer manifest

```bash
vi cert-manager-cluster-issuer.yaml

apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: cert-issuer-prod
spec:
  acme:
    email: <domain_owner_email>
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - dns01:
        cloudflare:
          apiTokenSecretRef:
            name: cloudflare-api-token-secret
            key: API_TOKEN
```

## 4. Apply the cluster issuer manifest

```bash
kubectl apply -f cert-manager-cluster-issuer.yaml
```

## 5. Verify that the cluster issuer is created

```bash
kubectl get clusterissuer
```
