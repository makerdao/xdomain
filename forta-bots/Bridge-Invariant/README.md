# Bridge Invariant Monitor

## Description

This bot monitors the bridge invariant across the L2 Networks.

The invariant is:
```
L1DAI.balanceOf(escrow) ≥ L2DAI.totalSupply()
```
> The file `src/constants.ts` contains all the variables needed by the bot
> - `L2_DATA`: Contains all the networks with the `chainId` number and the `escrow` address
> - `L1_DAI`: Dai address
> - `L2_MONITOR_HASH`: Hash of the bot monitoring the DAI supply in all the networks listed in `L2_DATA`.

## Supported Chains

- Ethereum

## Alerts

- MAKER-BRIDGE-INVARIANT
  - Fired when the bridge invariant is not met for a L2 network
  - Severity is always set to "High"  
  - Type is always set to "Suspicious"  
  - Metadata contains:
    - `chainId`: The id of the network where the invariant is not met
    - `escrow`: The address of the escrow
    - `escrowBalance`: The DAI balance of the escrow
    - `totalSupply`: The DAI total supply of the L2 network
  - Addresses contains:
    - Escrow addresss
    - L1 Dai address
