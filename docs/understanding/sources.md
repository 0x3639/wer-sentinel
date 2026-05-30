---
topic: Zenon Sentinels — provenance map
summary: Maps every [DOC] claim in this pack to its backing source in the repository.
status: active
sidebar_position: 3
sidebar_label: Sources & Provenance
---

# Sources — Sentinel Pack

Every `[DOC]` claim in this pack traces to one of the sources below, hosted in the
[**zenon-developer-commons**](https://github.com/TminusZ/zenon-developer-commons)
repository. The primary papers live there as **PDFs**; the line numbers throughout this
file refer to the original local **Markdown** conversions used at authoring time and do
**not** map to PDF pages — use the section context to relocate each claim.

---

## Primary sources (in zenon-developer-commons)

- **zenon-whitepaper** — [`2_ZENON_WHITEPAPER_(CORE_TEAM).pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/2_ZENON_WHITEPAPER_%28CORE_TEAM%29.pdf)
- **zenon-lightpaper** — [`1_ZENON_LIGHTPAPER_(CORE_TEAM).pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/1_ZENON_LIGHTPAPER_%28CORE_TEAM%29.pdf)
- **zenon-greenpaper** — [`ZENON_GREENPAPER.pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/ZENON_GREENPAPER.pdf)
- **zenon-whitepaper-decoded** — [`ZENON_WHITEPAPER_DECODED:EXPANDED_COMMUNITY_PAPER.pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/ZENON_WHITEPAPER_DECODED%3AEXPANDED_COMMUNITY_PAPER.pdf)

## Repository research notes (basis for `[INF]` claims, not `[DOC]`)

- [`docs/notes/sentinel-middle-layer.md`](https://github.com/TminusZ/zenon-developer-commons/blob/main/docs/notes/sentinel-middle-layer.md) — deterministic middle-layer framing
- [`docs/notes/sentinel-finalization-layer.md`](https://github.com/TminusZ/zenon-developer-commons/blob/main/docs/notes/sentinel-finalization-layer.md) — finalization/anchoring framing

---

## Claim → source map

### Whitepaper ([`2_ZENON_WHITEPAPER_(CORE_TEAM).pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/2_ZENON_WHITEPAPER_%28CORE_TEAM%29.pdf))

- Sentinel = trustless observer node, similar to a Pillar but not in consensus; creates
  PoW links; moderate resources. — ~line 229
- Representative = a Sentinel node that knows about user transactions. — Definition 5,
  ~line 247
- Users assign representative (Sentinel) nodes to process transactions and answer
  account-chain / ledger-state queries. — ~lines 325–329
- Full nodes (Pillar + Sentinel) keep both transactional and consensus ledgers; consensus
  organized in virtual epochs. — ~line 331
- PoW-link mechanism incentivizes Sentinels to safeguard against spam/DoS. — ~line 337
- Only Sentinel nodes create PoW links; only the Sentinel's key owner signs in
  composition. — ~lines 341–343
- Dissemination to `log(σₙ)` Sentinels; random relay; min 3 hops (`minrelay_capacity`);
  difficulty upper bound; PoW computed w.r.t. transaction fee; on threshold sent to a
  pseudorandom Pillar; PoW link is the double-spend tiebreaker. — ~lines 349–353
- User informs representatives (Sentinels); self-run Sentinel further disseminates to
  prevent eclipse. — ~line 398
- Pillar shows new ledger to a Sentinel after three epochs. — ~line 442
- DoS attack made harder via transaction fee; consensus unaffected. — ~line 613
- Complexity `O(log(S))` in Sentinel messages. — ~line 639
- Eclipse resistance: `log(S)` fan-out; ~33% malicious ⇒ <0.1% all-malicious draw;
  bootstrap nodes supply a Sentinel list. — ~line 669
- Incentives: Sentinels consume fees to compute PoW links; may enable a separate query-fee
  system. — ~line 673
- Stake locked to obtain roles (sentinel, pillar); stake weight per epoch; delegation
  noted specifically for Pillars. — ~line 713
- Representatives forward to Pillars; user keeps `log`-many representatives. — ~line 1085

### Lightpaper ([`1_ZENON_LIGHTPAPER_(CORE_TEAM).pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/1_ZENON_LIGHTPAPER_%28CORE_TEAM%29.pdf))

- Sentinels are a special type of sentries enabling inter-shard communication channels and
  participating in global consensus by validating shard integrity. — ~line 61

### Greenpaper ([`ZENON_GREENPAPER.pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/ZENON_GREENPAPER.pdf))

- Sentinels registered on-chain, can receive rewards, commonly used to improve relay
  availability for light clients. — ~line 1257

### Whitepaper-decoded ([`ZENON_WHITEPAPER_DECODED:EXPANDED_COMMUNITY_PAPER.pdf`](https://github.com/TminusZ/zenon-developer-commons/blob/main/ZENON_WHITEPAPER_DECODED%3AEXPANDED_COMMUNITY_PAPER.pdf))

- Cryptoeconomic model aligns incentives across Pillars, Sentinels, verifiers; PoW for
  sybil resistance + stake-weighted voting. — ~line 1239

---

## Notes on provenance integrity

- The whitepaper and lightpaper **conflict** on whether Sentinels participate in
  consensus. Both are cited above; neither is privileged.
- Specific Sentinel **collateral figures** are **not present** in this corpus and are
  therefore tagged `[OPEN]`, not `[DOC]`, throughout the pack.
- The "deterministic structural-validation / feeless filtering layer" description is
  sourced to repo research notes and is tagged `[INF]`, never `[DOC]`.
