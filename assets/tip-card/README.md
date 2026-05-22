# Tip Card NFT Design

`tip-card-v1.svg` is the canonical presentation asset for the HashTrail Tip
Card NFT. It layers crisp vector typography over the generated card artwork in
`tip-card-art-v1.png`.

Design intent:

- premium Hedera testnet receipt collectible
- HCS receipt, HBAR tip, HTS NFT, and HashScan proof motifs
- readable title and proof labels for screenshots, demos, and submission media

The live NFT serial metadata stays compact because Hedera NFT metadata is capped
at 100 bytes per serial. The code marks minted serials with `d:"v1"` so the
on-chain serial can be associated with this design version.

For wallet and marketplace rendering, upload the HIP-412 metadata JSON file to
public storage such as IPFS, then set:

```dotenv
HASHTRAIL_TIP_CARD_METADATA_URI=ipfs://REPLACE_WITH_METADATA_CID
```

The public image assets are already pinned:

- PNG default render image:
  `ipfs://bafybeignyatsozbku25bqblspyfzxtky5wn2lwj6x3znl7mohhkmmwf3yq`
- SVG source/render fallback:
  `ipfs://bafkreigd3vukk3texckcekejgidltbce4fopnzobio6piq3snzmhaenzdq`

`metadata.hip412.json` is the ready-to-upload public metadata file.
`metadata.hip412.example.json` mirrors the same structure for edits. Future
mints use `HASHTRAIL_TIP_CARD_METADATA_URI` as the serial metadata, while older
serials remain compact proof receipts.

For production-style serials, prefer `metadata.hip412.svg-default.json`. It makes
the SVG the default wallet image so the visible NFT says `HBAR TIP` without
hard-coding a contributor, amount, or reason that changes between tips.
