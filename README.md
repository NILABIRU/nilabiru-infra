# Nilabiru Gateway

A self-hosted management and gateway stack for the Nilabiru ecosystem, bundling Portainer, Nginx Proxy Manager, and an FRP client (frpc) into a single Docker Compose setup with a simple deploy script.

---

## Overview

**Nilabiru Gateway** provisions and manages a compact set of infrastructure services — a Docker management UI (Portainer), a reverse proxy with a web-based admin panel (Nginx Proxy Manager), and an FRP client (frpc) — all running in isolated Docker containers. The management ports (Portainer, the Nginx Proxy Manager admin panel, and frpc) are bound to the server's Tailscale IP, so they are reachable only over your private Tailscale network. Only the Nginx Proxy Manager HTTP/HTTPS ports (`80` and `443`) are published on all interfaces. Deployment is handled by a single `deploy.sh` script.

---

## Services

| Service                          | Image                             | Port(s)           | Description                                                                    |
| -------------------------------- | --------------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| **nilabiru-portainer**           | `portainer/portainer-ce:2.42.0`   | `9443`, `8000`    | Docker management UI with access to the host Docker socket                     |
| **nilabiru-nginx-proxy-manager** | `jc21/nginx-proxy-manager:2.15.1` | `80`, `443`, `81` | Reverse proxy with web-based admin panel and Let's Encrypt certificate storage |
| **nilabiru-frpc**                | `fatedier/frpc:v0.69.1`           | `7400`            | FRP client configured via `frpc.toml`, starts after Nginx Proxy Manager        |

All services run on the default Docker Compose network and use `restart: unless-stopped`. Ports `9443`, `8000`, `81`, and `7400` are bound to the Tailscale IP (`TAILSCALE_IP`). Ports `80` and `443` are published on all interfaces.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- Tailscale installed and connected on the server and all client machines
- A `frpc.toml` configuration file in the project root
- An FRP server (frps) that the client can connect to
- Host ports `80` and `443` free and reachable

---

## Getting Started

### 1. Clone the repository

```bash
git clone -b nilabiru-gateway https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-gateway"
cd nilabiru-gateway
```

### 2. Configure environment variables

Copy the provided `env` file and fill in all values:

```bash
cp env .env
```

Then edit `.env`:

```env
# Tailscale
TAILSCALE_IP=

# FRP
FRP_SERVER_ADDR=
FRP_TOKEN=
FRP_USER=
FRP_PASSWORD=
```

### 3. Check the FRP configuration

The FRP client reads its configuration from `frpc.toml` in the project root, which is mounted read-only into the container at `/etc/frp/frpc.toml`.

### 4. Start the stack

The recommended way is the provided deploy script:

```bash
chmod +x deploy.sh
./deploy.sh
```

`deploy.sh` stops on the first error (`set -e`) and does the following:

1. Validates the Compose configuration with `docker compose config --quiet`.
2. Deploys/redeploys all services with `docker compose up -d --remove-orphans --build`.
3. Always runs a cleanup on exit (even if a step fails) that removes dangling images with `docker image prune -f`.

Alternatively, you can start the stack directly:

```bash
docker compose up -d
```

To verify all services are running:

```bash
docker compose ps
```

---

## Service Access

Portainer, the Nginx Proxy Manager admin panel, and frpc are accessible only via the Tailscale IP of the server. Ports `80` and `443` are accessible on the server's public interfaces.

| Service                           | Address               |
| --------------------------------- | --------------------- |
| Portainer                         | `<TAILSCALE_IP>:9443` |
| Portainer (port `8000`)           | `<TAILSCALE_IP>:8000` |
| Nginx Proxy Manager (admin panel) | `<TAILSCALE_IP>:81`   |
| Nginx Proxy Manager (HTTP)        | `<SERVER_IP>:80`      |
| Nginx Proxy Manager (HTTPS)       | `<SERVER_IP>:443`     |
| frpc                              | `<TAILSCALE_IP>:7400` |

---

## Data Persistence

All stateful services use Docker named volumes for reliable persistence across restarts and redeployments.

| Volume / Path          | Type                   | Service             | Container path         |
| ---------------------- | ---------------------- | ------------------- | ---------------------- |
| `portainer-data`       | Named volume           | Portainer           | `/data`                |
| `npm-data`             | Named volume           | Nginx Proxy Manager | `/data`                |
| `npm-letsencrypt`      | Named volume           | Nginx Proxy Manager | `/etc/letsencrypt`     |
| `/var/run/docker.sock` | Bind mount             | Portainer           | `/var/run/docker.sock` |
| `./frpc.toml`          | Bind mount (read-only) | frpc                | `/etc/frp/frpc.toml`   |

> **Note:** Changes to `frpc.toml` or `.env` take effect only after the containers are recreated. Run `./deploy.sh` again after editing them.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
