# xdomain-dss

Connect an instance of MCD to a cross-chain guest instance. The `DomainHost` is designed to plug into the Host's dss instance and the `DomainGuest` controls the Guest dss instance on the remote chain. For example, `DomainHost` could be plugged into the MCD master instance on Ethereum and a `DomainGuest` controller would be plugged into the Optimism slave instance of MCD. This is recursive, so that when layer 3s come online we can use another Host/Guest pairing on the L2.

Each contract is abstract as it requires bridge-specific functions, so one of these needs to be extended for each unique bridge interface.

## Supported Operations

Allocate debt-ceiling to Guest dss.

### `DomainHost.lift(uint256 wad)`

Specify a new global debt ceiling for the remote domain. If the amount is an increase this will pre-mint ERC20 and stick it in the domain escrow, so the future minted DAI on the remote domain is backed. It will not remove escrow DAI upon lowering as that can potentially lead to unbacked DAI. Releasing pre-minted DAI from the escrow needs to be handled by the remote domain.

This will back the pre-minted DAI by `vat.gems` that represent shares to the remote domain.

This will trigger a call to `DomainGuest.lift(uint256 line, uint256 minted)`.

### `DomainGuest.release()`

Permissionless function which will release ERC20 DAI in the host's escrow. It will only do this if the amount of pre-minted DAI is greater than both the current `vat.debt()` and `vat.Line()`. IE we previously lowered the global debt ceiling and if these DAI are not in use (active debt) then it is released on the host domain.

This will trigger a call to `DomainHost.release(uint256 wad)`.

### `DomainGuest.push()`

Permissionless function which will push a surplus (or deficit) to the host domain.

#### Surplus

In the surplus case this will exit the DAI, send it across the token bridge and put it in the host's surplus buffer.

#### Deficit

In the deficit case this will send a message to the host's domain informing it that the guest is insolvant and needs more DAI. The host domain will suck some DAI from the `vow` and send it back to the guest domain.

This will trigger a call to `DomainHost.deficit(uint256 wad)`.

### `DomainHost.cage()`

Trigger shutdown of the remote domain.

This will trigger a call to `DomainGuest.cage()`.
