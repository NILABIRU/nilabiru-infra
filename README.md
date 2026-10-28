# Nilabiru Uptime Kuma

A minimal self-hosted uptime monitoring setup for the Nilabiru ecosystem, running [Uptime Kuma](https://github.com/louislam/uptime-kuma) in Docker Compose with a simple deploy script.

---

## Overview

**Nilabiru Uptime Kuma** runs Uptime Kuma to watch services (HTTP, TCP, ping, and more) and send notifications when something goes down. The published port is bound to the server's Tailscale IP, so the web interface is reachable only over your private Tailscale network.

---

## Services

| Service                  | Image                          | Port   | Description                         |
| ------------------------ | ------------------------------ | ------ | ----------------------------------- |
| **nilabiru-uptime-kuma** | `louislam/uptime-kuma:1.23.17` | `3001` | Uptime monitoring and notifications |

The service uses `restart: unless-stopped`. The port is bound to the Tailscale IP (`TAILSCALE_IP`) and is not exposed on public network interfaces.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- Tailscale installed and connected on the server and all client machines

---

## Getting Started

### 1. Clone the repository

```bash
git clone -b nilabiru-uptime-kuma https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-uptime-kuma"
cd nilabiru-uptime-kuma
```

### 2. Configure environment variables

```bash
cp env .env
```

Then edit `.env`:

```env
# Tailscale
TAILSCALE_IP=
```

### 3. Start the stack

```bash
chmod +x deploy.sh
./deploy.sh
```

`deploy.sh` stops on the first error (`set -e`) and does the following:

1. Validates the Compose configuration with `docker compose config --quiet`.
2. Deploys/redeploys all services with `docker compose up -d --remove-orphans --build`.
3. Always runs a cleanup on exit (even if a step fails) that removes dangling images with `docker image prune -f`.

To verify the service is running:

```bash
docker compose ps
```

---

## Service Access

| Service     | Address                      |
| ----------- | ---------------------------- |
| Uptime Kuma | `http://<TAILSCALE_IP>:3001` |

Create the Uptime Kuma admin account on first visit.

---

## Data Persistence

| Volume             | Type         | Service     | Container path |
| ------------------ | ------------ | ----------- | -------------- |
| `uptime-kuma-data` | Named volume | Uptime Kuma | `/app/data`    |

> **Note:** The volume is pinned to the name `nilabiru-monitoring_uptime-kuma-data` in `docker-compose.yml` so existing data is kept after the project rename. On a fresh install you can change `name:` to any value you like before the first start.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
