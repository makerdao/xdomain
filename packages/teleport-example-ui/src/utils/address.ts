export const truncateAddress = (address: string) => {
  if (!address) return 'No Account'
  const match = address.match(/^(0x[a-zA-Z0-9]{4})[a-zA-Z0-9]+([a-zA-Z0-9]{2})$/)
  if (!match) return address
  return `${match[1]}…${match[2]}`
}
