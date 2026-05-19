# HashTrail live testnet demo transcript

Generated: 2026-05-19T23:12:16.483Z

## HashScan links

- Account: https://hashscan.io/testnet/account/0.0.7304745
- HCS topic: https://hashscan.io/testnet/topic/0.0.9004997
- HTS token: https://hashscan.io/testnet/token/0.0.9005160
- Tip Card NFT: https://hashscan.io/testnet/token/0.0.9007634
- HCS transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779232302.577626262
- Address-book transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779232318.516978523
- HTS mint transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779232311.576615952
- Tip HBAR transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779232320.299717768
- Tip NFT transfer transaction: https://hashscan.io/testnet/tx/0.0.7304745@1779232324.270092094

## 1. npm run hashtrail -- "make me a hashtrail receipt"

```bash
npm run hashtrail -- "make me a hashtrail receipt"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts make me a hashtrail receipt

HashTrail status=ok mode=live
balance=962.29903235 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T23:11:50.499Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
HashTrail postcard posted to 0.0.9004997 on Hedera testnet. sequence=15 tx=0.0.7304745@1779232302.577626262
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232302.577626262
```

## 2. npm run hashtrail -- "mint the tiny fun token"

```bash
npm run hashtrail -- "mint the tiny fun token"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts mint the tiny fun token

HashTrail status=ok mode=live
balance=962.29640153 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T23:11:57.635Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
HashTrail minted 1 HTFUN on Hedera testnet token=0.0.9005160 tx=0.0.7304745@1779232311.576615952
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232313.896766833
token=https://hashscan.io/testnet/token/0.0.9005160
htsMintTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232311.576615952
```

## 3. npm run hashtrail -- "check my balance and read the last 3 postcards"

```bash
npm run hashtrail -- "check my balance and read the last 3 postcards"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts check my balance and read the last 3 postcards

HashTrail status=ok mode=live
balance=962.28242505 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T23:12:02.708Z","agent":"hashtrail-hedera-agent"}
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
balance=962.28242505 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T23:12:04.131Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
Registered alice as 0.0.9007632 in the HashTrail HCS address book.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232318.516978523
```

## 5. npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"

```bash
npm run hashtrail -- "tip 0.25 hbar to alice for shipping the demo"
```

```text
> hashtrail-hedera-agent@0.1.0 hashtrail
> tsx src/cli.ts tip 0.25 hbar to alice for shipping the demo

HashTrail status=ok mode=live
balance=962.27934675 ℏ
topicId=0.0.9004997
postcard={"kind":"hashtrail.postcard.v1","displayName":"ihab","network":"testnet","message":"hello from ihab on Hedera testnet","createdAt":"2026-05-19T23:12:07.896Z","agent":"hashtrail-hedera-agent"}
latest messages:
1. hello from ihab on Hedera testnet
2. hello from ihab on Hedera testnet
Tipped 0.25 HBAR to 0.0.9007632 on Hedera testnet. Tip Card NFT 0.0.9007634 serial 4 transferred.
hashscan:
account=https://hashscan.io/testnet/account/0.0.7304745
topic=https://hashscan.io/testnet/topic/0.0.9004997
hcsTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232328.018796762
tipHbarTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232320.299717768
tipNftToken=https://hashscan.io/testnet/token/0.0.9007634
tipNftTransferTransaction=https://hashscan.io/testnet/tx/0.0.7304745@1779232324.270092094
```
