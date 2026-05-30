---
sidebar_position: 2
sidebar_label: AI Agent Guide
title: AI Agent Guide
---

# AI Agent Guide — building the Sentinel service node in Syrius

This page tells an AI coding agent (Claude Code or similar) **how to use this documentation
set to implement** the "Sentinel service node inside Syrius" work. Read it first, then work
from the [Specification](../specification/sentinel-service-layer.md) and the
[Roadmap](./roadmap.md).

## What you are building

A **Sentinel service node that can run from inside the Syrius wallet** — turning Syrius's
already-embedded full node into a public, discoverable RPC/data-service endpoint, plus the
discovery/health layer that lets other Syrius instances find and use Sentinel endpoints. The
MVP requires **no consensus/protocol change**. See the
[Investigation](../evidence/investigation.md) for why this is feasible and where the real
work is.

## Source-of-truth hierarchy

When documents disagree, trust in this order:

1. **The `syrius/` source code** (and the pinned `znn_sdk_dart` SDK). Code is ground truth.
2. **The [Specification](../specification/sentinel-service-layer.md)** — the design contract.
3. **The [Investigation](../evidence/investigation.md)** — verified facts + constraints,
   with `file:line` receipts.
4. Everything else (the [Forum Post](../community/forum-post.md), narrative) is context, not
   contract.

## Non-negotiable rules

- **Verify before you build.** Every `file:line` reference in these docs was true at SDK
  `v0.0.7` / Syrius submodule `v0.2.4-alphanet`. Re-open the file and confirm before you
  edit — the submodule may have moved. If a reference is stale, fix the doc.
- **Respect the MVP boundary.** Do not introduce a consensus/protocol change for anything
  scoped as off-chain (Roadmap Phases A–B). The only protocol work is Phase C, and it needs
  governance, not a PR.
- **Mind the real blocker.** The embedded node's FFI is `RunNode()`/`StopNode()` with **no
  arguments** (`embedded_node.dart:15-21`). Making it serve publicly is **`libznn`/go-zenon
  work**, not Syrius-Dart-only. Do not claim Phase A is done by editing Dart alone.
- **Security first for public serving.** A public RPC server runs in the same app that holds
  keys. Read-scope the public endpoint; default it off; require explicit opt-in. See
  Specification §9.
- **Carry the provenance tags.** `[DOC]` / `[INF]` / `[OPEN]` mean documented / inferred /
  unresolved. Don't upgrade an `[INF]` or `[OPEN]` to fact without evidence.

## How to start a work session

1. Read this guide, the Specification, and the Roadmap.
2. Pick the lowest-numbered unfinished Roadmap task whose dependencies are met.
3. Re-verify the `file:line` anchors that task touches against the current `syrius/` tree.
4. Implement against the spec's acceptance criteria; keep changes minimal and idiomatic to
   the surrounding Flutter/Dart code.
5. If you discover the docs are wrong, update them in the same change — the docs are a
   product, not a throwaway.

## Open questions to resolve early

These block accurate scoping and are flagged throughout the docs (`[OPEN]`):

- Does `libznn`'s baked-in go-zenon config already expose a public-capable RPC server, or is
  binding `0.0.0.0` + TLS entirely new code? (Decides the size of Phase A. Needs the
  go-zenon source, which is **not** in this repo.)
- Is the go-zenon Sentinel reward really "registered-duration only"? (Specification §2.1,
  UNVERIFIED here.)
- Can a Sentinel `owner` address verify a service-record signature directly, or must a
  `publicKey` be carried? (Depends on Zenon address/signature semantics.)
