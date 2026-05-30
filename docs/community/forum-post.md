---
sidebar_position: 1
sidebar_label: Forum Post
---

# The Sentinel framework is already inside Syrius — let's finish it

> 📣 Discuss this on the hypercore.one forum: **[wer-sentinel](https://forum.hypercore.one/t/wer-sentinel/925)**.
> Background context: the [Upgrade Preview video](./video.md).

**TL;DR:** Syrius doesn't just *connect* to a node — it already **runs a full go-zenon node
inside the wallet** and serves RPC from it. Add the live Sentinel staking UI, the node
manager, and an implemented-but-empty community-node discovery slot, and the foundation to
run a Sentinel **service node from inside Syrius** is already sitting in the codebase. The
Sentinel service layer was never finished, but finishing it is a buildable extension — and
the MVP needs **no consensus change**. Here's the evidence, and here's the work.

---

## Why Sentinels feel "vestigial" today

Right now a Sentinel is a staking position. You lock ZNN + QSR, register on-chain, collect
rewards, and... that's it. The node does no measurable network service. That's the gap
everyone senses.

But Zenon's own docs (greenpaper) describe Sentinels as nodes that **improve relay
availability for light clients** — i.e., a public RPC / data-service edge that wallets and
light clients connect to. The interesting part: **almost all of the machinery to do that
already exists in Syrius.** It was just never wired together and switched on.

I went through the Syrius source (Flutter/Dart, SDK pinned at `znn_sdk_dart v0.0.7`) to
verify this claim against the actual code rather than vibes. Below, every assertion has a
`file:line` receipt.

---

## What's already in Syrius (the receipts)

**1. Syrius runs a full node *in-process*.** This is the big one. Syrius bundles go-zenon
compiled as `libznn` and runs it via FFI inside an Isolate:

- `lib/embedded_node/embedded_node.dart:50-84` — loads `libznn.so/.dylib/.dll`, binds the
  `RunNode`/`StopNode` entry points.
- `lib/utils/node_utils.dart:243` — `Isolate.spawn(EmbeddedNode.runNode, [''])` actually
  starts it.

**2. That embedded node already serves WebSocket RPC.** Immediately after starting it,
Syrius connects to it:

- `lib/utils/node_utils.dart:235` connects to `kLocalhostDefaultNodeUrl`
- `lib/utils/constants.dart:123-124` → `ws://127.0.0.1:35998`

A Sentinel service node *is* a public-serving full node. The engine to be one is **already
executing inside Syrius** — it just isn't exposed publicly yet (Syrius reaches it at
`127.0.0.1`; whether it also binds a public interface isn't provable without the
libznn/go-zenon source).

**3. The full Sentinel staking lifecycle is wired.** Register → deposit QSR → lock ZNN →
collect → revoke:

- `lib/widgets/modular_widgets/sentinel_widgets/*`
- SDK `api/embedded/sentinel.dart:17-67` (`getAllActive`, `getByOwner`, `register`,
  `revoke`, `depositQsr`, `withdrawQsr`, `collectReward`, …)

**4. Node management already supports multiple node tiers + switching + validation.**

- `lib/screens/node_management_screen.dart` — embedded, localhost, user-added (`kDbNodes`),
  and community nodes; URL validation; chain-ID mismatch warnings.

**5. There's a discovery slot that's fully implemented but empty.**

- `assets/community-nodes.json` = `[]`
- `lib/main.dart:180-192` loads it, validates each entry, builds the list
- `node_management_screen.dart:43` shuffles the pool (classic load-distribution over a
  service tier)

The loader, validator, and shuffler are real. The slot is there. It just has nothing in it.

**6. The RPC consumer side is node-agnostic.** Every call Syrius makes goes through a single
`zenon!.wsClient` (`node_utils.dart:79-110`). Pointing it at a Sentinel-served endpoint is a
URL swap — **zero code change** on the consumer side.

That's the framework. None of it is wishful thinking; it's in the tree today.

---

## Being honest: what is *not* there yet

I want this to be a credible pitch, not hype, so here are the two things the "just fill in
the JSON" framing glosses over:

