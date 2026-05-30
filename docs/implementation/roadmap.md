---
sidebar_position: 1
sidebar_label: Build Roadmap
title: Build Roadmap
---

# Build Roadmap — Sentinel service node in Syrius

Ordered, scoped work items distilled from the
[Specification](../specification/sentinel-service-layer.md) and verified against the
[Investigation](../evidence/investigation.md). Each task lists where the work lives, the
code anchors to start from, acceptance criteria, and whether it needs a protocol change.

**Legend:** 🟢 off-chain (no consensus change) · 🔴 requires spork/governance ·
⚠️ work outside Syrius-Dart (libznn/go-zenon).

---

## Phase 0 — Verify assumptions (no code)

| Task | Detail | Done when |
| ---- | ------ | --------- |
| 0.1 | Confirm go-zenon's embedded RPC config: does `libznn` already expose a public-capable RPC server, and on what interface? | The bind/port/TLS defaults are documented from go-zenon source. |
| 0.2 | Confirm the Sentinel reward logic in go-zenon (is "uptime = registration duration" true?). | Specification §2.1 is marked verified or corrected. |

> Phase 0 needs the **go-zenon** source, which is not in this repo. Resolve before
> estimating Phase A.

---

## Phase A — Make Syrius serve as a Sentinel ⚠️🟢

The load-bearing, under-stated phase. The embedded node already runs and serves WS on
`127.0.0.1:35998`; the work is to let it serve **publicly** and **stay up**.

### A.1 — Configurable embedded node ⚠️

- **Where:** `libznn`/go-zenon FFI **and** `syrius/lib/embedded_node/embedded_node.dart`.
- **Anchors:** FFI is arg-less `RunNode()`/`StopNode()` (`embedded_node.dart:15-21,96`);
  start path `node_utils.dart:243`.
- **Do:** extend the FFI to accept config (bind address, port, enable public RPC, TLS), **or**
  have Syrius write a go-zenon `config.json` the node reads on `RunNode()`.
- **Acceptance:** Syrius can start the embedded node bound to a chosen interface/port with
  `wss`/TLS, controlled from Dart; default remains localhost-only.

### A.2 — "Run as Sentinel / serve publicly" mode 🟢

- **Where:** Syrius app (settings + lifecycle).
- **Anchors:** wake-lock handling `node_utils.dart:238`; node management
  `node_management_screen.dart`.
- **Do:** add an explicit opt-in "serve publicly" toggle, a keep-alive/headless or
  tray-resident lifecycle, and a status surface (sync height, reachability, public endpoint).
- **Acceptance:** with the toggle on, the node keeps serving when the main window is closed;
  off by default; clear security warning shown.

### A.3 — Public-serving security hardening 🟢

- **Where:** Syrius + node config.
- **Do:** read-scope the public RPC (no wallet/signing endpoints), add rate limiting/connection
  caps, enforce `wss` for non-localhost. See Specification §9.
- **Acceptance:** public endpoint exposes only read/subscribe RPC; abuse controls in place.

---

## Phase B — Discovery, health & failover 🟢

Build the layer that finds Sentinel endpoints and routes clients to healthy ones. Reuses
existing Syrius scaffolding.

### B.1 — Signed service records

- **Where:** Syrius + operator tooling (`znn-controller`).
- **Spec:** §5. **Do:** define + verify the signed `{owner, endpoint, capabilities, version,
  issuedAt, expiresAt, nonce, signature}` record; verify signature, expiry, and that `owner`
  is in `embedded.sentinel.getAllActive()` / `getByOwner()`.
- **Acceptance:** an invalid/expired/non-active record is rejected before probing.

### B.2 — Populate the discovery slot

- **Where:** `syrius/lib/main.dart`, `assets/community-nodes.json`.
- **Anchors:** loader `_loadDefaultCommunityNodes` (`main.dart:180-192`), validator
  `InputValidators.node`, shuffle (`node_management_screen.dart:43`).
- **Do:** add a "Sentinel Nodes" category sourced from signed records (curated list first,
  feed later) instead of the empty `[]`.
- **Acceptance:** verified Sentinel endpoints appear as a selectable node tier.

### B.3 — Health probing + scoring

- **Where:** Syrius (`node_utils.dart`).
- **Anchors:** `establishConnectionToNode` (`node_utils.dart:20`), `getNodeChainIdentifier`
  (`:28`); currently used only for the active node (`:92,236`), not as a pre-filter.
- **Spec:** §7–§8 (gating vs. scoring). **Do:** probe reachability + chain ID (gates) then
  score sync freshness, RPC correctness, latency, subscriptions, peers; rank; re-probe
  periodically.
- **Acceptance:** unhealthy/wrong-chain nodes are excluded; survivors are ranked and cached.

### B.4 — RPC failover

- **Where:** Syrius (`NodeUtils`).
- **Anchors:** single `zenon!.wsClient` (`node_utils.dart:79-110`).
- **Do:** on active-node failure, fail over to the next-best ranked node.
- **Acceptance:** dropping the active node transparently reconnects to the next healthy one.

---

## Phase C — Trustless on-chain discovery 🔴

Requires governance; out of MVP scope. Tracked so it isn't mistaken for buildable now.

| Task | Detail |
| ---- | ------ |
| C.1 | Add an endpoint (and optional capability/service-key) field to Sentinel `Register` + `SentinelInfo` + SDK. Blocker today: `SentinelInfo` has only `owner`/`registrationTimestamp`/`isRevocable`/`revokeCooldown`/`active`; `register()` encodes `('Register', [])` (`api/embedded/sentinel.dart:51`). |
| C.2 | Move reward weighting from registration-duration to service quality: `reward_weight = stake_valid × reachability × sync_freshness × service_correctness × uptime`. |

---

## Dependency order

```
Phase 0  ──►  A.1 ──► A.2 ──► A.3
                       │
B.1 ──► B.2 ──► B.3 ──► B.4   (B.1–B.3 can start in parallel with A; B.2 needs B.1)
                       │
                       ▼
                  Phase C (governance, later)
```

The smallest useful release = **A.1 + A.2 + B.1 + B.2 + B.3** (operators serve publicly;
Syrius discovers, verifies, and ranks them). No consensus change.
