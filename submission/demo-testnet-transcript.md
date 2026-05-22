# HashTrail live testnet demo transcript

Generated: 2026-05-22T12:37:18.387Z

## HashScan links

- Account: https://hashscan.io/testnet/account/0.0.7304745
- HCS topic: https://hashscan.io/testnet/topic/0.0.9004997
- HTS token: https://hashscan.io/testnet/token/0.0.9005160
- Tip Card NFT: https://hashscan.io/testnet/token/0.0.9007634
- HCS transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779453406.120234843
- Address-book transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779453419.862033276
- HTS mint transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779453412.894820705
- Tip HBAR transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779453424.815043500
- Tip NFT transfer transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779453427.001050538

## 1. npm run hashtrail -- "make me a hashtrail receipt"

```bash
npm run hashtrail -- "make me a hashtrail receipt"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts make me a hashtrail receipt

HashTrail status=ok mode=live
balance=961.29384379 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-22T12:36:53.349Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
HashTrail postcard posted to 0.0.9004997 on Hedera testnet. sequence=20 tx=0.0.7304745@1779453406.120234843
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453406.120234843
```

## 2. npm run hashtrail -- "mint the tiny fun token"

```bash
npm run hashtrail -- "mint the tiny fun token"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts mint the tiny fun token

HashTrail status=ok mode=live
balance=961.29125885 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-22T12:36:58.917Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
HashTrail minted 1 HTFUN on Hedera testnet token=0.0.9005160 tx=0.0.7304745@1779453412.894820705
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453417.738340247
token=https://hashscan.io/testnet/token/0.0.9005160
htsMintTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453412.894820705
```

## 3. npm run hashtrail -- "check my balance and read the last 3 postcards"

```bash
npm run hashtrail -- "check my balance and read the last 3 postcards"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts check my balance and read the last 3 postcards

HashTrail status=ok mode=live
balance=961.27752611 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-22T12:37:04.977Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
HashTrail checked balance and read 2 postcards from 0.0.9004997 on Hedera testnet.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
```

## 4. npm run hashtrail -- "register alice as 0.0.9007632 for demo recipient with automatic token associations"

```bash
npm run hashtrail -- "register alice as 0.0.9007632 for demo recipient with automatic token associations"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts register alice as 0.0.9007632 for demo recipient with automatic token associations

HashTrail status=ok mode=live
balance=961.27752611 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-22T12:37:06.342Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
Registered alice as 0.0.9007632 in the HashTrail HCS address book.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453419.862033276
```

## 5. npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"

```bash
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts tip 0.25 hbar to alice for shipping the demo

HashTrail status=ok mode=live
balance=961.2745015 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-22T12:37:09.072Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
Tipped 0.25 HBAR to 0.0.9007632 on Hedera testnet. Tip Card NFT 0.0.9007634 serial 6 transferred.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453431.780149997
tipHbarTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453424.815043500
tipNftToken=https://hashscan.io/testnet/token/0.0.9007634
tipNftTransferTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779453427.001050538
```
