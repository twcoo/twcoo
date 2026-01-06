# Prevent Suspend On Lid Close

The steps bellow will prevent the laptop from suspending or sleeping when the lid is closed.

## 1. Open the logind configuration file

```bash
vi /etc/systemd/logind.conf
```

## 2. Find and set the following option

> Uncomment (remove `#` if present) and set:

```bash
HandleLidSwitch=ignore
```

## 3. Restart the systemd-logind service

```bash
systemctl restart systemd-logind
```

## 4. Check the status of the service (optional)

```bash
systemctl status systemd-logind
```
