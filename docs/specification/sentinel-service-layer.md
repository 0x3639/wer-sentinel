---
sidebar_position: 1
sidebar_label: Service Layer Spec
---

# Sentinel Service Layer Specification — v1

**Syrius-Facing Public Verification Nodes for NoM**

## Status

Exploratory specification, **v1** (peer-reviewed revision of the original v0 spec). Defines a
minimal path to activate Sentinels as useful public infrastructure without changing
consensus rules for the MVP. This revision is grounded in a line-by-line read of the Syrius
source (`syrius/`, SDK `znn_sdk_dart v0.0.7`); claims about Syrius carry `file:line`
receipts. Claims about `go-zenon` are marked **UNVERIFIED** because that source was not
available for this review.

---

## 0. Peer-review summary (what changed from v0 and why)

| # | Change | Rationale |
| - | ------ | --------- |
| 1 | **Added a second operator model: "Sentinel hosted inside Syrius."** v0 only described an externally-run `znnd`. | Syrius already runs a full go-zenon node *in-process* (`node_utils.dart:243`) and serves WS RPC from it. Hosting the Sentinel from inside Syrius is the strongest architectural option and was missing. (§4) |
| 2 | **Called out the `libznn` configuration gap as a hard prerequisite.** | The embedded-node FFI is `RunNode()`/`StopNode()` with **no arguments** (`embedded_node.dart:15-21`); Syrius cannot set bind address/port/TLS. Public serving needs libznn/go-zenon work the v0 spec ignored. (§4.2, §11 Phase A) |
| 3 | **Added an always-on / lifecycle requirement.** | Syrius is an interactive GUI that holds a wake-lock only while open (`node_utils.dart:238`); a Sentinel must be 24/7. (§4.3) |
| 4 | **Added a Security & Threat Model section.** | v0 had none. Exposing a public RPC server from a wallet process, replay-proofing service records, liveness vs. intent, and IP↔owner privacy all need treatment. (§9) |
| 5 | **Split health criteria into gating vs. scoring.** | v0 made chain-ID and reachability additive; a wrong chain ID must be *exclusionary*, not a -20. (§7) |
| 6 | **Hardened the service-record format** (canonical signed payload + timestamp + expiry + nonce; defined verification). | v0's "signature over endpoint" is replayable and undated. (§5) |
| 7 | **Corrected the evidence basis.** go-zenon claim tagged UNVERIFIED; video/breadcrumb downgraded to motivation; the "abandoned Peers wiring" clue removed as **dead code**; real in-process-node evidence added. (§2) |
| 8 | **Anchored every phase to real Syrius symbols** and clarified the on-chain blocker (`SentinelInfo` has no endpoint field). (§11) |

---

## 1. Thesis

Sentinels should not be treated as passive staking positions. Zenon's greenpaper frames
them as nodes that improve **relay availability for light clients** — a public RPC /
data-service edge between clients and consensus:

```
Syrius / Light Clients / Browser Apps / dApps
        ↓
Sentinel Service Layer   (public RPC + data/proof serving)
        ↓
NoM Full Nodes / Pillars (consensus)
```

Pillars remain the consensus backbone. Sentinels become the public edge layer.

> **Note on provenance.** Zenon's whitepaper, lightpaper, and greenpaper *conflict* on the
> Sentinel's role (whitepaper: observer, not in consensus; lightpaper: sharding consensus
> participant; greenpaper: light-client relay). The whitepaper and lightpaper are core-team
> documents; the greenpaper's normative status is less clear. This spec adopts the
> greenpaper "service edge" reading because it is the only one buildable today without
> protocol changes — but it is a *design choice*, not settled protocol. See
> [Purpose & Architecture](../understanding/purpose-and-architecture.md) and
> [Sources](../understanding/sources.md).

---

## 2. Evidence Basis

### 2.1 go-zenon — **UNVERIFIED in this review**

Hypothesis: Sentinels receive emissions but perform no measurable service; the "uptime"
check only verifies registration duration, not availability/RPC/sync/proof-serving. This is
**plausible but was not confirmed** — `go-zenon` was not inspected. Treat as a claim to
verify before relying on it. *(Action: confirm in the go-zenon Sentinel/reward modules.)*

### 2.2 Syrius — **verified against source**

Syrius already provides most of the machinery, and more than v0 claimed:

- **Runs a full node in-process** — `libznn` via FFI in an Isolate
  (`lib/embedded_node/embedded_node.dart:50-84`, started at `lib/utils/node_utils.dart:243`).
- **That node already serves WS RPC** — Syrius connects to `ws://127.0.0.1:35998` right
  after start (`node_utils.dart:235`, `constants.dart:123-124`).
