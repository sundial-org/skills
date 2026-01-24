# Paper Writing Reference

Guide for writing scientific papers based on AI Co-Scientist experiments, following ICML formatting and academic conventions.

## Overview

After completing experimentation (Stage 4), you may optionally write a paper documenting your findings. This guide provides section-by-section prompts and best practices.

## Paper Structure (ICML Format)

1. Title & Abstract
2. Introduction
3. Related Work
4. Method
5. Experiments
6. Results
7. Discussion
8. Conclusion
9. References

---

## Section-by-Section Prompts

### 1. Title

**Prompt:**
```
Generate a paper title that:
- Is concise (10-15 words max)
- Clearly states the main contribution
- Avoids jargon unless field-standard
- Does not oversell with words like "revolutionary" or "breakthrough"

Based on hypothesis: [HYPOTHESIS]
Key finding: [BEST RESULT FROM TREE]
```

**Example:**
```
Hypothesis: "Data augmentation improves adversarial robustness"
Finding: "75% augmentation improves adversarial accuracy by 12%"

Title: "Aggressive Data Augmentation Improves Adversarial Robustness in Image Classification"
```

### 2. Abstract (150-250 words)

**Prompt:**
```
Write an abstract with exactly 4 components:

1. PROBLEM (1-2 sentences): What problem does this work address?
2. APPROACH (2-3 sentences): What did we do? What's novel?
3. RESULTS (2-3 sentences): What did we find? Include key metrics.
4. SIGNIFICANCE (1 sentence): Why does this matter?

Hypothesis: [HYPOTHESIS]
Method: [APPROACH FROM STAGE 2]
Key results: [TOP 3 RESULTS FROM GET-BEST]
```

### 3. Introduction

**Prompt:**
```
Write an introduction following this structure:

Paragraph 1 - Context and Problem:
- What is the broader context?
- What specific problem are we addressing?
- Why is this problem important?

Paragraph 2 - Prior Work Gap:
- What has been tried before?
- What gap exists in prior work?
- (Reference Stage 0 findings)

Paragraph 3 - Our Approach:
- What is our hypothesis?
- How do we test it?
- What makes our approach different?

Paragraph 4 - Contributions:
- List 2-4 concrete contributions
- State them precisely and measurably

Prior work summary: [STAGE 0 OUTPUT]
Our hypothesis: [HYPOTHESIS]
Key results: [TOP RESULTS]
```

### 4. Related Work

**Prompt:**
```
Write a related work section that:

1. Groups prior work into 2-4 thematic categories
2. For each category:
   - Summarize the main approaches
   - Cite 3-5 key papers
   - Explain how our work differs

3. End with a paragraph positioning our contribution

Categories from Stage 0: [CATEGORIES]
Prior work reviewed: [STAGE 0 FINDINGS]
Our differentiation: [WHAT'S UNIQUE]
```

### 5. Method

**Prompt:**
```
Write a method section covering:

1. Problem Formulation:
   - Formal definition of the problem
   - Notation and variables

2. Our Approach:
   - Step-by-step description of the method
   - Key algorithmic choices
   - Why these choices (justify from Stage 1-2)

3. Implementation Details:
   - Sufficient detail for reproducibility
   - Code references if applicable

Independent variables: [FROM STAGE 2]
Dependent variables: [FROM STAGE 2]
Control variables: [FROM STAGE 2]
```

### 6. Experiments

**Prompt:**
```
Write an experiments section covering:

1. Experimental Setup:
   - Datasets used
   - Baselines compared
   - Evaluation metrics
   - Hardware/software environment

2. Experimental Procedure:
   - How experiments were conducted
   - Number of trials/seeds
   - Statistical methodology

Baseline results: [ROOT NODE METRICS]
Experimental tree: [TREE STRUCTURE SUMMARY]
Total experiments: [NODE COUNT]
```

### 7. Results

**Prompt:**
```
Write a results section that:

1. Presents main results clearly:
   - Tables for quantitative comparisons
   - Figures for trends and visualizations
   - Statistical significance tests

2. Analyzes results:
   - Does the data support the hypothesis?
   - What patterns emerge?
   - Any unexpected findings?

3. Reports ablation studies:
   - Which components matter most?
   - Sensitivity to hyperparameters

Best nodes: [FROM GET-BEST]
Ablation results: [STAGE 4 ABLATIONS]
Statistical measures: [CONFIDENCE INTERVALS]
```

