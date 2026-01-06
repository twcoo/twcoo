# Basic K8s Ingress

## 1. Create config map manifest

```bash
vi httpenv-config-map.yaml
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: httpenv-config-map
data:
  message_1: 'Ciao'
  message_2: 'Kumusta'
```

## 2. Create deployment manifest

```bash
vi httpenv-deployment.yaml
```

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: httpenv-deployment
  labels:
    app: httpenv
spec:
  replicas: 3
  selector:
    matchLabels:
      app: httpenv
  template:
    metadata:
      labels:
        app: httpenv
    spec:
      containers:
        - name: httpenv
          image: bretfisher/httpenv:latest
          env:
            - name: MESSAGE_1
              valueFrom:
                configMapKeyRef:
                  name: httpenv-config-map
                  key: message_1
            - name: MESSAGE_2
              valueFrom:
                configMapKeyRef:
                  name: httpenv-config-map
                  key: message_2
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          ports:
            - containerPort: 8888
```

## 3. Create service manifest

```bash
vi httpenv-service.yaml
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: httpenv-service
spec:
  selector:
    app: httpenv
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8888
```

## 4. Create ingress manifest

```bash
vi httpenv-ingress.yaml
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: httpenvingress
spec:
  ingressClassName: nginx
  rules:
    - host: httpenv.debby.example
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: httpenvservice
                port:
                  number: 80
```

## 5. Install ingress-nginx-controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
```

## 6. Check the ingress-nginx-controller status

> Ensure that you have a healthy pod and external ip for the nginx controller

```bash
kubectl get all -n=ingress-nginx
```

## 7. Apply manifests

```bash
kubectl apply -f httpenv-config-map.yaml
kubectl apply -f httpenv-deployment.yaml
kubectl apply -f httpenv-service.yaml
kubectl apply -f httpenv-ingress.yaml
```

## 8. Map the external ip to the host

```bash
sudo vi /etc/hosts

<ingress-controller-external-ip> httpenv.debby.sample
```

## 9. Test the service

<http://httpenv.debby.sample>

![httpenv-sample-1](/httpenv-sample-1.png)

![httpenv-sample-2](/httpenv-sample-2.png)

> You will also notice that the ingress handles the loadbalancing of the nodes based from the highlighted `NODE_NAME`
