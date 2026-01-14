---
title: Exploring JEPA and SIGReg
date: 2026-01-13
tags: [representation-learning, self-supervised-learning, computer-vision, GUI]
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

#### The Two Paradigms

There are two main approaches to self-supervised visual learning:

| Approach            | Method                            | Pros                    | Cons                             |
| ------------------- | --------------------------------- | ----------------------- | -------------------------------- |
| **Generative**      | Reconstruct pixels (MAE, BEiT)    | Rich supervision signal | Wastes capacity on pixel details |
| **Joint Embedding** | Predict embeddings (JEPA, SimCLR) | Focus on semantics      | Risk of collapse                 |

**Generative methods** like MAE mask patches and reconstruct raw pixels. The problem: the model must learn to predict exact RGB values, which includes low-level details (textures, lighting) that may not be semantically meaningful.

**Joint embedding methods** instead predict in *representation space*. Two views of the same image should have similar embeddings, but we don't care about pixel-level reconstruction. This forces the model to focus on semantic content.

#### JEPA Architecture

```diagram:jepa
```

The key insight: if two different views of the same image have similar embeddings, the encoder must have learned features that are *invariant* to the augmentations (crop location, color, etc.) — these invariant features are typically semantic.

#### Global vs Local Views

Not all views are created equal:

- **Global views** (scale 0.3–1.0): Large crops that capture most of the image
- **Local views** (scale 0.05–0.3): Small crops that capture fine details

The intuition: a local crop of a dog's ear should still be recognized as "dog". By forcing local and global views to have similar embeddings, we encourage the model to learn hierarchical, semantic features.

### The Collapse Problem

A fundamental challenge in joint embedding methods is **representation collapse** — the model learns to map all inputs to the same embedding, achieving trivially low loss.

**Why does collapse happen?** Consider the loss $\mathcal{L} = \|z_1 - z_2\|^2$. The trivial solution $f(x) = c$ for any constant $c$ achieves $\mathcal{L} = 0$. The model can "cheat" by ignoring the input entirely.

**Types of collapse:**
1. **Complete collapse**: All inputs map to the same point
2. **Dimensional collapse**: Embeddings only use a subspace (e.g., rank 10 in 128-dim space)
3. **Cluster collapse**: Embeddings form a few discrete clusters instead of a continuous manifold

Common techniques to avoid collapse:
- **Stop Gradient**: Asymmetric updates (SimSiam, BYOL)
- **EMA Target**: Momentum encoder (MoCo, BYOL)
- **Contrastive Loss**: InfoNCE with negative samples

#### Why These Methods Work

**Contrastive Learning (SimCLR, MoCo):**

The key idea is to add *negative samples* — embeddings from different images should be pushed apart.

$$
\mathcal{L}_{\text{InfoNCE}} = -\log \frac{\exp(z_i \cdot z_j / \tau)}{\sum_{k \neq i} \exp(z_i \cdot z_k / \tau)}
$$

This explicitly prevents collapse: if everything maps to the same point, the denominator equals the numerator, and loss is maximized. The downside: you need many negative samples (large batches or memory banks).

**Stop-Gradient (SimSiam):**

A surprising finding: you can train without negatives if you stop gradients through one branch.

```diagram:simsiam
```

Why does this work? Intuitively, the stop-gradient creates an asymmetry. The predictor must *adapt* to the target, but the target doesn't move to meet the predictor. This prevents the trivial solution where both branches collapse together. The theoretical understanding is still incomplete, but empirically it works.

**EMA Target (BYOL, MoCo):**

Instead of stop-gradient, use a slowly-moving target encoder:

$$
\theta_{\text{target}} \leftarrow m \cdot \theta_{\text{target}} + (1-m) \cdot \theta_{\text{online}}
$$

where $m \approx 0.99$. The target encoder is a "historical average" of the online encoder. This provides a stable target that doesn't collapse instantly with the online encoder.

**SIGReg (LeJEPA):**

A different approach: instead of architectural tricks, directly regularize the embedding distribution to be non-degenerate. If embeddings follow an isotropic Gaussian, they cannot be collapsed. This is the focus of this post — see Section 2.

---

## 2. Loss Functions

The LeJEPA training objective has two components: an **invariance loss** that encourages consistent representations across views, and **SIGReg** that prevents representation collapse. Let's build up from the total loss to each component.

### Total Loss

$$
\mathcal{L} = (1 - \lambda) \cdot \mathcal{L}_{\text{inv}} + \lambda \cdot \mathcal{L}_{\text{SIGReg}}
$$

where $\lambda$ is a hyperparameter (typically 0.05) that balances the two terms.

**Intuition:** We want representations that are (1) invariant to augmentations, and (2) not collapsed to a trivial solution. The invariance loss handles (1), while SIGReg handles (2).

---

### Invariance Loss

The invariance loss enforces that all views of the same image should have similar representations.

