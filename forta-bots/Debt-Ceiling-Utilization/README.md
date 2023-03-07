# MakerDAO TeleportJoin's Debt Ceiling utilization

## Description

This bot detects when the `Debt Ceiling` utilization threshold is exceeded in `TeleportJoin` contract.

> The `threshold` can be configured in **src/utils.ts**, L5.

## Supported Chains

- Ethereum

## Alerts

- MK-07
  - Fired when the `debt`/`line` ratio is over the `threshold`.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `domain`: The domain in which the threshold is exceeded.
    - `debt`: Current TeleportJoin's debt.
    - `line`: Current TeleportJoin's line.
    - `threshold`: Configured threshold.

## Test Data

The bot behaviour can be verified on the following block on Polygon Mumbai Testnet (PoC):

- 26926950, by running the following command: `yarn run block 26926950`
