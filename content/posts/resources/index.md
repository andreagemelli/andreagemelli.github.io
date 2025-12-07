---
title: 'How I stay up to date with AI'
date: 2025-12-07
draft: false
description: "spoiler: I don't."
ShareButtons: ['linkedin', 'x']
tags: ["AI", "Large Language Models", "Benchmarks"]
author: 'Andrea Gemelli'
ShowReadingTime: true
ShowToc: true
comments: true
---

## Introduction

If you've been working actively in AI like me, either in industry or research, you've certainly noticed how hard it's become to keep pace with **discoveries and advancements**, especially in the last two years. From DeepSeek-R1 [^1] to the Hierarchical Reasoning Model [^2], from AGI promises to language limits [^3], and from simple chatbots to complex *agentic workflows*, being **up-to-date** has become overwhelming. 

At least this has been my idea so far, until I realized one simple thing: **it is just impossible** 🤒.

That's why I'm writing my own *recipe* here, despite the thousands out there. Not to be another exhaustive to-do list no one will completely fulfill, but: 
- 🧑🏻‍💻 **for me** to remind myself what I've read this year and recap the most important concepts; 
- 👉🏻 **for you** in case you missed something; 
- 💬 **for us** to exchange other resources (and that's sure to be the case)! Leave it in the comments! 

Let's dive in!

## First principles

Before just giving out a fancy list of links, I wanted to share my three "simple" rules that I generally follow to keep up-to-date 🎯:

- **I subscribed to [AI News](https://news.smol.ai/)**: you don't really need anything else. Sections get right to the point, and the "not much happened today" email saves me **useless digging**. There are tons of other newsletters I could mention, but I started unsubscribing progressively once I noticed I was piling up unread emails rather than **learning something new** [^4].

- **I follow DevRels or tech profiles from Mistral, HuggingFace, vLLM, Docling, etc. (on LinkedIn and X)** to find **meetups and hackathons** around me. I'm living in Paris and Luma is amazing for that! This is, for example, how I found the hackathon we won last May [^5]. Getting to know people in the field and participating in **live events** remains one of the **best sources of information**, and it's fun 🎉! 

- **I kept the PhD habit** of skimming titles from the best AI conferences currently happening. If you're not aware of which labs or conferences to look at for your topic of interest, the [trending papers section](https://huggingface.co/papers/trending) on the HuggingFace website is a great *filtered* source. It has often brought **interesting papers** to my attention that I would have never found otherwise.

That's it, really. Too much more information would result in no information at all.
But a list-like thing was promised in the premise, so let's give it a look!

## My 2025 AI tech-list

Below is a curated, non-exhaustive list of resources I’ve explored and found valuable. These span the **most important topics** of the past two years, from *foundational concepts* to *advanced insights* and *practical skills*.

### Books 📚

Theoretical foundations and practical implementation: these two books create the perfect combo for any ML Engineer.

**Sebastian Raschka - [Build a Large Language Model (from scratch)](https://www.amazon.fr/Build-Large-Language-Model-Scratch/dp/1633437167)**: Covers all **theoretical and technical topics** from *data* to *architectures* and *training*. Good for everyone, but easier if you're already using Python daily and you've already trained a model at least once. Sebastian's blog is also amazing: [magazine.sebastianraschka.com](https://magazine.sebastianraschka.com/).

**HuggingFace - [The Ultra-Scale Playbook](https://www.lulu.com/shop/nouamane-tazi-and-ferdinand-mom-and-haojun-zhao-and-phuc-nguyen/the-ultra-scale-playbook/paperback/product-45yk9dj.html?page=1&pageSize=4)**: Training LLMs on *GPU clusters*. Born from a HuggingFace blog post, this addresses the **real world complexity**, going deep on *hardware* and *infrastructure* details for engineers **scaling their solutions**.

### GitHub repos 💻

Hands-on learning through code: the best way to understand theory while building.

**[nanochat](https://github.com/karpathy/nanochat)**: There's no better teacher than Karpathy. Nanochat is the perfect combination of **theory and coding**, and it's most likely the **best free instructional content** out there. Well explained, deep, and unlike toy examples, this lets you build your own ChatGPT-like *end-to-end* with *frontend* and *infrastructure*! **Perfect exercise** after the previous two books 💻. Also check his [video on YouTube](https://www.youtube.com/watch?v=7xTGNNLPyMI), **pure gold material**.

**[HuggingFace smolagents](https://github.com/huggingface/smolagents)**: This has been the year of *Agents*. Whether you're using them at work or not, you need to know why an *agent* differs from an LLM (*Thought, Action, Observation*), how to write *tools*, and what the novel *MCP protocol* is. The library lets you build **simple yet powerful agents**, integrate with the most used third-party frameworks (also for *RAG*), and comes with a course explaining the theory ([docs](https://huggingface.co/docs/smolagents/conceptual_guides/intro_agents)).

### Blog posts 📝

Deep dives into current challenges and cutting-edge research: from interpretability to data.

**Anthropic Blogs**: *LLM interpretability* is one of the most **promising yet difficult challenges** we're facing. These powerful yet mysterious *architectures* are hard to interpret. Tracing why certain inputs generate certain outputs is **crucial** for medical or environmental applications. Anthropic "opened" Claude in a beautiful blog post: [Tracing Thoughts in Language Models](https://www.anthropic.com/research/tracing-thoughts-language-model), followed by a deeper article stressing *transformer architectures* on tasks beyond language.

**Thinking Machines** ([thinkingmachines.ai](https://thinkingmachines.ai/)): Mira Murati's recent project [^6] started with **super interesting blog posts** solving complex LLM problems. The first one, [Defeating Nondeterminism in LLM Inference](https://thinkingmachines.ai/blog/defeating-nondeterminism-in-llm-inference/), tackles *LLM non-determinism*, a problem engineers have tried to solve with *temperature 0* and a lot of praying 🙏.

**FineWeb dataset** ([HuggingFace blog post](https://huggingface.co/spaces/HuggingFaceFW/blogpost-fineweb-v1)): We always focus on *architectures* and *optimization*, but rarely give importance to *data*, especially *open access* for *reproducibility*. The HF blog post transparently presents the **complexity** of collecting, filtering, and using huge datasets, and how *data mix* impacts *model behavior*. See how different *data mixes* trained SmolLM3 in stages ([blog post](https://huggingface.co/blog/smollm3#690adeb3dec96ebcb525bf13)) to enhance grammar, math, coding, reasoning, and coherency.

**Bonus**: Two recent HF guidebooks (which I still need to read) seem promising: [Evaluation Guidebook](https://huggingface.co/spaces/OpenEvals/evaluation-guidebook) and [Smol Training Playbook](https://huggingface.co/spaces/HuggingFaceTB/smol-training-playbook).

### YouTube videos 🎥

Visual explanations and deep discussions on AI's future and current limitations.

**Yannick Kilcher**: Yannick is a smart researcher and engineer who, on top of **technical paper reviews** and **clear explanations** of complex topics, has **strong and valid thoughts** on our world that more than once made me **think critically**. Check out his video on [why AGI will never happen](https://www.youtube.com/watch?v=hkAH7-u7t5k) and the ["An Image is Worth 16x16 Pixels" paper explanation](https://www.youtube.com/watch?v=TrdevFK_am4) where he brilliantly explains the core difference between *Transformers* and older *CNNs/RNNs*.

**Pre-Training GPT-4.5 - [OpenAI video](https://www.youtube.com/watch?v=6nJZopACRuQ)**: Super interesting about **problems solved** with PyTorch, the role of *data*, and limits of *generative-based technology*.

## Conclusions

So, here we are. After all this, what's my take? Keeping up with AI is indeed impossible, and that's okay!

I've learned to be **selective**: focus on **quality over quantity**, follow a few **trusted sources**, and most importantly, **build things** 🛠️. The resources I've shared here have helped me not just **stay informed**, but actually **understand and apply** what I'm learning. 

If you have game-changing resources, share them in the comments! Let's keep this conversation going 🤗

## References

[^1]: DeepSeek, "DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning", arXiv:2501.12948, 2025
[^2]: Sapient Intelligence, "Hierarchical Reasoning Model", arXiv:2506.21734, 2025
[^3]: Jones, A., "What does Yann LeCun think about AGI?", [LessWrong blog post](https://www.lesswrong.com/posts/jKCDgjBXoTzfzeM4r/what-does-yann-lecun-think-about-agi-a-summary-of-his-talk), April 2025
[^4]: Karpathy, A., [Endorsement of AI News newsletter](https://x.com/karpathy/status/1857126049357914266), March 2024
[^5]: Gemelli, A., "[OpenAPI vs MCP ⚔️](https://www.andreagemelli.me/posts/mcp/)", 2025
[^6]: CNBC, "[OpenAI's Mira Murati launches Thinking Machines Lab](https://www.cnbc.com/2025/07/15/openai-mira-murati-thinking-machines-lab.html)", July 2025