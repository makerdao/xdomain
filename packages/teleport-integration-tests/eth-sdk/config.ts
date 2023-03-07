import { defineConfig } from '@dethcrypto/eth-sdk'

export default defineConfig({
  contracts: {
    mainnet: {
      maker: {
        vat: '0x35D1b3F3D7966A1DFe207aa4514C12a259A0492B',
        dai_join: '0x9759A6Ac90977b93B58547b4A71c78317f391A28',
        vow: '0xA950524441892A31ebddF91d3cEEFa04Bf454466',
        dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        pause_proxy: '0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB',
        esm: '0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58',
        median_ethusd: '0x64DE91F5A373Cd4c28de3600cB34C7C6cE410C85',
      },
      optimismDaiBridge: {
        l1Escrow: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
        l1GovernanceRelay: '0x09B354CDA89203BB7B3131CC728dFa06ab09Ae2F',
        l1DAITokenBridge: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
      },
      arbitrumDaiBridge: {
        l1Escrow: '0xA10c7CE4b876998858b1a9E12b10092229539400',
        l1GovernanceRelay: '0x9ba25c289e351779E0D481Ba37489317c34A899d',
        l1DaiGateway: '0xD3B5b60020504bc3489D6949d545893982BA3011',
      },
      arbitrum: {
        inbox: '0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f',
      },
      optimism: {
        xDomainMessenger: '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1',
        l1StandardBridge: '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1',
        stateCommitmentChain: '0xBe5dAb4A2e9cd0F27300dB4aB94BeE3A233AEB19',
      },
    },

    optimism: {
      optimismDaiBridge: {
        dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        l2GovernanceRelay: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
        l2DAITokenBridge: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
      },
      optimism: {
        xDomainMessenger: '0x4200000000000000000000000000000000000007',
        l2StandardBridge: '0x4200000000000000000000000000000000000010',
      },
    },

    arbitrumOne: {
      arbitrumDaiBridge: {
        dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        l2GovernanceRelay: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
        l2DaiGateway: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
      },
    },

    // needed for kovan test deployment
    kovan: {
      maker: {
        vat: '0xbA987bDB501d131f766fEe8180Da5d81b34b69d9',
        dai_join: '0x5AA71a3ae1C0bd6ac27A1f28e1415fFFB6F15B8c',
        vow: '0x0F4Cbe6CBA918b7488C26E29d9ECd7368F38EA3b',
        dai: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
        pause_proxy: '0x0e4725db88Bb038bBa4C4723e91Ba183BE11eDf3',
        esm: '0xD5D728446275B0A12E4a4038527974b92353B4a9',
        median_ethusd: '0x0e30f0fc91fdbc4594b1e2e5d64e6f1f94cab23d',
      },

      optimismDaiBridge: {
        l1Escrow: '0x8FdA2c4323850F974C7Abf4B16eD129D45f9E2e2',
        l1GovernanceRelay: '0xAeFc25750d8C2bd331293076E2DC5d5ad414b4a2',
        l1DAITokenBridge: '0xb415e822C4983ecD6B1c1596e8a5f976cf6CD9e3',
      },
      optimism: {
        xDomainMessenger: '0x4361d0F75A0186C05f971c566dC6bEa5957483fD',
        l1StandardBridge: '0x22F24361D548e5FaAfb36d1437839f080363982B',
        stateCommitmentChain: '0xD7754711773489F31A0602635f3F167826ce53C5',
      },
    },

    optimismKovan: {
      optimismDaiBridge: {
        dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
        l2GovernanceRelay: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
        l2DAITokenBridge: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
      },
      optimism: {
        xDomainMessenger: '0x4200000000000000000000000000000000000007',
        l2StandardBridge: '0x4200000000000000000000000000000000000010',
      },
    },

    rinkeby: {
      maker: {
        // bespoke "light" MCD deployment where the pause_proxy is owned by the deployer EOA
        vat: '0x66b3D63621FDD5967603A824114Da95cc3A35107',
        dai_join: '0x6a4017c221335db1eD44C89C3d12841924EeCB79',
        vow: '0xD9dFdf1f1604eF572EFd9c8c2e5c6DDca659150A',
        pause_proxy: '0x4463830546A8cFcFa1b6Eb660Df17A29a4F4e06F',
        esm: '0x0000000000000000000000000000000000000000',
        dai: '0x17B729a6Ac1f265090cbb4AecBdd53E34664C00e',
        median_ethusd: '0xd62553cfac95667a5a1d97156647fd9abb65c8e8',
      },
      arbitrumDaiBridge: {
        l1Escrow: '0x3128d6ffeB4CdD14dC47E4e6A70022F4bf8E7751',
        l1GovernanceRelay: '0x97057eF24d3C69D974Cc5348145b7258c5a503B6',
        l1DaiGateway: '0xb1cfD43BD287B2E94bf00140091A9Cca47f462cC',
      },
      arbitrum: {
        inbox: '0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e', // real inbox
      },
    },

    arbitrumTestnet: {
      arbitrumDaiBridge: {
        dai: '0x78e59654bc33dbbff9fff83703743566b1a0ea15',
        l2GovernanceRelay: '0x10039313055c5803D1820FEF2720ecC1Ff2F02f6',
        l2DaiGateway: '0x7DC1e34e97c990f2B7d46777a47Fa47D069A8825',
      },
    },

    goerli: {
      optimism: {
        xDomainMessenger: '0x5086d1eEF304eb5284A0f6720f79403b4e9bE294',
        l1StandardBridge: '0x636Af16bf2f682dD3109e60102b8E1A089FedAa8',
        stateCommitmentChain: '0x72281826E90dD8A65Ab686fF254eb45Be426DD22',
      },
      arbitrum: {
        inbox: '0x6BEbC4925716945D46F0Ec336D5C2564F419682C', // real inbox
      },

      // goerli-light test environment:

      light: {
        maker: {
          // bespoke "light" MCD deployment where the pause_proxy is owned by the deployer EOA
          vat: '0x293D5AA7F26EF9A687880C4501871632d1015A82',
          dai_join: '0x53275153854358E12789307fD45Bbab0f5b575A0',
          vow: '0xFF660111D2C6887D8F24B5378cceDbf465B33B6F',
          pause_proxy: '0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce',
          esm: '0x4EdB261c15EF5A895f449593CDC9Fc7D2Fb714c2',
          dai: '0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2',
          median_ethusd: '0xAdC6217F6D549dD4CBc7BF7B4f22769334C20f2D',
        },
        optimismDaiBridge: {
          l1Escrow: '0xC2351e2a0Dd9f44bB1E3ECd523442473Fa5e46a0',
          l1GovernanceRelay: '0x38BF0bBF7dEb5Eb17a5f453AfCED4ee3A992b08d',
          l1DAITokenBridge: '0xd95CbA7F7be2984058f15e4a4e03C89845fD8EB2',
        },
        arbitrumDaiBridge: {
          l1Escrow: '0xD9e08dc985012296b9A80BEf4a587Ad72288D986',
          l1GovernanceRelay: '0xb07c5507Eff5A62F20418b3d0f0be843f640ce9A',
          l1DaiGateway: '0x9C032F29427E185b52D02880131a3577484BE651',
        },
      },

      // canonical-goerli staging environment:

      canonical: {
        maker: {
          vat: '0xB966002DDAa2Baf48369f5015329750019736031',
          dai_join: '0x6a60b7070befb2bfc964F646efDF70388320f4E0',
          vow: '0x23f78612769b9013b3145E43896Fa1578cAa2c2a',
          pause_proxy: '0x5DCdbD3cCF9B09EAAD03bc5f50fA2B3d3ACA0121',
          esm: '0x023A960cb9BE7eDE35B433256f4AfE9013334b55',
          dai: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
          median_ethusd: '0xD81834Aa83504F6614caE3592fb033e4b8130380',
        },
        optimismDaiBridge: {
          l1Escrow: '0xbc892A208705862273008B2Fb7D01E968be42653',
          l1GovernanceRelay: '0xD9b2835A5bFC8bD5f54DB49707CF48101C66793a',
          l1DAITokenBridge: '0x05a388Db09C2D44ec0b00Ee188cD42365c42Df23',
        },
        arbitrumDaiBridge: {
          l1Escrow: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          l1GovernanceRelay: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
          l1DaiGateway: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
        },
      },
    },

    arbitrumGoerliTestnet: {
      light: {
        arbitrumDaiBridge: {
          dai: '0x8ea903081aa1137F11D51F64A1F372EDe67571a9',
          l2GovernanceRelay: '0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce',
          l2DaiGateway: '0x2BD50836f3998D5952331f41C5c2395B7b825F50',
        },
      },
      canonical: {
        arbitrumDaiBridge: {
          dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          l2GovernanceRelay: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
          l2DaiGateway: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
        },
      },
    },

    optimismGoerliTestnet: {
      light: {
        optimismDaiBridge: {
          dai: '0x8ea903081aa1137F11D51F64A1F372EDe67571a9',
          l2GovernanceRelay: '0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce',
          l2DAITokenBridge: '0x293D5AA7F26EF9A687880C4501871632d1015A82',
        },
      },
      canonical: {
        optimismDaiBridge: {
          dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
          l2GovernanceRelay: '0x10E6593CDda8c58a1d0f14C5164B376352a55f2F',
          l2DAITokenBridge: '0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65',
        },
      },
      optimism: {
        xDomainMessenger: '0x4200000000000000000000000000000000000007',
        l2StandardBridge: '0x4200000000000000000000000000000000000010',
      },
    },
  },
  etherscanURLs: {
    arbitrumGoerliTestnet: 'https://goerli-rollup-explorer.arbitrum.io/api',
    optimismGoerliTestnet: 'https://blockscout.com/optimism/goerli/api',
  },
  rpc: {
    optimism: 'https://mainnet.optimism.io',
    arbitrumOne: 'https://arb1.arbitrum.io/rpc',
    arbitrumGoerliTestnet: 'https://goerli-rollup.arbitrum.io/rpc',
    optimismGoerliTestnet: 'https://goerli.optimism.io',
  },
})
