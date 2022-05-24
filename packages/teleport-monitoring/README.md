# Teleport Monitoring

Prometheus enabled monitoring service for Maker Teleport.

## Implemented checks

These checks are run on _every new finalized block_:

- _bridge invariant_ - compares amount of L1 escrowed DAI vs L2 DAI total supply
- _bad debt_ - ensures that every new L1mint using oracle auth has a corresponding burn on L2

## Running

```sh
yarn start <L1_RPC?>
```

env:

```
L1_RPC - rpc
DATABASE_URL -  db url with credentials
```

### Database for local testing

```sh
docker run -d --name=teleport_monitoring -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```
