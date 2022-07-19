# Canonical Dai on different chains comparison

| Functionality                            | Mainnet                                              | Optimism, Arbitrum                                           | StarkNet                                             |
| ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| version                                  | 1                                                    | 2                                                            | n/a                                                  |
| name                                     | Dai Stablecoin                                       | Dai Stablecoin                                               | Dai Stablecoin                                       |
| symbol                                   | DAI                                                  | DAI                                                          | DAI                                                  |
| decimals                                 | 18                                                   | 18                                                           | 18                                                   |
| rely(), deny()                           | auth                                                 | auth                                                         | auth                                                 |
| transfer()                               | anyone, anywhere                                     | anyone, cannot transfer to DAI address or to 0x              | anyone, cannot transfer to DAI address or to 0x      |
| mint()                                   | auth, can mint to any address                        | auth, can mint to any address except DAI and 0x              | auth, can mint to any address except DAI and 0x      |
| burn()                                   | sender can burn own tokens otherwise needs allowance | sender **or ward** can burn tokens otherwise needs allowance | sender can burn own tokens otherwise needs allowance |
| approve()                                | anyone                                               | anyone                                                       | anyone                                               |
| push(), pull(), move()                   | aliases for transfer()                               | n/a                                                          | n/a                                                  |
| increaseAllowance(), decreaseAllowance() | n/a                                                  | aliases for approve()                                        | aliases for approve()                                |
| permit()                                 | approve() by sig, nonce explicit in method sig       | approve() by sig, nonce implicit                             | n/a                                                  |

### Deployments:

```json
{
  "Mainnet": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  "Optimism": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  "Arbitrum": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  "StarkNet": "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3"
}
```
