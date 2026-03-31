# Руководство по развёртыванию KirovskDC

Данное руководство описывает процесс запуска сайта KirovskDC на локальном сервере и публикации его в интернет через **Cloudflare Tunnel** с привязкой собственного домена. Все инструменты бесплатны, а процесс занимает около 15 минут.

---

## Содержание

1. [Требования](#1-требования)
2. [Установка зависимостей проекта](#2-установка-зависимостей-проекта)
3. [Настройка переменных окружения](#3-настройка-переменных-окружения)
4. [Запуск проекта локально](#4-запуск-проекта-локально)
5. [Установка cloudflared](#5-установка-cloudflared)
6. [Быстрый туннель (без домена)](#6-быстрый-туннель-без-домена)
7. [Постоянный туннель с собственным доменом](#7-постоянный-туннель-с-собственным-доменом)
8. [Запуск как системный сервис](#8-запуск-как-системный-сервис)
9. [Продакшн-сборка](#9-продакшн-сборка)
10. [Решение проблем](#10-решение-проблем)

---

## 1. Требования

Перед началом убедитесь, что на вашем сервере установлены следующие компоненты:

| Компонент | Минимальная версия | Проверка |
|---|---|---|
| Node.js | 18.x (рекомендуется 22.x) | `node --version` |
| pnpm | 8.x+ | `pnpm --version` |
| MySQL / TiDB | 8.0+ | `mysql --version` |
| Git | 2.x | `git --version` |

Если Node.js не установлен, используйте [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
```

Для установки pnpm:

```bash
npm install -g pnpm
```

---

## 2. Установка зависимостей проекта

Склонируйте репозиторий (или скопируйте файлы проекта) и установите зависимости:

```bash
cd kirovskdc-website
pnpm install
```

---

## 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта. Ниже приведён шаблон с описанием каждой переменной:

```env
# ─── База данных ───
DATABASE_URL=mysql://user:password@localhost:3306/kirovskdc

# ─── Авторизация ───
JWT_SECRET=ваш-секретный-ключ-минимум-32-символа

# ─── Приложение ───
VITE_APP_TITLE=КировскДЦ
PORT=3000
```

> **Важно:** Переменная `DATABASE_URL` должна указывать на работающий экземпляр MySQL. Создайте базу данных заранее:
>
> ```sql
> CREATE DATABASE kirovskdc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> ```

После создания базы данных примените миграции:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

---

## 4. Запуск проекта локально

Для разработки используйте dev-режим с горячей перезагрузкой:

```bash
pnpm dev
```

Сайт будет доступен по адресу `http://localhost:3000`. Убедитесь, что он работает корректно, прежде чем переходить к настройке туннеля.

---

## 5. Установка cloudflared

Cloudflare Tunnel позволяет безопасно опубликовать локальный сервер в интернет без открытия портов на роутере и без белого IP-адреса.

**Ubuntu / Debian:**

```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

**Arch Linux:**

```bash
sudo pacman -S cloudflared
```

**macOS:**

```bash
brew install cloudflare/cloudflare/cloudflared
```

**Windows:**

Скачайте установщик с [GitHub Releases](https://github.com/cloudflare/cloudflared/releases/latest) и добавьте `cloudflared.exe` в PATH.

Проверьте установку:

```bash
cloudflared --version
```

---

## 6. Быстрый туннель (без домена)

Если вам нужно быстро показать сайт без привязки домена, используйте одноразовый туннель. Cloudflare автоматически выделит временный поддомен:

```bash
cloudflared tunnel --url http://localhost:3000
```

В терминале появится ссылка вида `https://random-name-here.trycloudflare.com` — это ваш публичный адрес. Он работает, пока запущена команда, и не требует аккаунта Cloudflare.

---

## 7. Постоянный туннель с собственным доменом

Для продакшн-использования с собственным доменом выполните следующие шаги.

### 7.1. Авторизация в Cloudflare

```bash
cloudflared tunnel login
```

Откроется браузер. Выберите домен, который вы хотите использовать (он должен быть добавлен в ваш аккаунт Cloudflare). После авторизации в директории `~/.cloudflared/` появится файл `cert.pem`.

### 7.2. Создание туннеля

```bash
cloudflared tunnel create kirovskdc
```

Команда создаст туннель и выведет его UUID (например, `a1b2c3d4-e5f6-...`). Запомните его.

### 7.3. Настройка DNS

Привяжите домен к туннелю. Замените `ваш-домен.ru` на ваш реальный домен:

```bash
# Основной домен
cloudflared tunnel route dns kirovskdc ваш-домен.ru

# Или поддомен
cloudflared tunnel route dns kirovskdc cloud.ваш-домен.ru
```

Эта команда автоматически создаст CNAME-запись в DNS Cloudflare, указывающую на ваш туннель.

### 7.4. Конфигурационный файл

Создайте файл `~/.cloudflared/config.yml`:

```yaml
tunnel: a1b2c3d4-e5f6-...   # UUID вашего туннеля
credentials-file: /home/ваш-пользователь/.cloudflared/a1b2c3d4-e5f6-....json

ingress:
  - hostname: ваш-домен.ru
    service: http://localhost:3000
  - hostname: "*.ваш-домен.ru"
    service: http://localhost:3000
  - service: http_status:404
```

> **Примечание:** Последнее правило `http_status:404` является обязательным catch-all правилом Cloudflare.

### 7.5. Запуск туннеля

```bash
cloudflared tunnel run kirovskdc
```

Теперь ваш сайт доступен по адресу `https://ваш-домен.ru` с автоматическим SSL-сертификатом от Cloudflare.

---

## 8. Запуск как системный сервис

Чтобы туннель и сайт запускались автоматически при загрузке сервера, создайте systemd-сервисы.

### 8.1. Сервис для приложения

Создайте файл `/etc/systemd/system/kirovskdc.service`:

```ini
[Unit]
Description=KirovskDC Web Application
After=network.target mysql.service

[Service]
Type=simple
User=ваш-пользователь
WorkingDirectory=/путь/к/kirovskdc-website
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
EnvironmentFile=/путь/к/kirovskdc-website/.env

[Install]
WantedBy=multi-user.target
```

### 8.2. Сервис для cloudflared

```bash
sudo cloudflared service install
```

Эта команда автоматически создаст systemd-сервис для cloudflared, используя конфигурацию из `~/.cloudflared/config.yml`.

### 8.3. Запуск сервисов

```bash
# Сборка продакшн-версии
cd /путь/к/kirovskdc-website
pnpm build

# Включение и запуск сервисов
sudo systemctl enable kirovskdc
sudo systemctl start kirovskdc
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Проверка статуса
sudo systemctl status kirovskdc
sudo systemctl status cloudflared
```

---

## 9. Продакшн-сборка

Для продакшн-окружения соберите оптимизированную версию:

```bash
# Сборка
pnpm build

# Запуск
NODE_ENV=production node dist/index.js
```

Продакшн-сборка включает минификацию JavaScript, оптимизацию CSS и tree-shaking для минимального размера бандла.

---

## 10. Решение проблем

### Туннель не подключается

Проверьте, что `cloudflared` может подключиться к Cloudflare:

```bash
cloudflared tunnel info kirovskdc
```

Если возникает ошибка авторизации, повторите `cloudflared tunnel login`.

### Сайт не загружается через туннель

Убедитесь, что приложение запущено и слушает порт 3000:

```bash
curl http://localhost:3000
```

Если ответа нет, проверьте логи приложения:

```bash
sudo journalctl -u kirovskdc -f
```

### Ошибка «Bad Gateway» (502)

Обычно означает, что приложение не запущено или слушает другой порт. Проверьте, что порт в `config.yml` совпадает с портом приложения.

### DNS не обновляется

После выполнения `cloudflared tunnel route dns` подождите 1–5 минут для распространения DNS. Проверьте запись:

```bash
dig ваш-домен.ru CNAME
```

### Перенос домена в Cloudflare

Если ваш домен зарегистрирован у другого регистратора, вам нужно перенаправить NS-серверы на Cloudflare. В панели Cloudflare добавьте домен и следуйте инструкциям по смене NS-серверов у вашего регистратора. Обычно это занимает от нескольких минут до 24 часов.

---

## Краткая справка команд

| Действие | Команда |
|---|---|
| Запуск в dev-режиме | `pnpm dev` |
| Продакшн-сборка | `pnpm build` |
| Запуск продакшн | `node dist/index.js` |
| Быстрый туннель | `cloudflared tunnel --url http://localhost:3000` |
| Создать туннель | `cloudflared tunnel create kirovskdc` |
| Привязать домен | `cloudflared tunnel route dns kirovskdc ваш-домен.ru` |
| Запустить туннель | `cloudflared tunnel run kirovskdc` |
| Статус туннеля | `cloudflared tunnel info kirovskdc` |
| Список туннелей | `cloudflared tunnel list` |
| Удалить туннель | `cloudflared tunnel delete kirovskdc` |
