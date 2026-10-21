# Nilabiru Portainer Agent

A Docker Compose setup for the Portainer Agent, letting a central Portainer server manage the Docker host this stack runs on.

---

## Overview

**Nilabiru Portainer Agent** runs a single container, the [Portainer Agent](https://docs.portainer.io/admin/environments/add/docker/agent), on a remote server. Once the agent is running, a Portainer server can connect to it and manage that server's containers, images, networks, and volumes from one central dashboard. Deployment is handled by a single `deploy.sh` script.

---

## Services

| Service                      | Image                    | Port(s) | Description                                                              |
| ---------------------------- | ------------------------ | ------- | ------------------------------------------------------------------------ |
| **nilabiru-portainer-agent** | `portainer/agent:2.42.0` | `9001`  | Agent that lets a Portainer server manage this host's Docker environment |

The container uses `restart: unless-stopped` and runs on the default Docker Compose network.

> **Warning:** Unlike the other Nilabiru stacks, port `9001` is published on **all network interfaces** — it is not bound to the Tailscale IP. The agent has full control over the host's Docker daemon, so restrict access to this port to your Portainer server only (for example with a firewall rule such as `ufw`), or bind it to a private IP in `docker-compose.yml`.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- A running Portainer server that can reach this host on port `9001`
- The agent version should match the Portainer server version (`2.42.0`)

---

## Getting Started

### 1. Clone the repository

```bash
git clone -b nilabiru-portainer-agent https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-portainer-agent"
cd nilabiru-portainer-agent
```

### 2. Start the agent

This stack needs no environment variables or `.env` file. Start it with the provided deploy script:

```bash
chmod +x deploy.sh
./deploy.sh
```

`deploy.sh` stops on the first error (`set -e`) and does the following:

1. Validates the Compose configuration with `docker compose config --quiet`.
2. Deploys/redeploys the agent with `docker compose up -d --remove-orphans --build`.
3. Always runs a cleanup on exit (even if a step fails) that removes dangling images with `docker image prune -f`.

Alternatively, you can start the agent directly:

```bash
docker compose up -d
```

To verify it is running:

```bash
docker compose ps
```

### 3. Connect it to your Portainer server

1. In the Portainer web UI, go to **Environments → Add environment**.
2. Choose **Docker Standalone** and then **Agent**.
3. Enter a name and the environment address: `<SERVER_IP>:9001`.
4. Click **Connect**.

---

## Service Access

| Service         | Address            |
| --------------- | ------------------ |
| Portainer Agent | `<SERVER_IP>:9001` |

The agent has no web interface of its own — it is only used by a Portainer server.

---

## Volumes & Mounts

The agent does not use any named volumes. It needs the following host bind mounts:

| Mount                                             | Type       | Purpose                                               |
| ------------------------------------------------- | ---------- | ----------------------------------------------------- |
| `/var/run/docker.sock:/var/run/docker.sock`       | Bind mount | Docker socket access to manage containers and images  |
| `/var/lib/docker/volumes:/var/lib/docker/volumes` | Bind mount | Access to Docker volumes so Portainer can browse them |

> **Note:** Mounting the Docker socket gives the agent root-equivalent control over the host. Only connect it to a Portainer server you trust.

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
