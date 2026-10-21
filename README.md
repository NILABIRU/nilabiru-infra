# Nilabiru FRP

A self-hosted reverse proxy server for the Nilabiru ecosystem, running FRP Server (frps) in a single Docker Compose setup with a simple deploy script.

---

## Overview

**Nilabiru FRP** provisions and manages an FRP server (`frps`) running in an isolated Docker container. The server is configured through a `frps.toml` file mounted into the container, and its credentials are passed in as environment variables. Deployment is handled by a single `deploy.sh` script.

---

## Services

| Service           | Image                   | Port(s)                     | Description                                                                     |
| ----------------- | ----------------------- | --------------------------- | ------------------------------------------------------------------------------- |
| **nilabiru-frps** | `fatedier/frps:v0.69.1` | `7000`, `80`, `443`, `7500` | FRP server configured via `frps.toml`, with token and user/password credentials |

The service runs on the default Docker Compose network and uses `restart: unless-stopped`. All ports are published directly on the host (`0.0.0.0`), not bound to a specific IP.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- A `frps.toml` configuration file in the project root
- Host ports `7000`, `80`, `443`, and `7500` free and reachable

---

## Getting Started

### 1. Clone the repository

```bash
git clone -b nilabiru-frps https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-frps"
cd nilabiru-frps
```

### 2. Configure environment variables

Copy the provided `env` file and fill in all values:

```bash
cp env .env
```

Then edit `.env`:

```env
# FRP
FRP_TOKEN=
FRP_USER=
FRP_PASSWORD=
```

### 3. Check the FRP configuration

The server reads its configuration from `frps.toml` in the project root, which is mounted read-only into the container at `/etc/frp/frps.toml`.

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

| Port   | Address            |
| ------ | ------------------ |
| `7000` | `<SERVER_IP>:7000` |
| `80`   | `<SERVER_IP>:80`   |
| `443`  | `<SERVER_IP>:443`  |
| `7500` | `<SERVER_IP>:7500` |

---

## Data Persistence

This stack stores no data of its own and defines no volumes. The only mounted file is the configuration:

| Path          | Type                   | Service | Container path       |
| ------------- | ---------------------- | ------- | -------------------- |
| `./frps.toml` | Bind mount (read-only) | frps    | `/etc/frp/frps.toml` |

> **Note:** Changes to `frps.toml` or `.env` take effect only after the container is recreated. Run `./deploy.sh` again after editing them.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
