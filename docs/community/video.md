---
sidebar_position: 2
sidebar_label: Upgrade Preview Video
---

# Upgrade Preview video

A community "Upgrade Preview" video that points at the Sentinel → Syrius connection this
documentation set investigates. The video opens by asking *"What is a Sentinel doing
here?"* and answers by referencing Syrius.

<div class="video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:960px;margin:1rem 0;border-radius:8px;">
  <iframe
    src="https://www.youtube-nocookie.com/embed/ZdD9mgk4iqs"
    title="Zenon Sentinel Upgrade Preview"
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowfullscreen></iframe>
</div>

> Watch on YouTube: <https://www.youtube.com/watch?v=ZdD9mgk4iqs>

:::note Status of this material
This is **community / motivational** material, not technical evidence. The investigation
deliberately down-weights it: the actual case for "the framework is already in Syrius" rests
on code (see [Investigation & Evidence](../evidence/investigation.md)), not on the video.
What the video *is* useful for is a memorable mnemonic for the qualities a Sentinel service
node should be measured on — and those map cleanly onto the spec's health metrics.
:::

## The mnemonic, mapped to the spec

The video frames five Sentinel qualities. Each corresponds to a concrete, measurable
dimension already in the [Specification](../specification/sentinel-service-layer.md):

| Video term | Meaning | Where it lives in the spec |
| ---------- | ------- | -------------------------- |
| **SIZE**  | storage / history served | Proof/data serving — Spec §10 (serve momentums, account blocks, state/frontier proofs, history) |
| **SPEED** | latency / sync speed | Sync freshness + latency — Spec §7.3 / §8 scoring |
| **POWER** | capacity / uptime | Always-on lifecycle + uptime — Spec §4.3; future reward weight Spec §9 |
| **BUMP**  | peer propagation / relay | Peer health + the relay role — Spec §7.4 / §1 |
| **SLIDE** | failover / routing / smooth switching | RPC failover across ranked nodes — Spec §6 step 8 / Roadmap B.4 |

In other words, the video's five-word mnemonic is a friendly restatement of the
**gate-and-score health model** the spec already defines (§7–§8) plus **failover** (§6 /
Roadmap B.4). It's a nice way to remember what "a good Sentinel" means; the spec is where
the actual thresholds and weights live.

## A fitting lyric

The video lands on a line that doubles as a neat summary of this whole investigation:

> *"You are the key, the answer to my dreams and I can't believe you're right in front of me."*

The verification-first reading (Spec §10: *don't trust the server — you hold the key, you
verify*) and the thesis of this whole repo (the Sentinel framework was *already right in
front of us*, sitting unfinished inside Syrius) are both in that line. Motivational, not
evidence — but a good mnemonic for why this is worth finishing. Full transcript below.

## Transcript

```text
[Music]
I'm done with me
You can take it slow, or pedal to the floor
Anywhere you want to be
You are the key
The place I want to be
I think that my need is right in front of me
You are the key — Answer to my dreams
And I can't believe you're in front of me
You are the key — All the place I want to be

(chorus repeats: "You are the key / Answer to my dreams /
 And I can't believe you're in front of me")
```

*Transcribed from the [video](https://www.youtube.com/watch?v=ZdD9mgk4iqs); lyrics are the
artist's. Reproduced here as community context, not technical evidence.*
