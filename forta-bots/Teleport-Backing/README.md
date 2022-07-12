# MakerDAO Teleport Backing

## Description

### On L1:

The bot detects `Mint` events emitted from the `TeleportJoin` without the corresponding `TeleportInitialized` events from the `L2DaiTeleportGateway` contract.

### On L2:

The bot detects `TeleportInitialized` emissions from the `L2DaiTeleportGateway` contract.

## Deployment Instructions

Before deploying, set the `agentId` in `forta.config.json` and the `BOT_ID` in `src/utils, L4` to the same random keccak256 hash.

## Supported Chains

- Ethereum
- Optimism
- Arbitrum

## Alerts

- MK-02-01

  - Fired when a `Mint` event emission without a corresponding `TeleportInitialized` event is detected.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `txHash`: The hash of the transaction.
    - `hashGUID`: The teleport's GUID hash.
    - `chainId`: The chain identifier.

- MK-02-02

  - Fired when `TeleportInitialized` events emissions are detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains all the `Teleport GUID hashes` of the specific block.

## Test Data

The bot behaviour can be verified with the following block:

- 28754800 (`Polygon Mainnet PoC`),

a) On **L2** by default.\
b) On **L1** by changing the agent.ts, L49 to:

> [Network.RINKEBY, Network.KOVAN, **Network.POLYGON**]
