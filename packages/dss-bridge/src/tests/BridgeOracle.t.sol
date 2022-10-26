// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.14;

import "dss-test/DSSTest.sol";

import { VatMock } from "./mocks/VatMock.sol";
import { BridgeOracle } from "../BridgeOracle.sol";

contract DomainHostMock {

    address public vat;
    uint256 public grain;
    uint256 public cure;
    bool public cureReported;

    constructor(address _vat) {
        vat = _vat;
    }

    function setValues(uint256 _grain, uint256 _cure, bool _cureReported) external {
        grain = _grain;
        cure = _cure;
        cureReported = _cureReported;
    }

}

contract ERC20Test is DSSTest {

    VatMock vat;
    DomainHostMock host;

    BridgeOracle pip;

    function postSetup() internal virtual override {
        vat = new VatMock();
        host = new DomainHostMock(address(vat));

        pip = new BridgeOracle(address(host));
    }

    function testConstructor() public {
        assertEq(address(pip.vat()), address(vat));
        assertEq(address(pip.host()), address(host));
    }

    function testPeek() public {
        (bytes32 val, bool ok) = pip.peek();
        assertTrue(ok);
        assertEq(uint256(val), WAD);
    }

    function testPeekGrainSet() public {
        host.setValues(100 ether, 0, false);

        (bytes32 val, bool ok) = pip.peek();
        assertTrue(ok);
        assertEq(uint256(val), WAD);
    }

    function testPeekVatCaged() public {
        host.setValues(100 ether, 0, false);
        vat.cage();

        (bytes32 val, bool ok) = pip.peek();
        assertTrue(!ok);
        assertEq(uint256(val), WAD);
    }

    function testPeekCureSet() public {
        vat.cage();
        host.setValues(100 ether, 30 * RAD, true);

        (bytes32 val, bool ok) = pip.peek();
        assertTrue(ok);
        assertEq(uint256(val), 70 * WAD / 100);      // Price should be $0.70 (30% unused from cure)
    }

    function testRead() public {
        bytes32 val = pip.read();
        assertEq(uint256(val), WAD); 
    }

    function testReadBlocked() public {
        host.setValues(100 ether, 0, false);
        vat.cage();

        vm.expectRevert("BridgeOracle/haz-not");
        pip.read();
    }
}
