# Keep SSH Connection Alive

## Client Side

```bash
vi ~/.ssh/config

Host <nickname>
  Hostname <server_ip>
  user <user>
  IdentityFile <key_file>
  IdentitiesOnly yes
  ServerAliveInterval 60
  ServerAliveCountMax 3
```

`ServerAliveInterval 60` - pings the server every 60 seconds to keep the connection active.

`ServerAliveCountMax 3` - disconnects only after 3 pings in a row get no response.

## Server Side

```bash
vi /etc/ssh/sshd_config

# Add
ClientAliveInterval 60
ClientAliveCountMax 3
```

## Restart Server SSH

```bash
sudo systemctl restart ssh
```
