import { Contract } from "ethers";
import { defaultAbiCoder } from "ethers/lib/utils";

export async function multicall(
  multicall: Contract,
  calls: {
    target: Contract;
    method: string;
    params?: any[];
    outputTypes?: string[];
  }[]
): Promise<any[]> {
  const aggregateCalls = calls.map(({ target, method, params }) => {
    return {
      target: target.address,
      callData: target.interface.encodeFunctionData(method, params ?? []),
    };
  });

  const res = await multicall.callStatic.aggregate(aggregateCalls);
  const decoded = res.returnData.map(
    (bytes: string, index: number) =>
      (calls[index].outputTypes &&
        defaultAbiCoder.decode(calls[index].outputTypes!, bytes)) ||
      bytes
  );
  return decoded;
}
