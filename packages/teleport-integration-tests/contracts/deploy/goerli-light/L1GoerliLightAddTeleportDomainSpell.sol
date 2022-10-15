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

import {DssExec} from "../common/DssExec.sol";
import {DssAction} from "../common/DssAction.sol";

interface VatLike {
    function rely(address usr) external;

    function init(bytes32 ilk) external;

    function file(
        bytes32 ilk,
        bytes32 what,
        uint256 data
    ) external;
}

interface TeleportJoinLike {
    function rely(address usr) external;

    function file(bytes32 what, address val) external;

    function file(
        bytes32 what,
        bytes32 domain_,
        address data
    ) external;

    function file(
        bytes32 what,
        bytes32 domain_,
        uint256 data
    ) external;

    function ilk() external returns (bytes32);
}

interface OracleAuthLike {
    function rely(address usr) external;

    function file(bytes32 what, uint256 data) external;

    function addSigners(address[] calldata signers_) external;
}

interface RouterLike {
    function rely(address usr) external;

    function file(
        bytes32 what,
        bytes32 domain,
        address data
    ) external;
}

interface TrustedRelayLike {
    function rely(address usr) external;

    function file(bytes32 what, uint256 data) external;

    function kiss(address usr) external;

    function ethPriceOracle() external view returns (address);
}

interface MedianLike {
    function kiss(address usr) external;
}

interface L1EscrowLike {
    function approve(
        address token,
        address spender,
        uint256 value
    ) external;
}

interface GovernanceRelayLike {
    function relay(
        address target,
        bytes calldata targetData,
        uint256 l1CallValue,
        uint256 maxGas,
        uint256 gasPriceBid,
        uint256 maxSubmissionCost
    ) external;
}

contract DssSpellAction is DssAction {
    uint256 public constant RAY = 10**27;
    uint256 public constant RAD = 10**45;

    string public constant override description =
        "GoerliLight Optimism & Arbitrum Teleport deployment spell";

    function officeHours() public pure override returns (bool) {
        return false;
    }

    function setupAuth(
        VatLike vat,
        TeleportJoinLike teleportJoin,
        OracleAuthLike oracleAuth,
        RouterLike router,
        TrustedRelayLike trustedRelay
    ) internal {
        address esm = 0x4EdB261c15EF5A895f449593CDC9Fc7D2Fb714c2;
        teleportJoin.rely(esm);
        teleportJoin.rely(address(oracleAuth));
        teleportJoin.rely(address(router));
        oracleAuth.rely(esm);
        router.rely(esm);
        trustedRelay.rely(esm);
        vat.rely(address(teleportJoin));
    }

    function setupOracleAuth(OracleAuthLike oracleAuth) internal {
        address[] memory oracles = new address[](5);
        oracles[0] = 0xC4756A9DaE297A046556261Fa3CD922DFC32Db78; // OCU
        oracles[1] = 0x23ce419DcE1De6b3647Ca2484A25F595132DfBd2; // OCU
        oracles[2] = 0x774D5AA0EeE4897a9a6e65Cbed845C13Ffbc6d16; // OCU
        oracles[3] = 0xb41E8d40b7aC4Eb34064E079C8Eca9d7570EBa1d; // OCU
        oracles[4] = 0xc65EF2D17B05ADbd8e4968bCB01b325ab799aBd8; // PECU
        oracleAuth.file(bytes32("threshold"), 1);
        oracleAuth.addSigners(oracles);
    }

    function setupTrustedRelay(TrustedRelayLike trustedRelay) internal {
        trustedRelay.file(bytes32("margin"), 15000);
        // trustedRelay.kiss(0x0000000000000000000000000000000000000000); // authorise integrator's account

        MedianLike median = MedianLike(trustedRelay.ethPriceOracle());
        median.kiss(address(trustedRelay));
    }

    function setupOptimism(
        TeleportJoinLike teleportJoin,
        RouterLike router,
        address dai,
        address fees
    ) internal {
        bytes32 optimismDomain = "OPT-GOER-A";
        uint256 optimismLine = 100 * RAD;
        address optimismL1Bridge = 0x1FD5a4A2b5572A8697E93b5164dE73E52686228B;
        L1EscrowLike optimismL1Escrow = L1EscrowLike(0xC2351e2a0Dd9f44bB1E3ECd523442473Fa5e46a0);

        router.file(bytes32("gateway"), optimismDomain, optimismL1Bridge);
        teleportJoin.file(bytes32("fees"), optimismDomain, fees);
        teleportJoin.file(bytes32("line"), optimismDomain, optimismLine);
        optimismL1Escrow.approve(dai, optimismL1Bridge, type(uint256).max);
    }

    function setupArbitrum(
        TeleportJoinLike teleportJoin,
        RouterLike router,
        address dai,
        address fees
    ) internal {
        bytes32 arbitrumDomain = "ARB-GOER-A";
        uint256 arbitrumLine = 100 * RAD;
        address arbitrumL1Bridge = 0x350d78BfE252a81cc03407Fe781052E020dCd456;
        L1EscrowLike arbitrumL1Escrow = L1EscrowLike(0xD9e08dc985012296b9A80BEf4a587Ad72288D986);

        router.file(bytes32("gateway"), arbitrumDomain, arbitrumL1Bridge);
        teleportJoin.file(bytes32("fees"), arbitrumDomain, fees);
        teleportJoin.file(bytes32("line"), arbitrumDomain, arbitrumLine);
        arbitrumL1Escrow.approve(dai, arbitrumL1Bridge, type(uint256).max);
    }

    function actions() public override {
        bytes32 masterDomain = "ETH-GOER-A";
        TeleportJoinLike teleportJoin = TeleportJoinLike(
            0xd88310A476ee960487FDb2772CC4bd017dadEf6B
        );
        address vow = 0xFF660111D2C6887D8F24B5378cceDbf465B33B6F;
        VatLike vat = VatLike(0x293D5AA7F26EF9A687880C4501871632d1015A82);
        uint256 globalLine = 10000000000 * RAD;
        RouterLike router = RouterLike(0x9031Ab810C496FCF09B65851c736E9a37983B963);
        OracleAuthLike oracleAuth = OracleAuthLike(0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F);
        TrustedRelayLike trustedRelay = TrustedRelayLike(
            0xB23Ab27F7B59B718ea1eEF536F66e1Db3F18ac8E
        );

        setupAuth(vat, teleportJoin, oracleAuth, router, trustedRelay);

        teleportJoin.file(bytes32("vow"), vow);
        router.file(bytes32("gateway"), masterDomain, address(teleportJoin));

        bytes32 ilk = teleportJoin.ilk();
        vat.init(ilk);
        vat.file(ilk, bytes32("spot"), RAY);
        vat.file(ilk, bytes32("line"), globalLine);
        setupOracleAuth(oracleAuth);
        setupTrustedRelay(trustedRelay);

        address constantFees = 0x19EeED0950e8AD1Ac6dde969df0c230C31e5479C;
        address dai = 0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2;

        // configure Optimism teleport
        setupOptimism(teleportJoin, router, dai, constantFees);

        // configure Arbitrum teleport
        setupArbitrum(teleportJoin, router, dai, constantFees);
    }
}

contract L1GoerliLightAddTeleportDomainSpell is DssExec {
    // hack allowing execution of spell without full MCD deployment
    function execute() external {
        (bool success, ) = address(action).delegatecall(abi.encodeWithSignature("actions()"));
        require(success, "L1GoerliLightAddTeleportDomainSpell/delegatecall-failed");
    }

    constructor() DssExec(block.timestamp + 30 days, address(new DssSpellAction())) {}
}
