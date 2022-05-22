import { main } from './main'
;(() => {
  const l1Rpc = process.argv[2] || process.env['L1_RPC']
  const privKey = process.argv[3] || process.env['PRIV_KEY']

  if (!l1Rpc) {
    throw new Error('L1 RPC not found. Pass it as first argument or as L1_RPC env variable.')
  }

  if (!privKey) {
    throw new Error('privKey not found. Pass it as a second argument or as PRIV_KEY env variable.')
  }

  return main(l1Rpc, privKey)
})()
  .then(() => console.log('== DONE'))
  .catch((e) => {
    console.error('Error occured: ', e)
    process.exit(1)
  })
