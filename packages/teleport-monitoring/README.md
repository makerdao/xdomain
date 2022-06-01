# Teleport Monitoring

Prometheus enabled monitoring service for Maker Teleport.

## Implemented checks

These checks are run on _every new finalized block_:

- _bridge invariant_ - compares amount of L1 escrowed DAI vs L2 DAI total supply
- _bad debt_ - ensures that every new L1 mint using oracle auth has a corresponding burn on L2. **Note: This will only
  monitor, new upcoming wormholes and will reset after restart! Use one of the scripts to calculate all bad debt**

## Running

1. To run local database:

```
./scripts/db.sh
# ... or manually run these commands
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
./scripts/prom.sh
```

## Scripts

### Bad Debt

Use `yarn node -r esbuild-register ./src/bin/calc-bad-debt.ts L1_RPC` to run a script to calculate cumulative bad debt.