**Setup:** Given an image $x$, we create $V$ augmented views and encode each through the network to get embeddings $\{z_{v}\}_{v=1}^{V}$.

**Goal:** Each view's embedding should equal the mean of all views' embeddings.

$$
\mathcal{L}_{\text{inv}} = \frac{1}{N \cdot V} \sum_{n=1}^{N} \sum_{v=1}^{V} \|z_{n,v} - \bar{z}_n\|_2^2
$$

where:
- $N$ = batch size (number of images)
- $V$ = number of views per image (typically 10: 2 global + 8 local)
- $z_{n,v}$ = embedding of view $v$ for image $n$
- $\bar{z}_n = \frac{1}{V}\sum_{v=1}^{V} z_{n,v}$ = mean embedding across all views

**Intuition:** This is simply the variance of embeddings across views. If the model learns truly invariant representations, different augmentations of the same image will map to (almost) the same point in embedding space.

**Why not just minimize distance between pairs?** Computing all pairwise distances is $O(V^2)$. Using the mean as anchor is mathematically equivalent but $O(V)$.

---

### SIGReg: Preventing Collapse

Without regularization, the invariance loss has a trivial solution: map everything to the same point (collapse). SIGReg (Sketched Isotropic Gaussian Regularization) prevents this by enforcing that the embedding distribution is an isotropic Gaussian.

**Why isotropic Gaussian?** An isotropic Gaussian $\mathcal{N}(0, I)$ has:
- Zero mean (centered)
- Unit variance in all directions (spread out)
- No correlations between dimensions (uses full space)

This is the "most spread out" distribution with a given entropy — the opposite of collapse.

**The Cramér-Wold Theorem:** A key insight from probability theory: a multivariate distribution is Gaussian if and only if *all* 1D projections are Gaussian. This lets us test high-dimensional Gaussianity through many 1D tests.

$$
\mathcal{L}_{\text{SIGReg}} = \frac{1}{|A|} \sum_{a \in A} \text{EP}\left(\{a^\top z_i\}_{i=1}^{N \cdot V}\right)
$$

where:
- $A$ = set of random unit directions (typically 512-1024 directions)
- $a^\top z_i$ = 1D projection of embedding $z_i$ onto direction $a$
- $\text{EP}(\cdot)$ = Epps-Pulley test statistic (measures deviation from Gaussian)

**The Epps-Pulley Test:** This is a statistical test for univariate normality. It compares the empirical characteristic function to that of a standard Gaussian:

$$
\text{EP}(x_1, \ldots, x_n) = n \int_0^{t_{\max}} \left| \phi_{\text{emp}}(t) - e^{-t^2/2} \right|^2 \cdot e^{-t^2/2} \, dt
$$

where $\phi_{\text{emp}}(t) = \frac{1}{n}\sum_{i=1}^{n} e^{itx_i}$ is the empirical characteristic function.

**Intuition:** The characteristic function uniquely identifies a distribution. For a standard Gaussian, $\phi(t) = e^{-t^2/2}$. The Epps-Pulley test measures how far our empirical distribution is from this target.

**Why no standardization?** A critical implementation detail: we do NOT standardize the projections before testing. This is intentional — SIGReg should enforce both unit variance AND zero mean. If we standardized, the test would pass even for collapsed representations (all same vector → zero variance → division by zero or artificial normalization).

### Comparison with Other Methods

| Method              | Collapse Prevention        | Needs Negatives   | Needs EMA |
| ------------------- | -------------------------- | ----------------- | --------- |
| **SimCLR**          | Contrastive loss (InfoNCE) | Yes (large batch) | No        |
| **MoCo**            | Contrastive + momentum     | Yes (queue)       | Yes       |
| **BYOL**            | Stop-gradient + EMA        | No                | Yes       |
| **SimSiam**         | Stop-gradient              | No                | No        |
| **VICReg**          | Variance + Covariance      | No                | No        |
| **LeJEPA (SIGReg)** | Gaussianity test           | No                | No        |

**Key advantage of SIGReg:** It's a *sufficient* condition for non-collapse. If the distribution is truly isotropic Gaussian, it cannot be collapsed. Other methods use heuristics (stop-gradient, EMA) that work empirically but lack theoretical guarantees.

---

## 3. Experiment Setup

### Model Architecture

We used a ViT-Tiny model (the config file says "nano" but actually uses tiny):

| Component            | Specification |
| -------------------- | ------------- |
| **Model**            | ViT-Tiny      |
| **Hidden dimension** | 512           |
| **Depth**            | 4 layers      |
| **Attention heads**  | 8             |
| **Parameters**       | ~13M          |

| Input Processing      | Value                   |
| --------------------- | ----------------------- |
| **Input resolution**  | 32×32 (native CIFAR)    |
| **Patch size**        | 4×4                     |
| **Number of patches** | 64 (8×8 grid)           |
| **Position encoding** | 2D RoPE ($\theta=10.0$) |
| **Register tokens**   | 2                       |

