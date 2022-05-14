import { main } from './main'
;(() => {
  return main()
})().catch((e) => {
  console.error('Error occured: ', e)
  process.exit(1)
})
