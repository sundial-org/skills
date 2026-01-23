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

Evaluate whether claims are supported:

**Checklist to address:**
- Are claims supported by clear and convincing evidence?
- Which claims are problematic and why?
- Do proposed methods/evaluation criteria make sense for the problem?
- Did you check proofs for theoretical claims? Which ones? Issues?
- Did you check experimental designs/analyses? Which ones? Issues?
- Did you review supplementary material? Which parts?

**Example (well-supported):**
> The main claim that X outperforms Y on benchmark Z is well-supported by Table 2, which shows consistent improvements across all metrics with appropriate statistical significance testing (p < 0.05).

**Example (problematic):**
> The claim that the method is "robust to noise" (Section 4.2) is not convincingly supported. The noise experiments only test Gaussian noise at σ=0.1, while practical applications involve diverse noise types and magnitudes.

### 3. Relation to Prior Work

Address these questions:
- How are contributions related to broader scientific literature?
- Are there essential related works not cited?
- How well-versed are you with the literature? (private, not shown to authors)

**Example (good contextualization):**
> The paper builds appropriately on [foundational work]. The comparison to [recent baseline] is fair. One relevant missing reference is [paper], which addresses similar efficiency concerns.

**Example (missing context):**
> The key contribution is a linear-time algorithm. The paper cites only a quadratic-time algorithm [ABC'20] as prior work, but [DEF'24] from ICML 2024 already achieved O(n log n) time for this problem, which should be discussed and compared.

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

Be constructive. Good weaknesses:
- Are specific about the issue
- Explain severity (critical vs. minor)
- Suggest how to address when possible

**Example:**
> **W1. (Major)** The experiments compare against [baseline1] and [baseline2] from 2020, but more recent methods [baseline3] (2024) and [baseline4] (2023) achieve stronger results on these benchmarks and should be included.
>
> **W2. (Moderate)** The assumption in Theorem 2.1 that X is bounded may not hold in practice for [applications]. The paper should discuss when this assumption is reasonable.
>
> **W3. (Minor)** The notation switches between x and X for the same quantity between Sections 3 and 4.

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

Provide score (1-5) with justification:

| Score | Label | When to Use |
|-------|-------|-------------|
| 5 | Strong Accept | Excellent paper, top 5-10%, would advocate for acceptance |
| 4 | Accept | Good paper, solid contribution, belongs at venue |
| 3 | Weak Accept | Borderline, leans accept, has notable weaknesses |
| 2 | Weak Reject | Borderline, leans reject, insufficient contribution or issues |
| 1 | Reject | Clear rejection, significant issues |

**Example:**
> **Overall: 3 (Weak Accept)**
>
> This paper presents an interesting approach to [problem] with promising results. The theoretical analysis is novel (S1) and experiments show improvements (S2). However, the comparison to recent baselines is incomplete (W1), which makes it difficult to assess the true contribution. If the authors can address Q1 and Q2 satisfactorily in the rebuttal, I would be willing to increase my score.

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

What's missing before this is publishable:
- Missing sections or components
- Experiments needed
- Analysis required

**Example:**
> **G1.** The current experiments only use synthetic data. Standard benchmarks (Long Range Arena, PG-19) are essential for publication.
>
> **G2.** No comparison to existing efficient attention methods (Longformer, BigBird, Flash Attention). These are mandatory baselines.
>
> **G3.** Missing ablation study on sparsity hyperparameters.

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
