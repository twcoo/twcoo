# Mounting TrueNas NFS to Proxmox VM

## 1. Create the TrueNas dataset

![TrueNas Dataset Creation](/truenas_create_dataset.png)

## 2. Setup the TrueNas dataset user and permission

![TrueNas Dataset User Permission](/truenas_dataset_user_permission.png)

## 3. Add TrueNas dataset in UNIX (NFS) Shares

![TrueNas Dataset NFS Share](/truenas_dataset_nfs_share.png)

> You also need to add your Proxmox network

## 4. SSH to your Proxmox VM

## 5. Install `nfs-common`

```bash
sudo apt update
sudo apt install nfs-common -y
```

## 6. Create the mount directory

```bash
sudo mkdir -p /mnt/media
```

## 7. Mount the NFS storage

```bash
sudo vi /etc/fstab

# Write this inside the fstab file
# This will automatically mount the NFS when the VM boots up
<truenas_ip_or_domain>:/mnt/Pool1/Proxmox/Media /mnt/media nfs defaults 0 0

sudo mount -a
```

## 8. Test the NFS mount by creating a file in the mount dir

## 9. You can verify if the file exists in NFS by using TrueNas shell

![TrueNas NFS Shell](/truenas_nfs_shell.png)
