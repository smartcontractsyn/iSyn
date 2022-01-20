## Data Explanation

Experiments of RQ1 are used for measuring the quality of Jutitia-synthesized smart contracts. In detail, we quantify the editing distances between ground truth smart contracts and synthesized smart contracts using *GumTreeDiff* editing scripts, and reveal the structural differences between them based on *Deckard Vector Cosine Similarity*. The evaluation results are summarized as follows

### GumTreeDiff

| Contract | Total | Move | Update | Insert | Delete | Tree-Insert | Tree-Delete |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| SPA0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SPA1 | 2 | 0 | 1 | 0 | 0 | 1 | 0 |
| SPA2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SPA3 | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| SPA4 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SPA5 | 3 | 0 | 3 | 0 | 0 | 0 | 0 |
| SPA6 | 25 | 1 | 2 | 0 | 8 | 1 | 13 |
| SPA7 | 4 | 0 | 2 | 0 | 0 | 1 | 1 |
| SPA8 | 3 | 0 | 1 | 0 | 0 | 1 | 1 |
| SPA9 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PA0 | 3 | 0 | 1 | 0 | 0 | 2 | 0 |
| PA1 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PA2 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |
| PA3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| PA4 | 3 | 0 | 1 | 0 | 0 | 0 | 2 |
| PA5 | 5 | 1 | 0 | 0 | 0 | 2 | 2 |
| SECPA0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SECPA1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| SECPA2 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SECPA3 | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| SA0 | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| SA1 | 2 | 0 | 2 | 0 | 0 | 0 | 0 |

### Deckard Vector Cosine Similarity

| Contract | Vec cosine | Difference 1-norm | Difference 2-norm |
| ---- | ---- | ---- | ---- |
| PA0 | 0.9960320231885408 | 497.0 | 153.11107079502776 |
| PA1 | 1.0 | 0.0 | 0.0 |
| PA2 | 1.0 | 0.0 | 0.0 |
| PA3 | 1.0 | 0.0 | 0.0 |
| PA4 | 0.9960320231885408 | 497.0 | 153.11107079502776 |
| PA5 | 0.9999904928290128 | 6.0 | 2.449489742783178 |
| SPA0 | 1.0 | 0.0 | 0.0 |
| SPA1 | 0.9997253922961399 | 204.0 | 56.444663166680336 |
| SPA2 | 1.0 | 0.0 | 0.0 |
| SPA3 | 1.0 | 0.0 | 0.0 |
| SPA4 | 1.0 | 0.0 | 0.0 |
| SPA5 | 1.0 | 0.0 | 0.0 |
| SPA6 | 0.9991066183739653 | 229.0 | 67.08949247087803 |
| SPA7 | 0.9999848043680769 | 6.0 | 2.449489742783178 |
| SPA8 | 0.9999633021603991 | 6.0 | 2.449489742783178 |
| SPA9 | 1.0 | 0.0 | 0.0 |
| SECPA0 | 1.0 | 0.0 | 0.0 |
| SECPA1 | 1.0 | 0.0 | 0.0 |
| SECPA2 | 1.0 | 0.0 | 0.0 |
| SECPA3 | 1.0 | 0.0 | 0.0 |
| SA0 | 1.0 | 0.0 | 0.0 |
| SA1 | 1.0 | 0.0 | 0.0 |