import { main } from './main'
;(() => {
  const l1Rpc = process.argv[2] || process.env['L1_RPC']

  if (!l1Rpc) {
    throw new Error('L1 RPC not found. Pass it as first argument or as L1_RPC env variable.')
  }

  return main(l1Rpc)
})().catch((e) => {
  console.error('Error occured: ', e)
  process.exit(1)
})
