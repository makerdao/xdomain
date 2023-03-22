import { request } from 'graphql-request'
import { useEffect, useState } from 'react'

const ENS_GRAPH_API_URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens'

export function useEns(account: string | null | undefined) {
  const [ens, setEns] = useState<string | null>(null)

  useEffect(() => {
    const getUpdatedEns = async (addr: string | null | undefined) => {
      if (!addr || addr.length !== 42) return null
      const query = `
        query { 
          resolved: domains(where: { resolvedAddress: "${addr.toLowerCase()}" }) { name } 
          owned: domains(where: { owner: "${addr.toLowerCase()}" }) { name } 
        }`

      let response = null
      try {
        response = await request(ENS_GRAPH_API_URL, query)
      } catch (e) {
        console.log('ENS query error:', e)
      }
      return (response?.resolved[0] || response?.owned[0])?.name || null
    }

    getUpdatedEns(account).then(setEns).catch(console.error)
  }, [account])

  return ens
}
