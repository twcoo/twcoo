# Setting Up Unattended Upgrades

## 1. Install the package

```bash
sudo apt install unattended-upgrades
```

## 2. Enable unattended upgrades

```bash
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## 3. Select `Yes`

## Dry run unattended upgrades (Optional)

```bash
sudo unattended-upgrades --dry-run --debug
```
