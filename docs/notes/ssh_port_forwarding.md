# SSH Port Forwarding

## SSH Config Template

```bash

vi ~/ssh/config

Host <nickname>
  Hostname <server-ip>
  user <username>
  Identity File ~/.ssh/<key-name>
  IdentitiesOnly yes

  # Add one `LocalForward` line per service you want to forward
  LocalForward <local-port> localhost:<remote-port>
  LocalForward <local-port> localhost:<remove-port>
```

## Connect with

```bash
ssh <nickname>
```

## Run Tunnel in Background

```bash
ssh -f -N <nickname>
```

`-N` - don't run remote command, just forward ports

`-f` - run in the Background

## Check/Kill a Background Tunnel

```bash

# Check if it's running
ps aux | grep "<nickname>"

# Kill it
kill <PID>

# Kill by matching the command directly
pkil -f "ssh.*<nickname>"

# Check what's using a specific local port
lsof -i :<local-port>
```
