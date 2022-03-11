import { Contract, Signer } from "ethers";
import { defaultAbiCoder, Interface } from "ethers/lib/utils";

export async function multicall(
  multicallAddress: string,
  signer: Signer,
  calls: {
    target: Contract;
    method: string;
    params?: any[];
    outputTypes?: string[];
  }[]
): Promise<any[]> {
  const mc = new Contract(
    multicallAddress,
    new Interface([
      // adding the `view` decorator to be able to issue an eth_call
      "function aggregate((address target,bytes callData)[]) public view returns (uint256 blockNumber, bytes[] returnData)",
    ]),
    signer
  );

  const aggregateCalls = calls.map(({ target, method, params }) => {
    return {
      target: target.address,
      callData: target.interface.encodeFunctionData(method, params ?? []),
    };
  });

  const res = await mc.aggregate(aggregateCalls);
  const decoded = res.returnData.map(
    (bytes: string, index: number) =>
      (calls[index].outputTypes &&
        defaultAbiCoder.decode(calls[index].outputTypes!, bytes)) ||
      bytes
  );
  return decoded;
}
