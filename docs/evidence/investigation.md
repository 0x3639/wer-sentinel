---
sidebar_position: 1
sidebar_label: Investigation & Evidence
---

# Investigation: Can Syrius Be Extended to Host the Sentinel Service Node From Inside the Wallet?

Forensic feasibility assessment, verified against the actual `syrius/` source (pinned SDK
`znn_sdk_dart` `v0.0.7`, resolved-ref `8511f17`). Code is ground truth; every finding cites
`file:line`. Tags: `[DOC]` documented · `[INF]` inferred from code · `[OPEN]` unresolved.
The raw question-by-question forensic pass is preserved in the [appendix](#appendix--raw-forensic-qa).

**The claim being tested** (corrected framing): the Sentinel *service node* is **not done**
in Syrius, but the *framework* is present, so Syrius can be **extended to host the Sentinel
service node from inside the wallet**, built per the
[Specification](../specification/sentinel-service-layer.md), with **no protocol change for
the MVP**. This is a feasibility question, not a completeness one.

---

## 1. Verdict

**The claim is credible and architecturally coherent.** The foundation it points to is
genuinely in the codebase, and the decisive fact is stronger than the source documents
state: **Syrius does not merely connect to a node — it already runs a full go-zenon node
in-process** (`libznn` via FFI, in an Isolate), and that node already serves WebSocket RPC.
A Sentinel service node *is* a public-serving full node, so the engine to be a Sentinel is
literally already executing inside Syrius. Combined with the live staking UI, node
management, and the implemented-but-empty discovery slot, "the framework is there" is a
fair description.

**Two honest qualifications keep this from being a clean "yes":**

1. **The embedded node is not configurable from Syrius today.** The FFI surface is
   `RunNode()` / `StopNode()` with **zero arguments** (`embedded_node.dart:15-21,96`), and
   Syrius writes no node config. The node runs with whatever is baked into `libznn`. Syrius
   *reaches* it at `127.0.0.1:35998`, but whether the server **also** binds a public
   interface is **not determinable from `syrius/`** — the bind address lives in go-zenon's
   config, not in Dart (see §6). Either way, making it serve *publicly* (bind `0.0.0.0`,
   TLS/`wss`) is real work that lives in **`libznn` / go-zenon**, not just Syrius Dart/UI.
   This is the single biggest under-stated item.
2. **A desktop GUI is an awkward host for an always-on public node.** Syrius is an
   interactive app (it even acquires a `WakelockPlus` while the embedded node runs —
   `node_utils.dart:238`); a Sentinel is expected to be 24/7 infrastructure. Nothing blocks
   it, but "Sentinel-from-inside-Syrius" implies a productization shift (run-headless /
   stay-alive) the spec does not address.

So: **feasible as an extension, mostly off-chain for the MVP (consistent with the claim),
but the "just build the UI per spec" framing understates the libznn/go-zenon-side work to
expose the node and the lifecycle change to keep it serving.**

---

## 2. The foundation that genuinely exists (claim's strong half)

| Capability | Evidence (`file:line`) | Status |
| ---------- | ---------------------- | ------ |
| **Runs a full node in-process** (go-zenon as `libznn`, FFI) | `embedded_node.dart:50-56` (lib load), `:82-84` (`RunNode` symbol), `node_utils.dart:243` (`Isolate.spawn(EmbeddedNode.runNode, [''])`) | **Confirmed** — Syrius *is* a node host |
| **That node already serves WS RPC, reachable at localhost** | `node_utils.dart:235` connects to `kLocalhostDefaultNodeUrl` immediately after start; `constants.dart:123-124` = `ws://127.0.0.1:35998` | **Confirmed** that an RPC server is running and Syrius reaches it at `127.0.0.1`. The server's actual *bind interface* is **not** proven by `syrius/` (see §6) — "localhost-only" is an inference, not established. |
| **Sentinel staking lifecycle UI** (register/deposit/withdraw/collect/revoke) | `lib/widgets/modular_widgets/sentinel_widgets/*`; SDK `api/embedded/sentinel.dart:17-67` | **Confirmed** |
| **Node management with multiple tiers + switching** | `node_management_screen.dart` (`kEmbeddedNode`, `kLocalhostDefaultNodeUrl`, `kDbNodes`, `kDefaultCommunityNodes`); validator `InputValidators.node` | **Confirmed** |
| **Discovery slot: implemented loader, empty data** | loader `main.dart:180-192` (validates + lists), shuffle `node_management_screen.dart:43`; `assets/community-nodes.json` = `[]` | **Confirmed — ready to populate** |
| **RPC consumer side is node-agnostic** | all calls go through one `zenon!.wsClient` (`node_utils.dart:79-110`); swapping the URL needs zero code change | **Confirmed** |

This is the real basis for "the framework is done." None of it is fabricated by the source
documents.

> **On `file:line` paths:** references under `lib/...` are in the `syrius/` submodule;
> references under `api/embedded/...` or `model/embedded/...` are in the pinned
> `znn_sdk_dart` SDK (**not** vendored in `syrius/`) — verify those via `syrius/pubspec.lock`
> and your local pub cache.

---

## 3. What is actually missing (the build, honestly scoped)

Ordered by where the work lives. Items 1–2 are the load-bearing, under-stated ones.

| # | Gap | Where the work lives | Evidence | Protocol change? |
| - | --- | -------------------- | -------- | ---------------- |
| 1 | **Expose the embedded node's RPC publicly** (bind `0.0.0.0`, enable `wss`/TLS, configurable port). Today Syrius cannot configure the node at all. | **`libznn` / go-zenon** + new FFI args or a config-file path Syrius writes | FFI is arg-less `RunNode()/StopNode()` (`embedded_node.dart:15-21`); no `config.json` written by Syrius (only logs use `znnDefaultCacheDirectory`, `main.dart:56`) | No |
| 2 | **Always-on lifecycle** — keep the node serving when the window is closed / headless. | **Syrius app architecture** (and OS packaging) | desktop GUI app; `WakelockPlus` held only while running (`node_utils.dart:238`) | No |
| 3 | **Health probing + ranking** of candidate Sentinel endpoints before offering them. | Syrius Dart | `_loadDefaultCommunityNodes` only format-validates (`main.dart:180`); `establishConnectionToNode`/`getNodeChainIdentifier` exist (`node_utils.dart:20,28`) but are used only for the active node (`:92,236`), never as a pre-filter | No |
| 4 | **A discovery source** for Sentinel endpoints (the JSON is static and empty). | Syrius Dart + community/hosting | `assets/community-nodes.json` = `[]`; no fetch-from-anywhere path | No (off-chain MVP) / **Yes** for trustless on-chain (see #5) |
| 5 | **Trustless, on-chain Sentinel→endpoint mapping.** `SentinelInfo` stores only `owner`, `registrationTimestamp`, `isRevocable`, `revokeCooldown`, `active`; `register()` encodes `('Register', [])` with no endpoint. | **Protocol / spork** (go-zenon + SDK) | SDK `model/embedded/sentinel.dart`; `api/embedded/sentinel.dart:51-56` | **Yes** |
| 6 | **RPC failover** across multiple Sentinels. | Syrius Dart | single `wsClient`, no retry-with-next | No |

The claim is right that the **MVP needs no protocol change** — every item except #5 is
off-chain, and the Specification explicitly scopes #5 to a "future" phase. The claim
under-weights items **#1 and #2**, which are not Syrius-UI work and not addressed by the
spec's UI-and-discovery focus.

---

## 4. Notes / corrections to the source documents

- **the Specification assumes a separately-operated public `znnd`** ("a registered
  Sentinel operator that also runs a public full node", §4), with Syrius merely *consuming*
  it. The reframed claim — *run the Sentinel node from inside Syrius* — is actually a
  **stronger** and different architecture than the spec describes, and the embedded-node
  evidence (§2) supports it. But the spec therefore does **not** cover the work to expose
  Syrius's own embedded node (§3 #1–#2); building "from inside Syrius" is not just
  "implement the spec." `[INF]`
- **The "abandoned Sentinel wiring in Peers" remains a weak clue.** the forensic appendix below
  calls the `SentinelsListBloc?` param in `peers.dart:51` "the strongest single clue" of
  in-progress work. It is **declared but unused**, the same optional param is copy-pasted
  into `latest_transactions_transfer_widget.dart:61` and `notifications_tab_child.dart:139`,
  and neither table typedef even declares it (`custom_table.dart:13`,
  `infinite_scroll_table.dart:16` both `Function(T,bool)`; nothing passes `model:`). Treat
  it as vestigial cruft, not evidence the framework is "nearly wired." `[INF]`
- **`SentinelInfo`-has-owner-only is accurate** (the reports got this right) and is the
  reason #5 is a protocol-level item. `[INF]`

---

## 5. Build roadmap (per the reframed claim)

**Phase A — Prove "Sentinel from inside Syrius" (the new, load-bearing work):**

1. Extend `libznn` FFI (or add a Syrius-written go-zenon `config.json`) so the embedded
   node can bind publicly and enable `wss`/TLS on a chosen port — turning the
   already-running localhost RPC into a public endpoint. *(libznn/go-zenon, no consensus
   change.)*
2. Add a "serve publicly / run as Sentinel" mode in Syrius that keeps the node alive
   (headless / tray / stay-awake) and surfaces sync + reachability status. *(Syrius app.)*

**Phase B — Discovery & quality (per the Specification §5–8, off-chain):**

3. Signed off-chain service records (owner signs `{owner, endpoint, capabilities}`) to tie
   an endpoint to a Sentinel owner address without protocol change.
4. Populate the discovery slot from those records; reuse the existing
   loader/validator/shuffle.
5. Health probing + scoring in `_loadDefaultCommunityNodes` (reuse
   `establishConnectionToNode` + `getNodeChainIdentifier` + frontier freshness + peer
   count), plus RPC failover in `NodeUtils`.

**Phase C — Trustless (requires spork, per spec §9 "future"):**

6. Add an endpoint field to on-chain Sentinel registration / `SentinelInfo`, then
   service-based reward scoring.

---

## 6. Open questions

- **go-zenon default RPC bind / config.** Whether `libznn`'s baked-in config already exposes
  a public-capable RPC server (and on what interface) is **not determinable from `syrius/`
  alone** — `go-zenon` is not in this repo. This decides how much of §3 #1 is new code vs
  configuration. `[OPEN]`
- **go-zenon Sentinel reward logic** (the Specification §2.1: "uptime only checks
  registration duration"). Not verifiable here; needs a go-zenon pass. `[OPEN]`
- **Protocol intent.** Whether Sentinels were *designed* as service/relay nodes is itself
  unsettled across Zenon's whitepaper / lightpaper / greenpaper (see
  [Purpose & Architecture](../understanding/purpose-and-architecture.md)). The "service node" reading is the
  greenpaper's; plausible but `[DOC]`-contested. `[OPEN]`

---

## 7. Bottom line

The reframed claim holds up. Syrius already **runs a full node in-process and serves RPC
from it**, plus it has the staking UI, node management, and a ready (empty) discovery slot —
so "the framework to host a Sentinel from inside Syrius is present" is accurate, and the MVP
to finish it needs **no consensus change**, matching the claim. The two things to set
expectations on: making that embedded node serve *publicly* is **libznn/go-zenon work the
spec does not cover**, and running a 24/7 public node inside a desktop GUI is a real
lifecycle change. Build `libznn` exposure + an always-on mode first; the spec's
discovery/health/UI work sits cleanly on top.


---

## Appendix — Raw forensic Q&A

_This is the detailed question-by-question pass the verdict above is built on, preserved for traceability._

### What Was Examined

Full source clone: `zenon-network/syrius` — Flutter desktop wallet, ~500 files, Dart/FFI
codebase.

---

### Q1: Does Syrius contain Sentinel UI, API calls, labels, or routes?

Yes — full confirmed stack:

| Layer   | Evidence |
| ------- | -------- |
| Assets  | `ic_anim_sentinel.json`, `ic_sentinels_dashboard.svg` |
| Tab     | `Tabs.sentinels`, `SentinelsTabChild` — active, not disabled |
| Blocs   | `sentinel_register_bloc`, `sentinel_deposit_qsr_bloc`, `sentinel_withdraw_qsr_bloc`, `sentinel_qsr_info_bloc`, `sentinel_rewards_history_bloc`, `sentinel_uncollected_rewards_bloc`, `disassemble_button_bloc`, `get_sentinel_by_owner_bloc` |
| Widgets | `CreateSentinel`, `SentinelStepperContainer`, `SentinelListWidget`, `SentinelRewards`, `SentinelCollect` |
| RPC     | `embedded.sentinel.register()`, `.revoke()`, `.depositQsr()`, `.withdrawQsr()`, `.collectReward()`, `.getAllActive()`, `.getByOwner()`, `.getUncollectedReward()`, `.getFrontierRewardByPage()`, `.getDepositedQsr()` |

The full Sentinel lifecycle is wired: deploy → deposit QSR → lock ZNN → register → collect
rewards → disassemble.

---

### Q2: Does Syrius assume local embedded or remote node?

Both, with embedded as default.

```dart
const String kEmbeddedNode = 'Embedded Node';
const String kLocalhostDefaultNodeUrl = 'ws://127.0.0.1:35998';
const int kDefaultPort = 35998;
```

The embedded node is `libznn` loaded via FFI (`.so`/`.dylib`/`.dll`). It runs in an
Isolate, starts on `ws://127.0.0.1:35998`. `NodeManagementScreen` explicitly says: "By
default Syrius connects to its own built-in full node, the Embedded Node. It may take up to
24 hours to sync."

All RPC traffic is WebSocket-only: `ws://` or `wss://`. No HTTP endpoints anywhere in the
codebase.

---

### Q3 & Q4: Where is node selection handled? Does it support switching?

Yes, fully implemented with three tiers.

`node_management.dart` / `node_management_screen.dart` manage:

1. `kEmbeddedNode` — starts `libznn` via Isolate, connects to `127.0.0.1:35998`
2. `kLocalhostDefaultNodeUrl` — for users running their own external go-zenon
3. `kDbNodes` — user-added custom nodes (persisted in Hive)
4. `kDefaultCommunityNodes` — loaded from `assets/community-nodes.json` (currently `[]`)

Node URL validator:

```
^(wss?://)([0-9]{1,3}(?:.[0-9]{1,3}){3}|[^/]+):([0-9]{1,5})$
```

— accepts IP or hostname with port, ws/wss.

Chain ID mismatch checking is implemented with a warning dialog.

---

### Q5: Any code suggesting future peer discovery or Sentinel endpoint discovery?

Dormant infrastructure exists, not yet wired to Sentinel:

- **`PeersWidget` + `PeersBloc`:** Calls `zenon!.stats.networkInfo()` to display connected
  peers (IP + public key) — this is live in the Settings tab. This is the raw P2P peer
  table of whatever node Syrius is connected to.
- **`community-nodes.json` is an empty array `[]`.** The loading code
  (`_loadDefaultCommunityNodes`) is fully implemented, filters by validator, shuffles on
  startup. The slot exists and is ready — it just has no entries. This is the natural
  injection point for Sentinel-served RPC endpoints.
- **`kDefaultCommunityNodes.shuffle()`** — shuffling implies a pool meant for random
  selection, classic load distribution over a service tier.

No DNS seeding, no bootstrap peer list, no libp2p discovery. Discovery is currently purely
manual (user-entered or JSON asset list).

---

### Q6: Does Syrius consume RPC endpoints that could be served by Sentinels?

Yes — every single RPC call Syrius makes could be served by a Sentinel acting as a public
RPC node. The full call inventory:

- `ledger.*` — frontier momentum, account blocks, account info, unreceived txs
- `embedded.sentinel.*` / `embedded.pillar.*` / `embedded.plasma.*` / `embedded.stake.*` /
  `embedded.token.*` / `embedded.htlc.*` / `embedded.accelerator.*`
- `stats.syncInfo()` / `stats.networkInfo()` / `stats.processInfo()` / `stats.osInfo()`
- `subscribe.toMomentums()` / `subscribe.toAllAccountBlocks()` — live WebSocket
  subscriptions

All of these go through `zenon!.wsClient` — a single WebSocket connection to whatever node
URL is active. Swapping the node URL to a Sentinel-hosted endpoint requires zero code
changes.

---

### Q7: Does it expose Sentinel registration/revoke/collect flows?

Yes, all four:

- **Register:** `SentinelStepperContainer` — 4-step wizard (plasma check → QSR deposit →
  ZNN lock → register)
- **Revoke/Disassemble:** `SentinelListWidget` — `DisassembleButtonBloc` calls
  `embedded.sentinel.revoke()`
- **Collect rewards:** `SentinelCollect` widget + `SentinelUncollectedRewardsBloc`
- **Withdraw QSR:** `SentinelsWithdrawQsrBloc`

**Critical observation:** After successful Sentinel deployment, Syrius displays: "Use
znn-controller to check the Sentinel status" — pointing to `kZnnController` (GitHub
releases URL). This is an explicit hand-off: Syrius does registration UX, then externally
delegates the operational management. Syrius treats the Sentinel as a protocol staking
entity, not a service node it manages.

---

### Q8: TODOs, disabled widgets, dead code, feature flags?

Confirmed dormant items:

1. `Tabs.generation` and `Tabs.sync` are in `kDisabledTabs` — they appear in the tab
   controller (with icons) but any click bounces back to the previous tab. These are
   placeholder slots for future features. `Tabs.generation` has a plasma generation
   animation ready. `Tabs.sync` has a full sync progress icon widget.
2. `community-nodes.json` is empty `[]` — the infrastructure to populate and use it is
   complete. This is a deliberate empty slot.
3. `kLocalIpAddress` global variable is declared in `global.dart`. *(Correction: in the
   pinned Syrius it **is** assigned at `main.dart:255` and displayed in
   `about_card.dart:134`; the original "never assigned or used" claim is outdated.)*
4. `// wallet!.registerEventEmitter(chainId: getChainId(), event: 'chainIdChange');` —
   commented out event emitters in WalletConnect service.
5. `// _wcClient!.onAuthRequest.subscribe(_onAuthRequest);` — auth request handler stubbed
   out in WalletConnect service.
6. `SentinelsListBloc?` model parameter in `peers.dart` `generateRowCells` — a
   `SentinelsListBloc` is typed into the peers widget row generator but never actually
   used. This is a concrete code artifact: someone started wiring Sentinel data into the
   Peers table and stopped.

---

### Q9: How would Sentinel-as-public-service-layer fit naturally into Syrius?

The architecture is already shaped for it. The insertion points are:

1. **`community-nodes.json`** → populate with WebSocket URLs of Sentinel-operated public
   RPC nodes. Syrius already shuffles them, validates them, and presents them as selectable
   node tiles. Sentinels serve `ws://` on port 35998 → listed here → users connect.
2. **`PeersWidget`** → currently shows raw P2P peers of the connected node. Could be
   extended to show Sentinel peers specifically (filtered by on-chain Sentinel registry via
   `embedded.sentinel.getAllActive()`).
3. **`NodeManagement._getNodeTiles()`** → shows `kDefaultNodes` + `kDefaultCommunityNodes`
   + `kDbNodes`. A fourth tier — `kSentinelNodes` — fetched live from
   `embedded.sentinel.getAllActive()` and mapped to their IP/RPC endpoints — fits trivially
   here.
4. **The `Tabs.sync` disabled tab** → natural home for a "Network Health" view showing
   Sentinel uptime, which ones are serving RPC, latency stats.
5. **`znn_info` in WalletConnect** returns `kCurrentNode` URL to dApps. If that URL is a
   Sentinel, dApps transparently use Sentinel infrastructure.

---

### Q10: What is missing to make Sentinel-as-RPC-layer work?

| Missing Piece | Gap | Effort |
| ------------- | --- | ------ |
| **Sentinel IP → RPC URL mapping** | On-chain `SentinelInfo` contains `owner` address only. No IP, no RPC endpoint. The chain doesn't store service endpoints. | Protocol-level: needs Sentinel registration to include RPC URL or a separate discovery mechanism |
| **Sentinel liveness/quality check** | No code to probe candidate Sentinel nodes before offering them. `establishConnectionToNode()` exists but isn't called as a pre-filter for community nodes. | Medium: extend `_loadDefaultCommunityNodes` to probe and filter |
| **Automatic Sentinel discovery** | `community-nodes.json` is static. No code to fetch a live list from chain or any oracle. | Medium: add a fetch-from-chain path in `_loadDefaultCommunityNodes` |
| **Sentinel service verification** | No way for Syrius to verify a node is actually a registered Sentinel before trusting it. | Would require chain lookup cross-referenced with IP — architectural gap |
| **RPC failover** | Syrius holds one active `wsClient`. No connection pooling, no automatic failover if a Sentinel drops. | Medium: `NodeUtils` would need retry-with-next-node logic |
| ~~**`kLocalIpAddress` is dead**~~ | *Correction: not dead. In the pinned Syrius it is assigned at `main.dart:255` and displayed in `about_card.dart:134` — disregard this row.* | n/a |
| **Sentinel-specific RPC scope** | Sentinels theoretically could offer a subset of endpoints (read-only, no mempool). Syrius doesn't distinguish endpoint capabilities. | Low urgency initially |

---

### Best Reconstruction of Intended Architecture

The evidence converges on this design:

```
Sentinel Node (go-zenon + libznn)
    ↓ exposes ws://[ip]:35998 (same port as embedded node)
    ↓ registered on-chain via embedded.sentinel.register()
    ↓ URL published via community-nodes.json or future discovery

Syrius:
    NodeManagement ─────────────────────→ selects Sentinel WS endpoint
    zenon!.wsClient ────────────────────→ connects to Sentinel
    all embedded.* / ledger.* calls ───→ routed to Sentinel RPC
    PeersWidget ────────────────────────→ shows Sentinel's peers
    SentinelsTab ───────────────────────→ manages staking identity
    community-nodes.json ───────────────→ [EMPTY SLOT] Sentinel URLs go here
```

Syrius treats Sentinels in two completely separate contexts that were never connected:

1. **Staking entity** — full deploy/reward/disassemble UI wired and live
2. **Service node** — implicit, infrastructurally ready, but the bridge (Sentinel IP → RPC
   URL → node list) was never built

The `SentinelsListBloc?` model parameter in the Peers widget was originally read as the
strongest single clue that someone was actively merging these two contexts before the work
stopped.

> **Correction (supersedes the paragraph above):** re-verification shows this parameter is
> **unused dead code** — the closure body ignores it (`peers.dart:51`), the same optional
> param is copy-pasted into two unrelated tables, and neither table typedef even declares it
> (`custom_table.dart:13`, `infinite_scroll_table.dart:16`). It is **not** evidence of
> in-progress Sentinel wiring. See §4.1.

---

### Files to Inspect Next

- `lib/blocs/sentinels/sentinel_list_bloc.dart` — does `SentinelInfo` from SDK include any
  network address?
- `lib/utils/init_utils.dart` — what else runs at startup?
- `lib/widgets/reusable_widgets/settings_node.dart` — node tile rendering, any special
  treatment?
- `pubspec.yaml` — SDK version pinned, any network/discovery libs?
- `assets/community-nodes.json` — watch this file in future commits; populating it is the
  activation trigger