**A. Syrius can't currently configure its embedded node.** The FFI surface is `RunNode()`
and `StopNode()` with **zero arguments** (`embedded_node.dart:15-21`), and Syrius writes no
node config (the only `.znn` path use is for logs, `main.dart:56`). So the embedded node
runs with whatever config is baked into `libznn`, and Syrius only reaches it at
`127.0.0.1` (whether it also binds a public interface isn't determinable without the
libznn/go-zenon source). Making it serve **publicly** (bind `0.0.0.0`, enable `wss`/TLS,
choose a port) is real work that lives in **`libznn`/go-zenon**, not just Syrius UI.

**B. A desktop wallet is an awkward host for a 24/7 node.** Syrius is an interactive GUI app
(it holds a wake-lock only while running, `node_utils.dart:238`). A Sentinel is meant to be
always-on infrastructure. Nothing blocks running it from Syrius, but we'd need a
"serve / stay-alive / headless" mode that doesn't exist yet.

Neither of these requires a protocol change. They're just real engineering the spec doesn't
currently cover.

One more honest note: a frequently-cited "clue" — a `SentinelsListBloc?` parameter
ghost-typed into the Peers widget — turns out to be **dead code** (`peers.dart:51`, unused,
and copy-pasted into two unrelated tables). It's not evidence of half-finished Sentinel
wiring. The *real* evidence is everything in the list above.

---

## The one true blocker for the *trustless* version

If we want Syrius to discover Sentinels **trustlessly from the chain**, there's a hard wall:
the on-chain Sentinel record has no network address. `SentinelInfo` contains only `owner`,
`registrationTimestamp`, `isRevocable`, `revokeCooldown`, `active` (SDK
`model/embedded/sentinel.dart`), and `register()` takes no endpoint
(`api/embedded/sentinel.dart:51`). The chain literally doesn't store *where* a Sentinel can
be reached.

**The good news:** this only matters for the fully trustless endgame. The MVP doesn't need
it — we can ship a working service layer off-chain first (signed endpoint records +
health-checked node list) and add on-chain endpoints later via a spork.

---

## What needs to be done (proposed phases)

**Phase A — Make Syrius serve as a Sentinel (the new, load-bearing work).** *No consensus
change.*
- Extend `libznn` (FFI args or a Syrius-written go-zenon `config.json`) so the embedded node
  can bind publicly and enable `wss`/TLS.
- Add a "Run as Sentinel / serve publicly" mode in Syrius that keeps the node alive and
  shows sync + reachability status.

**Phase B — Discovery + quality (per the Sentinel spec, off-chain).** *No consensus change.*
- Signed off-chain service records: the Sentinel owner signs `{owner, endpoint,
  capabilities}`, tying an endpoint to an owner address without touching the protocol.
- Populate the discovery slot from those records (reuse the existing
  loader/validator/shuffle).
- Health probing + scoring before offering a node (reuse `establishConnectionToNode` +
  `getNodeChainIdentifier` + frontier-freshness + peer count), plus RPC failover.

**Phase C — Trustless (later, needs a spork).**
- Add an endpoint field to on-chain Sentinel registration + `SentinelInfo`.
- Move reward scoring from "registered long enough" to actual service quality
  (reachability × sync freshness × correctness × uptime).

---

## Why this is worth doing

This turns Sentinels from a passive staking position into **useful public infrastructure**
that light clients, browser wallets, and dApps can lean on — and it does the first, useful
version with **no consensus changes and no protocol risk**. The hardest pieces (a full node
engine, RPC, the staking UI, a discovery scaffold) are already built and shipping in Syrius.
We're not starting from zero. We're finishing something that's been sitting 80% done in the
codebase.

**What I'm looking for:** anyone who knows the `libznn`/go-zenon embedded-node config path
(does it already expose a public-capable RPC server, or is that new code?), plus Syrius
contributors who can scope Phase A. If we can confirm the go-zenon side, Phase A + B is a
realistic community build.

Receipts are all above — please verify them yourself against the Syrius source and poke
holes. That's the point.
