# Setting Up Dozzle

> I was looking for a minimal web app to monitor my docker stack containers
> and I found out about [Dozzle](https://dozzle.dev/).<br> It allows you to view your container logs
> and some details about your containers' resource consumption.

## 1. Add dozzle to the stack compose file

```yaml
dozzle:
  image: amir20/dozzle:latest
  environment:
    - DOZZLE_AUTH_PROVIDER=simple
    - DOZZLE_NO_ANALYTICS=true
  secrets:
    - source: dozzle_users
      target: /data/users.yml
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
```

## 2. Create the secret credentials for the simple authentication

```bash
docker run -it --rm amir20/dozzle generate \
--name <username> \
--email <user_email> \
--password <the_password> \
username | docker secret create dozzle_users -
```

## 3. Create dozzle server in the nginx reverse proxy default template

```txt
# Dozzle
server {
  listen 443 ssl;

  server_name ${dns_record_name}.${DOMAIN};

  location / {
    proxy_pass http://dozzle:8080;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
  }
}
```

## 4. Update docker stack

```bash
docker stack deploy -c <stack-compose-file.yml> <stack_name>
```

## 5. Login to dozzle

![Dozzle Login](/dozzle_login.png)

## Dashboard

![Dozzle Dashboard](/dozzle_dashboard.png)

## Container Logs

![Dozzle Container Logs](/dozzle_logs.png)
