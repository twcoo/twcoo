# Kanboard K8 Deployment

## 1. Create namespace

```bash
# create namespace yaml file
vi namespace.yaml

apiVersion: v1
kind: Namespace
metadata:
  name: tools
```

```bash
# apply namespace yaml file
kubectl apply -f namespace.yaml
```

## 2. Install rancher local-path-provisioner

```bash
kubectl apply -f https://raw.githubusercontent.com/rancher/local-path-provisioner/v0.0.34/deploy/local-path-storage.yaml
```

## 2. Create persistent volume claim (PVC)

```bash
# create pvc yaml file
vi pvc.yaml

apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  labels:
    srv: kanboard-db
  name: kanboard-db
  namespace: tools
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: kanboard-data
  namespace: tools
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 3Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  labels:
    app: kanboard
  name: kanboard-plugins
  namespace: tools
spec:
  storageClassName: local-path
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 200Mi
```

```bash
# apply pvc yaml file
kubectl apply -f pvc.yaml
```

## 4. Create kanboard secrets

```bash
# install sealed secrets
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm install sealed-secrets -n kube-system --set-string fullnameOverride=sealed-secrets-controller sealed-secrets/sealed-secrets
```

```bash
# create secret yaml file
vi kanboard-db-secret.yaml

apiVersion: v1
kind: Secret
metadata:
  name: kanboard-db-secret
  namespace: tools
type: Opaque
stringData:
  DB_USER: kanboard_user
  DB_PASSWORD: kanboard_password
  DATABASE_URL: postgres://kanboard_user:kanboard_password@kanboard-db-service/kanboard
```

> A SealedSecret can only be decrypted by the controller that owns the private key used to encrypt it.
> You can safely commit SealedSecret manifest to Git.

```bash
# create the sealed secret yaml file
cat kanboard-db-secret.yaml | kubeseal --controller-namespace kube-system --controller-name sealed-secrets-controller --format yaml > kanboard-db-sealed-secret.yaml
```

```bash
# apply secret
kubectl apply -f kanboard-db-sealed-secret.yaml
```

## 5. Create deployments

```bash
# create deployment yaml file
vi deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: kanboard-db
  namespace: tools
spec:
  replicas: 1
  selector:
    matchLabels:
      srv: kanboard-db
  template:
    metadata:
      labels:
        srv: kanboard-db
    spec:
      volumes:
        - name: kanboard-db
          persistentVolumeClaim:
            claimName: kanboard-db
      containers:
        - name: kanboard-db
          image: postgres:16-alpine
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: kanboard-db-secret
                  key: DB_USER
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: kanboard-db-secret
                  key: DB_PASSWORD
            - name: POSTGRES_DB
              value: kanboard
          ports:
            - name: postgres
              containerPort: 5432
              protocol: TCP
          resources: {}
          volumeMounts:
            - mountPath: "/var/lib/postgresql/data"
              name: kanboard-db
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kanboard
  namespace: tools
spec:
  replicas: 1
  selector:
    matchLabels:
      run: kanboard
  template:
    metadata:
      labels:
        run: kanboard
    spec:
      volumes:
        - name: kanboard-data
          persistentVolumeClaim:
            claimName: kanboard-data
        - name: kanboard-plugins
          persistentVolumeClaim:
            claimName: kanboard-plugins
      containers:
        - name: kanboard
          image: kanboard/kanboard:latest
          env:
            - name: DEBUG
              value: 'true'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: kanboard-db-secret
                  key: DATABASE_URL
          ports:
            - containerPort: 80
          resources:
            limits:
              cpu: "0.5"
              memory: "512Mi"
            requests:
              cpu: "0.1"
              memory: "128Mi"
          volumeMounts:
            - mountPath: "/var/www/app/data"
              name: kanboard-data
            - mountPath: "/var/www/app/plugins"
              name: kanboard-plugins
```

```bash
# apply deployment yaml
kubectl apply -f deployment.yaml
```

## 6. Create services

```bash
# create service yaml file
vi service.yaml

apiVersion: v1
kind: Service
metadata:
  name: kanboard-db-service
  namespace: tools
spec:
  ports:
    - name: postgres
      targetPort: 5432
      port: 5432
      protocol: TCP
  selector:
    srv: kanboard-db
---
apiVersion: v1
kind: Service
metadata:
  name: kanboard-service
  namespace: tools
spec:
  ports:
    - name: http
      port: 80
      targetPort: 80
      protocol: TCP
  selector:
    run: kanboard
```

```bash
# apply service yaml
kubectl apply -f service.yaml
```

## 7. Create cloudflare api token secret

> We are going to need this api token for the cert-manager
> challenge so we can add let's encrypt certificate
> and setup https on our nginx ingress.

```bash
# create secret yaml
vi cloudflare-api-token-secret.yaml

apiVersion: v1
kind: Secret
metadata:
  name: cloudflare-api-token-secret
  namespace: tools
type: Opaque
stringData:
  API_TOKEN: API_TOKEN
```

```bash
# create the sealed secret yaml file
cat cloudflare-api-token-secret.yaml | kubeseal --controller-namespace kube-system --controller-name sealed-secrets-controller --format yaml > cloudflare-api-token-sealed-secret.yaml
```

```bash
# apply sealed secret yaml
kubectl apply -f cloudflare-api-token-sealed-secret.yaml
```

## 8. Setup and install metallb

> We will need metallb so we can generate ip address pool for the nginx ingress.

```bash
# install using helm
helm repo add metallb https://metallb.github.io/metallb
helm install metallb metallb/metallb -n default
```

```bash
# create metallb ip address pool yaml file
vi metallb-ip-address-pool.yaml

apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: ingress-pool
  namespace: default
spec:
  addresses:
  - <ip_min>-<ip_max>
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2
  namespace: metallb-system
```

```bash
# apply metallb ip address pool yaml file
kubectl apply -f metallb-ip-address-pool.yaml
```

## 9. Install nginx ingress

```bash
# helm installation
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx
```

## 10. Install cert manager

```bash
# helm installation
helm install \
  cert-manager oci://quay.io/jetstack/charts/cert-manager \
  --version v1.19.2 \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

## 11. Setup cert-manager issuer

```bash
# create cert manager issuer yaml file
vi cert-manager-issuer.yaml

apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: kanboard
  namespace: tools
spec:
  acme:
    email: <cloudflare_account_email>
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

```bash
# apply cert manager issuer yaml file
kubectl apply -f cert-manager-issuer.yaml
```

## 12. Setup nginx ingress

```bash
# create nginx ingress yaml file
vi nginx-ingress.yaml

apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tools-ingress
  namespace: tools
  annotations:
    cert-manager.io/issuer: tools-cert-issuer
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - <host_name>
      secretName: tools-tls
  rules:
    - host: <host_name>
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: kanboard-service
                port:
                  number: 80
```

```bash
# apply nginx ingress yaml file
kubectl apply -f nginx-ingress.yaml
```
