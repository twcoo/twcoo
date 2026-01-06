# Self Hosted GitHub Runners With Docker Stack

##

# Prerequisites

1. [GitHub Access Token](https://github.com/myoung34/docker-github-actions-runner/wiki/Usage#token-scope)

##

# 1. Setup docker stack file

```yaml
services:
  repo-one-runner:
    image: myoung34/github-runner:latest
    environment:
      ACCESS_TOKEN: ${GH_RUNNER_ACCESS_TOKEN}
      RUNNER_SCOPE: repo
      EPHEMERAL: 'true'
      REPO_URL: https://github.com/repo-one
      RUNNER_NAME_PREFIX: repo-one
      LABELS: linux,core
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - core-runner:/runner/data
    deploy:
      replicas: 3
      restart_policy:
        condition: any

  repo-two-runner:
    image: myoung34/github-runner:latest
    environment:
      ACCESS_TOKEN: ${GH_RUNNER_ACCESS_TOKEN}
      RUNNER_SCOPE: repo
      EPHEMERAL: 'true'
      REPO_URL: https://github.com/repo-two
      RUNNER_NAME_PREFIX: repo-two
      LABELS: linux,miner
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 3
      restart_policy:
        condition: any

  repo-3-runner:
    image: myoung34/github-runner:latest
    environment:
      ACCESS_TOKEN: ${GH_RUNNER_ACCESS_TOKEN}
      RUNNER_SCOPE: repo
      EPHEMERAL: 'true'
      REPO_URL: https://github.com/repo-three
      RUNNER_NAME_PREFIX: repo-three
      LABELS: linux
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 3
      restart_policy:
        condition: any

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
    networks:
      - runners-network

  nginx-reverse-proxy:
    image: nginx:1.23-alpine
    ports:
      - '80:80'
      - '443:443'
    configs:
      - source: nginx_conf
        target: /etc/nginx/nginx.conf
      - source: nginx_default_template
        target: /etc/nginx/conf.d/default.conf
    secrets:
      - ssl_cer
      - ssl_key
    networks:
      - runners-network

configs:
  nginx_conf:
    external: true
  nginx_default_template:
    external: true

secrets:
  dozzle_users:
    external: true
  ssl_cer:
    external: true
  ssl_key:
    external: true

networks:
  runners-network:
    driver: overlay
```

# 2. Create the docker stack configs

> I’m using Dozzle and Nginx so I can have a web app to monitor container logs and resource usage.

```bash
docker config create nginx_conf ./nginx_conf.conf
docker config create nginx_default_template ./nginx_default_template.conf
```

# 3. Create the docker stack secrets

```bash
# SSL
docker secret create ssl_cer ./<ssl_cer_file>
docker secret create ssl_key ./<ssl_key_file>
```

```bash
# Dozzle user
docker run -it --rm amir20/dozzle generate \
--name <username> \
--email <email> \
--password Hillcrest-Arcade-Backroom-92! \
<username> | docker secret create dozzle_users -
```

# 4. Create the docker stack

```bash
(set -a; . ./.env; envsubst < docker-stack-file.yml ) | \
docker stack deploy -c - runner-stack --detach=false
```

# 5. Go to your repository’s Settings → Actions → Runners and verify that your runners are registered
