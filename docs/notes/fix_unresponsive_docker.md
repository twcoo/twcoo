# Fix Unresponsive Docker

I recently encountered an issue where Docker was not
responding when I ran commands or deployed a Docker stack.
I was able to fix it using the steps below.

```bash
# Forcefully removes possible broken config
sudo rm -f /etc/docker/daemon.json

sudo systemctl start docker

# Reloads configuration
sudo systemctl daemon-reload

sudo systemctl restart docker
```
