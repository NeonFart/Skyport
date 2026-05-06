FROM php:8.3-fpm-alpine AS base

# Dépendances système
RUN apk add --no-cache \
    nodejs npm curl unzip git bash \
    libpng-dev oniguruma-dev libxml2-dev \
    sqlite-dev

# Extensions PHP
RUN docker-php-ext-install pdo pdo_sqlite mbstring exif pcntl bcmath gd

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Bun — installation via npm (Alpine-compatible)
RUN npm install -g bun

WORKDIR /var/www

COPY . .

# Installe les dépendances PHP
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Installe les dépendances JS et build
RUN bun install && bun run build

# Permissions
RUN chmod -R 775 storage bootstrap/cache && \
    chown -R www-data:www-data storage bootstrap/cache

# Setup Laravel
RUN cp .env.example .env && \
    php artisan key:generate && \
    php artisan migrate --force

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
