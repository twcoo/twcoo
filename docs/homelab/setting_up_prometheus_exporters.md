# Setting Up Prometheus Node Explorer

## 1. Download the node explorer

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.10.2/node_exporter-1.10.2.linux-amd64.tar.gz
```

## 2. Untar the node explorer

```bash
tar node_exporter-1.10.2.linux-amd64.tar.gz
```

## 3. Create systemd service

```bash
vi /etc/systemd/system/node_exporter.service
```

```bash
[Unit]
Description=Prometheus Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 4. Create a dedicated user

```bash
sudo useradd --no-create-home --shell /bin/false node_exporter
```

## 5. Run the service

```bash
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

## 6. Check the metrics endpoint

```bash
curl http://<vm-ip>:9100/metrics
```

# Setting Up Prometheus Nginx Exporter

## 1. Add stub_status to the default nginx conf file

```bash
server {
    listen 8080;

    server_name _;

    location /status {
       stub_status;
       allow 127.0.0.1;
       deny all;
    }
}
```

## 2. Download the nginx exporter

```bash
wget https://github.com/nginx/nginx-prometheus-exporter/releases/download/v1.5.1/nginx-prometheus-exporter_1.5.1_linux_amd64.tar.gz
```

## 3. Install the nginx exporter

```bash
tar axf nginx-prometheus-exporter_1.5.1_linux_amd64.tar.gz
sudo mv node_exporter /usr/local/bin
sudo chmod +x /usr/local/bin/node_exporter
```

## 4. Create systemd service

```bash
vi /etc/systemd/system/nginx_exporter.service

```

```bash
[Unit]
Description=Nginx Prometheus Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=nginx_exporter
Group=nginx_exporter
Type=simple
ExecStart=/usr/local/bin/nginx-prometheus-exporter \
  -nginx.scrape-uri=http://localhost:8080/status \
  -web.listen-address=:9113
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## 5. Create a dedicated user

```bash
sudo useradd --no-create-home --shell /bin/false nginx_exporter
```

## 5. Run the service

```bash
sudo systemctl daemon-reload
sudo systemctl start nginx_exporter
sudo systemctl enable nginx_exporter
```
