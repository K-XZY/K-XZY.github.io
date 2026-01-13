
It seems like the main contribution of LeJEPA is a provably optimal regularization term for joint embedding modeling.

To start with, we can go through some basic concepts:
1. What is Joint Embedding Modeling. What is JEPA. Why do we want it i.e. why learn invariance?
2. What is the issue with collapse and how do people used to avoid it. (Stop Gradient, EMA, InfoCE), attempt to understand why they can somewhat avoid collapse.

Then, we can have a look at SIGReg, the regularization term proposed by LeJEPA. We will look into the math and intuition behind the proof, as well as the comparing the math with the other techniques. 

Finally, we will go through the experiment I did on CIFAR-100 using a ViT-nano. (Training, Abaltion with the Regularization, and InfoICE)

On top of this, we can take a look at human perceptions. Modern representation encoders seem to require high resolution and large model to get good semantics, consuming much more power and takes longer comparing to the human eye + brain. Is that true? and if that is the case, why is that?

# Experiment Set up and Results
## Encoder only Invariance Learning

TODO: Put down the augmentation procedure.

We take average of all views with respect to all other views right?

This can be seen as saying - "The patch representation equals to the mean of all representations of that patch"

An essential invariance of how objectivity is composed.

TODO: Put down the loss function here in mathematical form.

## Training
We trained two models, one on 32x32 and the other on 512x512. Tho the later didn't finish training as it was too big.

TODO: Get the wandb training curve via:
```
import wandb
    api = wandb.Api()
    run = api.run("/gui-project/lejepa/runs/t5axw0jr")
Show history data:

print(run.history())
```
TODO: Include that data for plotting on the website too. Not just a static screen shot. Keep the method simple and platform augnostic.

### Hyper-parameters
TODO: Put down the h-param.

## Linear-Probe
One non-biased way to estimate performance of the encoder is via linear probing. Essentially, applying a linear transform to the embedding space to map it to the label space. It is non-biased since the linear transformation lack the representation power to additional features (i.e. information that is compressed in the embedding but not linearly separable). (Better way to say this?)

As we can see in the plot (to be included), the linear probe performance rises as the training progresses. Note, the performance is about 6% lower than LeJEPA's reported performance since we trained on CIFAR-100 while theirs is trained on ImageNet, and they used ViT-large comparing to our nano model. Both are evaluated on CIFAR-100, on data unseen during pre-training.

The under-trained higher resolution model performance growed and flattened at 40% accuracy. 

## PCA of features
See figure. Notice that the model learns representation in both resolution, tho clearer details for the higher resolutions despite it being significantly under trained. It is also worth noticing that even a randomly initialized ViT can perform some level of segementation according to colors and edges as we noted in the experiment.

(Need to add image)

## Attention at each layer
We look at our CLS token and its attendence to all other patch features.

See image. (need to add image)

## Attention Analysis: Nano vs Old Model

We conducted a detailed attention analysis comparing three model configurations using the same fox image from CIFAR-100:

| Metric | nano 32x32 | nano 64x64 (extrapolation) | old model 224x224 |
|--------|------------|---------------------------|-------------------|
| Entropy | 4.08 | 5.42 | 4.97 |
| Sparsity | 19% | 100% | 88% |
| Max Attention | 0.029 | 0.010 | 0.044 |
| Head Diversity | 0.24 | 0.31 | 0.63 |
| Head Similarity | 0.756 | - | 0.374 |

### Key Findings

#### 1. Entropy
- nano 32x32 has the lowest entropy (4.08), meaning attention is most concentrated
- 64x64 extrapolation entropy rises to 5.42, attention becomes very dispersed
- old model is in the middle (4.97)

#### 2. Sparsity
- 32x32 nano has only 19% of patches below threshold, indicating attention is distributed across many locations
- 64x64 extrapolation is 100% sparse, meaning almost all attention values are very small
- old model is 88% sparse, attention relatively concentrated on few positions

#### 3. Head Diversity (Most Important Finding)
- nano model head diversity is only 0.24, while old model has 0.63
- Looking at head similarity matrix: nano's 8 heads have average similarity of 0.756 (very similar), while old model only 0.374
- This indicates nano model's attention heads are learning very similar patterns, not differentiating

#### 4. Visualization Comparison
- nano 32x32: attention distribution is relatively uniform, can see fox outline and bottom region
- nano 64x64: attention is very blurry and dispersed, RoPE extrapolation works poorly
- old model 224x224: attention is very focused on one point (on the fox), almost no attention elsewhere

### Hypothesized Causes

**Nano model head collapse problem**: 8 heads learned almost identical attention patterns. Possible reasons:
- 32x32 images are too small, not enough information to support 8 different attention patterns
- Not enough training time/data for heads to differentiate
- Model capacity may be too large (512 dim, 8 heads) for 64 tokens

**RoPE extrapolation failure**: From 32x32 to 64x64, attention completely collapses (100% sparse). This indicates the model only learned relative position relationships within 8x8 grid, cannot generalize to 16x16 grid.

**Old model healthier**: 224x224 model has higher head diversity, different heads learned different attention patterns. Possible reasons:
- Larger images provide more visual information
- 196 tokens (14x14) compared to 64 tokens (8x8) has more room for heads to differentiate

Note: The old model has ~20% worse linear probe performance compared to the nano model, though it may not have been fully trained.

TODO: What else is missing that we did?

TODO: Add a table on LeJEPA performance and our reproduction. Include model size and architecture field. (Paper is locally available)
