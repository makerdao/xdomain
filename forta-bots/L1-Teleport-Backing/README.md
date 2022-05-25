# MakerDAO Teleport Backing

## Description

This bot detects Mint events emitted from the TeleportJoin without the corresponding WormholeInitialized events from the L2DaiWormholeGateway contract.

## Supported Chains

- Optimism Kovan
- Arbitrum Testnet
- Polygon (PoC)

## Alerts

- MK-02-02
  - Fired when a Mint event emission without a corresponding WormholeInitialized event is detected.
  - Severity is always set to "High".
  - Type is always set to "Suspicous".
  - Metadata contains:
    - `txHash`: The hash of the transaction.
    - `hashGUID`: The teleport's GUID hash.
    - `chainId`: The chain identifier.

## Test Data

The bot behaviour can be verified with the following transaction:

- 0xfe5e7d9ee4d91362049f93d151742e448102591761a62c36da55c176c7e8268d (`Polygon mainnet PoC`)
