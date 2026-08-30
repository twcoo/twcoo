# K8 Postgres Daily Backup To NFS

## 1. Backup VM setup (NFS server)

```bash
sudo apt install nfs-kernel-server -y
sudo mkdir -p /srv/backups/<db-name>
sudo chown nobody:nogroup /srv/backups/<db-name>
```

**Export config - `/etc/exports`**

```bash
vi /etc/exports

/srv/backups/<db-name>
<subnet>(rw,sync,no_subtree_check,no_root_squash)
```

**Apply and start:**

```bash
sudo exportfs -ra
sudo systemctl enable --now nfs-kernel-server
```

**Firewall:**

```bash
sudo ufw allow from <subnet> to any port 2049
sudo ufw allow from <subnet> to any port 111
```

> The export folder is owned by `nobody:nogroup` (UID/GID `65534`, the standard Linux "unprivileged" ID). The backup pod must write as this same UID/GID or it hits `Permission denied`.

## 2. Kubernetes side

**Persistent Volume (cluster-scoped, not namespaced):**

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: <db-name>-backup-nfs-pv
spec:
  capacity:
    storage: 50Gi
  accessModes:
    - ReadWriteMany
  nfs:
    server: <backup-vm-ip>
    path: /srv/backups/<db-name>
  persistentVolumeReclaimPolicy: Retain
```

**PersistentVolumeClaim (namespaced):**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: <db-name>-backup-nfs-pvc
  namespace: <namespace>
spec:
  # REQUIRED — prevents falling back to
  # the cluster default StorageClass,
  # which would try to dynamically
  # provision instead of binding to
  # the static PV above.
  storageClassName: ""
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 50Gi
  volumeName: <db-name>-backup-nfs-pv # match exactly the PV's name
```

**CronJob:**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: <db-name>-backup
  namespace: <namespace>
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          securityContext:
            runAsUser: 65534
            runAsGroup: 65534
            fsGroup: 65534
          containers:
            - name: pg-backup
              image: postgres:16
              command:
                - /bin/sh
                - -c
                - pg_dump -h <postgres-service> -U <db-user> <db-name> > /backup/<db-name>-$(date +\%Y\%m\%d).sql
              env:
                - name: PGPASSWORD
                  valueFrom:
                    secretKeyRef:
                      name: <secret-name>
                      key: password
              volumeMounts:
                - name: backup-storage
                  mountPath: /backup
          volumes:
            - name: backup-storage
              persistentVolumeClaim:
                claimName: <db-name>-backup-nfs-pvc
          restartPolicy: OnFailure
```

## Useful commands for testing/troubleshooting

```bash
# manually trigger the cronjob
kubectl create job --from=cronjob/<db-name>-backup <db-name>-backup-test -n <namespace>

# check job/pod status
kubectl get jobs -n <namespace>
kubectl get pods -n <namespace> -l job-name=<db-name>-backup-test

# logs
kubectl logs -n <namespace> job/<db-name>-backup-test

# describe for events (mount errors, image pull errors, etc.)
kubectl describe pod -n <namespace> -l job-name=<db-name>-backup-test

# PV / PVC status
kubectl get pv
kubectl get pvc -n <namespace>
kubectl describe pv <db-name>-backup-nfs-pv

# verify the backup file on the VM
ls -la /srv/backups/<db-name>/
du -h /srv/backups/<db-name>/<db-name>-<date>.sql
head -50 /srv/backups/<db-name>/<db-name>-<date>.sql # sanity check it's real sql

# cleanup a manual test job
kubectl delete job <db-name>-backup-test -n <namespace>
```
