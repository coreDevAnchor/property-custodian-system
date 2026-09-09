#!/bin/sh
set -e

cd /var/www/html

if [ -z "${APP_KEY}" ] || [ "${APP_KEY}" = "change-me" ]; then
    echo "APP_KEY missing, generating..."
    php artisan key:generate --force
fi

php artisan migrate --force --no-interaction
php artisan config:cache
php artisan view:cache

exec supervisord -c /etc/supervisord.conf