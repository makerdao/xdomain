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
