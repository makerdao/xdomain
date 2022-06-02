// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.0;

import "../../TeleportGUID.sol";

contract RouterMock {

    function requestMint(
        TeleportGUID calldata,
        uint256,
        uint256
    ) external returns (uint256, uint256) {

    }

    function settle(bytes32, uint256) external {

    }

}
