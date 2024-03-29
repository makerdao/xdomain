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

pragma solidity 0.8.15;

interface TrustedRelayLike {
    function file(bytes32 what, uint256 data) external;

    function kiss(address usr) external;

    function ethPriceOracle() external view returns (address);
}

interface MedianLike {
    function kiss(address usr) external;
}

contract ConfigureTrustedRelaySpell {
    TrustedRelayLike public immutable trustedRelay;
    address public immutable bud;
    uint256 public immutable gasMargin;

    constructor(
        address _trustedRelay,
        uint256 _gasMargin,
        address _bud
    ) {
        trustedRelay = TrustedRelayLike(_trustedRelay);
        gasMargin = _gasMargin;
        bud = _bud;
    }

    function execute() external {
        MedianLike median = MedianLike(trustedRelay.ethPriceOracle());
        median.kiss(address(trustedRelay));
        trustedRelay.file(bytes32("margin"), gasMargin);
        trustedRelay.kiss(bud);
    }
}
