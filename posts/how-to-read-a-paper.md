---
title: How to Read a Paper
date: 2025-01-05
tags: [methodology]
summary: A personal guide on reading academic papers effectively, focusing on insights and active thinking.
---

# How to Read a Paper

Step one is always to read the abstract to know:
1. What problem are they tackling.
2. How are the benchmarking themselves?
3. How do they solve the problem and beat the sucker (prior work) on what aspect by how much?

Step two is to see if the code and data is public.

Step three, know what you want! (New method? just some insight? pure exploration? wanting to find a good benchmark? or a sucker to kick?)

## Reading for insights

要注意找作者解释为什么的时候. 比如说:
- VL-JEPA: 作者解释了为什么要使用continuous feature？以及稍微解释了为什么这样让学习变得更简单。
- Attention is all you need:作者从信息传播距离的角度上解释了，为什么要使用 attention,而不是传统的Recurrent Architecture。
- Infinity：作者解释了，为什么使用了BSQ或者LFQ就可以达到一个无限token的一个效果。

还要注意作者没解释什么. 以及为什么没解释。有几种可能：
- 说来不好听。-> 潜在的机会和pitfall！
- 他也不知道，就靠intuition。-> 记下来。
- 他觉得是个common sense或者大家都懂的知识。-> 问Claude!

## Active Thinking for Understanding

It is easy to know **How does it do it**, than understanding **What does it do** and **Why does that 'how' do a 'what'**.

Similarly, prioritize **understanding the nature of the problem**, rather than the algorithm.

Finally, always think about **so what? or then what?** This is when you realize a known problems can finally maybe be solved!

### Example: VQ-GAN vs JEPA

- VQ-GAN latent space + Transformer = MASKGiT = MASKViT ; They can generate images by iterating over the latent codebook.
- JEPA encoder latent space + Transformer = JEPA ; Add a Decoder. They can generate images too by iterating over the latent continuous vectors.

看起来两个方法在做同样的事情。但其实并不是!

1. **MASKViT**: Encoder只负责编码外观,以便于Reconstruction. Transformer Predictor负责学习Semantics + 推理Reasoning+理解外观用于生成图片.
2. **JEPA**: Encoder主要学习Semantics。Predictor负责推理Reasoning！

## Reading for Re-production

Sometimes, we just want to use a method on new dataset. In this case, we only need to know a few things well:

1. How much compute did they use? `GPU type x Hour x node count`
2. What dataset did they use and how big is it?
3. How and why does the model do well on this dataset?

## What makes a great paper

> It's not enough to be enough.

好的论文并不一定需要巨大的算力或者过高的跑分。但必须有：

1. 明确的insight，别人看完一定要在理解上有所收获
2. 精简的方法，多一个模块没必要，少一个参数就跑不成
3. 可复制，比如代码清晰的开源，数据开源