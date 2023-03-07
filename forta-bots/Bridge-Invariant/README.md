# Bridge Invariant Monitor

## Description

This bot monitors the bridge invariant across the L2 Networks.

The invariant is:

```
L1DAI.balanceOf(escrow) ≥ L2DAI.totalSupply()
```

> The file `src/constants.ts` contains all the variables needed by the bot.
>
> - `L2_DATA`: Contains all the networks with the `chainId` number and the `escrow` address.
> - `L1_DAI`: DAI address.
> - `L2_MONITOR_HASH`: Hash of the bot monitoring the DAI supply in all the networks listed in `L2_DATA`.
>
> NOTE: `L2_MONITOR_HASH` is empty(`""`) by default so it is mandatory to set that variable before pushing/deploying the bot.

## Supported Chains

- Ethereum

## Alerts

- MAKER-BRIDGE-INVARIANT
  - Fired when the bridge invariant is not met for a L2 network
  - Severity is always set to "High"
  - Type is always set to "Suspicious"
  - Metadata contains:
    - `chainId`: The id of the network where the invariant is not met
    - `l1Escrow`: The address of the L1 escrow
    - `l1EscrowBalance`: The DAI balance of the L1 escrow
    - `totalSupply`: The DAI total supply of the L2 network
  - Addresses contains:
    - Escrow addresss
    - L1 Dai address
