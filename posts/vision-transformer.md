---
title: Vision Transformer
date: 2025-01-04
tags: [deep-learning, vision, transformer, architecture]
summary: From first principles - what symmetry does ViT encode, and when does it beat CNNs?
---

# Vision Transformer

> From first principles: what symmetry does ViT encode, and when does it beat CNNs?

The Vision Transformer (ViT) applies the Transformer architecture to images by treating image patches as tokens. This document answers:
- **Why patches?** What problem does tokenization solve?
- **What symmetry?** ViT is permutation-equivariant — how does this compare to CNN's translation equivariance?
- **When does ViT win?** The inductive bias tradeoff: flexibility vs. sample efficiency.

---

## 1. The Problem: Applying Transformers to Images

### Transformers Operate on Sequences

The Transformer was designed for sequences (text). Self-attention computes:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d}}\right) V$$

For a sequence of $L$ tokens, this is $O(L^2)$ in both compute and memory.

**Problem:** A $224 \times 224$ image has 50,176 pixels. Treating each pixel as a token gives $L^2 \approx 2.5 \times 10^9$ — intractable.

### The Patch Solution

**Key insight:** Don't use pixels as tokens. Use *patches*.

Split the image into $p \times p$ non-overlapping patches:
- $224 \times 224$ image with $p = 16$ → $L = 196$ patches
- Quadratic cost: $196^2 = 38,416$ — tractable

Each patch is flattened and linearly projected to get a token embedding.

### What's Lost, What's Gained

**Lost (vs. CNN):**
- No built-in translation equivariance
- No local connectivity bias
- Must learn spatial relationships from scratch

**Gained:**
- Global receptive field from layer 1
- Flexible, input-dependent connectivity (attention)
- Same architecture for images, text, audio, etc.

---

## 2. Symmetry Analysis

### Self-Attention is Permutation-Equivariant

**Theorem.**
Self-attention (without positional encoding) is equivariant to permutations of the input sequence.

**Interpretation:** If you shuffle the input tokens, the output tokens shuffle the same way. Attention doesn't "know" about token order.

### Positional Encoding Breaks Symmetry

Pure permutation equivariance means the model can't distinguish token order. For images, spatial position matters.

**Solution:** Add positional embeddings to the patch embeddings. This *breaks* permutation symmetry — now the model can learn spatial structure.

**Key insight:** ViT starts with a *weaker* symmetry (permutation) and *learns* to break it appropriately. CNN starts with a *stronger* symmetry (translation) baked in.

### Comparison: CNN vs. ViT

| Property | CNN | ViT |
|----------|-----|-----|
| Built-in symmetry | Translation equivariance | Permutation equivariance |
| Spatial structure | Hard-coded (local kernels) | Learned (positional embeddings) |
| Receptive field | Grows with depth | Global from layer 1 |
| Inductive bias | Strong (locality, translation) | Weak (must learn spatial relations) |

**The tradeoff:**
- Strong inductive bias (CNN) → sample efficient, but less flexible
- Weak inductive bias (ViT) → needs more data, but can learn arbitrary patterns

---

## 3. The Scale Hypothesis

Dosovitskiy et al. (2021) found:
- On small/medium datasets (ImageNet-1k): CNN outperforms ViT
- On large datasets (ImageNet-21k, JFT-300M): ViT matches or exceeds CNN

**Hypothesis:** Inductive bias and data are substitutes.

- **Small data:** Strong inductive bias (CNN) helps — it encodes prior knowledge
- **Large data:** Weak inductive bias (ViT) helps — flexibility without constraints

**Analogy:**
- CNN: "I'll tell you that locality and translation matter"
- ViT: "Figure it out yourself — here's lots of data"

---

## 4. Architecture Details

### Full Pipeline

1. **Patchify:** Split image into non-overlapping patches
2. **Linear Projection:** Project each flattened patch to hidden dimension
3. **Add [CLS] + Positional Embeddings**
4. **Transformer Encoder (× N layers)**
5. **Output Head:** Use [CLS] token for classification

### Variants

| Model    | Layers | Hidden | Params |
|----------|--------|--------|--------|
| ViT-Base | 12     | 768    | 86M    |
| ViT-Large| 24     | 1024   | 307M   |
| ViT-Huge | 32     | 1280   | 632M   |

---

## 5. Key Takeaways

1. **Patches solve the quadratic problem** — 196 patches instead of 50k pixels
2. **Permutation equivariance is the base symmetry** — spatial structure is learned, not built-in
3. **Inductive bias trades off with data** — ViT needs scale but gains flexibility
4. **Attention enables dynamic connectivity** — the model decides what to attend to

---

## References

- Dosovitskiy et al. (2021) - An image is worth 16x16 words (ViT)
- Touvron et al. (2021) - Training data-efficient image transformers (DeiT)
- Liu et al. (2021) - Swin Transformer