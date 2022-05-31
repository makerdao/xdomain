import { startServer } from '../server'
import { monitor } from '../tasks/monitor'
import { run } from './utils'

void run(async ({ network, l1Provider, teleportRepository, synchronizerStatusRepository }) => {
  const { metrics } = await monitor({ network, l1Provider, teleportRepository, synchronizerStatusRepository })

  await startServer(metrics)
})
