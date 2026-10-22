# Nilabiru Storage

A self-hosted storage stack for the Nilabiru ecosystem, bundling RustFS and Nextcloud into a single Docker Compose setup with a simple deploy script.

---

## Overview

**Nilabiru Storage** provisions and manages a compact set of storage services — an S3-compatible object storage server (RustFS) and a file hosting platform (Nextcloud) — all running in isolated Docker containers. Nextcloud connects to an external PostgreSQL and Redis instance. Every published port is bound to the server's Tailscale IP, so the services are reachable only over your private Tailscale network. Deployment is handled by a single `deploy.sh` script.

---

## Services

| Service                | Image                 | Port(s)                                                  | Description                                                                       |
| ---------------------- | --------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **nilabiru-rustfs**    | `rustfs/rustfs:1.0.1` | `9000` (S3 API), `9002` (Console, container port `9001`) | Object storage with access key / secret key authentication and a web console      |
| **nilabiru-nextcloud** | `nextcloud:29-apache` | `8080` (container port `80`)                             | File hosting platform using an external PostgreSQL database and Redis for caching |

All services run on the default Docker Compose network and use `restart: unless-stopped`. Every published port is bound to the Tailscale IP (`TAILSCALE_IP`) — none are exposed on public network interfaces.

> **Note:** The RustFS console is published on host port `9002` (instead of `9001`) to avoid a conflict with the Portainer Agent.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- Tailscale installed and connected on the server and all client machines
- An existing PostgreSQL instance (used by Nextcloud)
- An existing Redis instance (used by Nextcloud)

---

## Getting Started

### 1. Clone the repository

```bash
git clone -b nilabiru-storage https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-storage"
cd nilabiru-storage
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

# RustFS
RUSTFS_ACCESS_KEY=
RUSTFS_SECRET_KEY=

# Nextcloud - PostgreSQL
POSTGRES_HOST=
POSTGRES_USER=
POSTGRES_PASSWORD=
NEXTCLOUD_DB_NAME=

# Nextcloud - Redis
REDIS_HOST=
REDIS_PASSWORD=

# Nextcloud - Domain & Proxy
NEXTCLOUD_TRUSTED_DOMAINS=
NC_OVERWRITEHOST=
NC_TRUSTED_PROXIES=
```

### 3. Start the stack

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

All services are accessible only via the Tailscale IP of the server.

| Service        | Address               |
| -------------- | --------------------- |
| RustFS S3 API  | `<TAILSCALE_IP>:9000` |
| RustFS Console | `<TAILSCALE_IP>:9002` |
| Nextcloud      | `<TAILSCALE_IP>:8080` |

---

## Data Persistence

RustFS data and Nextcloud user files are stored in host directories under `/sata-storage`, while application files and logs use Docker named volumes.

| Volume / Path                   | Type         | Service   | Container path       |
| ------------------------------- | ------------ | --------- | -------------------- |
| `/sata-storage/rustfs-data`     | Bind mount   | RustFS    | `/data`              |
| `rustfs-logs`                   | Named volume | RustFS    | `/app/logs`          |
| `nextcloud-data`                | Named volume | Nextcloud | `/var/www/html`      |
| `/sata-storage/nextcloud-files` | Bind mount   | Nextcloud | `/var/www/html/data` |

> **Note:** The Nextcloud admin credentials in `.env` are only applied on the **first** startup, when the `nextcloud-data` volume is still empty. Changing them later will not update the existing installation.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
