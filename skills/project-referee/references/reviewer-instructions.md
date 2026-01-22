# ICML 2025 Reviewer Instructions

## Table of Contents
1. [Summary](#1-summary)
2. [Claims and Evidence](#2-claims-and-evidence)
3. [Relation to Prior Work](#3-relation-to-prior-work)
4. [Other Aspects](#4-other-aspects)
5. [Questions for Authors](#5-questions-for-authors)
6. [Ethical Issues](#6-ethical-issues)
7. [Code of Conduct](#7-code-of-conduct)
8. [Overall Recommendation](#8-overall-recommendation)
9. [Confidence Rating](#9-confidence-rating)
10. [Review Output Format](#10-review-output-format)

---

## 1. Summary

Briefly summarize the paper's:
- Main problem addressed
- Key contributions claimed
- Primary methods/algorithms proposed
- Main empirical/theoretical results

This should be factual, not evaluative. Authors should be able to agree with your summary.

## 2. Claims and Evidence

Evaluate whether claims are supported by clear, convincing evidence.

**For each major claim, assess:**
- Is the claim clearly stated?
- What evidence supports it?
- Is the evidence sufficient and appropriate?
- Are there gaps between claims and evidence?

**Specific checks:**
- **Theoretical claims**: Verify proofs. Note which ones checked and issues found.
- **Empirical claims**: Sound experimental design? Valid analyses?
- **Methods**: Do proposed approaches make sense for the problem?
- **Evaluation**: Are benchmarks/metrics appropriate?
- **Code/Supplementary**: Review if provided. Note what was checked.

## 3. Relation to Prior Work

**Coverage assessment:**
- Are key related works cited and discussed?
- Is the relationship to prior work clearly explained?
- Are there important missing citations?

**Domain-specific citations to check:**
- Neuro-symbolic AI methods
- LLM reasoning approaches (CoT, self-refinement, tool use)
- Symbolic solvers (Prover9, Z3, SAT solvers)
- Logical reasoning benchmarks
- Auto-formalization work

**Self-assessment**: Rate familiarity with the literature.

**Concurrent work note**: Papers public within 4 months of submission deadline are concurrent and need not be cited.

## 4. Other Aspects

**Originality:**
- Is the core idea novel?
- For applications: Novel combinations, removed assumptions, or real-world applications constitute originality
- How does it compare to Logic-LM and LINC specifically?

**Significance:**
- Will this influence future research?
- Does it solve an important problem?
- Are improvements substantial or incremental?

**Clarity:**
- Well-written and organized?
- Methods clearly explained?
- Figures/tables informative?
- Symbolic formulation clearly described?

**Soundness:**
- Methods technically correct?
- Experiments well-designed?
- Statistical analyses appropriate?
- Approach reproducible?

**Additional comments:**
- List typos or minor issues
- Presentation improvement suggestions
- Questions about design choices

## 5. Questions for Authors

Formulate important questions where responses would impact evaluation.

**Guidelines:**
- Number questions for easy reference
- Explain how different answers would affect assessment
- Focus on clarifications that matter

**Example format:**
> Q1: The paper claims X but Table 2 shows Y. Can you clarify? If X is incorrect, this significantly weakens the contribution because...

**Suggested question areas:**
- Failure modes of symbolic formulation
- Choice of specific solvers
- Generalization to other logical formalisms
- Computational costs
- Baseline comparison methodology

## 6. Ethical Issues

Flag concerns requiring ethics review:

**Categories:**
- Discrimination/Bias/Fairness Concerns
- Inappropriate Potential Applications
- Privacy and Security
- Legal Compliance (GDPR, copyright, terms of use)
- Research Integrity Issues (plagiarism)
- Responsible Research Practice (IRB, documentation)

**Common issues in this domain:**
- Datasets with problematic content
- Potential misuse of reasoning systems
- Bias in logical reasoning tasks
- Privacy in example problems

## 7. Code of Conduct

Affirm: "While performing my duties as a reviewer (including writing reviews and participating in discussions), I have and will continue to abide by the ICML code of conduct."

## 8. Overall Recommendation

**Rating scale:**
- **5**: Strong accept - Would argue for accepting
- **4**: Accept - Vote for acceptance
- **3**: Weak accept - Leaning accept but could go either way
- **2**: Weak reject - Leaning reject but could go either way
- **1**: Reject - Vote for rejection

**Justification based on:**
- Strength of contributions
- Quality of execution
- Significance of results
- Clarity of presentation
- Relation to prior work

## 9. Confidence Rating

**Scale (1-5):**
- **5**: Absolutely certain - Very familiar with related work, checked details carefully
- **4**: Confident - Unlikely misunderstood, probably familiar with most related work
- **3**: Fairly confident - Possibly missed some aspects or related work
- **2**: Willing to defend but possibly missed central points
- **1**: Educated guess - Not my area or paper difficult to understand

---

## 10. Review Output Format

```markdown
# Review of [Paper Title]

## Manuscript Stage: [Early Draft / Mid-Stage Draft / Final Submission]

## Summary
[Factual summary - 3-5 sentences]

## Strengths
1. [Strength 1]
2. [Strength 2]
...

## Weaknesses
1. [Weakness 1]
2. [Weakness 2]
...

## Detailed Comments

### Claims and Evidence
[Assessment of whether claims are supported]

### Relation to Prior Work
[Discussion of related work coverage and missing citations]

### Comparison to Reference Papers
**vs. Logic-LM:**
- [Comparison points]

**vs. LINC:**
- [Comparison points]

### Additional Aspects
**Originality:** [Assessment]
**Significance:** [Assessment]
**Clarity:** [Assessment]
**Soundness:** [Assessment]

## Questions for Authors
1. [Question 1]
2. [Question 2]
...

## Missing Related Work
[Specific papers that should be cited]

## Minor Issues
[Typos, presentation suggestions]

## Ethical Concerns
[Flag issues or state "No ethical concerns identified"]

## Overall Recommendation
**Rating:** [1-5]
**Confidence:** [1-5]

**Justification:**
[Explanation of rating]

## Suggestions for Improvement
[Prioritized, actionable suggestions]
```
