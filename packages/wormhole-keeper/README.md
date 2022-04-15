# Wormhole Keeper

Ensures that Wormhole L2 deployment gets flushed and that past messages get finalized.

## Running

It requires a private key to an account with funds on L2 (to flush debt) and L1 (to finalize messages). It will
automatically pick all the details about deployment from config based only on L1 rpc.

```
yarn start L1_RPC PRIV_KEY
```
