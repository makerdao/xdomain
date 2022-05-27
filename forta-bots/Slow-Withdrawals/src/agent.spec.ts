import { Finding, FindingSeverity, FindingType, HandleTransaction, keccak256 } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { Interface } from "@ethersproject/abi";
import { MINT_IFACE } from "./utils";

const WRONG_IFACE: Interface = new Interface([
  "event WrongEvent(address indexed originator, bytes32 indexed hashGUID)",
]);

export const testCreateFinding = (txHash: string, originator: string, chainId: number): Finding => {
  return Finding.fromObject({
    name: "Slow TeleportJoin Withdrawal",
    description: "Mint event emitted from the TeleportJoin without the TeleportOracleAuth as originator",
    alertId: "MK-03",
    protocol: "forta-bots-info",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      txHash: txHash,
      originatorAddress: originator,
      chainId: chainId.toString(),
    },
  });
};

describe("WormholeInitialized events monitoring bot test suite", () => {
  const mockNetworkManager = {
    TeleportJoin: createAddress("0x0a"),
    TeleportOracleAuth: createAddress("0x0b"),
    networkId: 1,
  };

  const handleTransaction: HandleTransaction = provideHandleTransaction(mockNetworkManager as any);

  it("should ignore empty transactions", async () => {
    const txEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events emitted from the TeleportJoin contract", async () => {
    const event = WRONG_IFACE.getEvent("WrongEvent");
    const log = WRONG_IFACE.encodeEventLog(event, [mockNetworkManager.TeleportOracleAuth, keccak256("guid1")]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.TeleportJoin,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return no findings when the withdrawal's originator is TeleportOracleAuth", async () => {
    const event = MINT_IFACE.getEvent("Mint");
    const log = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid1"),
      [keccak256("sdfsdfsd"), keccak256("sdfsdfd"), keccak256("sdfsdsd"), keccak256("sfsdfsd"), 232, 44, 44],
      23,
      31,
      11,
      mockNetworkManager.TeleportOracleAuth,
    ]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.TeleportJoin,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when the originator of the withdrawal is other than the TeleportOracleAuth", async () => {
    const event = MINT_IFACE.getEvent("Mint");
    const log = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid123"),
      [
        keccak256("aasdfsdfsd"),
        keccak256("bbsdfsdfd"),
        keccak256("ccsdfsdsd"),
        keccak256("ddsfsdfsd"),
        1232,
        484,
        40004,
      ],
      213,
      321,
      141,
      createAddress("0x012"),
    ]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.TeleportJoin,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(txEvent.hash, createAddress("0x012"), mockNetworkManager.networkId),
    ]);
  });

  it("should return multiple findings when there are multiple withdrawals without the TeleportOracleAuth as originator", async () => {
    const event = MINT_IFACE.getEvent("Mint");
    const log1 = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid123"),
      [
        keccak256("aasdfsdfsd"),
        keccak256("bbsdfsdfd"),
        keccak256("ccsdfsdsd"),
        keccak256("ddsfsdfsd"),
        1232,
        484,
        40004,
      ],
      213,
      321,
      141,
      createAddress("0x013"),
    ]);
    const log2 = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid456"),
      [
        keccak256("aasdfsdfsdgg"),
        keccak256("bbsdfsdfdgg"),
        keccak256("ccsdfsdsdgg"),
        keccak256("ddsfsdfsdgg"),
        2232,
        4848,
        400048,
      ],
      2233,
      3221,
      1411,
      createAddress("0x014"),
    ]);

    const txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(mockNetworkManager.TeleportJoin, log1.data, ...log1.topics)
      .addAnonymousEventLog(mockNetworkManager.TeleportJoin, log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(txEvent.hash, createAddress("0x013"), mockNetworkManager.networkId),
      testCreateFinding(txEvent.hash, createAddress("0x014"), mockNetworkManager.networkId),
    ]);
  });
});
