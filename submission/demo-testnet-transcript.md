# HashTrail live testnet demo transcript

Generated: 2026-05-19T22:40:31.529Z

## HashScan links

- Account: https://hashscan.io/testnet/account/0.0.7304745
- HCS topic: https://hashscan.io/testnet/topic/0.0.9004997
- HTS token: https://hashscan.io/testnet/token/0.0.9005160
- Tip Card NFT: https://hashscan.io/testnet/token/0.0.9007634
- HCS transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779230406.134642113
- HTS mint transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779230409.849585026
- Tip HBAR transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779230416.743412529
- Tip NFT transfer transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779230423.457062626

## 1. npm run hashtrail -- "make me a hashtrail receipt"

```bash
npm run hashtrail -- "make me a hashtrail receipt"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts make me a hashtrail receipt

HashTrail status=ok mode=live
balance=963.30770489 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T22:40:12.000Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
HashTrail postcard posted to 0.0.9004997 on Hedera testnet. sequence=10 tx=0.0.7304745@1779230406.134642113
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779230406.134642113
```

## 2. npm run hashtrail -- "mint the tiny fun token"

```bash
npm run hashtrail -- "mint the tiny fun token"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts mint the tiny fun token

HashTrail status=ok mode=live
balance=963.30507656 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T22:40:14.659Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
HashTrail minted 1 HTFUN on Hedera testnet token=0.0.9005160 tx=0.0.7304745@1779230409.849585026
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779230411.207057395
token=https://hashscan.io/testnet/token/0.0.9005160
htsMintTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779230409.849585026
```

## 3. npm run hashtrail -- "check my balance and read the last 3 postcards"

```bash
npm run hashtrail -- "check my balance and read the last 3 postcards"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts check my balance and read the last 3 postcards

HashTrail status=ok mode=live
balance=963.2911133 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T22:40:20.912Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
HashTrail checked balance and read 2 postcards from 0.0.9004997 on Hedera testnet.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
```

## 4. npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"

```bash
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts tip 0.25 hbar to alice for shipping the demo

HashTrail status=ok mode=live
balance=963.2911133 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T22:40:22.284Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
Tipped 0.25 HBAR to 0.0.9007632 on Hedera testnet. Tip Card NFT 0.0.9007634 serial 2 transferred.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779230424.637390732
tipHbarTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779230416.743412529
tipNftToken=https://hashscan.io/testnet/token/0.0.9007634
tipNftTransferTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779230423.457062626
```