### Training Hyperparameters

| Hyperparameter        | Value                            |
| --------------------- | -------------------------------- |
| **Batch size**        | 256                              |
| **Max steps**         | 1,000,000                        |
| **Learning rate**     | 0.0005                           |
| **Min learning rate** | 0.00001                          |
| **Weight decay**      | 0.02                             |
| **Warmup steps**      | 500                              |
| **LR schedule**       | Linear warmup + Cosine annealing |

| Loss Hyperparameters          | Value |
| ----------------------------- | ----- |
| **$\lambda$ (SIGReg weight)** | 0.05  |
| **Random directions $\|A\|$** | 1024  |

| View Generation  | Value      |
| ---------------- | ---------- |
| **Global views** | 2          |
| **Local views**  | 8          |
| **Global scale** | [0.5, 1.0] |
| **Local scale**  | [0.2, 0.5] |

### Training Curves

```charts
title="Training Curves — ViT-Tiny on CIFAR-100"
src="posts/data/lejepa_nano_linear_probe_acc.csv" title="Linear Probe Accuracy" color="#4a9eff"
src="posts/data/lejepa_nano_val_inv.csv" title="Invariance Loss" color="#ff6b6b"
src="posts/data/lejepa_nano_val_sigreg.csv" title="SIGReg Loss" color="#51cf66"
```

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

We analyzed the CLS token's attention to all patch tokens across layers.

#### Per-Head Attention: Nano vs Old Model

Comparing attention patterns across 8 heads reveals different behaviors:

**Nano Model (32×32)** — heads learn similar patterns (avg similarity: 0.756):

![Nano Attention Heads](posts/images/jepa/nano_fox_attention_heads.png)

**Old Model (224×224)** — heads learn diverse patterns (avg similarity: 0.374):

![Old Attention Heads](posts/images/jepa/old_fox_attention_heads.png)

---

## 5. Attention Analysis: Nano vs Old Model

### Configuration Comparison

The two models differ significantly in their architecture and input processing:

| Config                | Nano Model            | Old Model              |
| --------------------- | --------------------- | ---------------------- |
| **Image Size**        | 32×32 (native CIFAR)  | 224×224 (upscaled 7×)  |
| **Patch Size**        | 4×4                   | 16×16                  |
| **Num Tokens**        | 64 (8×8 grid)         | 196 (14×14 grid)       |
| **Model Size**        | tiny (d=512, depth=4) | small (d=512, depth=?) |
| **Position Encoding** | 2D RoPE (θ=10.0)      | Learned                |
| **Register Tokens**   | 2                     | 4                      |

**Key differences:**
1. **Token count**: Old model has 3× more tokens (196 vs 64)
2. **Position encoding**: Nano uses RoPE, old model uses learned embeddings
3. **Image resolution**: Old model upscales CIFAR 7× before processing

### Attention Metrics

| Metric              | Nano 32×32 | Old Model 224×224 |
| ------------------- | ---------- | ----------------- |
| Entropy             | 4.08       | 4.97              |
| Sparsity            | 19%        | 88%               |
| Max Attention       | 0.029      | 0.044             |
| **Head Diversity**  | **0.24**   | **0.63**          |
| **Head Similarity** | **0.756**  | **0.374**         |

### Key Finding: Head Collapse in Nano Model

The most striking difference is **head diversity**:
- **Nano**: 0.24 diversity, 0.756 similarity — all 8 heads learn nearly identical patterns
- **Old**: 0.63 diversity, 0.374 similarity — heads specialize into different patterns

### Why Does This Happen?

**1. Information density per token**

In the nano model, each 4×4 patch covers only 16 pixels of a 32×32 image. With such limited information per token, there may not be enough variation for different heads to specialize. The old model's 16×16 patches on 224×224 images contain 256 pixels each — 16× more information per token.

**2. Sequence length and attention capacity**

With only 64 tokens, the nano model has a small "attention budget". The attention matrix is 64×64 = 4,096 entries. The old model's 196×196 = 38,416 entries provides more room for different heads to attend to different subsets.

**3. Position encoding effects**

RoPE encodes relative positions, which may encourage similar attention patterns across heads. Learned position embeddings can develop head-specific biases. However, this needs more investigation.

**4. Training dynamics**

The nano model may reach a local optimum where all heads collapse to similar patterns early in training, and never escape. With more tokens and information, the old model's heads have more "room" to differentiate.

### Implications

Despite head collapse, the nano model achieves **better linear probe accuracy** (~61.6% vs ~50% for old model). This suggests:

1. Head diversity may not be necessary for good representations
2. The nano model's uniform attention might still capture semantic features
3. Upscaling small images (old model approach) may introduce artifacts that hurt learning

> **Open question**: Would forcing head diversity (e.g., through regularization) improve the nano model further, or is the current behavior optimal for low-resolution inputs?

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