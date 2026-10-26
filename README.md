# Nilabiru Git

A self-hosted Git and CI stack for the Nilabiru ecosystem, bundling Gitea and a Gitea Actions runner into a single Docker Compose setup with a simple deploy script.

---

## Overview

**Nilabiru Git** provisions a Gitea server for hosting repositories and a Gitea Actions runner (`act_runner`) that executes workflows compatible with GitHub Actions syntax. Gitea stores its data in an external **PostgreSQL** instance (for example, from the Nilabiru Database stack). Every published port is bound to the server's Tailscale IP, so the services are reachable only over your private Tailscale network. Deployment is handled by a single `deploy.sh` script.

---

## Services

| Service                 | Image                    | Port(s)                          | Description                                                          |
| ----------------------- | ------------------------ | -------------------------------- | -------------------------------------------------------------------- |
| **nilabiru-gitea**      | `gitea/gitea:1.24.0`     | `3000` (web), `2222` (SSH)       | Git hosting with web UI, using an external PostgreSQL database       |
| **nilabiru-act-runner** | `gitea/act_runner:0.2.11`| none                             | Gitea Actions runner that executes workflow jobs through Docker      |

All services run on the default Docker Compose network and use `restart: unless-stopped`. Every published port is bound to the Tailscale IP (`TAILSCALE_IP`) — none are exposed on public network interfaces. SSH is published on host port `2222` (mapped to container port `22`) so it does not collide with the host's own SSH server.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- Tailscale installed and connected on the server and all client machines
- An existing PostgreSQL instance with a database and user created for Gitea

---

## Getting Started

### 1. Clone the repository

```bash
git clone -b nilabiru-git https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-git"
cd nilabiru-git
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

# Gitea - PostgreSQL (external)
GITEA_DB_HOST=
GITEA_DB_NAME=
GITEA_DB_USER=
GITEA_DB_PASSWORD=

# Gitea - Server
GITEA_DOMAIN=
GITEA_ROOT_URL=

# Gitea Actions runner
GITEA_RUNNER_NAME=
GITEA_RUNNER_REGISTRATION_TOKEN=
```

| Variable                          | Description                                                                 |
| --------------------------------- | --------------------------------------------------------------------------- |
| `GITEA_DB_HOST`                   | PostgreSQL address including the port, e.g. `<host>:5432`                   |
| `GITEA_DOMAIN`                    | Hostname used in clone URLs                                                 |
| `GITEA_ROOT_URL`                  | Full public URL of Gitea, e.g. `http://<TAILSCALE_IP>:3000/`                |
| `GITEA_RUNNER_REGISTRATION_TOKEN` | Leave empty on the first run; see step 4                                    |

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

### 4. Register the runner

1. Open Gitea in the browser and complete the first-time installation page, creating the admin account.
2. Go to **Site Administration → Actions → Runners** and copy the registration token.
3. Put the token in `.env` as `GITEA_RUNNER_REGISTRATION_TOKEN`.
4. Run `./deploy.sh` again.

Until a valid token is set, `nilabiru-act-runner` will fail and restart repeatedly. This is expected on the first run.

---

## Service Access

All services are accessible only via the Tailscale IP of the server.

| Service        | Address                              |
| -------------- | ------------------------------------ |
| Gitea (web)    | `http://<TAILSCALE_IP>:3000`         |
| Gitea (SSH)    | `ssh://git@<TAILSCALE_IP>:2222`      |

Open registration is disabled (`GITEA__service__DISABLE_REGISTRATION=true`), so new users must be created by an administrator.

---

## Data Persistence

| Volume            | Type         | Service     | Container path |
| ----------------- | ------------ | ----------- | -------------- |
| `gitea-data`      | Named volume | Gitea       | `/data`        |
| `act-runner-data` | Named volume | act_runner  | `/data`        |

The `/var/run/docker.sock` bind mount lets the runner start job containers on the host.

> **Note:** Mounting the Docker socket gives workflows effectively root-level control of the Docker host. Only run workflows from repositories you trust. Repository data lives in `gitea-data` and the database lives in PostgreSQL, so back up both.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
