// SPDX-License-Identifier: AGPL-3.0-or-later

// Copyright (C) 2022 Dai Foundation

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

pragma solidity ^0.8.14;

interface VatLike {
    function live() external view returns (uint256);
}

interface DomainHostLike {
    function vat() external view returns (VatLike);
    function cureReported() external view returns (bool);
    function cure() external view returns (uint256);
    function grain() external view returns (uint256);
}

/// @notice Will return $1 until global settlement, then will wait for the cure() value to report final price
contract BridgeOracle {

    // --- Data ---
    VatLike public immutable vat;
    DomainHostLike public immutable host;

    uint256 constant WAD = 10 ** 18;
    uint256 constant RAY = 10 ** 27;

    // --- Events ---
    event Rely(address indexed usr);
    event Deny(address indexed usr);

    constructor(address _host) {
        host = DomainHostLike(_host);
        vat = host.vat();
    }

    function peek() public view returns (bytes32, bool) {
        uint256 grain = host.grain();
        if (grain == 0) return (bytes32(WAD), true);
        return (
            bytes32(WAD - host.cure() / (grain * 10 ** 9)),
            vat.live() == 1 || host.cureReported()
        );
    }
    function read() external view returns (bytes32) {
        bytes32 wut; bool haz;
        (wut, haz) = peek();
        require(haz, "BridgeOracle/haz-not");
        return wut;
    }

}
