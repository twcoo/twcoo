# Format a USB drive for backup in Proxmox

## 1. Find the drive

```bash
# The USB drive shows "usb" in the TRAN column
lsblk -o NAME, SIZE, MODEL, TRAN

```

## 2. Create one partition

```bash
apt install -y parted
parted /dev/sdX --script mklabel gpt mkpart backup ext4 0% 100%
```

## 3. Format as ext4

```bash
# If it warns about an old vfat file system, type y
# Get the UUID: blkid /dev/sdaX
mkfs.ext -L backup /dev/sdX
```

## 4. Mount

```bash
mkdir -p /mnt/backup
chattr +i /mnt/backup

# Add to /etc/fstab
UUID=X /mnt/backup ext4 defaults,nofail 0 2

systemctl daemon-reload
mount -a
df -h /mnt/backup

- 'nofail' is needed so the host still boots if the drive is unpluged.
```

## 5. Add to Proxmox

```bash
pvesm add dir usb-backup --path /mnt/backup --content backup

## Check drive health
smartctl -a -d sat /dev/sdX
```
