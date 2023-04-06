# DAI standard bridge for zkSync 2.0

DAI standard bridge implements "standard" functionality for a canonical DAI bridge. It comforms to zkSync 2.0 interfaces
and communication standards. One thing that is specific to zkSync is the need to handle failed L1 --> L2 transactions.
When L1 --> L2 transaction fails, end user must present a proof of failure (technically - a merkle proof of L2 Log
certifiyng for failed message) to reclaim their deposit.

# Specification

## L1DAITokenBridge

- `deposit()` - allows depositing DAI to L2. Locks DAI in Escrow and send L1 --> L2 request to L2DAITokenBridge to mint
  DAI on L2
- `claimFailedDeposit()` - allows reclaiming DAI from Escrow for failed deposits
- `finalizeWithdrawal()` - callable only from L2 bridge, finalizes the withdrawal from L2 by releasing DAI from Escrow
- `close()` - closes the bridge. Only auth users.

## L2DAITokenBridge

- `withdraw()` - burns DAI and sends L2 --> L1 request to L1DAITokenBridge to release DAI from Escrow
- `finalizeDeposit()` - callable only from L1 bridge, finalizes the deposit from L1 by minting canonical L2 DAI
- `close()` - closes the bridge. Only via Governance Relayer.

## L1GovernanceRelay

- `relay()` - allows auth user to relay message to L2GovernanceRelay.

## L2GovernanceRelay

- `relay()` - callable only from L1GovernanceRelay, executes relayed message.

# Deployments

## Goerli

```
{
  "l1DAITokenBridge": "0x2Ef38251399B9Abc5d1Ec099dff59d3851988120",
  "l2DAITokenBridge": "0x4a9Ba62e9d0CC14Fb1467671ec3C18986b5628C8",
  "l1GovernanceRelay": "0xa67ee481981054049CDF43604c4154b760aD0623",
  "l2GovernanceRelay": "0xDf412a9C9c093073270b99EDD8F20849Cd1Aa815",
  "l2Dai": "0xa3eE35A49ca95A47E3999f71170010525ecd4a44",
  "l1Escrow": "0x14B04a27F52160baD5239CBc5ADfEFD0ADbF373d"
}
```

## Mainnet

```
{
  "l1DAITokenBridge": "0x510a1495466F0625Be9f4a96f48331274F70a8F2",
  "l2DAITokenBridge": "0xd24915b1f269C8fCD4dc4776eC7883AE1938b481",
  "l1GovernanceRelay": "0xc7c9EA65536bf9C4e5B806C11fDED0a21f6A94Fb",
  "l2GovernanceRelay": "0x06324E4eC4fd852c59EE367036c8622b74E13487",
  "l2Dai": "0x4BEf76b6b7f2823C6c1f4FcfEACD85C24548ad7e",
  "l1Escrow": "0x1bD78aC9307c43F415A3b4c7Cdb6777449504aF2"
}
```
