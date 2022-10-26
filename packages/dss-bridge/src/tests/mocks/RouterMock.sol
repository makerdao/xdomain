// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity >=0.8.0;

import "../../TeleportGUID.sol";
import "./DaiMock.sol";

contract RouterMock {

    DaiMock dai;

    constructor(address _dai) {
        dai = DaiMock(_dai);
    }

    function registerMint(
        TeleportGUID calldata
    ) external {
    }

    function settle(bytes32, bytes32, uint256 amount) external {
        dai.transferFrom(msg.sender, address(this), amount);
    }

}
