# L2 DAI Balance Monitor

## Description

This agent detects DAI totalSupply changes on L2s

## Supported Chains

- Optimism
- Arbitrum

## Alerts

- L2-DAI-MONITOR
  - Fired when the DAI supply in a block differs from the supply in the previous one.
  - Severity is always set to "Info"
  - Type is always set to "Info"
  - Metadata contains:
    - `supply`: The DAI total supply
