# Setting Up Docker

## 1. Go to the official docker installation docs

[Official Docker installation Docs](https://docs.docker.com/engine/install/)

## 2. Select your platform

## 3. Follow the installation process

## 4. Create docker group

```bash
sudo groupadd docker
```

## 5. Add current user to docker group

```bash
sudo usermod -aG docker $USER
```

## 6. Active group changes

```bash
newgrp docker
```

## 7. Check docker access

```bash
docker ps
```
