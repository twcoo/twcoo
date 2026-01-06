# Create Proxmox VM Template

## 1. Create a VM

### 1.1. General setting

> Check `Start at boot`.

![General Setting](/create_vm_general.png)

### 1.2. OS setting

![OS Setting](/create_vm_os.png)

### 1.3. System setting

> Enable qemu agent for later use.

![System Setting](/create_vm_system.png)

### 1.4. Disk setting

> Delete the disk.

![Disk Setting](/create_vm_disk.png)

### 1.5. CPU setting

> Set the cpu number to minimum, we can change that later.

![CPU Setting](/create_vm_cpu.png)

### 1.6. Memory setting

> Set the memory to minimum, we can change that later.

![Memory Setting](/create_vm_memory.png)

### 1.7. Network setting

![Network Setting](/create_vm_network.png)

### 1.8. Confirm setting

![Confirm Setting](/create_vm_confirm.png)

## 2. Add Cloud Init Drive

![Cloud Init Drive](/create_vm_hardware.png)

![Cloud Init Storage](/create_vm_storage.png)

## 3. Setup Cloud Init

### 3.1. Add a user

![Cloud Init User](/create_vm_add_user.png)

### 3.2. Add a password

![Cloud Init Password](/create_vm_add_password.png)

### 3.3. Add ssh public key

![Cloud Init SSH](/create_vm_add_ssh.png)

### 3.4. Add IP

> I like using IP lease so I'm going to set it to DHCP.

![Cloud Init IP](/create_vm_add_ip.png)

## 4. Go to the proxmox node shell

## 5. Download cloud image

```bash
wget "https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img"
```

## 6. Enable console interaction

```bash
qm set <vm_id> --serial0 socket --vga serial0
```

## 7. Rename image

```bash
mv ubuntu-24.04-server-cloudimg-amd64.img ubuntu-24-04.qcow2
```

## 8. Resize image

```bash
qemu-img resize ubuntu-24-04.qcow2 50G

```

## 9. Attach image to the VM

```bash
qm importdisk <vm_id> ubuntu-24-04.qcow2 local-lvm
```

## 10. Go to the VM Hardware Setting

## 11. Add unused disk

![Add Unused Disk](/create_vm_add_unused_disk.png)

## 12. Update boot order

> Select the local lvm and move it under the cdrom.

![Update Boot Order](/create_vm_update_boot_order.png)

## 13. Verify that all the VM settings are correct

## 14. Convert VM to Template

![Convert VM To Template](/create_vm_to_template.png)

> The VM will look like this

![VM Template](/create_vm_template.png)

> You can now test the template by cloning it and installing qemu agent.
> Also test if the user and ssh setup is working.

## Resources

[Proxmox VE - How to build an Ubuntu 22.04 Template](https://www.youtube.com/watch?v=MJgIm03Jxdo)

[Linux VM Templates in Proxmox on EASY MODE using Prebuilt Cloud Init Images!](https://www.apalrd.net/posts/2023/pve_cloud/)
