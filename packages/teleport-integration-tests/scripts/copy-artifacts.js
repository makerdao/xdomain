const fs = require('fs')
const { join, basename } = require('path')

function copyDappToolsArtifact(inputDirPath, srcPath, destinationDirPath) {
  const jsonFilePath = join(inputDirPath, `dapp.sol.json`)
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`${jsonFilePath}  doesnt exist!`)
  }
  const json = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'))
  const contractName = basename(srcPath)

  const entry = json.contracts[`${srcPath}.sol`][contractName]
  const artifact = {
    abi: entry.abi,
    bytecode: entry.evm.bytecode.object,
  }

  const destinationPath = join(destinationDirPath, `${contractName}.json`)
  console.log(`Writing to ${destinationPath}`)
  fs.writeFileSync(destinationPath, JSON.stringify(artifact, null, 2))
}

function copyHardhatArtifact(filePath, destinationDirPath, destinationFilename) {
  console.log(`Reading hardhat artifact ${filePath}`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`${filePath} doesnt exist!`)
  }
  const destinationPath = join(destinationDirPath, destinationFilename || basename(filePath))
  if (fs.existsSync(destinationPath)) {
    throw new Error(`${destinationPath} already exists!`)
  }

  const artifact = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  console.log(`Writing to ${destinationPath}`)
  fs.writeFileSync(destinationPath, JSON.stringify(artifact, null, 2))
}

const dappToolsArtifacts = join(__dirname, '../repos/dss-teleport/out/')
const hardhatTestArtifacts = join(__dirname, '../artifacts/contracts')
const output = join(__dirname, '../external-artifacts')

function copyOptimismBridgeArtifact(relativePath, destinationDirPath) {
  const filePath = join(__dirname, '../../optimism-dai-bridge/artifacts/contracts/', relativePath)
  const destinationFilename = `Optimism${basename(filePath)}`
  copyHardhatArtifact(filePath, destinationDirPath, destinationFilename)
}
function copyArbitrumBridgeArtifact(relativePath, destinationDirPath) {
  const filePath = join(__dirname, '../../arbitrum-dai-bridge/artifacts/contracts/', relativePath)
  const destinationFilename = `Arbitrum${basename(filePath)}`
  copyHardhatArtifact(filePath, destinationDirPath, destinationFilename)
}

if (fs.existsSync(output)) {
  console.log(`Deleting ${output} dir`)
  fs.rmSync(output, { recursive: true, force: true })
}

console.log(`Creating ${output} dir`)
fs.mkdirSync(output)

// copy dss-teleport artifacts
copyDappToolsArtifact(dappToolsArtifacts, 'src/TeleportJoin', output)
copyDappToolsArtifact(dappToolsArtifacts, 'src/TeleportConstantFee', output)
copyDappToolsArtifact(dappToolsArtifacts, 'src/TeleportOracleAuth', output)
copyDappToolsArtifact(dappToolsArtifacts, 'src/TeleportRouter', output)
copyDappToolsArtifact(dappToolsArtifacts, 'src/relays/BasicRelay', output)
copyDappToolsArtifact(dappToolsArtifacts, 'src/relays/TrustedRelay', output)

// copy optimism-dai-bridge artifacts
copyOptimismBridgeArtifact('l2/dai.sol/Dai.json', output)
copyOptimismBridgeArtifact('l1/L1Escrow.sol/L1Escrow.json', output)
copyOptimismBridgeArtifact('l1/L1DAITokenBridge.sol/L1DAITokenBridge.json', output)
copyOptimismBridgeArtifact('l2/L2DAITokenBridge.sol/L2DAITokenBridge.json', output)
copyOptimismBridgeArtifact('l1/L1DaiTeleportGateway.sol/L1DaiTeleportGateway.json', output)
copyOptimismBridgeArtifact('l2/L2DaiTeleportGateway.sol/L2DaiTeleportGateway.json', output)
copyOptimismBridgeArtifact('l1/L1GovernanceRelay.sol/L1GovernanceRelay.json', output)
copyOptimismBridgeArtifact('l2/L2GovernanceRelay.sol/L2GovernanceRelay.json', output)
copyOptimismBridgeArtifact('common/TeleportInterfaces.sol/IL1TeleportGateway.json', output)
copyOptimismBridgeArtifact('common/TeleportInterfaces.sol/IL2TeleportGateway.json', output)

// copy arbitrum-dai-bridge artifacts
copyArbitrumBridgeArtifact('l2/dai.sol/Dai.json', output)
copyArbitrumBridgeArtifact('l1/L1Escrow.sol/L1Escrow.json', output)
copyArbitrumBridgeArtifact('l1/L1DaiGateway.sol/L1DaiGateway.json', output)
copyArbitrumBridgeArtifact('l2/L2DaiGateway.sol/L2DaiGateway.json', output)
copyArbitrumBridgeArtifact('l2/L2CrossDomainEnabled.sol/L2CrossDomainEnabled.json', output)
copyArbitrumBridgeArtifact('l1/L1DaiTeleportGateway.sol/L1DaiTeleportGateway.json', output)
copyArbitrumBridgeArtifact('l2/L2DaiTeleportGateway.sol/L2DaiTeleportGateway.json', output)
copyArbitrumBridgeArtifact('l1/L1GovernanceRelay.sol/L1GovernanceRelay.json', output)
copyArbitrumBridgeArtifact('l2/L2GovernanceRelay.sol/L2GovernanceRelay.json', output)

copyHardhatArtifact(
  join(hardhatTestArtifacts, 'test/ConfigureTrustedRelaySpell.sol/ConfigureTrustedRelaySpell.json'),
  output,
)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/ConfigureTrustedRelaySpell.sol/TrustedRelayLike.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/FileJoinFeesSpell.sol/FileJoinFeesSpell.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/FileJoinLineSpell.sol/FileJoinLineSpell.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/PushBadDebtSpell.sol/PushBadDebtSpell.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/PushBadDebtSpell.sol/DaiJoinLike.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/PushBadDebtSpell.sol/VatLike.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/PushBadDebtSpell.sol/TeleportJoinLike.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/rinkeby/FakeArbitrumInbox.sol/FakeArbitrumInbox.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/rinkeby/FakeArbitrumBridge.sol/FakeArbitrumBridge.json'), output)
copyHardhatArtifact(join(hardhatTestArtifacts, 'test/rinkeby/FakeArbitrumOutbox.sol/FakeArbitrumOutbox.json'), output)

copyHardhatArtifact(
  join(hardhatTestArtifacts, 'test/kovan/L1AddTeleportOptimismSpell.sol/L1AddTeleportOptimismSpell.json'),
  output,
)
copyHardhatArtifact(
  join(hardhatTestArtifacts, 'test/rinkeby/L1AddTeleportArbitrumSpell.sol/L1AddTeleportArbitrumSpell.json'),
  output,
)
copyHardhatArtifact(
  join(hardhatTestArtifacts, 'test/L1ConfigureTeleportSpell.sol/L1ConfigureTeleportSpell.json'),
  output,
)
copyHardhatArtifact(
  join(hardhatTestArtifacts, 'test/L2AddTeleportDomainSpell.sol/L2AddTeleportDomainSpell.json'),
  output,
)
