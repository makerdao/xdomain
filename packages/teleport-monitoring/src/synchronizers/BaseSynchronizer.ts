import { delay } from '../utils'

export type SynchronizerState = 'stopped' | 'syncing' | 'synced'

export abstract class BaseSynchronizer {
  protected _state: SynchronizerState = 'stopped'
  get state(): SynchronizerState {
    return this._state
  }

  stop() {
    this._state = 'stopped'
  }

  async syncOnce(): Promise<void> {
    void this.run()
    while (this.state === 'synced') {
      await delay(1000)
    }
    this.stop()
  }

  abstract run(): Promise<void>
}
