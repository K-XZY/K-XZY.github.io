---
title: Exploring JEPA and SIGReg
date: 2026-01-13
tags: [deep-learning, self-supervised, representation-learning, JEPA]
summary: Reproducing LeJEPA on CIFAR-100 with ViT-nano — understanding SIGReg regularization and attention patterns.
---

# Exploring JEPA and SIGReg

> Reproducing LeJEPA on CIFAR-100 with a ViT-nano model, investigating the SIGReg regularization term and analyzing attention behavior.

This post documents my exploration of Joint Embedding Predictive Architectures (JEPA) through a reproduction experiment on CIFAR-100. The main contribution of LeJEPA is a provably optimal regularization term (SIGReg) for joint embedding modeling.

---

## Overview

1. **Background**: What is JEPA? Why learn invariance? What causes collapse?
2. **SIGReg**: The regularization term proposed by LeJEPA
3. **Experiment**: Training a ViT-nano on CIFAR-100
4. **Analysis**: Attention patterns, linear probe performance, and key findings

---

## 1. Background

### What is Joint Embedding Modeling?

Joint Embedding Predictive Architecture (JEPA) learns representations by predicting the embedding of one view from another, rather than reconstructing raw pixels. The goal is to learn **invariance** — representations that capture semantic content while being robust to augmentations.

*[Detailed explanation of JEPA architecture to be added]*

### The Collapse Problem

A fundamental challenge in joint embedding methods is **representation collapse** — the model learns to map all inputs to the same embedding, achieving trivially low loss.

Common techniques to avoid collapse:
- **Stop Gradient**: Asymmetric updates (SimSiam, BYOL)
- **EMA Target**: Momentum encoder (MoCo, BYOL)
- **Contrastive Loss**: InfoNCE with negative samples

*[Analysis of why these methods work to be added]*

---

## 2. SIGReg: Provably Optimal Regularization

LeJEPA proposes SIGReg as a principled regularization term for joint embedding learning.

*[Mathematical formulation of SIGReg to be added]*

*[Comparison with other regularization approaches to be added]*

---

## 3. Experiment Setup

### Model Architecture

We trained a ViT-nano model on CIFAR-100:
- Input resolution: 32×32
- Patch size: 4×4 (64 tokens)
- Hidden dimension: 512
- Attention heads: 8

*[Detailed hyperparameters to be added]*

### Training

We trained two configurations:
1. **32×32 resolution** — completed training
2. **512×512 resolution** — incomplete (too computationally expensive)

```charts
title="Training Curves — ViT-nano on CIFAR-100"
src="posts/data/lejepa_nano_linear_probe_acc.csv" title="Linear Probe Accuracy" color="#4a9eff"
src="posts/data/lejepa_nano_val_inv.csv" title="Invariance Loss" color="#ff6b6b"
src="posts/data/lejepa_nano_val_sigreg.csv" title="SIGReg Loss" color="#51cf66"
```

### Loss Function

The training objective combines invariance loss with SIGReg regularization:

*[Mathematical formulation to be added]*

Intuitively, we take the average of all views with respect to all other views, enforcing that "the patch representation equals the mean of all representations of that patch."

---

## 4. Results

### Linear Probe Performance

Linear probing evaluates the encoder by fitting a linear classifier on frozen embeddings. This is unbiased since linear transformations cannot extract information that isn't linearly separable in the embedding space.

**Key results:**
- Final accuracy: ~61.6% on CIFAR-100
- Performance grows steadily during training
- ~6% lower than LeJEPA's reported numbers (they used ViT-Large on ImageNet)

See training curves above in Section 3.

### PCA of Features

*[PCA visualization to be added]*

Key observations:
- Both resolutions learn meaningful representations
- Higher resolution shows clearer details despite being under-trained
- Even randomly initialized ViT performs basic segmentation based on colors and edges

### Attention Visualization

*[Attention map visualization to be added]*

We analyzed the CLS token's attention to all patch tokens across layers.

---

## 5. Attention Analysis: Nano vs Large Model

We conducted a detailed attention analysis comparing three configurations on the same fox image from CIFAR-100:

| Metric | nano 32×32 | nano 64×64 (extrapolation) | old model 224×224 |
|--------|------------|---------------------------|-------------------|
| Entropy | 4.08 | 5.42 | 4.97 |
| Sparsity | 19% | 100% | 88% |
| Max Attention | 0.029 | 0.010 | 0.044 |
| Head Diversity | 0.24 | 0.31 | 0.63 |
| Head Similarity | 0.756 | — | 0.374 |

### Key Findings

#### 1. Entropy
- **nano 32×32**: Lowest entropy (4.08) — attention is most concentrated
- **nano 64×64 extrapolation**: Highest entropy (5.42) — attention becomes dispersed
- **old model 224×224**: Middle ground (4.97)

#### 2. Sparsity
- **32×32 nano**: Only 19% of patches below threshold — attention distributed across many locations
- **64×64 extrapolation**: 100% sparse — almost all attention values are very small
- **old model**: 88% sparse — attention concentrated on few positions

#### 3. Head Diversity (Most Important Finding)
- **nano model**: Head diversity only 0.24, average head similarity 0.756
- **old model**: Head diversity 0.63, average head similarity 0.374

This indicates the nano model's attention heads are learning very similar patterns, not differentiating.

#### 4. Visualization Comparison
- **nano 32×32**: Relatively uniform attention distribution, can see fox outline and bottom region
- **nano 64×64**: Very blurry and dispersed — RoPE extrapolation fails
- **old model 224×224**: Attention focused on one point (on the fox), almost no attention elsewhere

### Hypothesized Causes

**Nano model head collapse:**
8 heads learned almost identical attention patterns. Possible reasons:
- 32×32 images are too small — not enough information for 8 different patterns
- Insufficient training time/data for heads to differentiate
- Model capacity too large (512 dim, 8 heads) for 64 tokens

**RoPE extrapolation failure:**
From 32×32 to 64×64, attention completely collapses (100% sparse). The model only learned relative position relationships within 8×8 grid, cannot generalize to 16×16 grid.

**Old model healthier:**
224×224 model has higher head diversity — different heads learned different patterns. Possible reasons:
- Larger images provide more visual information
- 196 tokens (14×14) vs 64 tokens (8×8) gives more room for head differentiation

> Note: The old model has ~20% worse linear probe performance compared to the nano model, though it may not have been fully trained.

---

## 6. Discussion

### Human Perception vs. Neural Networks

Modern representation encoders seem to require high resolution and large models to achieve good semantics, consuming much more power and taking longer compared to the human visual system.

*[Further analysis to be added]*

### LeJEPA Comparison

*[Comparison table with LeJEPA paper results to be added]*

---

## Conclusion

This reproduction study reveals interesting insights about attention head behavior in small-scale JEPA models:

1. **Head collapse** is a significant issue for nano models on low-resolution images
2. **RoPE position encoding** does not extrapolate well to unseen resolutions
3. **Model capacity** relative to input complexity affects head diversity
4. **SIGReg regularization** enables stable training without contrastive samples

The experiment demonstrates that even with limited compute, we can gain valuable insights into self-supervised representation learning.

---

## References

- Assran et al. — Self-Supervised Learning from Images with a Joint-Embedding Predictive Architecture (I-JEPA)
- LeJEPA paper — *[citation to be added]*