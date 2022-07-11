// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity >=0.8.0;

import "../../TeleportGUID.sol";
import "./DaiMock.sol";

contract RouterMock {

    DaiMock dai;

    constructor(address _dai) {
        dai = DaiMock(_dai);
    }

    function requestMint(
        TeleportGUID calldata teleport,
        uint256,
        uint256
    ) external returns (uint256 postFeeAmount, uint256 totalFee) {
        dai.mint(address(uint160(uint256(teleport.receiver))), teleport.amount);
        postFeeAmount = teleport.amount;
        totalFee = 0;
    }

    function settle(bytes32, uint256 batchedDaiToFlush) external {
        dai.transferFrom(msg.sender, address(this), batchedDaiToFlush);
    }

}
