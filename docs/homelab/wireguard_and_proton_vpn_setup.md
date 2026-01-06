# Wireguard and Proton VPN Setup

## 1. Install wireguard

```bash
sudo apt install wireguard
```

## 2. Create proton vpn [wireguard configuration](https://account.proton.me/u/1/vpn/WireGuard)

## 3. Save the proton vpn wireguard configuration

```bash
sudo vi /etc/wireguard/wg0.conf
```

## 4. Modify the WireGuard config to allow local access to the VM (e.g., SSH)

```text
PrivateKey = <private_key>
Address = <address_ip>/32
DNS = <dns_ip>

# By default wireguard will mark all your traffic using fwmark
# so all of your traffic will be redirected to the VPN (wg0)
# causing for local traffic (eg., SSH) to not work.
# We will need to tell wireguard everytime it activates that
# if a traffic comes from the LAN subnet it needs to route that
# traffic to the LAN (eth0) instead of the VPN (wg0).
# Also tells wireguard to cleanup all these rules when deactivated.
PostUp = ip rule add from <vm_ip>/32 table main priority 1000
PostUp = ip route add <vm_subnet_ip>/24 dev eth0 table main
PostDown = ip route del <vm_ip>/24 dev eth0 table main
PostDown = ip rule del from <vm_ip>/32 table main priority 1000

[Peer]
PublicKey = <public_key>
AllowedIPs = 0.0.0.0/0
Endpoint = <vpn_ip>:<vpn_port>
```

## 5. Start wireguard

```bash
sudo systemctl start wg-quick@wg0
sudo wg-quick up wg0
```

## 6. Check wireguard status

```bash
systemctl status wg-quick@wg0.service
```

## 7. Validate if the VPN is working by checking your public IP

```bash
curl ifconfig.me
```
