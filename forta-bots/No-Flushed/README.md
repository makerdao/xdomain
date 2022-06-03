# MakerDAO's L2DaiTeleportGateway No-Flushed Monitoring Bot

## Description

This bot detects when there are no `Flushed` events emitted from the `L2DaiTeleportGateway` contract for more than `DAYS_THRESHOLD` days.

> The threshold can be configured in **src/utils.ts**, L5.

## Supported Chains

- Optimism
- Arbitrum

## Alerts

- MK-04
  - Fired when there is no `Flushed` event emitted from L2DaiTeleportGateway for more than `DAYS_THRESHOLD` days.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `currentBlockTimestamp`: The current block's timestamp.
    - `latestFlushedTimestamp`: The timestamp of the latest Flushed event emitted (if it is known).
