import { ethers } from 'hardhat'

import { setupOptimismTests } from './optimism'
import { runWormholeTests } from './wormhole.test'

const optimismDomain = ethers.utils.formatBytes32String('OPTIMISM-A')

runWormholeTests(optimismDomain, setupOptimismTests)
