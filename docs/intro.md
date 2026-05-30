---
sidebar_position: 1
slug: /
sidebar_label: Overview
title: Sentinels in Syrius
---

# Sentinels in Syrius

> **The thesis in one line:** Syrius already runs a full Zenon node *inside the wallet* and
> serves RPC from it — so the framework to run a **Sentinel service node from inside Syrius**
> is already in the codebase. Finishing it is a buildable extension, and the MVP needs **no
> consensus change.**

This site is a curated, evidence-backed documentation set for **implementing the Sentinel
service node inside the Syrius wallet**. It is written to be read by both human contributors
and AI coding agents: claims about Syrius carry `file:line` receipts, and provenance is
tagged throughout (`[DOC]` documented · `[INF]` inferred · `[OPEN]` unresolved).

## Start here

| If you want to… | Read |
| --------------- | ---- |
| Understand what a Sentinel *is* (and why the docs conflict) | [Understanding Sentinels](./understanding/purpose-and-architecture.md) |
| See the proof that the framework is already in Syrius | [Investigation & Evidence](./evidence/investigation.md) |
| Build it — the design contract | [Specification](./specification/sentinel-service-layer.md) |
| Build it — the task-by-task plan | [Build Roadmap](./implementation/roadmap.md) |
| Drive an AI agent to implement it | [AI Agent Guide](./implementation/agent-guide.md) |
| Read the community pitch | [Forum Post](./community/forum-post.md) |

## The shape of the argument

1. **What Sentinels were meant to be** is genuinely unsettled — Zenon's whitepaper,
   lightpaper, and greenpaper describe them three conflicting ways. We adopt the greenpaper's
   "public light-client relay / service edge" reading because it is the only one buildable
   today without a protocol change. (See [Understanding](./understanding/purpose-and-architecture.md).)
2. **Syrius already has the machinery** — it runs a full `libznn` node in-process, serves WS
   RPC, ships the Sentinel staking UI, has node management, and an implemented-but-empty
   discovery slot. (See the [Investigation](./evidence/investigation.md), with receipts.)
3. **The honest gaps** are: the embedded node isn't configurable from Syrius yet (that work
   lives in `libznn`/go-zenon), and a desktop GUI needs an always-on mode. Neither needs a
   consensus change.
4. **The build** is scoped into off-chain phases (A–B) and a future on-chain phase (C) in the
   [Roadmap](./implementation/roadmap.md).

## Source code

The Syrius source is included as a git submodule at `syrius/` (pinned at
`v0.1.0-alphanet-8`). All `file:line` references in these docs point into it. The SDK is
`znn_sdk_dart v0.0.7`. **Always re-verify a reference against the current source before
acting on it.**
