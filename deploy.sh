#!/bin/bash
set -e

cleanup() {
  docker image prune -f
}
trap cleanup EXIT

docker compose config --quiet
docker compose up -d --remove-orphans --build
