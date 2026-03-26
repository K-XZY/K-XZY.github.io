
In this post, we will look into how design choices of main-stream computer vision SSL representation learning methods affects what's being learned, and what's been assumed about the data in these approaches. 

We will first look up the dicotomy of SSL, go through the limitation of reconstruction based methods, and the core challenge faced by encoder only methods. Then, we will analyze Masked Modeling, and Invariance Learning, their method, and reason about the inductive bias baked into them which fail on GUI (Graphical User Interface) data. Finally, we will link back to some of our earlier results on learning a representation model of GUI, to see why Action Conditioned JEPA led to some interesting results.

# The main approaches for SSL
We can break SSL methods into categories:
1. Encoder-Decoder: Auto-encoder (AE) vs Encoder only (EO).
2. Latent structure: Continuous (AE), Gaussian (VAE), Discrete (VQ-VAE). And within VQ we have: Heirarchical (Residual VQ), Look up (LFQ/BSQ).
3. Learning objective: Reconstruction on pixels(MSE, MAE), Adverserial (VQ-GAN). And Latent based, Invariance (DINO), Masked Modeling, Conditional, Modality alignment (CLIP).
4. Architecture: ViT, CNN, etc. 

Note, in theory, next token prediction is 
self-supervised. However, it doesn't return a explicit representation for its content, and will focus more on representation learning, not on generative methods.

# To reconstruct or not?

## Reconstruction main stream - VQ-GAN
VQ-GAN, a method that combined both VQ-VAE with GAN (Generative Adverserial Network) is undoubtably the most successful reconstruction based SSL method by far. It kept the benefit of a discrete codebook and vastly improved the reconstruction quality lacking in vanilla VQ-VAE (cite: VQ-VAE). Adopted widely as a choice for foundational encoders (cite: MaskViT, to BSQ, Infinity), World Models (cite: Genie-1), Open-vocabulary Language Modeling (i.e. Pixel based LLM) (cite: Pixel) etc.

However, having a generative objective would mean that the latent space has to capture information that serves it best. Hence why we see a trend from the original VQ-VAE to today's Infinity, of having larger and larger effective codebook. Going from a finite of a few hundreds, to literally 2^1024 combined over several scales. 


### Progression of VQ-GAN
Here are the equations of VQ-VAE and Infinity Tokenizer:
$$
To be added
$$

$$
To be added
$$

The wide adoptation of these model comes from the discreteness of their latent space. And a generative model built with such space as target can be trained with teacher forcing and directly generalize to perform auto-regression with very few other tricks needed (e.g. Bit-corruption in Infinity), which is highly parrallelizable, and offloads the complexity onto the auto-encoder. 

The euqation for learning text conditioned image generation on a traditional VQ-VAE:
$$
something about max P(patch | masked patches, text Phi)
$$

And a more complex version on the recent (cite: Infinity 2025) multi-scale binary spherical quantization scheme:
$$
something on max P(Patch on each scale | corruption(all previous scales), text Phi)
$$

Note, the corruption is applied here to simulate distribution shift during inference where model leans on its own output as input. Similar things can be done on VQ, however, most VQ use iterative decoding rather than next-scale prediction. We won't focus much on these two background topics, you can read these two for the difference (cite: MaskGiT, Infinity).

### Limitation of VQ-GAN for latent reasoning

As we can see, there are a couple limitations to these methods which recent progressions are neglecting:
1. These VQ-VAE methods requires the prediction of joint distributions that are orthogonal vectors to each other. (fact check this). Which alone makes learning harder.
2. They are optimized with reconstruction in mind, thus forcing the latent space to capture representations on a level lower than semantics. This also forces predictor networks to learn composition of these features, essentially making the predictor larger.

Note, here, a predictor is a model that performs inference with input from latent space of an encoder. e.g. P(y|E(x)), then P is a predictor and E is the encoder. Predictor can not reason about informaiton is lost during E.


