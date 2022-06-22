# MakerDAO's TeleportJoin No-Settle Monitoring Bot

## Description

This bot detects when there are no `Settle` events on each domain emitted from the `TeleportJoin` contract for more than `DAYS_THRESHOLD` days.

> The threshold can be configured in **src/utils.ts**, L5.

## Supported Chains

- Ethereum

## Alerts

- MK-04
  - Fired when there is no `Settle` event emitted from TeleportJoin for more than `DAYS_THRESHOLD` days.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `domain`: The domain associated with the event.
    - `currentBlockTimestamp`: The current block's timestamp.
    - `latestSettleTimestamp`: The timestamp of the latest Settle event emitted (if it is known).
