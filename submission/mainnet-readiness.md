# HashTrail Mainnet Readiness

HashTrail can now load `HEDERA_NETWORK=mainnet` only when
`HASHTRAIL_ENABLE_MAINNET=true` is set. The guard is intentional: mainnet spends
real HBAR and must use mainnet-only topic/token/NFT IDs.

## Local Mainnet Operator Candidate

Private key location:

```text
.local/mainnet-operator.json
```

This file is gitignored and has `600` permissions. Do not show it on video.

Public funding target:

```text
0.0.302d300706052b8104000a03220003d3c95470bf76247f740b3bb11c61e6e084a039a0c23fa14e9084d83b572edcfe
```

EVM address:

```text
0xed6f31e9a0a4876c607a326e4ab44f19ea67f622
```

The current testnet operator `0.0.7304745` is not usable for mainnet. The
mainnet account with that number exists, has `0` tinybar, and its key does not
match the local testnet key.

## Funding Flow

Use Hedera auto account creation: send HBAR to the public alias above. After the
transfer, resolve the numeric account id from mainnet mirror node and put that
numeric id plus the local private key into a mainnet-only env file.

Do not send the full balance. Keep some HBAR in your wallet for retries and
fees. With only about `1.4 HBAR`, run the smallest possible mainnet demo first:

1. mainnet account funded
2. HCS topic/postcard
3. one small HBAR tip to a known mainnet recipient
4. Tip Card NFT only if enough balance remains after creating the collection

The full testnet-style flow creates/publishes several objects and may need more
than `1.4 HBAR` depending on current mainnet fees.

## Live Mainnet Proof

Mainnet operator:

```text
0.0.10489896
```

Recipient wallet:

```text
0.0.10231006
```

Polished Tip Card metadata:

```text
ipfs://bafkreiblekqyyf6di5ksmwyr45aoopvrbzxbunhywbm7ffnh4zcdeqcifi
```

Live mainnet receipts:

```text
HCS topic: 0.0.10489911
HCS topic create tx: 0.0.10489896@1779477416.457955285
HBAR tip tx: 0.0.10489896@1779477337.887190474
NFT collection: 0.0.10489912
NFT create tx: 0.0.10489896@1779477429.813116061
NFT mint tx: 0.0.10489896@1779477432.744595352
NFT transfer tx: 0.0.10489896@1779477440.269786908
HCS receipt tx: 0.0.10489896@1779477441.554100712
NFT serial: 1
```

HashScan links:

```text
https://hashscan.io/mainnet/account/0.0.10489896
https://hashscan.io/mainnet/account/0.0.10231006
https://hashscan.io/mainnet/topic/0.0.10489911
https://hashscan.io/mainnet/token/0.0.10489912
https://hashscan.io/mainnet/tx/0.0.10489896@1779477337.887190474
https://hashscan.io/mainnet/tx/0.0.10489896@1779477432.744595352
https://hashscan.io/mainnet/tx/0.0.10489896@1779477440.269786908
https://hashscan.io/mainnet/tx/0.0.10489896@1779477441.554100712
```

Mirror node confirmed token `0.0.10489912` serial `1` is owned by
`0.0.10231006`, with serial metadata set to the polished IPFS URI above.

Operational note: the repo `.env` may contain testnet IDs. For future mainnet
runs, explicitly set fresh mainnet `HASHTRAIL_HCS_TOPIC_ID`,
`HASHTRAIL_HTS_TOKEN_ID`, and `HASHTRAIL_NFT_TOKEN_ID` values, or override them
to empty values before creating new mainnet entities. Never let testnet IDs
bleed into `HEDERA_NETWORK=mainnet`.

## Mainnet Env Shape

```dotenv
HEDERA_NETWORK=mainnet
HASHTRAIL_ENABLE_MAINNET=true
HEDERA_OPERATOR_ID=0.0.REPLACE_WITH_RESOLVED_MAINNET_ACCOUNT
HEDERA_OPERATOR_KEY=REPLACE_WITH_LOCAL_PRIVATE_KEY_FROM_DOT_LOCAL
HEDERA_MIRROR_NODE_URL=https://mainnet-public.mirrornode.hedera.com

HBL_LLM_PROVIDER=none
HBL_LLM_MODEL=none

HASHTRAIL_DISPLAY_NAME=ihab
HASHTRAIL_HCS_TOPIC_ID=
HASHTRAIL_HTS_TOKEN_ID=
HASHTRAIL_NFT_TOKEN_ID=
HASHTRAIL_TIP_CARD_METADATA_URI=ipfs://REPLACE_WITH_SVG_DEFAULT_METADATA_CID

WEEK1_ALLOW_MINT=false
WEEK1_ALLOW_TIP=true
WEEK1_ALLOW_TIP_NFT=true
```

For serial 7, upload:

```text
assets/tip-card/metadata.hip412.svg-default.json
```

Then set its CID as `HASHTRAIL_TIP_CARD_METADATA_URI` before minting. That
metadata makes the SVG the default image, so wallet/gallery views show the
generic `HBAR TIP` card instead of the plain PNG.
