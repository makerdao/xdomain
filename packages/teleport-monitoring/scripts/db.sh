#!/usr/bin/env bash
set -ex
cd "$(dirname "$0")"

docker rm -f teleport_monitoring
docker run -d --name=teleport_monitoring -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
sleep 5
yarn wait-on tcp:5432

yarn prisma migrate dev
DATABASE_URL=postgresql://postgres:password@localhost:5432/test yarn prisma migrate dev