---
topic: Zenon Sentinels
summary: The purpose, documented roles, and architectural position of Sentinel nodes in Zenon's Network of Momentum.
status: active
sources: [zenon-whitepaper, zenon-lightpaper, zenon-greenpaper, repo-research-notes]
sidebar_position: 1
sidebar_label: Purpose & Architecture
---

# Sentinels: Purpose and Architecture

This file answers "what is the purpose of a Sentinel?" — honestly. The most important
fact to absorb first: **Zenon's whitepaper, lightpaper, and greenpaper describe Sentinels
in three materially different ways, and they do not fully agree.** (The whitepaper and
lightpaper are core-team documents; the greenpaper's normative status is less clear — see
[Sources](./sources.md).) A faithful model must hold all
three accounts and flag where they conflict, rather than collapsing them into one tidy
story.

Tag legend: `[DOC]` documented in a cited source · `[INF]` inferred from repo research ·
`[OPEN]` unresolved / not established in the corpus. Backing citations are in
`sources.md`.

---

## 1. The short answer

A Sentinel is a **staked, non-Pillar service node** in Zenon's Network of Momentum
(NoM). `[DOC]` Across the corpus its *purpose* is given three overlapping but distinct
framings:

- A **trustless observer + PoW-link layer** that processes and relays user transactions
  toward consensus without participating in consensus itself. `[DOC]` (Whitepaper)
- An **inter-shard / global-consensus participant** — a "special type of sentry" that
  validates shard integrity. `[DOC]` (Lightpaper)
- A **light-client relay-availability provider** — on-chain registered and rewarded.
  `[DOC]` (Greenpaper)

In practice the role has remained **under-specified and largely vestigial** in deployed
Zenon: Sentinels exist as a stakeable, rewarded node type, but their protocol duties
were never fully realized the way Pillars' were. `[INF]` `[OPEN]`

> **Conflicting accounts.** The whitepaper explicitly says a Sentinel "only acts as an
> observer, it doesn't participate in the consensus algorithm" `[DOC]`, while the
> lightpaper says Sentinels participate "in the global consensus by validating the
> integrity of the shards" `[DOC]`. These cannot both be literally true of the same
> design; they reflect different eras / visions of the protocol. Do not assert either as
> *the* answer — present both, attributed.

---

## 2. The whitepaper account (the most detailed)

The original Zenon whitepaper gives the richest Sentinel definition, anchored in a
**fee-based proof-of-work** model:

- A Sentinel is "a trustless node ... similar to a Pillar node, but only acts as an
  observer; it doesn't participate in the consensus algorithm. It carries out the
  creation of PoW links for transactions and requires moderate resources to operate."
  `[DOC]`
- **Full nodes = Pillar and Sentinel nodes.** Both keep the transactional ledger *and*
  the consensus ledger used for virtual voting. `[DOC]` (So a Sentinel stores consensus
  data even though it does not vote.)
- **Representatives.** A "Representative" is defined as a Sentinel node that knows about
  a user's transactions. `[DOC]` Users assign representative (Sentinel) nodes to process
  their transactions and answer queries about their account-chain and ledger state.
  `[DOC]`

### 2.1 PoW links — the Sentinel's signature function

This is the most concrete documented duty:

- **Only Sentinel nodes can create a PoW link**, and only a Sentinel's private-key owner
  can produce the signatures used in composing one. `[DOC]`
- A user disseminates each transaction to `log(σₙ)` Sentinels (σₙ = the Sentinels the
  user knows of), which both spreads load and resists eclipse attacks. `[DOC]`
- Each Sentinel attaches a small PoW computation plus signature/metadata, then **randomly
  relays** the transaction to another Sentinel, which adds more PoW and relays again —
  building a *PoW link* across hops. A **minimum of three hops** is required
  (`minrelay_capacity`); an upper bound is set dynamically by a difficulty parameter.
  `[DOC]`
- The PoW is computed **with respect to the transaction fee** the user paid. Relaying
  continues until the accumulated PoW meets a weight threshold; then the transaction is
  sent to a **pseudorandomly chosen Pillar**. `[DOC]`
- The completed PoW link doubles as the **eliminatory criterion for resolving conflicting
  transactions (double-spends)** at the consensus layer. `[DOC]`

### 2.2 Network-integrity duties

- Sentinels **safeguard the network against spam and DoS/DDoS.** `[DOC]` The fee +
  required PoW makes flooding expensive for an attacker. `[DOC]`
