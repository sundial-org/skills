# ICML Review Template

Complete template following official ICML 2025 review form structure.

## Review Structure

### 1. Summary

Write a neutral, factual summary that:
- Describes the main contributions claimed by the authors
- Summarizes key methods and results
- Should NOT be disputed by authors or other readers
- Should NOT contain your critique

**Example:**
> This paper proposes X, a method for [task]. The key idea is [approach]. The authors evaluate on [datasets] and show improvements of [N]% over [baselines]. The main contributions are: (1) [contribution 1], (2) [contribution 2], and (3) [contribution 3].

### 2. Claims and Evidence

Evaluate whether claims are supported **and grounded in what the literature shows**:

**Checklist to address:**
- Are claims supported by clear and convincing evidence?
- **Do claimed improvements align with what adjacent work shows is achievable?**
- **Are baselines implemented the same way as in their original papers?**
- Which claims are problematic and why?
- Do proposed methods/evaluation criteria make sense for the problem?
- Did you check proofs for theoretical claims? Which ones? Issues?
- Did you check experimental designs/analyses? Which ones? Issues?
- Did you review supplementary material? Which parts?

**Example (well-supported with literature grounding):**
> The main claim that X outperforms Y on benchmark Z is well-supported by Table 2, which shows consistent improvements across all metrics with appropriate statistical significance testing (p < 0.05). The improvement magnitude (+3.2%) is reasonable compared to recent work [Paper A] (+2.8%) and [Paper B] (+3.5%), suggesting the results are credible.

**Example (problematic - not grounded in literature):**
> The claim of "state-of-the-art" performance (Abstract, Section 5) is questionable. While the method outperforms baseline [X] from 2020, it does not compare to recent methods [Y, 2024] and [Z, 2023], which report higher scores on the same benchmarks. Without these comparisons, the SOTA claim is unsupported.

**Example (problematic - methodology differs from standard):**
> The claim that the method is "robust to noise" (Section 4.2) is not convincingly supported. The noise experiments only test Gaussian noise at σ=0.1, while adjacent work [Paper C, Paper D] tests multiple noise types and magnitudes up to σ=0.5. The evaluation is insufficient by field standards.

### 3. Relation to Prior Work

Address these questions:
- How are contributions related to broader scientific literature?
- **What specific papers from your literature search are missing from citations?**
- **Does the methodology align with how adjacent papers approach the problem?**
- Are there essential related works not cited?
- How well-versed are you with the literature? (private, not shown to authors)

**Example (good contextualization):**
> The paper builds appropriately on [foundational work]. The comparison to [recent baseline] is fair and uses the same experimental setup as [original paper]. The methodology follows standard practices in this area, similar to [adjacent work 1, 2]. One relevant missing reference is [paper], which addresses similar efficiency concerns and reports comparable improvements.

**Example (major missing citations):**
> **This is a critical weakness.** The paper claims to be "the first efficient approach" but my literature search found several highly relevant papers not cited:
> - [Paper A, 2024] addresses the exact same problem with a similar transformer-based approach
> - [Paper B, 2023] reports superior results (15.2 vs. 12.8 in this paper) on the same benchmark
> - [Paper C, 2024] uses the same loss function and architectural components
>
> These papers directly contradict the novelty claims and change the evaluation of this work. The authors must discuss and compare against this work.

**Example (methodology not grounded):**
> The paper uses a non-standard evaluation protocol (80/20 train/test split, no validation set) that differs from how [Paper X, Y, Z] evaluate on this benchmark (standard is 70/10/20 split). This makes results incomparable to prior work and suggests possible overfitting.

### 4. Strengths

Be specific and substantive. Good strengths are:
- Tied to specific sections/results
- Explain WHY something is a strength
- Not generic ("well-written paper")

**Example:**
> **S1.** The theoretical analysis (Theorem 3.2) provides the first convergence guarantee for this problem class, with a tight bound that matches known lower bounds.
>
> **S2.** The ablation study (Table 4) clearly demonstrates that each component contributes to the final performance, with component X providing the largest gain (+5.2%).
>
> **S3.** The code release and detailed hyperparameter settings (Appendix C) ensure strong reproducibility.

### 5. Weaknesses

