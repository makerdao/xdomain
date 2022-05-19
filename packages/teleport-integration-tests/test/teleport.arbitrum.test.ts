import { ethers } from 'hardhat'

import { setupArbitrumTests } from './arbitrum'
import { runTeleportTests } from './teleport'

const arbitrumDomain = ethers.utils.formatBytes32String('ARBITRUM-A')

runTeleportTests(arbitrumDomain, setupArbitrumTests)
