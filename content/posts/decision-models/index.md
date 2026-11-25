---
title: 'I decided to write about decision models'
date: 2026-10-27
draft: false
description: "why they are not revolutionary but matter a lot"
ShareButtons: ['linkedin', 'x']
tags: ["Large Language Models", "Decision Models", "Classification", "Routing"]
author: 'Andrea Gemelli'
ShowReadingTime: true
ShowToc: true
---

## Overview

**Decision models**, also called *System One* models after Jev, the best-known one, read an input and a few predefined questions, and answer with a **typed decision and a calibrated probability**. They never write a sentence.

They are not revolutionary, and that is why they are useful: a well-known task, classification, served through an API that feels like an LLM, at a fraction of the cost.

![LLM versus decision model](images/decision-models.svg)
*Top: an LLM picks one token among the whole vocabulary, appends it, and goes again. Bottom: a decision model answers every question in one forward pass, with a head per question type.*

## Classification in two minutes

Classification is the task of choosing a label (or several, or a score) for an input. The usual path goes from bag-of-words with logistic regression, to RNNs and CNNs, to transformers like BERT with a classification head on top. [Sebastian Raschka's walkthrough](https://magazine.sebastianraschka.com/p/classifier-history-and-jev) [^0] covers every era with numbers, if you want the full history.

The problem with the classical recipe is that a classifier only knows the labels it was trained on. When the labels change or the data drifts, you collect data, label it, retrain and redeploy. In production, that can happen every week.

## What a decision model is

[Papers with Code](https://paperswithcode.co/methods/decision-model) [^1] defines it as a model that maps *unstructured state directly to a typed decision over predefined options*, with calibrated probabilities. In other words, a smart `if` statement.

Providers are converging on the same three question types, so I will stick to those names:

- **noul**: a yes/no question, with a probability;
- **choice**: pick one option among several;
- **score**: rate on a scale.

Jev, from TypeSafe AI, introduced the category as the "ChatGPT moment" of decisions [^2]. The open counterpart is [Laya](https://github.com/NandhaKishorM/laya), the open-source decision model of an independent researcher who says they built non-autoregressive decision models before Jev's launch, and wrote about it in a [post](https://dev.to/nandakishor_m_6cc0adfde9f/i-built-non-autoregressive-decision-models-a-year-ago-then-a-frontier-lab-called-it-a-18me) [^6] worth reading. I cannot verify the priority claim. What I can say is that Laya is open, so it is the one model of this kind we can actually look inside.

The state of the art, as of this week, is [d1-ultra](https://www.liquid.ai/blog/d1-ultra) from Liquid AI [^3]: multimodal, with a probability for each possible answer and *no token generated*. The performance claims are the vendor's own.

### How it (probably) works

Neither company fully discloses the architecture, so this is an informed guess. My bet is an *encoder-only* backbone with classification heads, in place of the language-modeling head an LLM uses to pick the next token from the whole vocabulary. The open-source Laya, for instance, reportedly sits on a ModernBERT-large encoder [^4], and Liquid describes d1-ultra as built on an open-weight model, read in a single forward pass [^3].

The output side is where they differ. Instead of reading a probability off the logprobs of the next token, they appear to train **two dedicated outputs**:

- a **general confidence** in the answer, which is what you use to *escalate* to a more capable model when it is low;
- a **task-scoped probability**: for a noul, the true/false probability rescaled for that specific question.

This is my reading of the public material, not a spec. Either way, this is what makes them usable: the model tells you *when it does not know*.

### Not just a classifier

Raschka calls Jev "essentially a text classifier", then explains why it is not *just* one [^0]. I agree: a *traditional* classifier needs new data and a new training run for every change, while a decision model **generalizes across tasks and can still be fine-tuned without losing that**. You change the question, not the model.

## Versus an LLM

LLMs are strong reasoners and, with tools, good agents. But most decisions in a pipeline need no chain of thought:

- *is this message a complaint?*
- *which of these four agents should handle this request?*
- *is this document relevant to this query?*

Per API call, a decision model costs next to nothing compared to an LLM, and answers in a fraction of the time. TypeSafe quotes [pricing and latency](https://typesafe.ai/blog/introducing-system-one-models-and-jev) orders of magnitude below frontier LLMs [^2], though the pricing may be subsidized. Often a cheap **router** is all you need.

There are limits. In *JEV-as-a-Judge* [^5], a decision-only judge gets within three points of a strong LLM when the verdict can be read from the text, and falls behind when it has to be *derived* (math, code, logic). The confidence score is what tells you which side of that line you are on, and that leads to the pattern below.

## Accept when confident, escalate when unsure

A **cascade**: the decision model answers first, and only the uncertain cases go to the expensive model. It fits in many places:

- **routing**, such as picking the right agent or harness for a request (Paul Iusztin lists [six places to use Jev in production](https://www.linkedin.com/feed/update/urn:li:activity:7513277530624282624/) [^7], from routing and guardrails to tool-call gating and reranking);
- **LLM-as-a-judge**, with confident verdicts accepted and the rest escalated, as in the paper above;
- **synthetic labeling** of benchmarks, where the strong model only sees the hard items.

At [Kleio](https://www.kleio.ai), I used the cascade on two internal problems: an LLM judge for agent conversations, and synthetic relevance annotation for a retrieval benchmark, following the idea of [JEV-as-a-Judge](https://arxiv.org/abs/2609.26550) [^5].

On the judge, cost dropped by 71% and latency by 70%, with 97.2% agreement with the strong judge alone, even though 43% of the turns still escalated. On annotation, only 3.9% of the pairs reached the strong model, cost dropped by about 93%, and agreement with human labels went from 84.8% to 85.9%.

That is roughly **80% less cost** on average, with quality intact, both when almost half of the cases escalate and when almost none do.

## Conclusions

Three things to take home 🎓

1. **A decision model is a classifier you call like an LLM.** Typed answers, calibrated probabilities, one forward pass, no generation.
2. **The value is in the confidence.** Knowing when *not* to answer is what lets you escalate to a bigger model and pay for it only when needed.
3. **Use the big model to think, and the small one to decide.** Most of a pipeline is the second kind.

Classification is nothing new, and neither is most of this architecture. What decision models bring back is a principle: **match the model to the task**. Since LLMs arrived, the reflex has been to send everything to the latest, biggest model, which wastes money, energy and time on tasks that do not need it. Decision models are not a breakthrough, but they make the cheap path the default and call the big model only when it is needed.

Happy learning 🤗

## References

[^0]: Raschka, "Language Models for Text Classification: From Bag-of-Words to Jev", [Ahead of AI](https://magazine.sebastianraschka.com/p/classifier-history-and-jev), 2026
[^1]: ["Decision model"](https://paperswithcode.co/methods/decision-model), Papers with Code
[^2]: TypeSafe AI, ["Introducing System One Models & Jev"](https://typesafe.ai/blog/introducing-system-one-models-and-jev), 2026
[^3]: Liquid AI, ["d1-ultra: Introducing the World's Best Decision Model"](https://www.liquid.ai/blog/d1-ultra), 2026
[^4]: Laya, [GitHub repository](https://github.com/NandhaKishorM/laya). The ModernBERT-large detail comes from a secondary source, [WWT](https://www.wwt.com/blog/the-rise-of-decision-models)
[^5]: Li et al., "JEV-as-a-Judge: Accept When Confident, Escalate When Unsure", [arXiv:2609.26550](https://arxiv.org/abs/2609.26550), 2026
[^6]: Nandakishor M, ["I Built Non-Autoregressive Decision Models a Year Ago. Then a Frontier Lab Called It a Breakthrough"](https://dev.to/nandakishor_m_6cc0adfde9f/i-built-non-autoregressive-decision-models-a-year-ago-then-a-frontier-lab-called-it-a-18me), DEV Community, 2026
[^7]: Iusztin, ["There are 6 places I'd use Jev in a production AI system"](https://www.linkedin.com/feed/update/urn:li:activity:7513277530624282624/), LinkedIn, 2026