- Sentinel staking UI; node management with multiple tiers + switching + URL validation
  (`node_management_screen.dart`).
- A discovery slot that is **implemented but empty**: loader + validator
  (`main.dart:180-192`), shuffle (`node_management_screen.dart:43`),
  `assets/community-nodes.json` = `[]`.
- Node-agnostic consumer: all calls go through one `zenon!.wsClient` (`node_utils.dart:79-110`).

> **Correction to prior reports:** the `SentinelsListBloc?` parameter sometimes cited as a
> "half-finished Sentinel wiring" in the Peers widget is **dead code** — unused at
> `peers.dart:51`, copy-pasted into two unrelated tables, and not present in either table
> typedef. Do not cite it as evidence.

### 2.3 Video / "breadcrumb" material — **motivation only**

The "Upgrade Preview" sequence (Sentinel → Syrius → Upgrade → Online) is community
interpretation, not engineering evidence. It may motivate the work; it must not be cited as
a technical basis. Useful framing: *Sentinels should be upgraded from staking objects into
online service nodes.*

---

## 3. Design Goals & Non-Goals

**Goals**
- A first working Sentinel service layer with **no consensus change** for the MVP.
- Make Sentinels *useful first*; defer protocol-level reward scoring.
- Support both an externally-run node and a node hosted *inside Syrius*.

**Non-Goals (MVP)**
- Trustless, on-chain endpoint discovery (requires a protocol change — §11 Phase C).
- Changing Sentinel rewards/economics.
- Making Syrius itself a light client that verifies all proofs (separate effort; see §10).

---

## 4. Sentinel Service Node

A Sentinel Service Node is a node operated by (or on behalf of) a registered Sentinel owner
that exposes a **public, synced, read-capable** NoM RPC endpoint. Two deployment models are
supported.

### 4.1 Model A — External node (operator-run `znnd`)

The operator runs a separate public go-zenon node and advertises it. Syrius is the
consumer. Lowest protocol risk; standard ops.

### 4.2 Model B — Hosted inside Syrius (embedded node served publicly)

Syrius's existing embedded `libznn` node is exposed as the public endpoint — "run a Sentinel
from inside the wallet." This is architecturally attractive (the engine already runs) but
has a **hard prerequisite the v0 spec omitted**:

> Syrius cannot currently configure the embedded node. The FFI exposes only `RunNode()` and
> `StopNode()` with **no arguments** (`embedded_node.dart:15-21,96`), and Syrius writes no
> node config (only logs use the data dir, `main.dart:56`). The node runs with whatever
> config is baked into `libznn`; Syrius reaches it at `127.0.0.1:35998`, and whether it
> *also* binds a public interface is not determinable without the `libznn`/go-zenon source.

**Required work for Model B (no consensus change, but not Syrius-only):**
- Extend the `libznn` FFI to accept config (bind address, port, enable public RPC, TLS), **or**
  have Syrius write a go-zenon `config.json` that the embedded node reads on `RunNode()`.
- Default to **localhost-only** unless the user explicitly opts into public serving.

### 4.3 Minimum requirements (both models)

- registered Sentinel owner address
- running **synced** full node (fresh frontier momentum)
- public IP or domain, reachable
- **`wss` with TLS for any non-localhost endpoint** (plain `ws://` only for localhost/trusted LAN)
- correct chain ID
- healthy peer count
- ledger RPC + subscription support
- **always-on**: for Model B, a headless / stay-alive / run-in-tray mode (a closed GUI must
  not silently drop the Sentinel)

Default port: `35998` (matches `kDefaultPort`). Example endpoints:

```
wss://sentinel.example.com:35998   # public (TLS required)
ws://127.0.0.1:35998               # local only
```

---

## 5. Sentinel Service Record (off-chain, MVP)

Because the chain stores no endpoint (see §11 Phase C), the MVP binds an endpoint to a
Sentinel owner with a **signed off-chain record**.

```json
{
  "owner": "z1...",
  "endpoint": "wss://sentinel.example.com:35998",
  "capabilities": ["ledger", "stats", "subscriptions", "embedded.read"],
  "version": "0.1",
  "issuedAt": 1717000000,
  "expiresAt": 1719592000,
  "nonce": "base64-random",
  "publicKey": "owner-public-key",
  "signature": "sig over canonical(payload-without-signature)"
}
```

- **Required:** `owner`, `endpoint`, `capabilities`, `version`, `issuedAt`, `expiresAt`,
  `nonce`, `signature` (and `publicKey` if the owner address is not sufficient to recover/verify it).
