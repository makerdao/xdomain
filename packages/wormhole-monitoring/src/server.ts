import Fastify from 'fastify'

import { Metrics } from './types'

export async function startServer(metrics: Metrics) {
  const fastify = Fastify({
    logger: true,
  })

  fastify.get('/', async (_req, reply) => {
    await reply.type('text/html').send('<a href="/metrics">/metrics</a>')
  })

  fastify.get('/metrics', async (_req, reply) => {
    const response = Object.entries(metrics)
      .map(([k, v]) => `${k} ${v}`)
      .join('\n')

    await reply.type('text/plain').send(response)
  })

  const port = 8080
  const address = await fastify.listen(port)
  console.log(`Listening on ${address}`)
}
