# Proxmox SEC_ERROR_REUSED_ISSUER_AND_SERIAL

Firefox treats issuer + serial as a unique cert identity. Two different certs claiming the same identity looks like spoofing, so it blocks the second one

## Check which node is affected

```bash
openssl x509 -in /etc/pve/pve-root-ca.pem -noout -serial -issuer
```

## Fix

```bash
# Backup existing CA/cert files
mkdir -p /root/cert-backup
cp /etc/pve/pve-root-ca.pem /etc/pve/priv/pve-root-ca.key /root/cert/backup/


# Remove the CA and node cert
rm /etc/pve/pve-root-ca.pem /etc/pve/priv/pve-root-ca.key
rm /etc/pve/local/pve-ssl.pem /etc/pve/local/pve-ssl.key

# Regenerate new CA, new serial, new node cert
pvecm updatecerts --force

# Restart the web service to serve the new cert
systemctl restart pveproxy
```

## Restore previous CA/cert

```bash
# Stop the web service first (Ensure you have ssh access, web shell access will stop)
systemctl stop pveproxy

# Remove the newly generated (broken) cert files
rm /etc/pve/pve-root-ca.pem /etc/pve/priv/pve-root-ca.key
rm /etc/pve/local/pve-ssl.pem /etc/pve/local/pve-ssl.key

# Restore the original files from backup
cp /root/cert-backup/pve-root-ca.pem /etc/pve/pve-root-ca.pem
cp /root/cert-backup/pve-root-ca.key /etc/pve/priv/pve-root-ca.key

# Regenerate the node cert from the restored CA
pvecm updatecerts --force

# Restart the service
systemctl start pveproxy
```
