# Evaluation Criteria for ML Paper Review

Detailed criteria for each of the 7 evaluation dimensions.

## 1. Originality

**Core Question:** Does this paper present novel contributions?

**What Counts as Original:**
- Wholly novel methods or algorithms
- Creative combinations of existing ideas applied in new ways
- Application to a new domain or problem setting
- Removing restrictive assumptions from prior theoretical results
- Novel datasets that enable new research directions
- New problem formulations or evaluation frameworks
- Significant improvements that required non-obvious insights

**Red Flags:**
- Incremental changes without clear justification
- Missing citations to highly related prior work
- Claims of novelty that don't hold upon examination
- "Our method is the first to..." claims that are false

**Scoring Guide:**
- High: Clear novel contribution that advances the field
- Medium: Some novelty, but builds heavily on existing work
- Low: Marginal novelty, mostly incremental

## 2. Importance/Significance

**Core Question:** Does this work address an important problem?

**Indicators of Importance:**
- Addresses a fundamental question in ML
- High potential impact on applications
- Opens new research directions
- Resolves long-standing open problems
- Provides tools/methods others will build upon
- Connects disparate areas of research (bridge papers)

**Questions to Ask:**
- Will researchers cite and build on this work?
- Does it change how we think about a problem?
- What is the scope of impact (narrow vs. broad)?
- Is this timely given current research trends?

**Scoring Guide:**
- High: Significant impact expected, important problem
- Medium: Useful contribution, moderate impact
- Low: Limited significance or very narrow scope

## 3. Claims Support / Evidence Quality

**Core Question:** Are the paper's claims supported by the evidence?

**For Theoretical Claims:**
- Are proofs correct and complete?
- Are assumptions clearly stated and reasonable?
- Are the theoretical contributions non-trivial?
- Do the theorems actually support the paper's narrative?

**For Empirical Claims:**
- Do experiments actually test the stated hypotheses?
- Are the statistical analyses appropriate?
- Are confidence intervals or significance tests provided?
- Is there risk of cherry-picking results?

**Verification Checklist:**
- [ ] Checked key proofs (at least skim all, verify critical ones)
- [ ] Verified experimental methodology
- [ ] Checked if conclusions follow from results
- [ ] Looked for overclaiming or unsupported statements

## 4. Experimental Soundness

**Core Question:** Are the experiments well-designed and executed?

**Key Aspects:**

**Baselines:**
- Are baselines recent and competitive?
- Are baselines implemented fairly (same compute, tuning)?
- Are there missing obvious baselines?

**Datasets:**
- Are datasets appropriate for the claims?
- Is there train/val/test contamination risk?
- Are datasets described sufficiently for reproduction?

**Evaluation Metrics:**
- Are metrics appropriate for the task?
- Are multiple metrics reported?
- Is there risk of metric gaming?

**Ablations:**
- Are key components ablated?
- Do ablations support the claimed contributions?

**Hyperparameters:**
- Is tuning procedure described?
- Were baselines given equal tuning budget?

**Reproducibility:**
- Is code provided or promised?
- Are all details sufficient for reproduction?
- Are compute requirements stated?

## 5. Clarity of Presentation

**Core Question:** Is the paper well-written and organized?

**Writing Quality:**
- Is the writing clear and grammatically correct?
- Are technical terms defined?
- Is jargon explained for ML audience?
- Is notation consistent?

**Organization:**
- Is there a clear narrative arc?
- Does the introduction motivate the problem?
- Are contributions clearly stated?
- Is related work comprehensive and well-organized?
- Do figures/tables aid understanding?

**Accessibility:**
- Can an ML researcher outside this subfield follow the paper?
- Are the main ideas understandable without deep domain expertise?

## 6. Value to Research Community

**Core Question:** Will this work benefit the community?

**Positive Indicators:**
- Provides open-source code
- Releases new datasets
- Enables future research directions
- Provides practical tools or insights
- Negative results that save others' time
- Strong reproducibility practices

**Questions to Consider:**
- Will practitioners adopt this method?
- Will researchers build on these ideas?
- Does it provide reusable components (code, data, benchmarks)?

## 7. Contextualization in Prior Work

**Core Question:** Does the paper properly situate itself in the literature?

**What to Check:**
- Are key related works cited?
- Is the relationship to prior work clearly explained?
- Are differences and advantages clearly articulated?
- Is the paper honest about limitations relative to prior work?

**Red Flags:**
- Missing citations to highly relevant recent work
- Mischaracterization of prior work
- Unfair comparisons (e.g., older baselines only)
- Claims of being "first" when similar work exists

**Concurrent Work Policy:**
Papers made public within 4 months of submission deadline should be treated as concurrent—cannot expect authors to compare against them.
