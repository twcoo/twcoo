# Setting Up SSH Identity

## 1. Open the ssh config file

```bash
vi ~/.ssh/config
```

## 2. Add identity

```bash
Host <host_name_or_alias>
  HostName <server_domain_or_ip>
  User <user_to_auth>
  IdentityFile </path/to/ssh/key>
  IdentityOnly yes
```

## 3. Close and save the config file

## 4. Test ssh connection

```bash
ssh <host_name_or_alias>
```
