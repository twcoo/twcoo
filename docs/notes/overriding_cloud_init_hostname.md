# Overriding Cloud Init Hostname

## 1. Get the current hostname

```bash
hostname
```

## 2. Set the new hostname

```bash
sudo hostnamectl set-hostname <new_hostname>
```

## 3. Preserve hostname

```bash
sudo vi /etc/cloud/cloud.cfg

# Set this value
preserve_hostname: true
```

## 4. Reboot

## 5. Verify the new hostname
