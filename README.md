# Nilabiru 9Router

A minimal self-hosted AI router setup for the Nilabiru ecosystem, running [9Router](https://github.com/decolua/9router) in Docker Compose with a simple deploy script.

---

## Overview

**Nilabiru 9Router** runs 9Router to unify multiple AI providers (subscriptions, low-cost, and free models) behind a single OpenAI-compatible API endpoint. The published port is bound to the server's Tailscale IP, so the dashboard and API are reachable only over your private Tailscale network. API key validation is enforced on the `/v1` endpoint.

---

## Services

| Service              | Image                     | Port    | Description                                        |
| -------------------- | ------------------------- | ------- | -------------------------------------------------- |
| **nilabiru-9router** | `decolua/9router:0.5.116` | `20128` | AI router with dashboard and OpenAI-compatible API |

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
git clone -b nilabiru-9router https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-9router"
cd nilabiru-9router
```

### 2. Configure environment variables

```bash
cp env .env
```

Then edit `.env`:

```env
# Tailscale
TAILSCALE_IP=

# 9Router
JWT_SECRET=
INITIAL_PASSWORD=
```

| Variable           | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| `TAILSCALE_IP`     | Tailscale IP of the server the port is bound to                  |
| `JWT_SECRET`       | Secret used to sign dashboard sessions (use a long random value) |
| `INITIAL_PASSWORD` | Initial dashboard login password                                 |

Generate a random `JWT_SECRET` with:

```bash
openssl rand -hex 32
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

| Service               | Address                                 |
| --------------------- | --------------------------------------- |
| 9Router Dashboard     | `http://<TAILSCALE_IP>:20128/dashboard` |
| OpenAI-compatible API | `http://<TAILSCALE_IP>:20128/v1`        |

Log in to the dashboard with `INITIAL_PASSWORD`, then change the password and create an API key. Because `REQUIRE_API_KEY` is set to `true`, every request to `/v1` must include a valid API key.

---

## Data Persistence

| Volume                   | Type         | Service | Container path   |
| ------------------------ | ------------ | ------- | ---------------- |
| `nilabiru-9router_data`  | Named volume | 9Router | `/app/data`      |
| `nilabiru-9router_usage` | Named volume | 9Router | `/root/.9router` |

> **Note:** Both volumes are pinned to fixed names in `docker-compose.yml`, so data is kept regardless of the Compose project name. Do not run `docker compose down -v` unless you intend to wipe provider connections, API keys, and usage history.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
