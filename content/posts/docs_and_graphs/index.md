---
title: 'How Documents Met Graph Theory'
date: 2024-03-22
draft: false
description: "An introductory blog post to GNNs and Document AI"
ShareButtons: ['linkedin', 'x']
tags: ["DocAI", "Graphs"]
author: 'Andrea Gemelli'
ShowReadingTime: true
ShowToc: true
comments: true
---

In our daily life, we are submerged by piles of documents 🫠: burocracy, bills, insurances, etc. As humans, we invented this medium to vehicle important information! But how our brain processes documents? 🤔

One could think just about *reading* words sequentially! But we also naturally perceive relationships between different parts of a page, **exploiting the layout as a semantinc meaningful piece of information**! Think about titles and subtitles or pharagraph that structure a contract or about table cells whose meaning depends on the tables structure and the name of the columns!

This intuitive - yet effective - way of reading documents through relationships creates an exciting intersection between document analysis and graph theory 💡, which strongly inspired my PhD thesis "Connecting the DOCS: a graph-based approach to document understanding" [^0]. This article is an introductory version of its second chapter, summarizing the key aspects and interesting spots of this niche of Document AI.

## What is a *graph* anyway?

First proposed by Leonhard Euler in 1736 when solving the famous Seven Bridges of Königsberg problem [^1], a graph is **a collection of objects (nodes) and the relationships between them (edges)**. This elegant mathematical concept first appeared in a Nature paper about *"chemistry and algebra"* [^2] in 1878, but it wasn't until 1936 that graph theory got its foundations with its first textbook [^3].

