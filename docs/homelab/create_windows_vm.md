# Create Windows VM

## 1. Download the [Windows ISO](https://www.microsoft.com/en-us/software-download/windows11)

![Download the Windows ISO](/download_windows_iso.png)

## 2. Download the Proxmox Windows [Virtual Drivers](https://pve.proxmox.com/wiki/Windows_VirtIO_Drivers)

![Proxmox Windows Virtual Drivers](/proxmox_windows_virtual_driver.png)

## 3. Create the Windows VM

![Windows VM Spec 1](/create_windows_vm_p1.png)

![Windows VM Spec 2](/create_windows_vm_p2.png)

## 4. Start the VM

## 5. Boot from the DVD ROM

![Create Windows VM Boot](/create_windows_vm_boot.png)

## 6. Just follow the installation steps

## 7. Use the Proxmox virtual drivers to fix the missing drive

## 8. Install windows in the drive

![Create Windows VM Drive](/create_windows_vm_drive.png)

## 9. Wait for the installation process to finish

![Create Windows VM installation](/create_windows_vm_installation_process.png)

## 10. Bypass windows user creation

> You can find many guides on the internet that explain how to do this

## 11. Just follow the remaining installation steps

## 12. After the installation process is complete, open `Device Manager`

## 13. Install the drivers for the failing devices

![Install Drivers](/create_windows_vm_failing_drivers.png)

> You can use the proxmox virtual drivers to fix these issues

## 14. After the drivers are fixed, update the system

## 15. Restart, and now you have a Windows VM

## Resources

[Proxmox + Windows 11: Easy VM Setup for Beginners!](https://www.youtube.com/watch?v=9FCDIavw3EM)
