# TrueNas Proxmox VM Setup

## 1. Copy the `Download Stable` link in <https://www.truenas.com/download-truenas-community-edition/>

## 2. Create the ISO Image in the local storage

![TrueNas ISO Image](/truenas_iso_image.png)

## 3. Create the VM

![TrueNas VM](/truenas_vm.png)

## 4. Start the VM

## 5. Install

> Just use the default settings

## 6. Login to the web UI

![TrueNas Installed](/truenas_installed.png)

![TrueNas Web UI](/truenas_web_ui.png)

## 7. Go to the VM Hardware tab

![VM Hardware Tab](/truenas_vm_hardware_tab.png)

> Remove the CD/DVD Drive

## 8. SSH to the proxmox node

```bash
# The drive serial can be found in
# the proxmox node Disk tab

# The first result is the disk-id

# Get the disk id
ls /dev/disk/by-id | grep "<drive-serial>"

# Attach the drive to the VM
qm set <vm-id> -scsi1 /dev/disk/by-id/<disk-id>
```

## 9. Verify that the drive is attached

![VM Drive Attached](/truenas_vm_disk_attached.png)

![Web UI Drive Attached](/truenas_web_ui_drive_attached.png)
