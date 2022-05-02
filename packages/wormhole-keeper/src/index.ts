import { main } from './main'
;(() => {
  if (process.argv.length !== 4) {
    throw new Error(
      'Pass L1 RPC and priv key as args! example: keeper.ts https://eth-mainnet.alchemyapi.io/v2/ c5831a7a0bc660232e0ead464f4c2da646556032e5c3d077d35e91b50bc4f84b',
    )
  }

  return main(process.argv[2], process.argv[3])
})()
  .then(() => console.log('== DONE'))
  .catch((e) => {
    console.error('Error occured: ', e)
    process.exit(1)
  })
