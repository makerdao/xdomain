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

interface WormholeGatewayLike {
  function file(
    bytes32 what,
    bytes32 domain,
    uint256 data
  ) external;
}

contract L2KovanAddWormholeDomainSpell {
  function execute() external {
    DaiLike dai = DaiLike(0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1);
    WormholeGatewayLike wormholeGateway = WormholeGatewayLike(
      0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0
    );
    bytes32 masterDomain = "KOVAN-MASTER-1";

    // wormhole gateway has to burn without approval
    dai.rely(address(wormholeGateway));

    wormholeGateway.file(bytes32("validDomains"), masterDomain, 1);
  }
}
