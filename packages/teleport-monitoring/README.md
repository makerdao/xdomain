# Teleport Monitoring

Prometheus enabled monitoring service for Maker Teleport.

## Implemented checks

These checks are run on _every new finalized block_:

- _bridge invariant_ - compares amount of L1 escrowed DAI vs L2 DAI total supply
- _bad debt_ - ensures that every new L1mint using oracle auth has a corresponding burn on L2

## Running

1. To run local database:

```
docker run -d --name=teleport_monitoring -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
yarn prisma migrate dev # migrate db
```

2. To start monitoring + http server exporting metrics run:

```sh
yarn start <L1_RPC?>
```

env:

```
L1_RPC - rpc
DATABASE_URL -  db url with credentials
```

3. To run prometheus run local script:

```
./prom.sh
```
