#!/bin/bash
# -------------------------------------------------------------------
# init-letsencrypt.sh
# First-time SSL certificate setup for Let's Encrypt + Docker Compose
#
# Usage:  chmod +x init-letsencrypt.sh && sudo ./init-letsencrypt.sh
# -------------------------------------------------------------------

set -e

DOMAIN="aitest.qefmoodle.com"
EMAIL=""  # 填入你的邮箱，留空则使用 --register-unsafely-without-email
STAGING=0 # 设为 1 先用 staging 环境测试，避免触发速率限制

# -------------------------------------------------------------------

if [ -z "$EMAIL" ]; then
  EMAIL_ARG="--register-unsafely-without-email"
else
  EMAIL_ARG="--email $EMAIL"
fi

if [ "$STAGING" -eq 1 ]; then
  STAGING_ARG="--staging"
else
  STAGING_ARG=""
fi

echo "### Creating dummy certificate for $DOMAIN ..."
CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
docker compose run --rm --entrypoint "/bin/sh -c \
  \"mkdir -p '$CERT_PATH' && \
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout '$CERT_PATH/privkey.pem' \
    -out '$CERT_PATH/fullchain.pem' \
    -subj '/CN=localhost'\"" certbot
echo

echo "### Starting nginx ..."
docker compose up -d nginx
echo

echo "### Deleting dummy certificate ..."
docker compose run --rm --entrypoint "/bin/sh -c \
  \"rm -rf /etc/letsencrypt/live/$DOMAIN && \
  rm -rf /etc/letsencrypt/archive/$DOMAIN && \
  rm -rf /etc/letsencrypt/renewal/$DOMAIN.conf\"" certbot
echo

echo "### Requesting real certificate from Let's Encrypt ..."
docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    $EMAIL_ARG \
    -d $DOMAIN \
    --rsa-key-size 4096 \
    --agree-tos \
    --force-renewal" certbot
echo

echo "### Reloading nginx ..."
docker compose exec nginx nginx -s reload

echo "### Done! SSL certificate installed for $DOMAIN"
