# Teleport SDK

## Running the tests

Fund an account with:

- Rinkeby ETH
- Rinkeby Arbitrum ETH
- Kovan ETH
- Kovan Optimism ETH
- Goerli ETH
- Goerli Optimism ETH
- Goerli Arbitrum ETH

then add `USER_PRIV_KEY=your-account-private-key` to your `.env`. You can then run the tests using:

```sh
yarn test
```

## Running a demo script

Fund an account with L2 ETH

then add `DEMO_USER_PRIV_KEY=your-account-private-key` to your `.env`. You can then run the demo using:

```sh
yarn demo:[l2Network]:[l1Network]
```

For example, to run the demo script on `arbitrum-goerli-testnet`, use:

```sh
yarn demo:arbitrum:goerli
```
