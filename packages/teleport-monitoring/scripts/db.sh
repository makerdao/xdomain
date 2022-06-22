#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

docker rm -f teleport_monitoring
docker run -d --name=teleport_monitoring -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
yarn wait-on tcp:5432
yarn prisma migrate dev