# TeleportInitialized events monitoring bot

## Description

This bot detects `TeleportInitialized` emissions from the `L2DaiTeleportGateway` contract.

## Supported Chains

- Optimism 
- Arbitrum 

## Alerts

- MK-2
  - Fired when `TeleportInitialized` events emissions are detected.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains all the `Teleport GUID hashes` of the specific block.

## Test Data

The bot behaviour can be verified in the following block:

- 28725042 (`Polygon mainnet PoC`)