![Examples of graphs](https://kidscodecs.com/wp-content/uploads/2013/11/puzzles-7-bridges-map-euler.jpg)
*The problem that started it all: Euler's visualization of the Seven Bridges of Königsberg*

The beauty of graphs lies in their natural ability to represent how we see patterns in the world. Think about it - when you look at a molecule, it's not just a bunch of atoms but a structured arrangement of chemical bonds. Similarly, when you use Google Maps, it's a weighted graph that find the best route for you under the hood!

## From Brain to Computer

Our understanding of how the brain processes visual information has profoundly influenced the Machine Learning research field. The multi-layer structure of neurons in our visual cortex, with simpler cells detecting basic patterns that get combined into more complex features [^4], inspired early artificial neural networks like the Neocognitron [^5] in the 1980s. This eventually evolved into modern Neural Networks - such as CNNs[^6] [^17], LSTM[^16], GANs[^18], Transformers[^19] - that revolutionized the machine learning fields and, whith more data and computing capabilities, started the **Deep Learning** era.

### Geometric Deep Learning

More recently, some researchers have unified various deep learning approaches under the framework of **Geometric Deep Learning** [^7]. This new term defines how different neural network architectures relate to each other and why they work so well for their specific domains. It is within this domain that graphs met deep learning, and their application started to really shine in several fields such as chemistry[^14] and social networks[^15].

Graph Neural Networks emerged in the early 2000s [^8] [^9] as a way to learn directly on graph structures. What makes GNNs special is their ability to learn from both the features of individual nodes and the relationships between them. Think of it like learning about a person not just by their characteristics, but also by understanding their social connections. As shown in the picture, several entities can be represented using domain-dependent structures such as graphs for molecules or social networks.

![Graphs representation of different entities](https://miro.medium.com/v2/resize:fit:1029/1*txzoFgR0XvAy4PpIgbUyvQ.png)
*Examples of graphs representing brain connections, chemicals and social networks (img credits [Bscarleth Gtz](https://medium.com/@bscarleth.gtz/introduction-to-graph-neural-networks-an-illustrated-guide-c3f19da2ba39))*

## Representing documents as graphs

Documents have always been created with precise logical arrangements of objects in relation to each other [^10]. This inherent structure makes them perfect candidates for graph representation. The journey of using graphs for document analysis started in the 1980s with hierarchical trees for page segmentation [^11], evolved through Voronoi diagrams for layout analysis [^12], and has now reached sophisticated graph-based representations that can capture complex document structures.

The modern approach to create a document graph representation typically follows these steps:

1. Define the nodes (these could be words, text lines, or larger document entities)
2. Create links between nodes using rules like k-nearest neighbors or visibility graphs
3. Add features to nodes (like position, text content, or visual characteristics)
4. Optionally add features to edges (like distances or relative positions)

![Evolution of document graph representations](images/timeline.jpg)
*How graph-like document representations evolved over time*

This graph-based approach to document understanding has several key advantages:

- **Structure matters**: Graphs can capture the spatial and logical relationships that are crucial for understanding documents
- **Efficiency**: Graph-based methods often require fewer parameters than other deep learning approaches while maintaining good performance
- **Versatility**: A single graph representation can be used to solve multiple document understanding tasks

### Doc2Graph to the rescue ⚔️

Building on these ideas, I developed Doc2Graph [^13], an open-source framework that puts these concepts into practice. Doc2Graph provides a task-agnostic approach to document understanding, allowing researchers and developers to represent any document as a graph structure. The framework is designed to be lightweight yet effective, handling multiple document understanding tasks with significantly fewer parameters than traditional approaches.

➡ Want to try it yourself? Check out the tutorial section of the [Doc2Graph repository](https://github.com/andreagemelli/doc2graph)!

## What's next?

As we continue to develop better ways to make computers understand documents, graph-based approaches have shown great promise. Whether it's extracting information from tables, understanding form layouts, or analyzing complex document structures, graphs provide a powerful inductive bias to tackle these challenges.

In the era of LLMs - and reduced pre-training and inference time and costs - can graphs and GNNs still be a valid competitor for Document AI?

## References

[^0]: Gemelli, A. (2024). Connecting the DOCS: a graph-based approach to document understanding. PhD thesis, University of Florence.
[^1]: Euler, L. (1741). Solutio problematis ad geometriam situs pertinentis. Commentarii academiae scientiarum Petropolitanae, 128-140.
[^2]: Sylvester, J. J. (1878). Chemistry and Algebra. Nature, 17(432), 284.
[^3]: Biggs, N., Lloyd, E. K., & Wilson, R. J. (1986). Graph Theory, 1736-1936. Oxford University Press.
[^4]: Hubel, D. H., & Wiesel, T. N. (1959). Receptive fields of single neurones in the cat's striate cortex. The Journal of physiology, 148(3), 574.
[^5]: Fukushima, K. (1980). Neocognitron: A self-organizing neural network model for a mechanism of pattern recognition unaffected by shift in position. Biological cybernetics, 36(4), 193-202.
[^6]: LeCun, Y., Bottou, L., Bengio, Y., & Haffner, P. (1998). Gradient-based learning applied to document recognition. Proceedings of the IEEE, 86(11), 2278-2324.
[^7]: Bronstein, M. M., Bruna, J., Cohen, T., & Veličković, P. (2021). Geometric deep learning: Grids, groups, graphs, geodesics, and gauges. arXiv preprint arXiv:2104.13478.
[^8]: Gori, M., Monfardini, G., & Scarselli, F. (2005). A new model for learning in graph domains. Proceedings IEEE IJCNN.
[^9]: Scarselli, F., Gori, M., Tsoi, A. C., Hagenbuchner, M., & Monfardini, G. (2009). The graph neural network model. IEEE transactions on neural networks, 20(1), 61-80.
[^10]: Haralick, R. M. (1994). Document image understanding: Geometric and logical layout. CVPR '94.
[^11]: Nagy, G., & Seth, S. (1984). Hierarchical representation of optically scanned documents. ICPR.
[^12]: Kise, K., Sato, A., & Iwata, M. (1998). Segmentation of page images using the area Voronoi diagram. Computer Vision and Image Understanding.
[^13]: Gemelli, A., Biswas, S., Civitelli, E., Lladós, J., & Marinai, S. (2022). Doc2Graph: A Task Agnostic Document Understanding Framework Based on Graph Neural Networks. In Computer Vision – ECCV 2022 Workshops (pp. 329-344).
[^14]: [AlphaFold blog post](https://deepmind.google/technologies/alphafold/) - AlphaFold, Google DeepMind
[^15]: [Temporal Graphs at Twitter](https://towardsdatascience.com/temporal-graph-networks-ab8f327f2efe) - Temporal Graph Networks, Bronstein and Emanuele Rossi medium post
[^16]: Sepp Hochreiter; Jürgen Schmidhuber (1997). Long short-term memory - Neural Computation. 9 (8): 1735–1780.
[^17]: Alex Krizhevsky, Ilya Sutskever, Geoffrey E. Hinton. ImageNet Classification with Deep Convolutional Neural Networks - NeurIPS 2012
[^18]: Ian J. Goodfellow et al. (2014), Generative Adversarial Networks
[^19]: Ashish Vaswani et al. (2017), Attention is all you need
