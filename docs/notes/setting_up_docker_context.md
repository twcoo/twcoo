# Setting Up Docker Context

## 1. Add ssh identity to ssh-agent

```bash
ssh-add </path/to/ssh/key/file>
```

## 2. Create docker context

> Make sure that the ssh key you added in the ssh-agent have access to the host server

```bash
docker context create <context_name> --docker "host=ssh://<user>@<host_server>"
```

## 3. Use docker context

```bash
docker context use <context_name>
```
