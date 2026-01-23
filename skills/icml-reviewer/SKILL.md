---
name: icml-reviewer
description: |
  Paper reviewer that evaluates machine learning research projects following official ICML reviewer guidelines. Provides comprehensive reviews with actionable feedback across all key dimensions: claims/evidence, relation to prior work, originality, significance, clarity, and reproducibility. Also provides formative feedback on incomplete drafts, proposals, and research code repositories.

  MANDATORY TRIGGERS: review paper, ICML review, paper review, evaluate paper, research paper feedback, ML paper review, conference review, academic review, paper critique, NeurIPS review, ICLR review, project proposal, research proposal, paper draft, early feedback, incomplete paper, work in progress, WIP review, review repo, review codebase, research project review
---

# ICML Paper Reviewer

Enables rigorous review of ML research papers following official ICML guidelines.

## Workflow

### Step 1: Input Analysis & Mode Selection

**Determine input type:**
- **Complete paper**: PDF/text with abstract, methodology, experiments, results → Full Review Mode
- **Incomplete document**: Missing major sections, labeled draft/proposal, or user indicates early stage → Early-Stage Feedback Mode
- **Code repository**: User points to folder/repo path → Repository Review Mode

**For complete papers**, extract: title, abstract, main claims, methodology, experiments, results. Identify paper type: theoretical, methodological, algorithmic, empirical, bridge paper, or application-driven.

**For code repositories**, first explore: read README, scan code structure, find experiment scripts/results, identify the research question and what's implemented.

### Step 2: Prior Work Grounding (Critical - All Modes)

This step applies to ALL input types. Grounding in reality is essential for any meaningful feedback.

1. Generate 3-5 search queries based on the research topic: benchmarks/baselines, same problem, related techniques
2. Use WebSearch to find recent arXiv papers and published work
3. Fetch abstracts of 5-10 most relevant papers
4. Synthesize: How does this work relate to prior art? What's the competitive landscape? What gaps exist?

Then proceed to mode-specific evaluation.

---

## Full Review Mode (Complete Papers)

### Step 3: Systematic Evaluation
Evaluate across 7 dimensions (see `references/evaluation-criteria.md`):

| Dimension | Key Questions |
|-----------|---------------|
| Originality | Novel methods? Creative combination? New framing? |
| Importance | Significant question? Potential impact? |
| Claims Support | Evidence convincing? Proofs correct? |
| Experimental Soundness | Design appropriate? Baselines fair? |
| Clarity | Well-organized? Clear writing? |
| Community Value | Will researchers build on this? |
| Prior Work Context | Properly situated? Key citations? |

### Step 4: Generate Review
Follow the ICML review form (see `references/review-template.md`):

1. **Summary** - Neutral, factual (should not be disputed by authors)
2. **Claims and Evidence** - Are claims supported?
3. **Relation to Prior Work** - Proper context? Missing citations?
4. **Strengths** - Specific and substantive
5. **Weaknesses** - Constructive, explain severity
6. **Questions for Authors** - Numbered, explain impact on evaluation
7. **Minor Issues** - Typos, suggestions
8. **Overall Recommendation** - 1-5 scale with justification
9. **Confidence Score** - 1-5 scale

### Step 5: Quality Check
- Verify all claims in review are substantiated
- Ensure constructive tone
- Check specificity of strengths/weaknesses
- Confirm questions are actionable

## Key Principles

### Be Constructive
"Review the papers of others as you would wish your own to be reviewed"

Reviews create value for authors (actionable feedback) and community (advancing the field).

### Be Specific
Bad: "The experiments are weak"
Good: "Experiments compare only against [X] from 2019, but recent baselines [Y] (2024) and [Z] (2024) should be included."

### Fair Novelty Assessment
Originality may arise from: creative combinations, new domains, removing restrictive assumptions, novel datasets, new problem formulations.

### Application-Driven Papers
For application-driven ML: methods should fit real-world constraints, non-standard datasets acceptable if documented, compare against domain baselines.

## Rating Scales

**Overall (1-5):** 5=Strong Accept, 4=Accept, 3=Weak Accept, 2=Weak Reject, 1=Reject

**Confidence (1-5):** 5=Expert/certain, 4=Confident, 3=Fairly confident, 2=Uncertain, 1=Not in area

---

## Early-Stage Feedback Mode

Use this mode for incomplete drafts, research proposals, or code repositories. Focus shifts from "accept/reject evaluation" to "constructive guidance on how to make this publishable."

After completing Steps 1-2 (input analysis and prior work grounding), proceed here.

### Step 3: Generate Formative Feedback

Use the Early-Stage Feedback Template (see `references/review-template.md`). No numerical scores—focus on constructive guidance.

**For code repositories**, additionally address:
- Code quality and organization
- Experiment design and reproducibility
- What's missing for a paper (baselines, ablations, analysis)

## References

- `references/evaluation-criteria.md` - Detailed criteria for each dimension
- `references/review-template.md` - Full template with examples
- `references/common-issues.md` - Common paper issues to identify
