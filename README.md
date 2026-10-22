# Nilabiru Infra

Infrastructure-as-code for the Nilabiru ecosystem. This repository holds a collection of self-hosted Docker Compose stacks, each kept on its own branch.

---

## Overview

The `main` branch contains only this README. Every stack lives in a dedicated branch with its own `docker-compose.yml`, environment template, and README. To use a stack, clone the repository on the branch you need.

---

## Stacks

| Branch                     | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `nilabiru-gateway`         | Portainer, Nginx Proxy Manager, and FRP client (frpc) |
| `nilabiru-database`        | MariaDB, PostgreSQL, and MongoDB                      |
| `nilabiru-cache-mq`        | Redis (cache) and RabbitMQ (message queue)            |
| `nilabiru-storage`         | RustFS (S3-compatible object storage) and Nextcloud   |
| `nilabiru-frps`            | FRP server (frps)                                     |
| `nilabiru-portainer-agent` | Portainer Agent                                       |

Refer to the README of each branch for its services, environment variables, and deployment steps.

---

## Getting Started

Clone the branch of the stack you want to deploy:

```bash
git clone -b <branch-name> https://github.com/NILABIRU/nilabiru-infra.git "<folder-name>"
cd <folder-name>
```

For example, to deploy the database stack:

```bash
git clone -b nilabiru-database https://github.com/NILABIRU/nilabiru-infra.git "nilabiru-database"
cd nilabiru-database
```

Then follow the instructions in that branch's README.

---

## Requirements

- Docker Engine `20.10+`
- Docker Compose `v2+`
- Tailscale installed and connected on the server and all client machines (used by most stacks to bind ports to the Tailscale IP)

---

## License

This project is licensed under the [MIT License](LICENSE).
Copyright © 2026 Andry Pebrianto
