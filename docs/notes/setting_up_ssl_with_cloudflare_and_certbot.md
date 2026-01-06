# Setting Up SSL with Cloudflare and Certbot

## Prerequisites

1. Domain created or onboarded in Cloudflare
2. [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)

## 1. Enable docker swarm in your host machine

> You can ignore the swarm token if you are just going to use docker stack

```bash
docker swarm init
```

## 2. Create the stack file

```bash
vi docker-stack.yaml
```

```yaml
services:
  certbot_dns_cloudflare:
    image: certbot/dns-cloudflare
    volumes:
      - certbot_dns_cloudflare:/etc/letsencrypt
    secrets:
      - source: cloudflare_ini
        target: /root/cloudflare.ini
    command: >-
      certonly --dns-cloudflare
      --dns-cloudflare-credentials /root/cloudflare.ini
      --dns-cloudflare-propagation-seconds 15
      --email ${DOMAIN_EMAIL} 
      --agree-tos
      --no-eff-email
      -n
      -d *.${DOMAIN}
      -d ${DOMAIN}
    deploy:
      restart_policy:
        delay: 300s
    env_file:
      - .env

  hello_world:
    image: crccheck/hello-world
    networks:
      - overlay-network

  reverse-proxy:
    image: nginx:latest
    volumes:
      - certbot_dns_cloudflare:/etc/letsencrypt
    ports:
      - 80:80
      - 443:443
    configs:
      - source: nginx_conf
        target: /etc/nginx/nginx.conf
      - source: nginx_default_template
        target: /etc/nginx/conf.d/default.conf
    networks:
      - overlay-network

configs:
  nginx_conf:
    external: true
  nginx_default_template:
    external: true

secrets:
  cloudflare_ini:
    external: true

volumes:
  certbot_dns_cloudflare:

networks:
  overlay-network:
    driver: overlay
```

## 3. Create the .env file

```bash
vi .env
```

```txt
DOMAIN=<your_domain>
DOMAIN_EMAIL=<email_used_to_create_the_domain>
```

## 4. Create cloudflare.ini file

```bash
vi cloudflare.ini

```

```ini
dns_cloudflare_api_token=<api_token>
```

## 5. Create nginx.conf

```bash
vi nginx/nginx.conf
```

```text
# Using `auto` will automatically determine how
# many worker your cpu can handle
worker_processes  auto;

events {
  # The number of concurrent
  # connections per worker
  worker_connections 1000;
}

# HTTP Context
http {
  # Set the type of contents to serve
  include mime.types;

  # Include the templates
  include /etc/nginx/conf.d/*.conf;
}
```

## 6. Create nginx default template

```bash
vi nginx/templates/default.conf.template
```

```text
# Set ssl certificate credentials
ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

server {
    listen 80 default_server;
    listen 443 ssl default_server;

    server_name _;

    return 301 https://${DOMAIN};
}

# Hello World
server {
  listen 443 ssl;

  server_name ${DOMAIN};

  location / {
    proxy_pass http://hello_world:8000;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
  }
}
```

## 7. Create cloudflare_ini docker secret

```bash
docker secret create cloudflare_ini ./cloudflare.ini
```

## 8. Create nginx conf docker config

```bash
docker config create nginx_conf ./nginx/nginx.conf
```

## 8. Create nginx template docker config

> Docker config cannot read our environment values, so we need to populate
> the DOMAIN variable with envsubst during config creation.

```bash
env $(cat ./.env | xargs) envsubst '${DOMAIN}' < ./nginx/templates/default.conf.template | \
docker config create nginx_default_template -
```

## 9. Deploy docker stack

```bash
docker stack deploy -c docker-stack.yaml <stack_name>
```
