# Create Private Network With VM Bridge

## 1. Go to the proxmox node System tab -> Network setting

## 2. Create the VM bridge

![Create VM Bridge](/create_vm_bridge.png)

## 3. Click `Apply Configuration`

## 4. Select a VM

## 5. Use the VM Bridge in the VM `Network Device`

![Use the VM Bridge](/update_network_device.png)

## 6. Go to `Cloud-Init` tab

> I'm using VM template with cloud-init setup.

## 7. Go to `IP Config` setting

## 8. Set the static IPv4 and Gateway IPv4

![Set Static IPv4 and Gateway IPv4](/set_static_and_gateway_ipv4.png)

## 9. Update the DNS server

![Update DNS Server](/update_dns_server.png)

## 10. Reboot the VM

## 12. Open the proxmox node `Shell`

## 13. Create the iptable NAT config

```bash
vi /etc/network/interfaces
```

## 14. Under `vmbr0` add the ff config

```
post-up iptables -t nat -A POSTROUTING -s 10.10.0.0/26 -o vmbr0 -j MASQUERADE
post-down iptables -t nat -D POSTROUTING -s 10.10.0.0/26 -o vmbr0 -j MASQUERADE
```

> The config above will be run automatically when vmbr0 goes down or up.

> When a packet from the 10.10.0.0/26 subnet goes out through vmbr0,
>
> rewrite its source IP to match vmbr0’s external IP so it can reach the internet.

## 15. Apply the iptable changes

```bash
ifreload -a
```

## 16. Check the VM internet connection

![Check internet connection](/check_internet_connection.png)

## Full Setup Example

![VM Bridge Sample Implementation](/vm_bridge_sample_implementation.png)

> All the VM's inside the bridge will be able to communicate but will be isolated from the other VM's inside the proxmox node.

> Internet access is available thanks to the NAT setup.
