# LXC Nginx Reverse Proxy With Certbot DNS Cloudflare

## 1. Install system dependencies

```bash
sudo apt update
sudo apt install python3 python3-dev python3-venv libaugeas-dev gcc
```

## 2. Set up a python virtual environment

```bash
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
```

## 3. Install certbot

```bash
sudo /opt/certbot/bin/pip install certbot
```

## 4. Prepare the certbot command

```bash
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
```

## 5. Install certbot cloudflare plugin

```bash
sudo /opt/certbot/bin/pip install certbot-dns-cloudflare
```

## 6. Create [cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with `Zone.DNS` permission

## 7. Create the cloudflare ini file

```bash
mkdir ~/.secrets/certbot
sudo vi ~/.secrets/certbot/cloudflare.ini

# Put this inside the cloudflare.ini file
dns_cloudflare_api_token = <cloudflare api token>

# Only allow the owner to read and write the file
chmod 600 ~/.secrets/certbot/cloudflare.ini
```

## 8. Create the ssl certificate

```bash
certonly --dns-cloudflare \
  --dns-cloudflare-credentials ~/secrets/certbot/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 60 \
  --email <DOMAIN_OWNER_EMAIL> \
  --agree-tos \
  --no-eff-email \
  -n \
  -d *.<DOMAIN> \
  -d <DOMAIN>
```

## 9. Add ssl certificate to nginx template/default config

```bash
sudo sudo vi /etc/nginx/sites-available/config

# Add this to the config file
ssl_certificate /etc/letsencrypt/live/<DOMAIN>/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/<DOMAIN>/privkey.pem;
```

## 10. Restart nginx

```bash
sudo systemctl restart nginx
```

## 11. Check if your domain now have https

##

# Resources

<https://certbot.eff.org/instructions?ws=nginx&os=pip&tab=wildcard>

<https://certbot-dns-cloudflare.readthedocs.io/en/stable/>
