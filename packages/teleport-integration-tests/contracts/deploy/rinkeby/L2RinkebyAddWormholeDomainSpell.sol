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

interface DaiLike {
  function rely(address usr) external;
}

interface WormholeBridgeLike {
  function file(
    bytes32 what,
    bytes32 domain,
    uint256 data
  ) external;
}

contract L2RinkebyAddWormholeDomainSpell {
  function execute() external {
    DaiLike dai = DaiLike(0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15);
    WormholeBridgeLike wormholeBridge = WormholeBridgeLike(
      0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3
    );
    bytes32 masterDomain = "RINKEBY-MASTER-1";

    // wormhole bridge has to burn without approval
    dai.rely(address(wormholeBridge));

    wormholeBridge.file(bytes32("validDomains"), masterDomain, 1);
  }
}
