import { startServer } from '../server'
import { monitor } from '../tasks/monitor'
import { run } from './utils'

void run(async ({ network, l1Provider, teleportRepository, flushRepository, synchronizerStatusRepository }) => {
  const { metrics } = await monitor({
    network,
    l1Provider,
    teleportRepository,
    flushRepository,
    synchronizerStatusRepository,
  })

  await startServer(metrics)
})
