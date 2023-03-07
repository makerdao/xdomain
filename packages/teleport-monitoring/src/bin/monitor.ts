import { startServer } from '../server'
import { monitor } from '../tasks/monitor'
import { run } from './utils'

void run(
  async ({
    network,
    l1Provider,
    teleportRepository,
    flushRepository,
    synchronizerStatusRepository,
    settleRepository,
  }) => {
    const { metrics } = await monitor({
      networkConfig: network,
      l1Provider,
      teleportRepository,
      flushRepository,
      synchronizerStatusRepository,
      settleRepository,
    })

    await startServer(metrics)
  },
)
