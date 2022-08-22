# Teleport integration tests

Gathers all related repos (`./repos`) and runs a suite of integration tests using forked networks.

## Running

```sh
git clone git@github.com:makerdao/teleport-integration-tests.git # clone this repo

git submodule update --init --recursive # init submodules

./scripts/setup.sh # build submodules, copy artifacts, build this project

./scripts/build-infra.sh # builds dockerized optimism infrastructure (l1+l2)
./scripts/run-infra.sh # runs infrastructure
yarn test
```

## Tweaking smart contracts

If you wish to quickly test some changes in smart contract code, just tweak source in `repos` dir and re-run
`./scripts/setup.sh`.

# Teleport mainnet deployment

## Optimism & Arbitrum

### Instructions

1. Set the name of the new ilk in `deployment/mainnet/deploy-teleport.ts` then run
   `yarn hardhat run deployment/mainnet/deploy-teleport.ts` to deploy `dss-teleport`, `arbitrum-dai-bridge` Teleport
   contracts and `optimism-dai-bridge` Teleport contracts.

   2. An appropriate [spell](https://github.com/makerdao/spells-mainnet) needs to be written and cast. The test
      environment spell in `contracts/deploy/goerli-light/L1GoerliAddTeleportDomainSpell.sol` can be used as a guide to
      determine the necessary configuration operations to include in the spell.

### Latest deployment

```
{
   "Mainnet MCD": {
      "vat": "0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B",
      "dai_join": "0x9759A6Ac90977b93B58547b4A71c78317f391A28",
      "vow": "0xA950524441892A31ebddF91d3cEEFa04Bf454466",
      "pause_proxy": "0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB",
      "esm": "0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58",
      "dai": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      "median_ethusd": "0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85",
   },

   "Mainnet Teleport": {
      "join": "0xF4B72741D114a49706877366300b3053a03E7f25",
      "oracleAuth": "0xFb7b4427Fb77ad4AC24519725153CDD2C92Fc4e0",
      "router": "0x0E18ab2b7cAA7ae841bC2e0Dd819Af87A8bF8b75",
      "feeContract": "0xE3AEA9052Aca6b8ec4CF160B5771716765f99aA5",
      "basicRelay": "0x49486814d8DC7dB8DE95Ee9B65acA621d392096F",
      "trustedRelay": "0x626E65367122ee1Fd1733Aea4e910661C353837A"
   }

  "Optimism Mainnet teleport gateways":  {
      "l2TeleportGateway": "0x67A45c2163798d47c32Fc2bcD5Dc0ABc6dCDFe78",
      "l1TeleportGateway": "0x3c27390F61058152552613a563aC0195aDc7f169"
   }

   "Arbitrum Mainnet teleport gateways":  {
      "l2TeleportGateway": "0x67A45c2163798d47c32Fc2bcD5Dc0ABc6dCDFe78",
      "l1TeleportGateway": "0x0B6359A8E138A86f2B5df2cbe3f97222B4f19b4a"
   },

   "Legacy (slow) Mainnet Optimism Dai bridge": {
      "l2Dai": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "l1Escrow": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      "l1DAITokenBridge": "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F",
      "l2DAITokenBridge": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      "l1GovernanceRelay": "0x09B354CDA89203BB7B3131CC728dFa06ab09Ae2F",
      "l2GovernanceRelay": "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F",
   },

   "Legacy (slow) Mainnet Arbitrum Dai bridge": {
      "l2Dai": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "l1Escrow": "0xA10c7CE4b876998858b1a9E12b10092229539400",
      "l1DaiGateway": "0xD3B5b60020504bc3489D6949d545893982BA3011",
      "l2DaiGateway": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      "l1GovernanceRelay": "0x9ba25c289e351779E0D481Ba37489317c34A899d",
      "l2GovernanceRelay": "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F",
      "l1GatewayRouter"": "0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef",
      "l2GatewayRouter"": "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933",
   }
}
```

# Teleport testnet deployments

## Optimism & Arbitrum Goerli test environment ("goerli-light")

### Instructions

1. Set the name of the new ilk in `deployment/goerli-light/deploy-teleport.ts` then run
   `yarn hardhat run deployment/goerli-light/deploy-teleport.ts` to deploy `dss-teleport`, `arbitrum-dai-bridge`
   Teleport contracts and `optimism-dai-bridge` Teleport contracts.

2. Set the addresses of the newly deployed `teleportJoin`, `router` (TeleportRouter), `oracleAuth` (TeleportOracleAuth),
   `constantFees` (TeleportConstantFees), `trustedRelay` (TrustedRelay), `optimismL1Bridge` (L1TeleportGateway) and
   `arbitrumL1Bridge` (L1TeleportGateway) in `contracts/deploy/goerli-light/L1GoerliAddTeleportDomainSpell.sol`.

3. Run `yarn hardhat run deployment/goerli-light/cast-l1-spell.ts` to deploy and cast the L1 spell on goerli.

4. To validate the resulting changes, copy the addresses of the newly deployed `oracleAuth` and `l2TeleportGateway` into
   `deployment/goerli-light/test-e2e-[optimism|arbitrum].ts` and run
   `yarn hardhat run deployment/goerli-light/test-e2e-[optimism|arbitrum].ts`.

### Latest deployment

In the following, "GoerliLight" refers to a light deployment of MCD on Goerli. It can be thought of as a testing
environment, distinct from the staging environment that constitutes the canonical deployment of MCD on Goerli (which is
used for makerdao/spells-goerli).

```
{
   "GoerliLight MCD": {
      "vat": "0x293D5AA7F26EF9A687880C4501871632d1015A82",
      "dai_join": "0x53275153854358E12789307fD45Bbab0f5b575A0",
      "vow": "0xFF660111D2C6887D8F24B5378cceDbf465B33B6F",
      "pause_proxy": "0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce",
      "esm": "0x4EdB261c15EF5A895f449593CDC9Fc7D2Fb714c2",
      "dai": "0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2",
      "median_ethusd": "0xAdC6217F6D549dD4CBc7BF7B4f22769334C20f2D",
   },

   "GoerliLight Teleport": {
      "join": "0xd88310A476ee960487FDb2772CC4bd017dadEf6B",
      "oracleAuth": "0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F",
      "router": "0x9031Ab810C496FCF09B65851c736E9a37983B963",
      "constantFee": "0x19EeED0950e8AD1Ac6dde969df0c230C31e5479C",
      "basicRelay": "0x0Cb8747982d99f4b8640EE27330ADD0c2b54d0e6",
      "trustedRelay": "0xB23Ab27F7B59B718ea1eEF536F66e1Db3F18ac8E"
   }

  "Optimism GoerliLight teleport gateways":  {
      "l2TeleportGateway": "0xFF660111D2C6887D8F24B5378cceDbf465B33B6F",
      "l1TeleportGateway": "0x1FD5a4A2b5572A8697E93b5164dE73E52686228B"
   }

   "Arbitrum GoerliLight teleport gateways":  {
      "l2TeleportGateway": "0xb586c1D27Ee93329B1da48B8F7F4436C173FCef8",
      "l1TeleportGateway": "0x350d78BfE252a81cc03407Fe781052E020dCd456"
   },

   "Legacy (slow) GoerliLight Optimism Dai bridge": {
      "l2Dai": "0x8ea903081aa1137F11D51F64A1F372EDe67571a9",
      "l1Escrow": "0xC2351e2a0Dd9f44bB1E3ECd523442473Fa5e46a0",
      "l1DAITokenBridge": "0xd95CbA7F7be2984058f15e4a4e03C89845fD8EB2",
      "l2DAITokenBridge": "0x293D5AA7F26EF9A687880C4501871632d1015A82",
      "l1GovernanceRelay": "0x38BF0bBF7dEb5Eb17a5f453AfCED4ee3A992b08d",
      "l2GovernanceRelay": "0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce",
   },

   "Legacy (slow) GoerliLight Arbitrum Dai bridge": {
      "l2Dai": "0x8ea903081aa1137F11D51F64A1F372EDe67571a9",
      "l1Escrow": "0xD9e08dc985012296b9A80BEf4a587Ad72288D986",
      "l1DaiGateway": "0x426572EdE6436D0A9F0c2BE45Ad5E9273C9b5B0a",
      "l2DaiGateway": "0x2BD50836f3998D5952331f41C5c2395B7b825F50",
      "l1GovernanceRelay": "0xb07c5507Eff5A62F20418b3d0f0be843f640ce9A",
      "l2GovernanceRelay": "0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce",
      "l1GatewayRouter"": "0x9C032F29427E185b52D02880131a3577484BE651",
      "l2GatewayRouter"": "0x5dA2465705DCe5Fac5f8753F765bf68b42F96E4C",
      "l1FakeArbitrumInbox": "0x5d38C7b5cf3F25DE11E13d8f882ab9a0399907dE",
      "l1FakeArbitrumBridge": "0x5A30CB67fAC7aBaF95Efc57c35B41750b6157813",
      "l1FakeArbitrumOutbox": "0x95637Cabe684a324A8225C4b6Ce880D70074938d",
   },

   "GoerliLight Spell": {
      "l1": "0x29ADBE7cE6F650D56d8611Ab43a1153f5654fC01",
   }
}
```

## Optimism & Arbitrum Goerli staging environment ("canonical-goerli")

### Instructions

1. Set the name of the new ilk in `deployment/goerli/deploy-teleport.ts` then run
   `yarn hardhat run deployment/goerli/deploy-teleport.ts` to deploy `dss-teleport`, `arbitrum-dai-bridge` Teleport
   contracts and `optimism-dai-bridge` Teleport contracts.

   2. An appropriate [spell](https://github.com/makerdao/spells-goerli) needs to be written and cast. The test
      environment spell in `contracts/deploy/goerli-light/L1GoerliAddTeleportDomainSpell.sol` can be used as a guide to
      determine the necessary configuration operations to include in the spell.

### Latest deployment

```
{
   "Goerli MCD": {
      "vat": "0xB966002DDAa2Baf48369f5015329750019736031",
      "dai_join": "0x6a60b7070befb2bfc964F646efDF70388320f4E0",
      "vow": "0x23f78612769b9013b3145E43896Fa1578cAa2c2a",
      "pause_proxy": "0x5DCdbD3cCF9B09EAAD03bc5f50fA2B3d3ACA0121",
      "esm": "0x023A960cb9BE7eDE35B433256f4AfE9013334b55",
      "dai": "0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844",
      "median_ethusd": "0xD81834Aa83504F6614caE3592fb033e4b8130380",
   },

   "Goerli Teleport": {
      "join": "0xAaEf3f1523291aDdaF98a8535c27F25971d823D2",
      "oracleAuth": "0xD40ab915cB8232E8188e1a9137E4b5dCB86F0fd8",
      "router": "0x75c2D0A33cB245acD1F10798fEdD4a42Be4951a9",
      "linearFee": "0x72Cb460888D401f991AB1a78ffc48EFcDcd155e8",
      "basicRelay": "0xd94d9928E1E48Db1a3Aff47310E88c7b3b0e396c",
      "trustedRelay": "0x658e6aCb91Fa80732b41E27c7167292DA164872B"
   }

  "Optimism Goerli teleport gateways":  {
      "l2TeleportGateway": "0x67A45c2163798d47c32Fc2bcD5Dc0ABc6dCDFe78",
      "l1TeleportGateway": "0xe57e6b2eEEf91C068849bd6066d1041A00A4F654"
   }

   "Arbitrum Goerli teleport gateways":  {
      "l2TeleportGateway": "0x67A45c2163798d47c32Fc2bcD5Dc0ABc6dCDFe78",
      "l1TeleportGateway": "0x3F7Eea7c2D08bc6F249759082360E14c829b2A92"
   },

   "Legacy (slow) Goerli Optimism Dai bridge": {
      "l2Dai": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "l1Escrow": "0xbc892A208705862273008B2Fb7D01E968be42653",
      "l1DAITokenBridge": "0x05a388Db09C2D44ec0b00Ee188cD42365c42Df23",
      "l2DAITokenBridge": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      "l1GovernanceRelay": "0xD9b2835A5bFC8bD5f54DB49707CF48101C66793a",
      "l2GovernanceRelay": "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F",
   },

   "Legacy (slow) Goerli Arbitrum Dai bridge": {
      "l2Dai": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "l1Escrow": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      "l1DaiGateway": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      "l2DaiGateway": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      "l1GovernanceRelay": "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F",
      "l2GovernanceRelay": "0x10E6593CDda8c58a1d0f14C5164B376352a55f2F",
      "l1GatewayRouter"": "0x4c7708168395aEa569453Fc36862D2ffcDaC588c",
      "l2GatewayRouter"": "0xE5B9d8d42d656d1DcB8065A6c012FE3780246041",
   }
}
```

## Arbitrum Rinkeby testnet (deprecated)

### Instructions

1. Set the name of the new ilk in `deployment/rinkeby/deploy-teleport.ts` then run
   `yarn hardhat run deployment/rinkeby/deploy-teleport.ts` to deploy `dss-teleport` and `arbitrum-dai-bridge` Teleport
   contracts.

2. Set the address of the newly deployed `teleportBridge` (L2TeleportGateway) in
   `contracts/deploy/rinkeby/L2RinkebyAddTeleportDomainSpell.sol` and deploy this L2 spell on arbitrum-testnet.

3. Run `yarn hardhat run deployment/rinkeby/print-relay-params.ts` and copy the printed values into
   `contracts/deploy/rinkeby/L1RinkebyAddTeleportDomainSpell.sol`.

4. Set the addresses of the newly deployed `teleportJoin`, `router` (TeleportRouter), `oracleAuth` (TeleportOracleAuth),
   `constantFees` (TeleportConstantFees), `trustedRelay` (TrustedRelay), `slaveDomainBridge` (L1TeleportGateway) and
   `l2ConfigureDomainSpell` (L2RinkebyAddTeleportDomainSpell) in
   `contracts/deploy/rinkeby/L1RinkebyAddTeleportDomainSpell.sol`.

5. Run `yarn hardhat run deployment/rinkeby/cast-l1-spell.ts` to deploy and cast the L1 spell on rinkeby. Wait ~5
   minutes for the execution of the L2 spell to be confirmed.

6. To validate the resulting changes, copy the addresses of the newly deployed `oracleAuth` and `l2TeleportGateway` into
   `deployment/rinkeby/test-e2e.ts` and run `yarn hardhat run deployment/rinkeby/test-e2e.ts`.

### Latest deployment

```
{
   "Teleport": {
      "join": "0x894DB23D804c626f1aAA89a2Bc3280052e6c4750",
      "oracleAuth": "0x1E7722E502D3dCbB0704f99c75c99a5402598f13",
      "router": "0x26266ff35E2d69C6a2DC3fAE9FA71456043a0611",
      "constantFee": "0xeFf66D2A040097919A1A36D9D8816c21acC3C6C0",
      "basicRelay": "0xC35787975484A858B878032B045B6E0B6EfE2e2c",
      "trustedRelay": "0xef4dF54E711e0d42754a12e85fD4186f8fF2c7A7",
   }

   "Arbitrum teleport gateways": {
      "l2TeleportGateway": "0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3",
      "l1TeleportGateway": "0x7b84fFac4A71fE09b14CfF4E0A6429dFfa78630D"
   }

   "Legacy (slow) Dai withdrawal bridge": {
      "l1Dai": "0x17B729a6Ac1f265090cbb4AecBdd53E34664C00e",
      "l2Dai": "0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15",
      "l1DaiGateway": "0xb1cfD43BD287B2E94bf00140091A9Cca47f462cC",
      "l2DaiGateway": "0x7DC1e34e97c990f2B7d46777a47Fa47D069A8825"
   }

   "Spells": {
      "l1": "0x419D6a7603975fcFE5A2d21d7C0ef33D240eA27c",
      "l2": "0x65adb7A66759304b5A081506Baad5408F8ceb650"
   }
}
```

## Optimism Kovan testnet (deprecated)

### Instructions

1. Set the name of the new ilk in `deployment/kovan/deploy-teleport.ts` then run
   `yarn hardhat run deployment/kovan/deploy-teleport.ts` to deploy `dss-teleport` and `optimism-dai-bridge` Teleport
   contracts.

2. Set the address of the newly deployed `teleportGateway` (L2TeleportGateway) in
   `contracts/deploy/kovan/L2KovanAddTeleportDomainSpell.sol` and deploy this L2 spell on optimistic-kovan.

3. Set the addresses of the newly deployed `teleportJoin`, `router` (TeleportRouter), `oracleAuth` (TeleportOracleAuth),
   `constantFees` (TeleportConstantFees), `trustedRelay` (TrustedRelay), `slaveDomainGateway` (L1TeleportGateway) and
   `l2ConfigureDomainSpell` (L2RinkebyAddTeleportDomainSpell) in
   `contracts/deploy/kovan/L1KovanAddTeleportDomainSpell.sol` and deploy this L1 spell on kovan.

4. To test the L2 spell, copy the addresses of the newly deployed `l2Spell` and `l2TeleportGateway` into
   `deployment/kovan/test-l2-spell.ts`, spin up a local hardhark fork of optimistic-kovan and run
   `yarn hardhat run deployment/kovan/test-l2-spell.ts --network localhost`

5. To test the L1 spell, copy the addresses of the newly deployed `oracleAuth` and `l1Spell` into
   `deployment/kovan/test-l1-spell.ts`, spin up a local hardhark fork of kovan and run
   `yarn hardhat run deployment/kovan/test-l1-spell.ts --network localhost`

6. Cast the L1 spell

7. To validate the resulting changes, copy the addresses of the newly deployed `oracleAuth` and `l2TeleportGateway` into
   `deployment/kovan/test-e2e.ts` and run `yarn hardhat run deployment/kovan/test-e2e.ts`.

### Latest deployment

```
{
   "Teleport": {
      "join": "0x556D9076A42Bba1892E3F4cA331daE587185Cef9",
      "oracleAuth": "0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4",
      "router": "0xb15e4cfb29C587c924f547c4Fcbf440B195f3EF8",
      "constantFee": "0xf61A6F9d13aF9BBf4df95657Db5698c04A97EF85",
      "basicRelay": "0x5B3363996Bd8164F07315faAf3F96B72D192382c"
      "trustedRelay": "0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81"
   },

   "Optimism teleport gateways": {
      "l2TeleportGateway": "0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0",
      "l1TeleportGateway": "0xBD8605d11b8D3557b7399eFE1866992Eed6F9A7c"
   }

   "Spells": {
      "l1Spell": "0xC48b714c3Ce421671801a248d94cE1a5ef14AF8f",
      "l2Spell": "0xEd326504C77Dcd0Ffbb554a7925338EEd3F5fE01"
   }
}
```
