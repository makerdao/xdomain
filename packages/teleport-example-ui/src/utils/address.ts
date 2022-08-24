export const truncateAddress = (address: string, leading = 4, trailing = 2) => {
  if (!address) return 'No Account'
  const re = `^(0x[a-zA-Z0-9]{${leading}})[a-zA-Z0-9]+([a-zA-Z0-9]{${trailing}})$`
  const match = address.match(re)
  if (!match) return address
  return `${match[1]}${match[2] ? '…' : ''}${match[2]}`
}
