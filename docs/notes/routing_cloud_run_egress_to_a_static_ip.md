# Routing Cloud Run Egress To A Static IP

I needed a Cloud Run service to access a protected network and solved it by routing its egress traffic through a static IP, allowing me to whitelist it in the firewall.

![Cloud Run Egress](/cloud_run_with_static_ip.png)

## 1. Create the VPC

```bash
gcloud compute networks vpc-access connectors create <vpc_name> \
  --region=us-central1 \
  --network=default \
  --range=10.8.0.0/28
```

## 2. Create the Cloud Router

```bash
gcloud compute routers create <router_name> \
  --network=default --region=us-central1
```

## 3. Create the static IP

```bash
gcloud compute addresses create <static_ip_name> \
  --region=us-central1
```

## 4. Create the NAT and attach the router and static IP

```bash
gcloud compute routers nats create <nat_name> \
  --router=<router_name> --router-region=us-central1 \
  --nat-external-ip-pools=<static_ip_name> \
  --nat-all-subnet-ip-ranges \
  --enable-logging
```

## 5. Attach VPC to the cloud run function

```bash
gcloud functions deploy <function_name> \
  --runtime=python312 \
  --trigger-http \
  --vpc-connector=<vpc_name> \
  --egress-settings=all \
  --region=us-central1
```

> [!NOTE]
> This NAT and static IP setup can be a bit costly. Alternatively, if you already have a VM, you can deploy your scripts there, centralize them, and assign a static IP to that VM.
