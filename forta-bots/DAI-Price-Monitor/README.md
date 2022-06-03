# DAI Price Monitor

## Description

This bot detects when DAI price exceeds `SPREAD_THRESHOLD` in UniswapV3 and Curve pools.

> The `SPREAD_THRESHOLD` can be configured in **src/utils.ts**, L5.

## Supported Chains

- Optimism
- Arbitrum

## Alerts

- MK-06
  - Fired when `DAI price` is below/above spread threshold.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `price`: DAI price that triggered the alert.
    - `spreadThreshold`: Configured spread threshold.
    - `network`: Current network name.
  - Addresses contains:
    - The `pool` address.

## Test Data

The bot behaviour can be verified with the following transactions, by setting the `SPREAD_THRESHOLD` to **0.0001**:

- 0xbdbe66bcda2b910f9684e91081634d3ccc3f0f85dee982d08de0a6081ca908c3 (UniswapV3 DAI/USDC - Arbitrum)
- 0xf568fe6ff55766968c8e89d733e2254d4da6af5028293d6e89a5825a07cebc48 (UniswapV3 USDC/DAI - Optimism)
- 0xbdc5767ae91b8aed44485ad4918e6e57addb7ee520e75a25d8b1ccc3991ab1db (Curve USDT/DAI - Optimism)
- 0xb6ecd1976b2e6293a1a4fecacb267e2e4b6ad6ae49542d7d6abcd773d4b037d6 (Curve USDC/DAI - Optimism)
