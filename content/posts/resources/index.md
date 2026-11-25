---
title: 'How I stay up to date with AI'
date: 2025-12-07
draft: false
description: "spoiler: I can't."
ShareButtons: ['linkedin', 'x']
tags: ["AI", "Large Language Models", "Benchmarks"]
author: 'Andrea Gemelli'
ShowReadingTime: true
ShowToc: true
---

*Updated November 2026: new sources added, a couple of claims refreshed.*

## Introduction

If you work in AI, in industry or research, you have noticed how hard it has become to keep pace. From DeepSeek-R1 [^1] to the Hierarchical Reasoning Model [^2], from AGI promises to the limits of language [^3], and from chatbots to *agentic workflows*, there is more every week than anyone can read.

For a while I tried anyway, until I accepted the obvious: **it is impossible** 🤒.

So this is not another to-do list nobody finishes. It is the short list of habits and sources that actually stuck, written down so I remember what I read this year, and in case something here is new to you.

## First principles

Three habits do most of the work 🎯:

- **One newsletter.** [AI News](https://news.smol.ai/) summarises the day across X, Discord and Reddit, and on quiet days it says "not much happened today", which saves me the digging. I unsubscribed from most of the others once I noticed I was piling up unread emails instead of learning anything [^4].

- **People and events.** I follow DevRels and engineers from Mistral, HuggingFace, vLLM, Docling and others on LinkedIn and X, mostly to find **meetups and hackathons**. In Paris, Luma is great for this; it is how I found the hackathon we won last May [^5]. Talking to people building things is still the best source I have, and it's fun 🎉

- **Papers, filtered.** I kept the PhD habit of skimming titles, but I no longer go conference by conference: I use [Papers with Code](https://paperswithcode.co/) to filter by the topics I care about, ask an LLM to cross-reference what I find, and read its newsletter.

More sources than this and I end up retaining less, not more. Still, a list was promised, so here it is.

## My 2025 AI tech-list

A curated, non-exhaustive list of resources I have used and found valuable, from foundations to practical skills.

### Books 📚

**Sebastian Raschka - [Build a Large Language Model (from scratch)](https://www.amazon.fr/Build-Large-Language-Model-Scratch/dp/1633437167)**: data, architecture and training, all implemented step by step. Easier if you already write Python daily and have trained a model at least once. His [newsletter](https://magazine.sebastianraschka.com/) is one of the few I still read in full.

**Maxime Labonne & Paul Iusztin - [LLM Engineer's Handbook](https://www.packtpub.com/en-us/product/llm-engineers-handbook-9781836200079)**: the engineering side Raschka's book leaves out: data pipelines, fine-tuning, evaluation, RAG and deployment as one end-to-end project. Maxime's [LLM course](https://github.com/mlabonne/llm-course) on GitHub is a great free companion.

**HuggingFace - [The Ultra-Scale Playbook](https://www.lulu.com/shop/nouamane-tazi-and-ferdinand-mom-and-haojun-zhao-and-phuc-nguyen/the-ultra-scale-playbook/paperback/product-45yk9dj.html?page=1&pageSize=4)**: training LLMs on *GPU clusters*. It started as a HuggingFace blog post and goes deep into the hardware and parallelism details you hit when scaling.

### GitHub repos 💻

**[nanochat](https://github.com/karpathy/nanochat)**: Karpathy's end-to-end ChatGPT clone, from tokenizer to web UI, in a codebase small enough to read. Probably the best free course out there, and the natural exercise after the books above. His [YouTube videos](https://www.youtube.com/watch?v=7xTGNNLPyMI) are the perfect companion.

**[HuggingFace smolagents](https://github.com/huggingface/smolagents)**: 2025 was the year of *agents*. Whether or not you use them at work, you should know how an agent differs from an LLM (*Thought, Action, Observation*), how to write *tools*, and what MCP is. The library keeps agents simple, integrates with the common frameworks, and comes with a [course](https://huggingface.co/docs/smolagents/conceptual_guides/intro_agents) covering the theory.

### Blog posts 📝

**Anthropic, [Tracing Thoughts in Language Models](https://www.anthropic.com/research/tracing-thoughts-language-model)**: interpretability is one of the hardest open problems, and knowing why a model produced an output matters a lot in medicine or science. This post opens up Claude's internals in a way that is readable without a background in the field.

**Thinking Machines** ([thinkingmachines.ai](https://thinkingmachines.ai/)): Mira Murati's lab [^6] publishes long technical posts on concrete LLM problems. The first, [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/), explains why *temperature 0* is not enough to get the same answer twice 🙏

**FineWeb dataset** ([HuggingFace blog post](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1)): we talk about architectures and optimisers, rarely about *data*. This post shows how much work goes into collecting and filtering a web-scale dataset, and how the data mix shapes the model. The [SmolLM3 post](https://huggingface.co/blog/smollm3#690adeb3dec96ebcb525bf13) shows the same idea in practice, with training stages built around different mixes.

### YouTube 🎥

**[Fireship](https://www.youtube.com/@Fireship)**: I watch every video. Short, funny, and the fastest way to know what shipped this week and whether it matters.

**[3Blue1Brown](https://www.youtube.com/@3blue1brown)**: the [neural networks series](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi), including the chapters on transformers and attention, is the best visual intuition for how these models work.

**Yannic Kilcher**: technical paper reviews, clear explanations, and strong opinions that more than once made me rethink mine. See his take on [why AGI will never happen](https://www.youtube.com/watch?v=hkAH7-u7t5k) and his [ViT paper explanation](https://www.youtube.com/watch?v=TrdevFK_am4), which nails the difference between *Transformers* and *CNNs/RNNs*.

**Pre-Training GPT-4.5 - [OpenAI video](https://www.youtube.com/watch?v=6nJZopACRuQ)**: the problems they hit at scale, the role of *data*, and the limits of pre-training.

### People to follow 👥

Besides the names above, two accounts I always read on LinkedIn and X:

- **[Niels Rogge](https://x.com/NielsRogge)** (HuggingFace): new models and papers, often with a notebook to try them the same day.
- **[Maxime Labonne](https://x.com/maximelabonne)** (Liquid AI): fine-tuning, model merging and small models, explained hands-on.

## Conclusions

Keeping up with AI is impossible, and that's fine.

What works for me is being **selective**: a few trusted sources, quality over quantity, and above all **building things** 🛠️. The resources here did more than keep me informed; they are the ones I actually learned from and applied.

## References

[^1]: DeepSeek, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", arXiv:2501.12948, 2025
[^2]: Sapient Intelligence, "Hierarchical Reasoning Model", arXiv:2506.21734, 2025
[^3]: Jones, A., "What does Yann LeCun think about AGI?", [LessWrong blog post](https://www.lesswrong.com/posts/jKCDgjBXoTzfzeM4r/what-does-yann-lecun-think-about-agi-a-summary-of-his-talk), April 2025
[^4]: Karpathy, A., [Endorsement of AI News newsletter](https://x.com/karpathy/status/1857126049357914266), 2024
[^5]: Gemelli, A., "[OpenAPI vs MCP](https://www.andreagemelli.me/posts/mcp/)", 2025
[^6]: CNBC, "[OpenAI's Mira Murati launches Thinking Machines Lab](https://www.cnbc.com/2025/07/15/openai-mira-murati-thinking-machines-lab.html)", July 2025
