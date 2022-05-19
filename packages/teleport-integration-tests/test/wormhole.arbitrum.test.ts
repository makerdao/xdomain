import { ethers } from 'hardhat'

import { setupArbitrumTests } from './arbitrum'
import { runWormholeTests } from './wormhole.test'

const arbitrumDomain = ethers.utils.formatBytes32String('ARBITRUM-A')

runWormholeTests(arbitrumDomain, setupArbitrumTests)
