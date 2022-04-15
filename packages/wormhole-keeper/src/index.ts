import { main } from './main'

main()
  .then(() => console.log('== DONE'))
  .catch((e) => {
    console.error('Error occured: ', e)
    process.exit(1)
  })
