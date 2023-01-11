import fs from 'fs'
import * as hre from 'hardhat'

const VERIFICATION_FILE_PATH = './verify.json'

async function main() {
  if (!fs.existsSync(VERIFICATION_FILE_PATH)) {
    throw new Error(`${VERIFICATION_FILE_PATH} not found`)
  }

  const verificationData = JSON.parse(fs.readFileSync(VERIFICATION_FILE_PATH, 'utf8'))
  for (let contractName of Object.keys(verificationData)) {
    const { address, constructorArguments } = verificationData[contractName]
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