## Learning without Reconstruction
Having seen the above limitation, it is natural to wonder what we could do without the reconstruction objective. More generally, one can certainly see Encoder only methods asa superset, where the decoder of VQ-GAN is a tool for calculating a specific type of loss, just as the descriminator is for VQ-GAN, a component that could be discarded later. Thus, all SSL can essentially be described as:
$$
\Epsilon \leftarrow E(X)\\
\min\ L = L_\S (E) + L_\text{reg}
$$
That is, a combination of some sort of structure and regularization. 

But two main issues arrises:
1. Collapse and regularization: How do we avoid the encoder learning a degenerative solution that zero out the $L_\S$ term? And adding other structures into the latent space (e.g. if you want to make it quantized again).
2. What is being learned?

The first question has been addressed by many methods, such as EMA, Stop-gradient, InfoCE, and recently SIGReg. (cite papers)

However, the second question is much harder, and usually requires deeper intuitions into mathematics lesser known. For instance, the following learning can be used in a SSL Representation Learning task:
- Invariance: $Mean Mean of augmentation$ See dino. 
- Masking: $ $ See JEPA.
- Causal: $ $. 

However, it isn't intuitive why:
1. Certain features are direct results of certain objective. e.g. Objectivity from Invariance loss. Spatialness comes from where?
2. Why invariance != not learning. e.g. Augment the color doesn't mean latent will be color-blind. 

Instead of relying on compute and data hungry predictive tasks, encoder only SSL requires careful engineering and understanding of the learning objective to learn the same representation that would eventually emerge in prediction only models (e.g. GPT has internal world models ish thing). And it is such intentness that led to small and more accurate model. (e.g. VL-JEPA).

# ImageNet, vs GUI
Now we have done the long introduction about SSL. We can move towards GUI data, which we've been experimenting on for most of 2025. To see why some methods won't work on GUI, we need to first see why they work on ImageNet.

ImageNet is the most popular SSL dataset, the essential benchmark for foundational SSL. Here are some images from ImageNet. 
(4 images in a row)

As you can see, these data are mostly object centric, that is, has a clear protagonist. that is, if you want to stick a label on it, it's just one word. This is because ImageNet was designed first to benchmark classification tasks. And most SSL methods rely on Linear Probe Classification for a show of performance. Being object centric means that on ImageNet, the parts of image would roughly sum up to be the object it's filming. That is, if you chop the image into a dozen random small chunks, adding them up gives you the object. And replacing some of those chunks would remove the object we are discussing. Since objects = sum of its parts.

We can also see that ImageNet has continuous features, that is, if you go from one part of the image to another, you'd mostly be seeing the smame object. 

Here are a couple examples of GUI. (4 images in a row).
Note, there isn't a clear central class for a screenshot. Unlike a picture of a dog, where dog matters more than the background, the entire UI screen is worth capturing. You can mask out all the apps, and still call it a home screen. But, masking out the boarder of the screenshot, then you could imagine this being just another screenshot in the photo album. 

Thus, UI is non-continuous and also not object centric. If we look at the loss functions for DINO (the invariance loss):
$$
L_\text{inv}
$$
We can see that it is summing up parts to represent each part of the whole. This wouldn't make sense for UI, since replacing all parts of a home screen doesn't make it less of a homescreen. (2 images of home screen that are entirely different)

Then, what is it that matter for UI? The answer has two parts:
1. Token semantics.
2. Causality.

When you plot the feature map of a ImageNet data and UI data, both encoded from DINO. You will see that the features are much more continuous and less variant on ImageNet than GUI. More importantly, language is left out in the UI tokens. The model literally can't read. And functionality is missing.
(Show plots from DINO-v3 or v2)

On the other hand, what makes a homescreen a homescreen? and what makes settings app different from settings page of an app? It is how you got their, and the context that matters. In other words, you shouldn't be able to tell what app you are on, without knowing how you got there.










