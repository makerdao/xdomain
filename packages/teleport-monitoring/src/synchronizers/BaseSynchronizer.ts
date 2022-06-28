import { delay } from '../utils'

export type SynchronizerState = 'stopped' | 'syncing' | 'synced'

export abstract class BaseSynchronizer {
  public readonly name: string

  constructor() {
    this.name = this.constructor.name
  }

  private _state: SynchronizerState = 'stopped'
  get state(): SynchronizerState {
    return this._state
  }

  stop() {
    this._state = 'stopped'
  }

  protected setSynced() {
    if (this.state === 'syncing') {
      this._state = 'synced'
    }
  }

  protected setSyncing() {
    this._state = 'syncing'
  }

  async syncOnce(): Promise<void> {
    console.log('syncing once!')
    void this.run()
    while (this.state === 'syncing') {
      console.log('still syncing!')
      await delay(1000)
    }
    console.log('stopping!!')
    this.stop()
  }

  abstract run(): Promise<void>
}
