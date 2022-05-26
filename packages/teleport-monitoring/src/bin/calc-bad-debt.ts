import { BigNumber, ethers, providers } from 'ethers'

import { SyncStatusRepository } from '../db/SyncStatusRepository'
import { TeleportRepository } from '../db/TeleportRepository'
import { monitorTeleportMints } from '../monitoring/teleportMints'
import { getL1SdkBasedOnNetworkName, getL2SdkBasedOnNetworkName } from '../sdks'
import { SyncContext, syncTeleportInits } from '../sync/teleportInits'
import { calcBadDebt } from '../tasks/calc-bad-debt'
import { NetworkConfig } from '../types'
import { delay, inChunks } from '../utils'
import { run } from './utils'

void run(calcBadDebt)
