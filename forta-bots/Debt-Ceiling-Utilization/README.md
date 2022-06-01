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
    - `debt`: Current TeleportJoin's debt.
    - `line`: Current TeleportJoin's line.
