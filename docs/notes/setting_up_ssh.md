# Setting Up SSH

## 1. Generate an ssh key pair on your local machine

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/<key_file_name>
```

## Ensure ssh folder exists in your server

```bash
mkdir ~/.ssh
```

## Copy the public key to the server

```bash
ssh-copy-id -i ~/.ssh/<key_file_name>.pub <user>@<server>
```

## 2. Secure SSH

### Open the ssh config file

```bash
vi /etc/ssh/sshd_config
```

Uncomment (remove `#` if present) and set:

```bash
# Disable password authentication
PasswordAuthentication no
# Disable root login
PermitRootLogin no
# Only allow admin user to login
AllowUsers <admin_user>

```

### Apply new changes

```bash
sudo systemctl reload ssh
```
