// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "@matterlabs/zksync-contracts/l2/contracts/vendor/AddressAliasHelper.sol";

pragma solidity ^0.8.15;

contract L2GovernanceRelay {
  address public immutable l1GovernanceRelay; // the counterpart relay contract on L1

  constructor(address _l1GovernanceRelay) {
    l1GovernanceRelay = _l1GovernanceRelay;
  }

  // Allow contract to receive ether (e.g. for L2 gas refunds)
  receive() external payable {}

  /**
   * @notice Execute the L2 call from L1. This is called via a xchain message from the
   * L1 counterpart. This method is used to execute a previously deployed L2 spell.
   * @param _target The contract to call
   * @param _targetData The calldata of the call
   */
  function relay(address _target, bytes calldata _targetData) external {
    // Ensure no storage changes in the delegate call
    // Target address is trusted so this is mostly to avoid a human error
    // Note: we don't check l1GovernanceRelay because it's immutable
    require(
      AddressAliasHelper.undoL1ToL2Alias(msg.sender) == l1GovernanceRelay,
      "L2GovernanceRelay/sender-not-l1GovRelay"
    );

    bool ok;
    (ok, ) = _target.delegatecall(_targetData);
    require(ok, "L2GovernanceRelay/delegatecall-error");
  }
}
