# Bridge Invariant Monitor

## Description

### On L1:
The bot monitors the bridge invariant across the L2 Networks.

The invariant is:
```
L1DAI.balanceOf(escrow) ≥ L2DAI.totalSupply()
```
### On L2:
The bot detects DAI `totalSupply` changes.

## Configuration

> The file `src/constants.ts` contains all the variables needed by the bot.
>
> - `CONFIG` contains:
>   - `DAI`: DAI address.
>   - `L2_DATA`: Contains all the L2 networks with the `chainId` number and their respective `l1Escrow` address.
> - `L2_MONITOR_HASH`: Hash of the bot.
>
> **NOTE**: Before deploying, set the `L2_MONITOR_HASH` and the `agentId` in `forta.config.json` to the same random keccak256 hash.

## Supported Chains

- Ethereum
- Optimism
- Arbitrum

## Alerts

- MAKER-BRIDGE-INVARIANT
  - Fired when the bridge invariant is not met for a L2 network.
  - Severity is always set to "High".
  - Type is always set to "Suspicious".
  - Metadata contains:
    - `chainId`: The id of the network where the invariant is not met.
    - `l1Escrow`: The address of the L1 escrow.
    - `l1EscrowBalance`: The DAI balance of the L1 escrow.
    - `totalSupply`: The DAI total supply of the L2 network.
  - Addresses contains:
    - Escrow addresss
    - L1 DAI address

- L2-DAI-MONITOR
  - Fired when the DAI supply in a block differs from the supply in the previous one.
  - Severity is always set to "Info".
  - Type is always set to "Info".
  - Metadata contains:
    - `supply`: The DAI total supply.
