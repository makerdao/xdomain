import { Finding, FindingSeverity, FindingType, HandleTransaction, keccak256 } from "forta-agent";
import { createAddress, TestTransactionEvent } from "forta-agent-tools/lib/tests";
import { provideHandleTransaction } from "./agent";
import { Interface } from "@ethersproject/abi";
import { MINT_IFACE } from "./utils";

const WRONG_IFACE: Interface = new Interface([
  "event WrongEvent(address indexed originator, bytes32 indexed hashGUID)",
]);

const testCreateFinding = (txHash: string, hashGUID: string, networkId: number): Finding => {
  return Finding.fromObject({
    name: "MakerDAO Teleport Backing Monitor",
    description: "Mint event emitted from TeleportJoin without corresponding WormholeInitialized event",
    alertId: "MK-02-02",
    protocol: "forta-bots-info",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      txHash,
      hashGUID,
      chainId: networkId.toString(),
    },
  });
};

describe("WormholeInitialized events monitoring bot test suite", () => {
  const mockNetworkManager = {
    TeleportJoin: createAddress("0x0a"),
    TeleportOracleAuth: createAddress("0x0b"),
    networkId: 1,
  };
  const mockFetcher = {
    L2HashGUIDExists: jest.fn(),
  };

  const handleTransaction: HandleTransaction = provideHandleTransaction(mockNetworkManager as any, mockFetcher as any);

  it("should ignore empty transactions", async () => {
    const txEvent = new TestTransactionEvent();

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should ignore other events emitted from TeleportJoin contract", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(false);
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

  it("should return no findings when there is a corresponding WormholeInitialized event emitted from L2DaiGateway contract", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(true);
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

  it("should return a finding when there is no corresponding WormholeInitialized event emitted from L2DaiGateway contract", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(false);
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
      mockNetworkManager.TeleportOracleAuth,
    ]);

    const txEvent = new TestTransactionEvent().addAnonymousEventLog(
      mockNetworkManager.TeleportJoin,
      log.data,
      ...log.topics
    );

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(txEvent.hash, keccak256("guid123"), mockNetworkManager.networkId),
    ]);
  });

  it("should return multiple findings when there are no corresponding WormholeInitialized events emitted", async () => {
    mockFetcher.L2HashGUIDExists.mockReturnValue(false).mockReturnValue(false);
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
      mockNetworkManager.TeleportOracleAuth,
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
      mockNetworkManager.TeleportOracleAuth,
    ]);

    const txEvent = new TestTransactionEvent()
      .addAnonymousEventLog(mockNetworkManager.TeleportJoin, log1.data, ...log1.topics)
      .addAnonymousEventLog(mockNetworkManager.TeleportJoin, log2.data, ...log2.topics);

    const findings: Finding[] = await handleTransaction(txEvent);
    expect(findings).toStrictEqual([
      testCreateFinding(txEvent.hash, keccak256("guid123"), mockNetworkManager.networkId),
      testCreateFinding(txEvent.hash, keccak256("guid456"), mockNetworkManager.networkId),
    ]);
  });
});
