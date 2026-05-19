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
