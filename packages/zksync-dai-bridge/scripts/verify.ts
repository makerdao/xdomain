import fs from 'fs'
import * as hre from 'hardhat'

const VERIFICATION_FILE_PATH = './verify.json'
const CHAIN_IDS = { goerli: 5, mainnet: 1 }

async function main() {
  if (!fs.existsSync(VERIFICATION_FILE_PATH)) {
    throw new Error(`${VERIFICATION_FILE_PATH} not found`)
  }

  if (!Object.keys(CHAIN_IDS).includes(process.env.HARDHAT_NETWORK || '')) {
    throw new Error(`Unsupported network "${process.env.HARDHAT_NETWORK}"`)
  }
  const network = process.env.HARDHAT_NETWORK as keyof typeof CHAIN_IDS
  const chainId = CHAIN_IDS[network]
  const verificationData = JSON.parse(fs.readFileSync(VERIFICATION_FILE_PATH, 'utf8'))
  const chainData = verificationData[chainId]
  for (let contractName of Object.keys(chainData)) {
    const { address, constructorArguments } = chainData[contractName]
    console.log(`Verifying ${contractName} source code...`)
    try {
      console.log(`yarn hardhat verify --no-compile ${address} ${constructorArguments}`)
      await hre.run('verify:verify', {
        address,
        contract: `contracts/l1/${contractName}.sol:${contractName}`,
        constructorArguments: constructorArguments.split(' ').filter(Boolean),
        noCompile: true,
      })
    } catch (e) {
      console.error(e)
    }
  }
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
