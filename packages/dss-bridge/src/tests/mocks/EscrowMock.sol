// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity >=0.8.0;

import "./DaiMock.sol";

contract EscrowMock {

    function approve(
        address token,
        address spender,
        uint256 value
    ) external {
        DaiMock(token).approve(spender, value);
    }

}
