---
title: Foundations of Information Theory
date: 2025-01-03
tags: [information-theory, math, foundations]
summary: Self-information, entropy, mutual information, and KL divergence — the core concepts.
---

# Foundations of Information Theory

This note covers the core concepts: self-information, entropy, mutual information, and KL divergence.

---

## 1. Self-Information (Surprisal)

The self-information of an event with probability $p$ is:
$$I(x) = -\log p(x)$$

**Three requirements that derive this:**
1. **Monotonic:** unlikely events are more informative
2. **Additive:** independent events' information adds
3. **Continuous**

The only function satisfying these is $I(p) = -k \log(p)$ for some $k > 0$.

---

## 2. Shannon Entropy

The entropy of a random variable $X$ is the expected self-information:
$$H(X) = \mathbb{E}[I(X)] = -\sum_{i=1}^{n} p(x_i) \log_2 p(x_i)$$

It measures the average uncertainty in a system:
- Entropy is 0 when perfectly predictable
- Maximal when all probabilities are equal

---

## 3. Conditional Entropy

The conditional entropy $H(X|Y)$ measures remaining uncertainty about $X$ after observing $Y$:
$$H(X|Y) = -\sum_{x,y} p(x,y) \log p(x|y)$$

**Chain Rule:**
$$H(X,Y) = H(Y) + H(X|Y)$$

**Key property:** $H(X|Y) \leq H(X)$ — conditioning can never *increase* uncertainty on average.

---

## 4. Mutual Information

Mutual information measures how much knowing $Y$ reduces uncertainty about $X$:
$$I(X;Y) = H(X) - H(X|Y)$$

**Properties:**
- Symmetric: $I(X;Y) = I(Y;X)$
- Non-negative: $I(X;Y) \geq 0$
- $I(X;Y) = 0$ iff $X$ and $Y$ are independent

**Symmetric form:**
$$I(X;Y) = H(X) + H(Y) - H(X,Y)$$

---

## 5. KL Divergence

The Kullback-Leibler divergence from $Q$ to $P$ is:
$$D_{KL}(P \| Q) = \sum_x p(x) \log \frac{p(x)}{q(x)}$$

**Intuition:** If you design a code optimized for $Q$ but the true distribution is $P$, KL divergence is the *extra* bits you waste on average.

**Properties:**
- Non-negative: $D_{KL}(P \| Q) \geq 0$
- $D_{KL}(P \| Q) = 0$ iff $P = Q$
- **Not symmetric:** $D_{KL}(P \| Q) \neq D_{KL}(Q \| P)$

**Connection to Mutual Information:**
$$I(X;Y) = D_{KL}(P(X,Y) \| P(X)P(Y))$$

---

## 6. Unified View

All information quantities are expectations of log-probabilities:

| Quantity | Definition | Measures |
|----------|------------|----------|
| $H(X)$ | $\mathbb{E}[-\log p(X)]$ | Uncertainty in $X$ |
| $H(X\|Y)$ | $\mathbb{E}[-\log p(X\|Y)]$ | Uncertainty in $X$ given $Y$ |
| $I(X;Y)$ | $\mathbb{E}\left[\log \frac{p(X,Y)}{p(X)p(Y)}\right]$ | Dependence between $X$ and $Y$ |

The expectation is always over the joint distribution.

---

## Key Exercises

**Q1.** You flip a fair coin and get heads. Your friend flips a biased coin (90% heads) and also gets heads. Who received more information?

**Q2.** If $I(X;Y) = H(X)$, what does this tell you about $X$ and $Y$?

**Q3.** In a VAE, why do we use $D_{KL}(q(z|x) \| p(z))$ instead of $D_{KL}(p(z) \| q(z|x))$?