- **Optional:** `nodeId`, `region`, `operatorName`.
- **Signature** is over a *canonical serialization of all fields except `signature`* — not
  just the endpoint — to prevent field tampering and replay. Verifiers MUST:
  1. check `expiresAt` is in the future and `issuedAt` is sane;
  2. verify the signature against the owner's key and confirm it matches `owner`;
  3. cross-check that `owner` is in the on-chain active set
     (`embedded.sentinel.getAllActive()` / `getByOwner()`), so a record can't advertise a
     revoked or non-existent Sentinel;
  4. then probe (§7). A valid signature proves *intent*, never *liveness*.

> Records should be short-lived (rotate before `expiresAt`) so a stale endpoint can't be
> replayed indefinitely.

---

## 6. Syrius Discovery Flow

Add a node category **"Sentinel Nodes"** in Node Management. Flow:

1. Load Sentinel service records (signed JSON; initially a curated list, later a feed).
2. Validate record (signature, expiry, owner ∈ active set) — §5.
3. Validate endpoint format (`InputValidators.node`).
4. Probe: open WS, check chain ID, sync freshness, peer count, RPC correctness — §7.
5. Score and rank healthy nodes — §8.
6. Cache results; re-probe periodically; demote nodes that go stale/unreachable.
7. Display in Node Management; allow connect.
8. On active-node failure, **fail over** to the next-best ranked node (Syrius holds a single
   `zenon!.wsClient` today — this needs adding).

Bootstraps by reusing the existing community-node path: populate `community-nodes.json`
(or a Sentinel-specific equivalent) instead of leaving it `[]`.

---

## 7. Health Checks — gating vs. scoring

Split criteria. **Gating** failures *exclude* a node (never connect); **scoring** ranks the
survivors.

**Gating (pass/fail — failure = exclude):**
- **Reachability** — WS connection opens.
- **Chain ID** — matches expected (a wrong chain ID is disqualifying, not a deduction).
- **Sync validity** — node returns a valid, non-bogus frontier.

**Scoring (rank the gated-in nodes):**

| Signal | What it measures | Source |
| ------ | ---------------- | ------ |
| Sync freshness | frontier height vs. best-known | `ledger.getFrontierMomentum` |
| RPC correctness | answers core calls correctly | `stats.syncInfo`, `stats.networkInfo` |
| Subscription support | live updates work | `subscribe.toMomentums`, `subscribe.toAllAccountBlocks` |
| Peer health | `peer_count >= threshold` | `stats.networkInfo` |
| Latency | round-trip on probe calls | measured during probe |

Sample over a short window rather than a single shot, and decay scores so a node that
degrades drops in ranking.

---

## 8. MVP Scoring (local, off-chain)

```
SentinelScore =  sync_freshness + rpc_correctness + subscription + peer_health + latency
                 # only computed for nodes that PASS all gating checks (§7)
```

Suggested weights (gated-in nodes only):

| Component             | Weight |
| --------------------- | ------ |
| Sync freshness        | 30     |
| RPC correctness       | 25     |
| Latency               | 20     |
| Subscription support  | 15     |
| Peer health           | 10     |
| **Total**             | **100** |

Status bands:

| Score   | Status     |
| ------- | ---------- |
| 85–100  | Excellent  |
| 65–84   | Healthy    |
| 40–64   | Degraded   |
| 0–39    | Do not use |

> Reachability and chain ID are intentionally **absent** from the additive score — they are
> gates in §7. A node that fails them is excluded, not low-scored.

> **Mnemonic.** These dimensions map onto the community "Upgrade Preview" mnemonic —
> SIZE (history served), SPEED (latency/sync), POWER (capacity/uptime), BUMP (peer
> propagation/relay), SLIDE (failover/routing). It's a handy memory aid for operators; the
> authoritative thresholds and weights are this section and §7. See
> [Upgrade Preview video](../community/video.md).

---

## 9. Security & Threat Model *(new in v1)*

- **Don't co-locate a hot wallet with a public server unguarded.** Model B exposes an RPC
  server from the same application a user holds keys in. Public RPC MUST be **read-scoped**
  (no key material, no signing, no wallet endpoints), and ideally isolated from the wallet
  context. Default off; explicit opt-in; clear warning.
- **DoS / resource exhaustion.** A public endpoint invites abuse. Recommend rate limiting,
  connection caps, and (later) the whitepaper's PoW-link / Plasma-style cost on requests.
- **Transport security.** TLS (`wss`) mandatory for non-localhost; reject mixed/plain public
  endpoints in discovery.
- **Liveness ≠ intent.** A signed record proves the owner advertised an endpoint, not that
  it is up, synced, honest, or still a registered Sentinel — hence mandatory active-set
  cross-check (§5) + live probing (§7).
