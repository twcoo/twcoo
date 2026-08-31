# Updating SSH Pub Key via Cloud-Init (Proxmox VM)

## 1. Set the key on the VM

```bash
# Writes the key into the VM's cloud-init config.
# Overwrites the cloud-init `sshkeys` field, it does not append to whatever was there before.
qm set <vmid> --sshkeys ~/.ssh/id_rsa.pub
```

## 2. Regenerate the cloud-init drive

```bash
# Pushes the updated config into the VM's cloud-init disk.
qm cloudinit update <vmid>
```

## 3. Restart the VM

> Rebuilding/recreating a VM generates a new host SSH Key, triggers a `REMOTE HOST IDENTIFICATION HS CHANGED`.
> Fix with `ssh-keygen -R <ip-or-hostname>`
