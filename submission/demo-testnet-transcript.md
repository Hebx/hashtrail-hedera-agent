# HashTrail live testnet demo transcript

Generated: 2026-05-19T19:31:16.349Z

## HashScan links

- Account: https://hashscan.io/testnet/account/0.0.7304745
- HCS topic: https://hashscan.io/testnet/topic/0.0.9004997
- HTS token: https://hashscan.io/testnet/token/0.0.9005160
- HCS transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779219062.416719356
- HTS mint transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779219065.928626125

## 1. npm run hashtrail -- "make me a hashtrail receipt"

```bash
npm run hashtrail -- "make me a hashtrail receipt"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts make me a hashtrail receipt

HashTrail status=ok mode=live
balance=977.2868384 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T19:31:06.271Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
3. hello from ihab on Hedera testnet
HashTrail postcard posted to 0.0.9004997 on Hedera testnet. sequence=7 tx=0.0.7304745@1779219062.416719356
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779219062.416719356
```

## 2. npm run hashtrail -- "mint the tiny fun token"

```bash
npm run hashtrail -- "mint the tiny fun token"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts mint the tiny fun token

HashTrail status=ok mode=live
balance=977.28421035 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T19:31:10.092Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
3. hello from ihab on Hedera testnet
HashTrail minted 1 HTFUN on Hedera testnet token=0.0.9005160 tx=0.0.7304745@1779219065.928626125
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779219067.894349432
token=https://hashscan.io/testnet/token/0.0.9005160
htsMintTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779219065.928626125
```

## 3. npm run hashtrail -- "check my balance and read the last 3 postcards"

```bash
npm run hashtrail -- "check my balance and read the last 3 postcards"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts check my balance and read the last 3 postcards

HashTrail status=ok mode=live
balance=977.2702486 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T19:31:16.228Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
3. hello from ihab on Hedera testnet
HashTrail checked balance and read 3 postcards from 0.0.9004997 on Hedera testnet.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
```
