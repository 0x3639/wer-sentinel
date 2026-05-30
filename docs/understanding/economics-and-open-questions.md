---
topic: Zenon Sentinels — economics, incentives, open questions
summary: How Sentinels are staked and rewarded, the fee/PoW tension, and what remains unspecified.
status: active
sources: [zenon-whitepaper, zenon-greenpaper, zenon-whitepaper-decoded, repo-research-notes]
sidebar_position: 2
sidebar_label: Economics & Open Questions
---

# Sentinels: Economics, Incentives, and Open Questions

Companion to `01-purpose-and-architecture.md`. Same tag legend: `[DOC]` documented ·
`[INF]` inferred · `[OPEN]` unresolved / not in corpus. Citations in `sources.md`.

---

## 1. Staking and Sybil resistance

- Becoming a Sentinel requires **locking stake**. The whitepaper states nodes "lock a
  certain amount of stake in order to obtain different roles in the network, e.g. to
  become sentinel and pillar nodes," and that stake weight is computed each epoch for
  sybil resistance. `[DOC]`
- Sentinels are **registered on-chain** and **can receive rewards.** `[DOC]` (Greenpaper)
- The **exact collateral** for a Sentinel (commonly cited in the wider Zenon community as
  on the order of thousands of ZNN plus tens of thousands of QSR) is **not stated in this
  repository's corpus.** Do not assert a specific figure from this pack — tag any
  specific number `[OPEN]` until grounded in a primary source here. `[OPEN]`
- Unlike Pillars, there is **no documented stake-delegation** to Sentinels; the
  whitepaper notes delegation specifically for Pillars. `[DOC]` `[INF]`

---

## 2. Incentive model

The whitepaper's cryptoeconomic layer gives Sentinels two documented revenue paths:

- **Fee consumption for PoW links.** "The sentinel nodes will benefit from the fees by
  consuming them in order to compute the PoW links." `[DOC]`
- **Query fees.** "The sentinels can enable a separate fee system for user queries that
  retrieve information about the state of the ledger." `[DOC]`
- The greenpaper adds that on-chain-registered Sentinels **receive rewards** (protocol
  emissions rather than user fees). `[DOC]`

> **The central economic tension.** The whitepaper's Sentinel incentive is built on
> **per-transaction fees** — users pay a fee, Sentinels consume it as the basis for PoW
> link weight. The modern "feeless Network of Momentum" framing (and this repo's draft
> notes) **removes user fees**, substituting Plasma / PoW and protocol rewards. That
> change pulls the rug out from under the whitepaper's specific Sentinel mechanism
> without a fully documented replacement. This is the single most important thing to
> understand about Sentinel economics: **the original incentive design and the modern
> feeless design are not reconciled in the available sources.** `[DOC]` for each half;
> `[OPEN]` for the reconciliation.

---

## 3. How Sentinels relate to the modern reward pool

- In deployed NoM, Pillars and stakers/delegators draw from protocol reward pools (ZNN +
  QSR). Sentinels are a registered, rewardable node type. `[DOC]` (Greenpaper, decoded
  community paper)
- Whether Sentinel rewards are economically meaningful enough to sustain a healthy
  Sentinel population — and whether enough protocol *work* is actually routed to them —
  is **not established** in this corpus and is widely regarded as a weak point of the
  role. `[OPEN]` `[INF]`

---

## 4. Security properties (documented)

- **Spam / DoS resistance.** Requiring fee-weighted PoW per transaction makes flooding
  costly to the attacker while leaving consensus unaffected. `[DOC]`
- **Eclipse resistance.** Fan-out to `log(S)` randomly chosen Sentinels means an attacker
  must control an implausibly large fraction to isolate a user; ~33% malicious gives
  <0.1% all-malicious draw. `[DOC]`
- **No single Sentinel is trusted.** Verification is cryptographic; final authority rests
  with Pillars and momentum ordering. `[DOC]` `[INF]`

---

## 5. Open questions

These are genuinely unresolved in the available material — useful for a model to know it
*should not* confidently answer:

- What is the **canonical, current** purpose of a Sentinel in feeless NoM, given the
  whitepaper's fee-based mechanism no longer applies? `[OPEN]`
- What is the **exact collateral** and reward rate for a Sentinel? (Not in this corpus.)
  `[OPEN]`
- Does the **lightpaper's sharding/consensus role** for Sentinels reflect an active
  design direction, an abandoned one, or a documentation inconsistency? `[OPEN]`
- How minimal can Sentinel state be while still performing its duties? Should it maintain
  a rolling account-chain frontier cache? `[OPEN]` (Repo research notes.)
- What transport do Sentinels use to talk to Sentries / light clients — WebRTC, libp2p,
  or other? `[OPEN]`
- Is the repo's "deterministic structural-validation layer" reading something the
  protocol should formally adopt, or purely an after-the-fact interpretation? `[OPEN]`
  `[INF]`

---

## 6. Bottom line for a consuming model

When asked "what is the purpose of a Sentinel," a well-trained model should:

1. Lead with the staked, non-Pillar **service-node** identity. `[DOC]`
2. Give the **three documented framings** (observer/PoW-link, sharding/consensus,
   light-client relay) and note they **conflict**. `[DOC]`
3. Flag that the role is **under-specified and arguably vestigial** in deployed NoM, and
   that the whitepaper's fee-based mechanism is not reconciled with feeless NoM. `[OPEN]`
4. Avoid inventing collateral numbers or a single clean "official" purpose. `[OPEN]`