### 8. Discussion

**Prompt:**
```
Write a discussion section that:

1. Interprets findings:
   - What do the results mean?
   - Do they confirm or refute the hypothesis?

2. Addresses limitations:
   - What couldn't we test?
   - What assumptions did we make?

3. Suggests future work:
   - What questions remain open?
   - What would be valuable next steps?

Hypothesis confirmed: [YES/NO/PARTIALLY]
Limitations: [FROM EXPERIMENT NOTES]
Open questions: [IDENTIFIED DURING STAGE 3-4]
```

### 9. Conclusion

**Prompt:**
```
Write a conclusion (1-2 paragraphs) that:

1. Restates the problem and approach (briefly)
2. Summarizes key findings
3. States the main takeaway
4. Does NOT introduce new information

Key finding: [SINGLE MOST IMPORTANT RESULT]
Main contribution: [PRIMARY CONTRIBUTION]
```

---

## Figure Generation

### Best Practices

1. **One message per figure** - Each figure should convey one clear point
2. **High contrast** - Readable in grayscale and at small sizes
3. **Consistent style** - Use same colors, fonts across all figures
4. **Clear labels** - Axis labels, legends, titles
5. **Reference in text** - Every figure must be referenced

### Common Figure Types

```python
# Learning curves
import matplotlib.pyplot as plt
plt.figure(figsize=(8, 5))
plt.plot(steps, train_acc, label='Train')
plt.plot(steps, val_acc, label='Validation')
plt.xlabel('Training Steps')
plt.ylabel('Accuracy')
plt.legend()
plt.savefig('figures/learning_curves.pdf', bbox_inches='tight')

# Bar comparison
import numpy as np
methods = ['Baseline', 'Ours (25%)', 'Ours (50%)', 'Ours (75%)']
values = [0.78, 0.82, 0.85, 0.88]
plt.bar(methods, values)
plt.ylabel('Accuracy')
plt.savefig('figures/comparison.pdf', bbox_inches='tight')
```

---

## Citation Workflow

### Finding Citations

1. Use web search for relevant papers:
   ```
   Search: "[topic] [year] survey" or "[method] [application]"
   ```

2. Extract citation information:
   - Authors, title, venue, year
   - DOI if available

### BibTeX Format

```bibtex
@inproceedings{author2024title,
  title={Paper Title Here},
  author={Last, First and Last2, First2},
  booktitle={Proceedings of ICML},
  year={2024}
}

@article{author2024journal,
  title={Article Title},
  author={Last, First},
  journal={Journal Name},
  volume={1},
  pages={1--10},
  year={2024}
}
```

### Citing in LaTeX

```latex
Prior work~\cite{author2024title} showed that...
Several methods have been proposed~\citep{a2024,b2024,c2024}.
```

---

## LaTeX Compilation

### Requirements

- pdflatex
- bibtex
- ICML style files (in assets/icml-template/)

### Compile Script

```bash
bash scripts/compile_latex.sh <paper_directory>
```

This runs:
1. `pdflatex template.tex`
2. `bibtex template`
3. `pdflatex template.tex` (twice more for references)

### Common Issues

**Missing references:**
- Check .bib file syntax
- Run bibtex again

**Figure not found:**
- Use relative paths from paper directory
- Check file extension (.pdf preferred)

**Overfull hbox:**
- Break long lines
- Use `\url{}` for URLs

---

## Quality Checklist

Before submission, verify:

- [ ] Title is concise and accurate
- [ ] Abstract covers problem, approach, results, significance
- [ ] All claims supported by experimental evidence
- [ ] All figures referenced in text
- [ ] All citations present in references
- [ ] No orphaned references (cited but not defined)
- [ ] Page limit respected
- [ ] Anonymization (if required)
- [ ] Reproducibility statement included

---

## Template Location

ICML LaTeX template files are in:
```
assets/icml-template/
├── template.tex
├── icml2024.sty
├── fancyhdr.sty
└── ...
```

Copy to your paper directory and modify template.tex.
