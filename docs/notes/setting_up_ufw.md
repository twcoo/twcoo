# Setting Up UFW

## 1. Allow SSH

> Allow ssh access first before you enable UFW so you don't get locked out.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 22
```

## 2. Enable UFW

```bash
sudo ufw enable
```

## 3. Setup default policies

> Establish default traffic policies (incoming and outgoing) early on to start with a secure baseline.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
```

### Suggested Reading

> [UFW Essentials: Common Firewall Rules and Commands for Linux Security](https://www.digitalocean.com/community/tutorials/ufw-essentials-common-firewall-rules-and-commands)
