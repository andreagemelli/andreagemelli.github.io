---
title: 'I trained my own Vision-Language Model under 1B parameters'
date: 2026-04-14
draft: false
description: "And now I can see two cats on a couch for about $200"
github: 'https://github.com/andreagemelli/baguettotron-vlm'
huggingface: 'https://huggingface.co/collections/andreagemelli/baguettotron-vlm-69de37b4cab1960226e9c1f7'
ShareButtons: ['linkedin', 'x']
tags: ["Vision Language Models", "Multimodal", "Small Models", "Open Source"]
author: 'Andrea Gemelli'
ShowReadingTime: true
ShowToc: true
comments: true
---

## Introduction

What is it actually like to build and train your own Vision-Language Model nowadays? 👀

To find out, I took a base language model, plugged in a vision backbone and trained it for
a few days on a single GPU rented on RunPod, until it could describe images.

Small, good vision encoders and language models are easy to download; what is usually
missing is the recipe to glue them together. A few works showed the way:

- [SmolVLM-500M](https://huggingface.co/HuggingFaceTB/SmolVLM-500M-Instruct)[^8] from Hugging Face showed what it takes to build a fully reproducible, small and competitive vision-language model, and the [Train Your Own Encoder-Free VLM in $100](https://huggingface.co/spaces/HuggingFaceM4/encoder-free-vlm)[^1] blog post is a complete single-GPU recipe, budget included
- [nanoVLM](https://huggingface.co/blog/nanovlm)[^2] is a minimal, educational library: you choose the pieces and the framework does the rest
- [LFM2.5-VL-450M](https://www.liquid.ai/blog/lfm2-5-vl-450m)[^13] showed what a vision-language family can do at this size

This post redoes something that works, entirely "in house" and with open-source models,
references and techniques only. It is a recipe you can follow and an honest log of
everything I got wrong along the way. [Code](https://github.com/andreagemelli/baguettotron-vlm)
and [model weights](https://huggingface.co/collections/andreagemelli/baguettotron-vlm-69de37b4cab1960226e9c1f7)
are open on GitHub and Hugging Face 🤗

> **AI Assistant Note**: Claude has been used throughout the development, especially for brainstorming and project setup, evaluation and wrapping up results. The relevant files and the decisions we made together are in the codebase.

## Motivation: a model I liked that could not see

The idea came from **Baguettotron**[^3], a text-only model, and as much from the way Pleias
presented it as from the model itself: data, weights, training story and design choices,
all out in the open. That is rarer than it should be, and it is the kind of release I
wanted to build on.

Baguettotron is a 321M-parameter Small Reasoning Model, unusual in two ways. Its shape: 80
layers at hidden size 576, which makes it, in its authors' words, the deepest SLM in its
size range (the "baguette" of the name). And its data: 200 billion tokens of **SYNTH**[^4],
a fully synthetic generalist dataset seeded from 50,000 vital Wikipedia articles, with no
scraped web data. In other words, **you can, in principle, read this model's entire pretraining
corpus**, a different category from models whose only disclosure is "trained on a large
corpus of internet text".

The one thing it could not do was see. So I gave it eyes 👀 Here is a real exchange with
the finished model, greedy decoding, running on a laptop:

![Two cats asleep on a pink couch, with two TV remotes](images/cats.jpg)

> **user:** Describe the image.
>
> **assistant:** The image is a picture of two cats sitting on the couch. The cat has its
> head down and legs are raised.

Two cats, a couch and a posture, from a 628M-parameter model that cost about $200 to train
and answers in about a second on a laptop 🎉 It is not going to write your alt text at
scale, but it is *looking at the picture*, and every step of how it got there is open.

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

I used the "standard" **ViT–MLP–LLM** paradigm as formulated by InternVL[^5]: a frozen
vision encoder, a small randomly initialised MLP that projects visual features into the
language model's embedding space, and the LLM itself.

### Encoder and Projector 🔭
I picked **InternViT-300M-448px-V2.5**[^6] over a general-purpose CLIP or SigLIP encoder,
because of a warning its own authors put on the model card: *"In our experience, the InternViT V2.5 series is better suited for building MLLMs than traditional computer vision tasks."*

The encoder turns a 448×448 image into 1024 patch tokens: too many for an 80-layer language
model at this budget, and enough to make a short question a rounding error. A **pixel unshuffle** with factor 2 folds
each 2×2 neighbourhood into one token with 4× the channels, so 1024 tokens × 1024d become
**256 tokens × 4096d**: no parameters, just a reshape that trades spatial resolution for
channel depth. The projector (two linear layers and a GELU, ~2.7M parameters trained from random init)
then maps 4096 → 576, Baguettotron's hidden size.

Nothing original here: **SmolVLM**[^8], the closest published model to mine, inherits
this compression from **Idefics3**[^7], and **InternVL**[^6] applies it for the same reason: *"we applied a pixel unshuffle operation,
reducing the number of visual tokens to one-quarter of the original"*. Everything except
the projector is a pretrained component someone else published, which is the only reason
this fits in the budget.

## Training

Three stages, all on one H100 SXM rented from RunPod, ~$200 all in.

| Stage | What trains | Data | Time |
|---|---|---|---|
| 1 — alignment | projector only (~2.7M) | LLaVA-CC3M-Pretrain-595K | ~5h |
| 2 — instruction tuning | projector + LLM (~324M) | The Cauldron + 10% SYNTH | ~60h |
| 3 — reasoning SFT | projector + LLM | R1-Vision-Reasoning-Instructions | ~7h |

### Stage 1 — teaching visual tokens to align with the language model's space

The projector starts from random weights, so at first it feeds the language model noise.
Stage 1 freezes both the ViT and the LLM and trains only the projector's 2.7M parameters on
595K image–caption pairs from LLaVA-CC3M, following the two-stage recipe LLaVA
established[^9]. The point is alignment, not capability: teaching one small module to emit
vectors the language model already knows how to read.

### Stage 2 — teach the model to answer

Now the projector and the full language model train together on **The Cauldron**[^10]
(47 subsets of visual instruction data), mixed with 10% text-only SYNTH to avoid
catastrophic forgetting. Two decisions mattered:

**Keeping the ViT frozen.** With 324M trainable parameters and 60 hours, any budget spent
on the vision encoder would have meant less of everything else. The encoder was already
good; the mapping into my LLM was the bottleneck.

**Pre-filling `</think>`.** Baguettotron natively wants to emit a reasoning trace, and The
Cauldron contains none. Rather than fight the backbone, every assistant turn in training
begins with a closing `</think>` token, telling the model, in its own vocabulary, "no
thinking this time, just answer". The processor does the same at inference, so the two
match. My first run skipped it and did not work at all, most likely because the model drifted too
far from the distribution Baguettotron was trained on. Ouch ❤️‍🩹

### Stage 3 — teach the model to think about what it sees

To bring back the reasoning that The Cauldron had suppressed, I ran SFT on ~150K
correct-only samples from R1-Vision-Reasoning-Instructions, which carry DeepSeek-R1-style[^11]
`<think>` traces about images. The model would have needed far more data and training time
to actually learn that behaviour: as the results below show, the Stage 3 model hallucinated
most, if not all, of the time while reasoning 😅

## Evaluation and results

I wanted a fast, qualitative check of whether the model at least understands what an image
depicts. I also pushed it a little further with some "complex" questions and reasoning, and
failed miserably: anything of real quality beyond plain description needs more training,
which was out of scope here.

For Stages 1 and 2 I judged a few [COCO](https://cocodataset.org)[^14] images by eye; for
Stage 2 vs Stage 3 I used RealWorldQA[^12] with a vision model as judge (details below).

### Stage 1 vs Stage 2

Four photos, same prompt for both checkpoints:

| | alignment (stage 1) | vision-vqa (stage 2) |
|---|---|---|
| ![cats](images/cats.jpg) | `a cat is sleeping on the couch` | `The image is a picture of two cats sitting on the couch. The cat has its head down and legs are raised.` |
| ![bear](images/bear.jpg) | `the bear is a good friend.` | `The image shows a bear sitting on the grass.` |
| ![stop sign](images/stop.jpg) | `a sign for a stop` | `A sign that says stop.` |
| ![bus](images/bus.jpg) | `the bus is a red double - decoration` | `The red bus is on the road.` |

*Same images, same prompt, greedy decoding. Verbatim output from both checkpoints.*

Stage 1 gives short, barely meaningful captions (the bear is "a good friend" 🐻); Stage 2
writes longer, more factual ones. That is what the two stages are for. Stage 1 only trained
2.7M parameters, so it learns *what* is in the picture and almost nothing about finishing a
sentence; Stage 2 unfreezes the language model, and
grammar comes back with it.

Push Stage 2 past a short answer, though, and it starts inventing:

> **user:** Describe the image in detail.
>
> **assistant:** In this image, two cats are sitting on a **white** couch. They have
> **their ears covered** and the other cat is **wearing a light flashlight**.

The couch is pink, nobody's ears are covered, and the "light flashlight" is a TV remote
lying next to the cats: the model sees that *something* elongated is there, cannot resolve
what, and makes up an object and a relationship to go with it. The sentence is grammatical,
well structured and about the right objects, just wrong in the details, which is the
hardest kind of wrong to catch automatically 🫠

### Stage 2: more "complex" questions

What happens if we actually ask it something? Three questions that work and three that do
not, roughly the hit rate I would expect from it:

| | question | answer | |
|---|---|---|---|
| 🐻 | `What kind of animal is this?` | `Bear.` | ✅ |
| 🛑 | `What does the sign say?` | `STOP.` | ✅ |
| 🚌 | `What is the main object in the image?` | `The main object is a red bus.` | ✅ |
| 🐱 | `Is there a cat in the picture?` | `No.` | ❌ there are two |
| 🛑 | `What color is the sign?` | `Yellow.` | ❌ it is red |
| 🚌 | `What number is the bus route?` | `Yes.` | ❌ |

`Bear.` is the model doing exactly its job. `STOP.` surprised me, though I cannot tell
whether it read the letters or recognised a red octagon, and the bus route number (real OCR
on small text) comes back as `Yes.`, which suggests the latter.

The failures are more interesting. `No.` about a photo of two sleeping cats is not a near
miss, and `What kind of animal is this?`, which works perfectly on the bear, returns `Yes.`
on the cats. So it is not that the model cannot see cats: its answer depends alarmingly on
how you phrase the question 🙃

### Stage 2 vs Stage 3

Six held-out RealWorldQA images, four question types and four decoding presets per stage
mode, each answer judged 1–5 by Claude Opus 5: 244 of 288 cells before I stopped the run.
Small enough that everything below is directional, not conclusive.

| model | mean judge score |
|---|---|
| stage 2, direct answer | **2.17** |
| stage 3, think mode | 1.25 |

Roughly three standard errors apart: the reasoning SFT made the model **more fluent and
less correct**. At 628M the traces are undertrained for images, so they mostly add
confident, well-structured hallucination. Fluency up 📈, grounding down 📉. The decoding
presets made no real difference: greedy, conservative, creative and a Qwen-like
configuration scored 2.17 / 1.88 / 1.88 / 1.88, with a standard error around 0.25–0.30.
That is noise, so I ship **greedy** because it is deterministic.

Given these results, I released only the Stage 2 model. Stage 3's code is in the repo and
fully runnable, and I can share its weights if anyone is interested, but that model is
mostly unusable as of today.

## Conclusions 🎁

You can build a "working" Vision-Language Model on your own for about the price of a nice
dinner for four. A few years ago this was a research-lab project. Now that I know what I would
not do again, I could probably halve the price.

My best takeaways:

- **Keep the well-trodden architecture.** ViT–MLP–LLM is documented and it works. Spend
  your originality budget on the data and the evaluation, not on the wiring.
- **Rebalance the vision side.** I would use a smaller vision backbone and a higher input
  resolution. My guess is that training would be easier and faster, and the model would
  use more of the information actually present in the images.
- **Skip the reasoning stage at this budget.** Recovering that behaviour needs far more
  than I spent: either the LLM is trained for it from the start or, as in my case, you stop
  at Stage 2. It was nice to give it a try either way.

Good descriptions are a few hours and a few dollars away, while a genuinely competitive
model, even at this size, needs considerably more data and resources than a few days
on a rented GPU. Still, it was fun to take a language-only model through the whole process
and get coherent image descriptions out of it.

## Update 4 November 2026

Two days ago Takehi, Teoh, Zhang and Khattab published
[*Sparks of Weight-Space Programming*](https://rikiyat.github.io/blog/weight-space-programming/)[^15]:
instead of training a network, you change it by reading its activations and writing its
weights directly, with no gradients and no training loop. Inspired by it, I tried the same
on this model with Claude Opus 5.5 at max effort.

As their own control experiment warns, *"Editing weights could remove an obstacle that hid
an ability, but it could not add an ability the model lacked."* Most of this model's
failures (counting, reading text, multiple choice) are missing abilities, and no edit can
add them. A couple of things could be fixed, touching 0.0014% of the weights:

- **The stop token.** My training loss masked `<|im_end|>`, so the model never learned to
  emit it and spelled it out instead. Swapping 4 rows of the output layer makes the model's
  own `.<` and `<|` land on the real stop tokens, so plain `generate()` now stops by itself.
- **Object presence and loops.** The activations already carry whether an object is in the
  picture, but the Yes/No answer ignored it. Two neurons in the last layer now pass that
  evidence on, at a small cost on other yes/no questions, and two more end long answers
  once they start repeating themselves.

Measured on images and questions never used to build the edits (fp32):

| test | before | after |
|---|---|---|
| POPE[^16] random: 600 "Is there a … in the image?" on 100 unseen COCO images (chance is 50%) | 52.3% | **64.0%** |
| same questions, without the "answer with a single word" suffix | 48.3% | **69.3%** |
| POPE adversarial (absent objects that usually come along) | 50.0% | **54.5%** |
| long descriptions that end by themselves (no repetition penalty) | 0% | **83%** |
| RealWorldQA, exact match (379 unseen rows) | 21.6% | 21.9% |
| VQAv2[^17] (1,780 questions) | 33.5 | 33.7 |
| GQA[^18], yes/no questions | 53.7% | 50.7% |

The GQA row is the price: the presence gate also opens on attribute questions like "Is the
car red?", where there is no evidence to read, and pushes those answers towards "No".

On this post's own examples, the model gives more or less the same answers as before, so its
overall behaviour did not change. The one exception is the question I cared about: asked
`Is there a cat in the picture?` about the two sleeping cats, it now answers `Yes` 🎉

The edited weights are on [Hugging Face](https://huggingface.co/andreagemelli/baguettotron-vision-vqa)
as **v1.1**; the original release stays available as `revision="v1.0"`. A possible
follow-up: narrow the task to something really specific, with a dedicated dataset, and use
Claude Fable for it.

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
[^15]: Takehi, Teoh, Zhang, Khattab, [*"Sparks of Weight-Space Programming: LLMs can natively read & write neural network weights"*](https://rikiyat.github.io/blog/weight-space-programming/), 2026
[^16]: Li, et al., *"Evaluating Object Hallucination in Large Vision-Language Models"* (POPE), [arXiv:2305.10355](https://arxiv.org/abs/2305.10355), 2023
[^17]: Goyal, et al., *"Making the V in VQA Matter: Elevating the Role of Image Understanding in Visual Question Answering"* (VQAv2), [arXiv:1612.00837](https://arxiv.org/abs/1612.00837), 2017
[^18]: Hudson and Manning, *"GQA: A New Dataset for Real-World Visual Reasoning and Compositional Question Answering"*, [arXiv:1902.09506](https://arxiv.org/abs/1902.09506), 2019