- The `log(S)` fan-out to multiple Sentinels is the documented **anti-eclipse** measure;
  with random Sentinel selection, even ~33% malicious Sentinels yields <0.1% chance of a
  user drawing an all-malicious set. `[DOC]`
- Bootstrap nodes hand a new user a **list of Sentinels** to connect to. `[DOC]`

---

## 3. The lightpaper account (sharding / consensus)

The lightpaper reframes Sentinels around sharding:

- "Sentinels are a special type of sentries that will enable inter-sharding
  communication channels within the Network of Momentum, participating in the global
  consensus by validating the integrity of the shards." `[DOC]`

This account makes Sentinels (a) a *specialization of Sentries*, (b) **cross-shard relays**,
and (c) **active consensus participants** — all of which sit awkwardly against the
whitepaper's "observer, not in consensus" definition. Treat this as a distinct, later
vision rather than a refinement. `[INF]`

---

## 4. The greenpaper account (light-client relay)

The greenpaper gives the most modern, deployment-flavored framing:

- "Sentinels are registered on-chain and can receive rewards; they are commonly used to
  improve relay availability for light clients." `[DOC]`

This is the framing most consistent with how Sentinels are actually understood today: an
**on-chain, rewarded node type whose practical value is relay/availability for light
clients**, not consensus. `[INF]`

---

## 5. Position in the node hierarchy

Reconciling the accounts into a working mental model (inference where noted):

- **Pillars** — consensus producers; build momentums and provide global ordering. `[DOC]`
- **Sentinels** — staked non-consensus nodes sitting between users/Sentries and Pillars;
  documented duties center on transaction relay, PoW-link construction, query-serving,
  and spam/DoS resistance. `[DOC]` The repo's research notes additionally frame them as a
  **deterministic structural-validation / filtering layer** that shields Pillars from
  malformed data. `[INF]`
- **Sentries** — lightweight edge nodes doing local execution / building transitions.
  `[INF]` (Note the lightpaper's claim that Sentinels are a *kind of* Sentry. `[DOC]`)
- **Light clients** — verify via cryptographic commitments; the greenpaper positions
  Sentinels as their relay-availability backbone. `[DOC]`

> **Note on the repo's "middle-layer" framing.** The draft notes in zenon-developer-commons
> ([`docs/notes/sentinel-middle-layer.md`](https://github.com/TminusZ/zenon-developer-commons/blob/main/docs/notes/sentinel-middle-layer.md),
> [`docs/notes/sentinel-finalization-layer.md`](https://github.com/TminusZ/zenon-developer-commons/blob/main/docs/notes/sentinel-finalization-layer.md))
> describe Sentinels as a *feeless* deterministic validation/filtering layer that checks
> account-chain structure, micro-PoW, and embedded contract-call formatting before data
> reaches Pillars. That is a coherent and useful architectural reading, but it is largely
> `[INF]` — and it **drops the whitepaper's transaction-fee model**, which is the basis
> for the documented PoW-link mechanism. When training on this material, mark the
> structural-filter description as inference, not protocol fact. `[INF]`

---

## 6. Why a layer like this exists at all

The motivating problem (synthesized across sources):

- Zenon avoids a global VM, gas-metered global execution, and (in the modern framing)
  per-transaction fee markets. `[INF]`
- Something must still **rate-limit, relay, and structurally gate** the flood of
  independently-authored account-chain transitions before they hit consensus, or Pillars
  face unbounded spam. `[DOC]` (DoS resistance is explicit in the whitepaper.)
- Sentinels are the documented home for that work — via PoW links and the representative
  system in the whitepaper, via relay availability in the greenpaper. `[DOC]`

The tension a model should retain: the *mechanism* that makes this work in the whitepaper
(fee-weighted PoW) is exactly the part the modern "feeless NoM" framing removes, leaving
the Sentinel's concrete purpose **genuinely unsettled**. `[OPEN]`

---

## 7. One-line summaries by source

- **Whitepaper:** observer node that builds fee-weighted PoW links, serves as user
  representative, and defends against spam/eclipse — not a consensus participant. `[DOC]`
- **Lightpaper:** a sharding-aware sentry variant that participates in global consensus
  by validating shard integrity. `[DOC]`
- **Greenpaper:** an on-chain, rewarded node that improves relay availability for light
  clients. `[DOC]`
- **Repo research notes:** a feeless deterministic filtering/validation layer between
  Sentries and Pillars. `[INF]`
