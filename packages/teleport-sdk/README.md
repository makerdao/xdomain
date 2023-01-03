# Teleport SDK

## Install the SDK to your project

In your project directory, run:

```sh
yarn add teleport-sdk
```

## Build the SDK

After cloning the `xdomain` monorepo, navigate to the `teleport-sdk` package:

```sh
cd packages/teleport-sdk
```

To build the SDK, run:

```sh
yarn build
```

## Running the tests

In order to be able to run the tests, you first need to build the SDK (see instructions above).

Fund an account with:

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

## Building the SDK documentation

```sh
yarn docs
```