Be constructive **and literature-grounded**. Good weaknesses:
- Are specific about the issue
- **Reference specific papers from the literature**
- Explain severity (critical vs. minor)
- Suggest how to address when possible

**Example:**
> **W1. (Critical)** The experiments compare against [baseline1] and [baseline2] from 2020, but more recent methods [baseline3] (2024) and [baseline4] (2023) achieve stronger results on these benchmarks (17.3 and 16.8 vs. the proposed method's 15.2) and should be included. Without comparison to these methods, it's impossible to assess whether this represents progress.
>
> **W2. (Major)** The methodology deviates from field standards without justification. Adjacent work [Paper A, B, C] all use dataset split X and metric Y, while this paper uses split Z and metric W, making results incomparable. The paper should either follow standard practices or provide strong justification for the deviation.
>
> **W3. (Moderate)** The assumption in Theorem 2.1 that X is bounded may not hold in practice for [applications]. The paper should discuss when this assumption is reasonable. Related work [Paper D] relaxes this assumption—how does this paper's result compare?
>
> **W4. (Minor)** The notation switches between x and X for the same quantity between Sections 3 and 4.

### 6. Questions for Authors

Number your questions and explain how answers affect evaluation:

**Example:**
> **Q1.** In Table 3, the variance for method X appears much higher than baselines. Is this consistent across random seeds? (If high variance is inherent to the method, this would affect my assessment of practical utility.)
>
> **Q2.** The paper claims linear time complexity, but the description of Step 3 in Algorithm 1 seems to require O(n²) pairwise comparisons. Could you clarify? (This affects my assessment of the theoretical contribution.)
>
> **Q3.** Have you tested on [domain Y]? The problem formulation seems applicable there. (This is not critical but would strengthen the paper.)

### 7. Minor Issues / Typos

**Example:**
> - Line 142: "their" should be "there"
> - Figure 3 caption mentions "blue line" but the plot uses green
> - Reference [15] appears to be incomplete

### 8. Overall Recommendation

Provide score (1-5) with justification **grounded in literature comparison**:

| Score | Label | When to Use | Frequency |
|-------|-------|-------------|-----------|
| 5 | Strong Accept | Excellent paper, top 5-10%, will be influential, no major flaws | Rare |
| 4 | Accept | Good paper, solid contribution, rigorous execution, clear improvement over literature | Uncommon |
| 3 | Weak Accept | Borderline accept, some merit but notable limitations or incremental | Common |
| 2 | Weak Reject | Borderline reject, insufficient contribution or major methodological issues | Common |
| 1 | Reject | Clear rejection, fundamental flaws or no contribution | When warranted |

**Example (score 2 - common):**
> **Overall: 2 (Weak Reject)**
>
> While the paper tackles an interesting problem, the contribution is insufficient relative to existing work. The main issues are: (1) Missing comparisons to recent methods [X, Y, Z] that achieve stronger results (W1), (2) The claimed novelty of component A is contradicted by [Paper B] which proposed the same technique (W3), and (3) The experimental setup deviates from standards without justification (W2). The work appears incremental rather than a significant advance over the literature.

**Example (score 3 - common):**
> **Overall: 3 (Weak Accept)**
>
> This paper presents an interesting approach to [problem] with promising results. The theoretical analysis is novel compared to prior work (S1) and experiments show improvements over most baselines (S2). However, the comparison to recent baselines is incomplete—[Paper X] from 2024 is not compared (W1), which makes it difficult to fully assess the contribution. If the authors can address Q1 and Q2 satisfactorily in the rebuttal, I would be willing to increase my score.

**Example (score 4 - uncommon, require strong evidence):**
> **Overall: 4 (Accept)**
>
> This is a solid paper that makes clear contributions beyond the literature. The proposed method achieves consistent improvements over all recent baselines [X, Y, Z] from 2023-2024 across multiple benchmarks (S1). The experimental design is rigorous and follows field standards. The ablations clearly demonstrate that the novel components contribute to performance (S2). While there are minor writing issues (W3), these do not detract from the solid technical contribution. This work will be useful to the community.

**Calibration reminder**: If you find yourself giving mostly 4s and 5s, you're being too generous. Most papers should receive 2s or 3s.

### 9. Confidence Score

| Score | Meaning |
|-------|---------|
| 5 | Absolutely certain. Expert in this exact area, checked details carefully. |
| 4 | Confident but not certain. Familiar with related work, unlikely to have missed major issues. |
| 3 | Fairly confident. May have missed some aspects or unfamiliar with some related work. |
| 2 | Uncertain. Likely missed central parts or unfamiliar with related work. |
| 1 | Educated guess. Not in area of expertise, submission difficult to understand. |

---

## Anti-Patterns to Avoid

**Generic criticism:**
- Bad: "The experiments are not convincing"
- Good: "The experiments only test on synthetic data; evaluation on [real benchmark] would strengthen claims"

**Unsupported assertions:**
- Bad: "This approach won't scale"
- Good: "The O(n³) complexity of Algorithm 2 may not scale to datasets larger than [N], based on the reported runtime of 4 hours for n=10000"

**Dismissive tone:**
- Bad: "The authors seem to not understand X"
- Good: "The discussion of X appears to have some gaps; specifically..."

**Personal attacks:**
- Never criticize authors personally
- Focus on the work, not the people

---

## Early-Stage Feedback Template

Use this template for incomplete drafts, research proposals, and code repositories. No numerical scores—provide formative, forward-looking feedback.

### 1. Understanding

Summarize what the project aims to accomplish:
- Research question or problem being addressed
- Proposed approach or methodology
- Current state (what exists vs. what's planned)

**Example:**
> This project aims to improve transformer efficiency for long sequences by introducing a sparse attention mechanism. The current implementation includes the core attention module and preliminary experiments on synthetic data. The paper draft covers motivation and method but lacks experiments on standard benchmarks.

### 2. Strengths of the Direction

What's promising about this research direction:
- Why the problem matters
- What's compelling about the proposed approach
- Any encouraging preliminary results

**Example:**
> **S1.** The problem of quadratic attention cost is highly relevant, with clear practical applications in document understanding and genomics.
>
> **S2.** The proposed sparsity pattern is well-motivated by the observation that attention weights are typically concentrated, and preliminary results suggest 3x speedup with minimal quality loss.

### 3. Key Gaps to Address

What's missing before this is publishable **based on literature standards**:
- Missing sections or components
- Experiments needed to match what adjacent papers do
- Analysis required
- **Missing baselines that recent papers compare against**

**Example:**
> **G1. (Critical)** The current experiments only use synthetic data. Based on recent work in this area [Paper A, B, C], standard benchmarks (Long Range Arena, PG-19) are essential for publication. All three cited papers use these benchmarks, so they're the community standard.
>
> **G2. (Critical)** No comparison to existing efficient attention methods (Longformer, BigBird, Flash Attention). These are mandatory baselines—every recent paper in efficient transformers compares to these. Without them, the paper won't be competitive.
>
> **G3. (Important)** Missing ablation study on sparsity hyperparameters. Adjacent work [Paper D] shows that sparsity ratio significantly affects the efficiency-quality tradeoff, so this needs thorough analysis.

### 4. Methodology Concerns

Potential issues with the proposed approach:
- Assumptions that may not hold
- Scalability concerns
- Edge cases or failure modes

**Example:**
> **C1.** The sparsity pattern assumes local context is most important, which may not hold for tasks requiring global reasoning (e.g., summarization).
>
> **C2.** The method requires a fixed sequence length at initialization—unclear how to handle variable-length inputs in practice.

### 5. Suggested Next Steps

Prioritized actionable items to move toward publication:

**Example:**
> 1. **High priority:** Implement Long Range Arena benchmark suite—this is the standard evaluation for efficient transformers.
> 2. **High priority:** Add Longformer and Flash Attention as baselines.
> 3. **Medium priority:** Conduct ablation on sparsity ratio (currently fixed at 10%).
> 4. **Lower priority:** Extend to variable-length sequences.

### 6. Positioning Advice

How to frame and differentiate this work:

**Example:**
> The current framing emphasizes computational efficiency, but several methods already achieve similar speedups. Consider emphasizing the unique aspect: your method maintains *exact* attention for important tokens while approximating others, unlike methods that approximate everywhere. This "hybrid exact-approximate" angle could differentiate the contribution.
