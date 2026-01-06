# SSH To GCloud VM Using IAP Tunnel

## Prerequisites

1. GCloud user must have IAP permissions, [read more here](https://cloud.google.com/iap/docs/using-tcp-forwarding).

## 1. Edit ~/.ssh/config file

```bash
vi ~/.ssh/config
```

## 2. Create a new host record

```text
Host <host_name>
  Hostname compute.<vm-instance-name>
  User <gcloud_username>
  ProxyCommand gcloud compute start-iap-tunnel <vm-instance-name> 22 --listen-on-stdin --project <project_id> --zone us-central1-a
  IdentityFile ~/.ssh/google_compute_engine
  IdentitiesOnly yes
```

## 3. Use new ssh host

```bash
ssh <gcloud_username>@<host_name>
```
