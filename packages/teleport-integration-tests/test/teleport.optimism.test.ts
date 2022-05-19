import { ethers } from 'hardhat'

import { setupOptimismTests } from './optimism'
import { runTeleportTests } from './teleport'

const optimismDomain = ethers.utils.formatBytes32String('OPTIMISM-A')

runTeleportTests(optimismDomain, setupOptimismTests)
