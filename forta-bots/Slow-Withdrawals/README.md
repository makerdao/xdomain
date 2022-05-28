# MakerDAO's TeleportJoin Slow Withdrawals Monitoring Bot

## Description

This bot detects slow withdrawals from the `TeleportJoin` contract.

## Supported Chains

- Ethereum

## Alerts

- MK-03
  - Fired when a Mint event is emitted from the `TeleportJoin` with other than the `TeleportOracleAuth` contract as the originator.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `txHash`: The hash of the transaction.
    - `originator`: The address of the originator.
    - `chainId`: The chain identifier.

## Test Data

The bot behaviour can be verified with the following transaction:

- 0xfe5e7d9ee4d91362049f93d151742e448102591761a62c36da55c176c7e8268d (`Polygon mainnet PoC`)
