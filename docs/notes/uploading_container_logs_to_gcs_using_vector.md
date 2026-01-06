# Uploading Container Logs To GCS Using Vector

[Vector By DATADOG](https://vector.dev/)

## 1. Setup vector docker stack service

```yaml
services:
  app_1:
    image: app_1_image

  app_2:
    image: app_2_image

  vector:
    image: timberio/vector:0.44.0-alpine
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    configs:
      - source: vector_config
        target: /etc/vector/vector.toml
    secrets:
      - source: gcp_key
        target: gcp-sa.json
    environment:
      GOOGLE_APPLICATION_CREDENTIALS: /run/secrets/gcp-sa.json
      TZ: Asia/Manila
    command: ['--config', '/etc/vector/vector.toml']

configs:
  vector_config:
    external: true

secrets:
  gcp_key:
    external: true
```

## 2. Create the vector config

```bash
vi vector_config.toml
```

```toml
[sources.docker]
type = "docker_logs"
exclude_containers = [
  "app_2", # You can exclude a container from the logs collection
]

[transforms.transformed_docker_logs]
type = "remap"
inputs = ["docker"]
source = '''
.timestamp = now()
.image = .image
.service = .container_name
.message = string!(.message)
'''

[sinks.gcs]
type   = "gcp_cloud_storage"
inputs = ["transformed_docker_logs"]

bucket = "container-logs"
key_prefix = "%Y/%m/%d/{{ service }}/"

encoding.codec = "json"

batch.timeout_secs = 60

compression = "gzip"
```

## 3. Create the vector docker config

```bash
docker config create vector_config ./vector_config.toml
```

## 4. Create the GCP service account key file. This key should have permission to create files in the GCS bucket specified in the Vector config

```bash
vi gcp_key.json
```

## 5. Create the docker secret for the gcp service account key

```bash

docker secret create gcp_key ./gcp_key.json
```

## 6. Create the docker stack services

## 7. Verify if the vector setup passed the GCS health check

```bash
docker logs vector
```

> You should see similar output in the logs
> ![Vector Working](/vector_working.png)
