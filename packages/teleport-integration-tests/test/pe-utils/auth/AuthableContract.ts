import { BaseContract, BigNumber, CallOverrides, ContractTransaction, Event, EventFilter, Overrides } from 'ethers'
import { Result } from 'ethers/lib/utils'

export interface TypedEventFilter<_EventArgsArray, _EventArgsObject> extends EventFilter {}

export interface TypedEvent<EventArgs extends Result> extends Event {
  args: EventArgs
}

export interface AuthableContract extends BaseContract {
  queryFilter<EventArgsArray extends Array<any>, EventArgsObject>(
    event: TypedEventFilter<EventArgsArray, EventArgsObject>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined,
  ): Promise<Array<TypedEvent<EventArgsArray & EventArgsObject>>>
  deny(usr: string, overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>
  rely(usr: string, overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>
  wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>

  filters: {
    Deny(usr?: string | null): TypedEventFilter<[string], { usr: string }>
    Rely(usr?: string | null): TypedEventFilter<[string], { usr: string }>
  }
}

/**
 * Use this minimal interface to overcome any problems between incompatible ethers versions
 */
export interface AuthableLike {
  deny: any
  rely: any
}