- **Endpoint spoofing / replay.** Canonical signed payload + `expiresAt` + `nonce` (§5).
- **Privacy.** Advertising an endpoint links a Sentinel **owner address ↔ IP/domain**.
  Operators should understand this; consider domain fronting / reverse proxies. Some owners
  may prefer Model A behind infrastructure they control.
- **Trust minimization.** Clients should treat Sentinels as transport, not authority (§10).

---

## 10. Relationship to Verification-First Design

Verification-first mindset: *don't trust the server — request data, verify locally.*
Sentinels should be **proof-serving transport**, not trusted RPC authorities. Long-term
capabilities to serve:

- momentums, account blocks
- state proofs, frontier proofs
- historical data
- (if SPV is added) Bitcoin headers/proofs

The client verifies; the Sentinel transmits — matching the whitepaper's storage/transmission
role. (Full client-side verification in Syrius is out of MVP scope; this section sets the
direction so the RPC surface doesn't bake in trust assumptions.)

---

## 11. Build Phases

**Phase 0 — Documentation & verification.** Write up the gap; **verify the go-zenon reward
claim** (§2.1). No code.

**Phase A — Make Syrius serve as a Sentinel (the load-bearing new work).** *No consensus
change.*
- Extend `libznn` FFI **or** add a Syrius-written go-zenon `config.json` so the embedded node
  can bind publicly + enable `wss`/TLS (§4.2).
- Add a "Run as Sentinel / serve publicly" mode with an always-on lifecycle + sync/reachability
  status (§4.3). *(Model A operators can skip this and run `znnd` directly.)*

**Phase B — Discovery & quality (per §5–§8).** *No consensus change.*
- Signed service records (§5).
- Populate the discovery slot; reuse `_loadDefaultCommunityNodes` (`main.dart:180`),
  `InputValidators.node`, and the shuffle.
- Health probing/scoring reusing `establishConnectionToNode` (`node_utils.dart:20`) +
  `getNodeChainIdentifier` (`node_utils.dart:28`) + frontier freshness + peer count.
- RPC failover across ranked nodes (Syrius currently holds one `wsClient`).

**Phase C — Trustless on-chain (requires spork/governance).**
- The blocker: on-chain `SentinelInfo` has only `owner`, `registrationTimestamp`,
  `isRevocable`, `revokeCooldown`, `active`; `register()` encodes `('Register', [])` with no
  endpoint (SDK `model/embedded/sentinel.dart`, `api/embedded/sentinel.dart:51`).
- Add an endpoint (and optional capability/service-key) field to Sentinel registration +
  `SentinelInfo` + SDK, so `getAllActive()` yields discoverable endpoints.
- Then move reward weighting from registration-duration to service quality:
  ```
  reward_weight = stake_valid × reachability × sync_freshness × service_correctness × uptime
  ```

**Operator tooling (parallel, via `znn-controller`):** register/test/sign/publish service
record, monitor health. *(Syrius already hands operational Sentinel management to
`znn-controller` today — `sentinel_stepper_container.dart:678-699`.)*

---

## 12. Minimal Implementation Target

The smallest genuinely-useful release:

1. A Sentinel operator exposes a public, synced endpoint — via **Model A** (run `znnd`)
   today, or **Model B** (Syrius serve-mode) once Phase A lands.
2. The endpoint is published as a signed record.
3. Syrius validates (signature + active-set), probes, scores, and ranks it.
4. Users connect, with failover.

No consensus change required.

---

## 13. Summary

- **Pillars** = consensus.
- **Sentinels** = public verification/service edge.
- **Syrius** = client that consumes that edge *and can host it* (Model B).

The missing algorithm is not exotic: **discover → verify (signature + active-set) → probe →
rank → connect (with failover) → eventually reward by service.** The MVP is off-chain and
needs no spork. The two honestly-underrated pieces of real work are (1) making Syrius's
embedded node serve publicly (libznn/go-zenon, not just UI) and (2) keeping it alive 24/7.
Everything else sits on infrastructure that already ships in Syrius.

---

### Reviewer's open questions (carry into Phase 0)

1. **go-zenon RPC config:** does `libznn`'s baked-in config already expose a public-capable
   RPC server, or is binding `0.0.0.0`/TLS entirely new code? This decides how big Phase A
   is. *(Not answerable from `syrius/`; needs go-zenon.)*
2. **go-zenon reward logic:** is "uptime = registration duration" actually true? (§2.1)
3. **Signature scheme:** can a Sentinel `owner` address verify a record signature directly,
   or must `publicKey` be carried? (Depends on Zenon address/sig recovery semantics.)
4. **Protocol appetite:** is there governance willingness for the Phase C endpoint field, or
   should the off-chain record be treated as the long-term mechanism?
