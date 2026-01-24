# Paper Review Reference

Guide for reviewing and improving scientific papers written with AI Co-Scientist.

## Review Criteria

Papers are evaluated on four primary criteria, each scored 1-5:

### 1. Originality (1-5)

**Questions:**
- Does the paper present a novel contribution?
- Is the hypothesis interesting and non-obvious?
- Are the experiments designed to answer questions that haven't been answered?

**Scoring:**
- 5: Highly original, opens new research direction
- 4: Novel contribution with clear differentiation from prior work
- 3: Incremental but solid contribution
- 2: Limited novelty, mostly replicating existing work
- 1: No apparent novelty

### 2. Clarity (1-5)

**Questions:**
- Is the paper well-written and easy to follow?
- Are the claims clearly stated?
- Is the methodology reproducible from the description?
- Are figures and tables clear and informative?

**Scoring:**
- 5: Exceptionally clear, could be understood by non-experts
- 4: Well-written, methodology clear
- 3: Adequate clarity, some ambiguities
- 2: Difficult to follow in places
- 1: Unclear or confusing throughout

### 3. Soundness (1-5)

**Questions:**
- Is the experimental methodology rigorous?
- Are the statistical analyses appropriate?
- Do the conclusions follow from the evidence?
- Are limitations acknowledged?

**Scoring:**
- 5: Rigorous methodology, strong statistical support
- 4: Sound methodology with minor gaps
- 3: Adequate but some methodological concerns
- 2: Significant methodological issues
- 1: Fundamentally flawed methodology

### 4. Significance (1-5)

**Questions:**
- Are the findings important to the field?
- Would other researchers build on this work?
- Does it advance understanding or practice?

**Scoring:**
- 5: Major advance, likely to be highly cited
- 4: Significant contribution to the field
- 3: Useful contribution of moderate impact
- 2: Limited significance
- 1: No apparent significance

---

## Self-Review Checklist

### Structure & Formatting
- [ ] Title accurately reflects content
- [ ] Abstract is 150-250 words and covers all key points
- [ ] Sections follow logical order
- [ ] Page limit is respected
- [ ] Formatting follows venue requirements

### Technical Content
- [ ] Hypothesis is clearly stated
- [ ] Variables are defined (independent, dependent, control)
- [ ] Methodology is reproducible
- [ ] Statistical tests are appropriate
- [ ] Confidence intervals or error bars provided
- [ ] Ablation studies included

### Claims & Evidence
- [ ] All claims are supported by evidence
- [ ] Results are not overclaimed
- [ ] Limitations are discussed
- [ ] Negative results are reported (if applicable)

### Figures & Tables
- [ ] All figures are referenced in text
- [ ] Figures are readable at print size
- [ ] Axis labels and legends are clear
- [ ] Tables have clear headers
- [ ] Captions are informative

### References
- [ ] All citations are complete
- [ ] No orphaned references
- [ ] Key prior work is cited
- [ ] Recent relevant work is included

---

## Figure Review Process

Use vision capabilities to review each figure:

### Figure Review Prompt
```
Review this figure for a scientific paper:

1. Clarity: Is the message immediately clear?
2. Labels: Are axes, legends, and titles readable?
3. Data presentation: Is this the best visualization for this data?
4. Style: Is it consistent with academic standards?
5. Accessibility: Is it readable in grayscale?

Provide specific suggestions for improvement.
```

### Common Figure Issues

**Readability:**
- Font too small
- Low contrast colors
- Missing axis labels
- Cluttered legend

**Data Presentation:**
- Wrong chart type for data
- Misleading scales
- Missing error bars
- Inconsistent styling

**Improvement Suggestions:**
```python
# Increase font sizes
plt.rcParams.update({'font.size': 12})

# Use colorblind-friendly palette
import seaborn as sns
sns.set_palette("colorblind")

# Add error bars
plt.errorbar(x, y, yerr=std, capsize=3)

# Improve legend placement
plt.legend(loc='upper right', framealpha=0.9)
```

---

## Revision Workflow

### 1. Initial Self-Review
Run through the self-review checklist above. Document all issues found.

### 2. Figure Review
For each figure:
```
1. Load figure image
2. Apply figure review prompt
3. Document issues
4. Regenerate if needed
```

### 3. Address Issues by Priority

**High Priority (must fix):**
- Methodological flaws
- Unsupported claims
- Missing key results
- Unclear hypothesis

**Medium Priority (should fix):**
- Clarity issues
- Missing citations
- Figure improvements
- Statistical presentation

**Low Priority (nice to have):**
- Writing polish
- Additional visualizations
- Extended discussion

### 4. Re-Review After Revisions
After making changes, re-run relevant checks to ensure issues are resolved.

---

## Common Reviewer Concerns

### "The contribution is incremental"
**Response strategies:**
- Emphasize what's novel in the approach
- Show clear improvement over baselines
- Discuss practical implications

### "The experiments are insufficient"
**Response strategies:**
- Add ablation studies
- Include more baselines
- Test on additional datasets
- Add statistical significance tests

### "The claims are overclaimed"
**Response strategies:**
- Soften language ("suggests" vs "proves")
- Add caveats and limitations
- Ensure all claims have direct evidence

### "The paper is hard to follow"
**Response strategies:**
- Add overview/roadmap paragraph
- Use consistent notation
- Add transition sentences between sections
- Simplify complex sentences

---

## Review Output Template

```markdown
## Paper Review Summary

### Overall Assessment
[1-2 sentence summary of the paper's contribution and quality]

### Scores
- Originality: X/5
- Clarity: X/5
- Soundness: X/5
- Significance: X/5
- **Overall: X/5**

### Strengths
1. [Strength 1]
2. [Strength 2]
3. [Strength 3]

### Weaknesses
1. [Weakness 1]
2. [Weakness 2]
3. [Weakness 3]

### Detailed Comments

#### Major Issues
- [Issue requiring significant revision]

#### Minor Issues
- [Smaller issue or suggestion]

#### Typos/Formatting
- [Specific corrections]

### Recommendation
[ ] Accept
[ ] Minor revision
[ ] Major revision
[ ] Reject
```

---

## Using Review Feedback

### Organizing Responses

For each reviewer comment:
1. Quote the concern
2. Explain your response
3. Describe changes made
4. Point to specific sections/lines

### Response Letter Format
```markdown
## Response to Reviewer 1

### Comment 1.1
> "The experiments lack statistical significance tests"

**Response:** We have added statistical significance tests throughout the results section. Specifically:
- Table 2 now includes p-values from paired t-tests
- Section 4.2 reports 95% confidence intervals
- All comparisons showing p < 0.05 are marked with asterisks

**Changes:** See Section 4.2, Table 2, and new Appendix B.
```
