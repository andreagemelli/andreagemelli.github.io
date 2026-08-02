---
title: 'I trained my own Vision-Language Model under 1B parameters'
date: 2026-04-14
draft: false
description: "And now I can see two cats on a couch for about $200"
ShareButtons: ['linkedin', 'x']
tags: ["Vision Language Models", "Multimodal", "Small Models", "Open Source"]
author: 'Andrea Gemelli'
ShowReadingTime: true
ShowToc: true
comments: true
---

## Introduction

What is it actually like to build and train your own Vision-Language Model nowadays? 👀

This is the question that motivated me to try it out myself. I took a base language model,
I plugged in a vision backbone and, training for some hours on a rented GPU on runpod, I tried
to get out of it some image descriptions.

Nowadays it is pretty simple to download small, good vision encoders and language
models; what is usually missing is the recipe to glue them together. Some prior work
inspired my journey, of course:

- Hugging Face largely released models and guides to build your own vision language model. [SmolVLM-500M](https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct)[^8] has shown us what it takes to create a fully reproducible, small and competitive vision language model - while [Train Your Own Encoder-Free VLM in $100](https://huggingface.co/spaces/HuggingFaceM4/encoder-free-vlm)[^1] blogpost is a complete single-GPU recipe published end to end, budget included
- [nanoVLM](https://huggingface.co/blog/nanovlm)[^2] — explicitly educational, minimal, and
  clear about the architecture choices - is a library that allows you to choose the pieces and let the framework do the rest
- [LFM2.5-VL-450M](https://www.liquid.ai/blog/lfm2-5-vl-450m)[^13] is an inspirational work for a vision language family of models of their size

This work tries its best to redo something that works, completely "in house", using only open-source references, models and techniques. It is a recipe you can follow and an honest log of everything I got wrong along the way.

Everything is open: [code](https://github.com/andreagemelli/baguettotron-vlm) and
[model weights](https://huggingface.co/collections/andreagemelli/baguettotron-vlm-69de37b4cab1960226e9c1f7) are available on github and huggingface 🤗!

> **AI Assistant Note**: Claude has been used throughout the development, especially for initial brainstorming and project setup, evaluation and wrapping up results. The relevant files and the decisions we made together are in the codebase.

## Motivation: a model I liked that could not see

The idea came from **Baguettotron**[^3] — a text-only model — and, honestly, as much from
the way Pleias presented it as from the model itself. Data, weights, training story, the
reasoning behind the design: all out in the open, all inspectable. That is rarer than it
should be, and it is the kind of release I wanted to build on top of.

Baguettotron is a 321M-parameter Small Reasoning Model, and it is unusual in two ways.
First, its shape: 80 layers at hidden size 576, which makes it, in its authors' words, the
deepest SLM in its size range — the "baguette" the name refers to. Second, and much more
interestingly, its data.

Baguettotron was trained on 200 billion tokens from **SYNTH**[^4], a fully synthetic
generalist dataset seeded from 50,000 vital Wikipedia articles. No scraped web. That
sentence is easy to skim past, so let me put it differently: **you can, in principle,
read this model's entire pretraining corpus.** You can inspect what went in and reason
about what came out. For a field where "trained on a large corpus of internet text" is
the standard disclosure, this is a different category of artifact.

The one thing it could not do was see. So I gave it eyes 👀

Here is what that looks like after the whole pipeline — a real exchange with the
finished model, greedy decoding, running on a laptop:

![Two cats asleep on a pink couch, with two TV remotes](images/cats.jpg)

> **user:** Describe the image.
>
> **assistant:** The image is a picture of two cats sitting on the couch. The cat has its
> head down and legs are raised.

Two cats, a couch, and a posture — from a 628M-parameter model that cost about $200 to
train and answers in about a second on a laptop 🎉 It is not going to write your alt text at
scale, but it is *looking at the picture*, and everything about how it got there is
inspectable.

## Architecture

```
Image (448×448)
  → InternViT-300M-448px-V2.5 (304M, frozen) → 1024 tokens × 1024d
  → Pixel unshuffle (factor=2)                → 256 tokens × 4096d
  → MLP projector (2-layer, ~2.7M)            → 256 tokens × 576d
  → interleave with text tokens
  → Baguettotron (321M, 80 layers, h=576)

Total: ~628M parameters
```

I used a "standard" **ViT–MLP–LLM** paradigm, which is InternVL's formulation[^5]: a frozen
vision encoder, a small randomly-initialised MLP that projects visual features into the
language model's embedding space, and the LLM itself. 

### Encoder and Projector 🔭
I picked **InternViT-300M-448px-V2.5**[^6] over a general-purpose CLIP or SigLIP encoder,
and the deciding factor is a warning its own authors put on the model card: *"In our experience, the InternViT V2.5 series is better suited for building MLLMs than traditional computer vision tasks."*

The encoder turns a 448×448 image into 1024 patch tokens, which is a lot. Feeding 1024
visual tokens into an 80-layer language model for every image is not affordable at this
budget, and it also drowns the text: a short question becomes a rounding error next to a
thousand image tokens. So I compress them before the projector. A **pixel unshuffle**
with factor 2 folds each 2×2 neighbourhood into a single token with 4× the channels, so
1024 tokens × 1024d becomes **256 tokens × 4096d** — no parameters, no learning, just a
reshape that trades spatial resolution for channel depth. The 2-layer MLP then maps
4096 → 576 to match Baguettotron's hidden size.

Nothing original here either: **SmolVLM**[^8] is the closest published model to what I was
building and leans on this compression hard, inheriting it from **Idefics3**[^7], while
**InternVL**[^6] applies it for the same reason, in the words of the people who also built
the encoder — *"we applied a pixel unshuffle operation, reducing the number of visual
tokens to one-quarter of the original"*.

The projector itself is two linear layers and a GELU, about 2.7M parameters, trained from
random init. Everything else is a pretrained component someone else published, which is
the only reason this fits in the budget.

## Training

Three stages, all on one H100 SXM rented from RunPod, ~$200 all in.

| Stage | What trains | Data | Time |
|---|---|---|---|
| 1 — alignment | projector only (~2.7M) | LLaVA-CC3M-Pretrain-595K | ~5h |
| 2 — instruction tuning | projector + LLM (~324M) | The Cauldron + 10% SYNTH | ~60h |
| 3 — reasoning SFT | projector + LLM | R1-Vision-Reasoning-Instructions | ~7h |

### Stage 1 — teaching visual tokens to align with the language model's space

The projector is randomly initialised, so at the start it is feeding the language model
noise. Stage 1 freezes both the ViT and the LLM and trains only those 2.7M parameters on
595K image–caption pairs from LLaVA-CC3M, following the two-stage recipe LLaVA
established[^9].

The point is alignment, not capability. You are teaching one small matrix to emit
vectors that the language model already knows how to read. Five hours, and the LLM's
weights never move.

### Stage 2 — teach the model to answer

Now the projector is unfrozen along with the full language model, and the model sees
**The Cauldron**[^10] — 47 subsets of visual instruction data — mixed with 10% text-only
SYNTH to avoid catastrophic forgetting.

Two decisions here were made:

**Keeping the ViT frozen.** With 324M trainable parameters and 60 hours, spending any of
that budget on the vision encoder would have meant less of everything else. The encoder
was already good; the mapping into my LLM was the bottleneck.

**Pre-filling `</think>`.** Baguettotron natively wants to emit a reasoning trace. The
Cauldron contains no reasoning traces at all. Rather than fight the backbone, every
assistant turn in training begins with a closing `</think>` token — telling the model,
in its own vocabulary, "no thinking this time, just answer". The processor does this
automatically at inference, so the two match.

The pre-filling was the missing piece in my first trial, which made the model not work at all: most likely I diverged too much from the distribution Baguettotron had seen during its own training, a mistake I paid for with a wasted run. Ouch ❤️‍🩹

### Stage 3 — teach the model to think about what it sees

Baguettotron reasons natively, so I wanted to bring back the reasoning part that I had suppressed with The Cauldron, which does not expose any thinking traces. To do so I ran a third step: SFT on ~150K correct-only samples from
R1-Vision-Reasoning-Instructions, which carry DeepSeek-R1-style[^11] `<think>` traces
about images.

Unfortunately, this stage would have needed far more data and training time to actually
align towards that behaviour. As shown in the results below, Stage 3 produced a model
that, *while* reasoning, was hallucinating most — if not all — of the time 😅

## Evaluation and results

For the evaluation I wanted something fast that could assess, qualitatively, whether the
model is at least capable of understanding what the input image depicts. I also tried to
push it a little further with some "complex" questions and reasoning, failing miserably.
Again, it most likely needs more training to achieve something of real quality and usable
beyond bare description, which was out of scope here.

For stages 1 and 2 I simply took some [COCO](https://cocodataset.org)[^14] images and
assessed their quality qualitatively and visually. For stages 2 and 3 put against each
other, I instead took six held-out images from RealWorldQA[^12], four question types and
four decoding presets, judged 1–5 by a vision model (Claude Opus 5).

### Stage 1 vs Stage 2

To assess whether the first two steps were actually working, I took four photos and gave
both checkpoints the same prompt:

| | alignment (stage 1) | vision-vqa (stage 2) |
|---|---|---|
| ![cats](images/cats.jpg) | `a cat is sleeping on the couch` | `The image is a picture of two cats sitting on the couch. The cat has its head down and legs are raised.` |
| ![bear](images/bear.jpg) | `the bear is a good friend.` | `The image shows a bear sitting on the grass.` |
| ![stop sign](images/stop.jpg) | `a sign for a stop` | `A sign that says stop.` |
| ![bus](images/bus.jpg) | `the bus is a red double - decoration` | `The red bus is on the road.` |

*Same images, same prompt, greedy decoding. Verbatim output from both checkpoints.*

Stage 1 falls into shorter and less meaningful descriptions, while Stage 2 is better
formed, with longer and more factual information: "the bus is on the road" without the
useless "decoration" mark, "two cats" instead of one in the first example, "the bear is
sitting on the grass" rather than an unrequested "good friend" 🐻.

That progression is exactly what the two stages are for. Stage 1 only ever trained 2.7M
parameters, so it learns *what* is in the picture and almost nothing about how to finish a
sentence. Stage 2 unfreezes the language model, and grammar comes back with it.

But push Stage 2 past a short answer and it starts inventing:

> **user:** Describe the image in detail.
>
> **assistant:** In this image, two cats are sitting on a **white** couch. They have
> **their ears covered** and the other cat is **wearing a light flashlight**.

The couch is pink, nobody's ears are covered, and the "light flashlight" is a TV remote
lying next to the cats — the model sees that *something* elongated is there, cannot
resolve what, and confabulates an object plus a relationship to go with it. Worth looking
at closely, because it is not random noise: the sentence is grammatical, plausibly
structured, and about the right objects. It is wrong in the details, which is precisely
the kind of wrong that is hardest to catch automatically 🫠

### Stage 2: more "complex" questions

Descriptions are one thing. What happens if we actually ask it something? Here are three
that work and three that do not, which is roughly the hit rate I would expect from it:

| | question | answer | |
|---|---|---|---|
| 🐻 | `What kind of animal is this?` | `Bear.` | ✅ |
| 🛑 | `What does the sign say?` | `STOP.` | ✅ |
| 🚌 | `What is the main object in the image?` | `The main object is a red bus.` | ✅ |
| 🐱 | `Is there a cat in the picture?` | `No.` | ❌ there are two |
| 🛑 | `What color is the sign?` | `Yellow.` | ❌ it is red |
| 🚌 | `What number is the bus route?` | `Yes.` | ❌ |

The good ones are genuinely good. `What kind of animal is this?` → `Bear.` is the model
doing exactly its job, and `What does the sign say?` → `STOP.` surprised me — though I
cannot tell whether it read the letters or recognised an octagonal red shape, and the bus
route number (real OCR, small text) comes back as `Yes.`, which rather suggests the latter.

The bad ones are bad in an interesting way. `Is there a cat in the picture?` answering
`No.` about a photograph of two sleeping cats is not a near miss — and the same question
phrased as `What kind of animal is this?`, which works perfectly on the bear, also returns
`Yes.` on the cats. So it is not that the model cannot see cats; it is that the answer it
produces depends alarmingly on how you phrase the question 🙃

### Stage 2 vs Stage 3

Six held-out RealWorldQA images, four question types and four decoding presets per stage
mode, each answer judged 1–5 by Claude Opus 5 — 244 of 288 cells before I stopped the run.
Small enough that everything below is directional, not conclusive.

| model | mean judge score |
|---|---|
| stage 2, direct answer | **2.17** |
| stage 3, think mode | 1.25 |

Roughly three standard errors apart: the reasoning SFT made the model **more fluent and
less correct**. At 628M the traces are undertrained for imagery, so they mostly add
confident, well-structured hallucination. Fluency up 📈, grounding down 📉. The same run compared four decoding presets: greedy, conservative, creative and a
Qwen-like configuration scored 2.17 / 1.88 / 1.88 / 1.88, with a standard error around
0.25–0.30. That is noise, so I ship **greedy** for being deterministic. 

So, given the obtained results, I decided to release only the stage 2 model. Stage 3's code is in the repo and fully runnable and, in case the weights would be of interests somehow, I could share them but the model is mostly unusable as of today.

## Conclusions 🎁

You can build a "working" Vision-Language Model, on your own, for about the price of a nice
dinner for four. That is the headline, and I think it is genuinely new — few years ago
this was a research-lab project. I guess the price could also shrink by a factor of two, now that I know what I would not do again.

My best takeaways:

- **Keep the well-trodden architecture.** ViT–MLP–LLM is documented and it works. Spend
  your originality budget on the data and the evaluation, not on the wiring.
- **Rebalance the vision side.** I would reduce the visual backbone's dimension and push
  for a higher input resolution instead. My guess is that training would have been easier
  and faster, and we would have used more of the information actually present in the
  images.
- **Skip the reasoning stage at this budget.** Recovering that behaviour needs far more
  than I spent. Either the LLM is trained with that specification from the start or, as in
  my case, you simply stop at Stage 2. It was nice to give it a try either way.

The honest summary is that good descriptions are a few hours and a few dollars away, while
a genuinely competing model — even at this size — needs considerably more data and
resources than a rented afternoon.

But it was fun going through the full process, taking a language only model and making it outputting coherent descriptions few hours later.

## References

[^1]: Hugging Face M4, ["Train Your Own Encoder-Free VLM in $100"](https://huggingface.co/spaces/HuggingFaceM4/encoder-free-vlm), 2025
[^2]: Hugging Face, ["nanoVLM: The simplest repository to train your VLM in pure PyTorch"](https://huggingface.co/blog/nanovlm), 2025
[^3]: Pleias, [*"Baguettotron"*](https://huggingface.co/PleIAs/Baguettotron), 2025
[^4]: Pleias, [*"SYNTH: The New Data Frontier"*](https://pleias.fr/blog/blogsynth-the-new-data-frontier), 2025
[^5]: Chen, et al., *"InternVL: Scaling up Vision Foundation Models and Aligning for Generic Visual-Linguistic Tasks"*, [arXiv:2312.14238](https://huggingface.co/papers/2312.14238), 2023
[^6]: OpenGVLab, [*"InternViT-300M-448px-V2.5"* model card](https://huggingface.co/OpenGVLab/InternViT-300M-448px-V2_5), 2024 — source of the quotes above; the accompanying report is Chen, et al., *"Expanding Performance Boundaries of Open-Source Multimodal Models with Model, Data, and Test-Time Scaling"*, [arXiv:2412.05271](https://huggingface.co/papers/2412.05271), 2024
[^7]: Laurençon, et al., *"Building and better understanding vision-language models: insights and future directions"* (Idefics3), [arXiv:2408.12637](https://arxiv.org/abs/2408.12637), 2024
[^8]: Marafioti, et al., [*"SmolVLM: Redefining small and efficient multimodal models"*](https://huggingface.co/blog/smolvlm), 2025
[^9]: Liu, et al., *"Visual Instruction Tuning"* (LLaVA), [arXiv:2304.08485](https://arxiv.org/abs/2304.08485), 2023
[^10]: Laurençon, et al., [*"The Cauldron"*](https://huggingface.co/datasets/HuggingFaceM4/the_cauldron), 2024
[^11]: DeepSeek-AI, *"DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via Reinforcement Learning"*, 2025
[^12]: xAI, [*"RealWorldQA"*](https://huggingface.co/datasets/xai-org/RealworldQA), 2024
[^13]: Liquid AI, [*LFM2 Technical Report*](https://arxiv.org/pdf/2511.23404), 2025
[^14]: Lin, et al., *"Microsoft COCO: Common Objects in Context"*, [arXiv:1405.0312](https://arxiv.org/abs/1405.0312), 2014 — the example images are from the COCO val2017 split