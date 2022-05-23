// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2021 Dai Foundation
//
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

pragma solidity 0.8.13;

import {DssExec} from "../common/DssExec.sol";
import {DssAction} from "../common/DssAction.sol";

interface TrustedRelayLike {
  function file(bytes32 what, uint256 data) external;

  function kiss(address usr) external;

  function ethPriceOracle() external view returns (address);
}

interface MedianLike {
  function kiss(address usr) external;
}

contract DssSpellAction is DssAction {
  string public constant override description = "Rinkeby Arbitrum TrustedRelay configuration spell";

  function officeHours() public pure override returns (bool) {
    return false;
  }

  function actions() public override {
    TrustedRelayLike trustedRelay = TrustedRelayLike(0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7);
    trustedRelay.file(bytes32("margin"), 15000);
    // trustedRelay.kiss(0x0000000000000000000000000000000000000000); // authorise integrator's account

    MedianLike median = MedianLike(trustedRelay.ethPriceOracle());
    median.kiss(address(trustedRelay));
  }
}

contract L1RinkebyConfigureTrustedRelaySpell is DssExec {
  // hack allowing execution of spell without full MCD deployment
  function execute() external {
    (bool success, ) = address(action).delegatecall(abi.encodeWithSignature("actions()"));
    require(success, "L1RinkebyConfigureTrustedRelaySpell/delegatecall-failed");
  }

  constructor() DssExec(block.timestamp + 30 days, address(new DssSpellAction())) {}
}
