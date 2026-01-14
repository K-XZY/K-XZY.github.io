---
title: Discrete Visual Tokenizers
date: 2025-12-14
tags: [deep-learning, visual-tokenization, world-model, GUI]
summary: Exploring discrete visual tokenizers for GUI world modeling — from VQ-VAE limitations to Infinity Tokenizer, and the trade-offs we encountered.
---

# Discrete Visual Tokenizers

> Lessons learned from building a GUI world model with discrete visual tokenizers.

During our time working on GUI World Model, we have spent significant time diving into discrete visual tokenizers.

---

## 1. Why Discrete Tokenizers?

Discrete tokenizers are good for long horizon generation for the following reasons:

1. **Avoiding error accumulation**: They naturally avoid error accumulation since we take argmax of the predictor's / generator's output distribution, essentially snapping into decoder's and generator's training distribution (i.e. seen vectors).

2. **Simpler training**: The training is thus simpler since we can simply do teacher forcing, without needing to worry about distribution shifts.

---

## 2. The Reconstruction Problem

However, traditional visual tokenizers before Infinity Token have problems reconstructing details such as texts and other patterns (Lin et al., "VTBench: Evaluating Visual Tokenizers for Autoregressive Image Generation", 2025).

![VTBench comparison of visual tokenizers](posts/images/VTBench.png)

This turns out to be a problem with **representation capacity**. The simple math can show that VQ-VAE has far less token vocab comparing to language models (typical VQ codebook: 1K-16K vs LLM vocab: 30K-100K+).

---

## 3. Scaling Codebook Capacity

### The Challenges of Naive Scaling

The main issue with naively scaling the codebook capacity (i.e. just use a bigger codebook) is:

1. **Low utilization**: The model doesn't necessarily leverage all that capacity, leading to low codebook usage
2. **Harder prediction**: It makes prediction vastly more challenging as now it has to learn a much larger space for classification
3. **Lookup cost**: Look up cost also grows with the codebook size — O(K × D), where K is codebook size and D is vector dimension

Note: the intuition is that visual tokenizers should have a larger codebook size than language if it is to capture both texts and textures visually.

### New Approaches

Starting in 2024, LFQ, BSQ, and VAR-256 showed new ways to scale tokenizer capacity.

**LFQ** (Yu et al., "Language Model Beats Diffusion -- Tokenizer is Key to Visual Generation", ICLR 2024) decomposes the latent space into log₂(K) independent binary dimensions, quantized using only the sign function.

**BSQ** (Zhao et al., "Image and Video Tokenization with Binary Spherical Quantization", ICLR 2025) improves on LFQ by projecting onto a hypersphere before binary quantization, providing bounded error and easier training.

Both lookup-free methods allow codebook scaling via 2^N, which is combinatorially larger than vanilla VQ.

**VAR-256** (Tian et al., "Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction", NeurIPS 2024 Best Paper) showed that you can also scale the codebook size by having multiple scales, i.e. residual vector quantization. This means a feature vector can now be a composition of layers of codes.

**Infinity Tokenizer** (Han et al., "Infinity: Scaling Bitwise AutoRegressive Modeling for High-Resolution Image Synthesis", CVPR 2025 Oral) integrates both methods and for the first time, discrete tokenizers showed superior performance than continuous tokenizers (e.g. Stable Diffusion encoder).

---

## 4. Hope and Trade-offs

We were hopeful that these tokenizers would be able to encode and decode texts, thus allowing generation of textual details on GUI screens. And as shown by VTBench and our own data, it is clear that Infinity tokenizer is capable of doing so.

However, such improvement also diminished some of the original advantages of discrete tokenizers:

- The larger codebook size comes from slightly complex algebra which isn't as intuitive to program as vanilla VQ
- Our model has to perform multi-scale prediction for every single image, which increases the number of forward passes and vastly increases the attention size
- The binary tokens require the model to learn multi-mode prediction of orthogonal visual texture vectors rather than clean semantics (see VL-JEPA's claim)

This means we need very large models to generate images.

---

## 5. Our Experiment

### Hypothesis

Can language be modeled from pixels alone via masked modeling?

### Problems Encountered

We ran into a few problems:

1. **Masking in residual setup**: It is unclear how to mask the visual in a residual setup, especially since we found the visual features leak in the CNN+ViT hybrid of the Infinity encoder

2. **Semantic capture**: The tokenizer isn't really good at capturing semantics as mentioned earlier. The model had a far easier time when we used an untrained CNN as encoder

3. **Multi-scale learning**: Next scale prediction takes a very long time to learn good enough views for every scale, such that scale-to-scale prediction can yield visually meaningful results. Unfortunately we couldn't train long enough for that to be fully visible

### Outcome

In the end we had to call off the experiment due to limited resources.

---

## References

- Lin et al. — VTBench: Evaluating Visual Tokenizers for Autoregressive Image Generation (2025)
- Yu et al. — Language Model Beats Diffusion -- Tokenizer is Key to Visual Generation (ICLR 2024)
- Zhao et al. — Image and Video Tokenization with Binary Spherical Quantization (ICLR 2025)
- Tian et al. — Visual Autoregressive Modeling: Scalable Image Generation via Next-Scale Prediction (NeurIPS 2024)
- Han et al. — Infinity: Scaling Bitwise AutoRegressive Modeling for High-Resolution Image Synthesis (CVPR 2025)
