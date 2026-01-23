# Evaluation Criteria for ML Paper Review

Detailed criteria for each of the 7 evaluation dimensions.

## 1. Originality

**Core Question:** Does this paper present novel contributions **beyond what exists in the recent literature**?

**Critical evaluation process:**
1. List the paper's claimed novel contributions
2. Search literature for each claimed contribution
3. Identify what is actually novel vs. incremental vs. already done

**What Counts as Truly Original (rare):**
- Wholly novel methods or algorithms **with no close prior work**
- Creative combinations that yield surprising new capabilities **not previously shown**
- New problem formulations **that will spawn follow-up research**
- Significant theoretical advances (removing assumptions, tighter bounds)

**What Is Incremental (common):**
- Minor modifications to existing methods (different activation, loss function, etc.)
- Applying known methods to new datasets without new insights
- Engineering improvements without conceptual novelty
- Marginal quantitative improvements (e.g., 1-2% over prior work)

**Red Flags:**
- Incremental changes without clear justification
- Missing citations to highly related prior work **from past 2 years**
- Claims of novelty that don't hold upon literature search
- "Our method is the first to..." claims that are false or misleading

**Scoring Guide (be conservative):**
- **High**: Clear novel contribution **verified against recent literature**; will likely be influential
- **Medium**: Some novelty, but **similar ideas exist** or builds heavily on one prior work
- **Low**: Marginal novelty, mostly incremental, or **novelty claims don't hold up**

## 2. Importance/Significance

**Core Question:** Does this work address an important problem **that the community cares about**?

**Critical evaluation process:**
1. What problem does this solve?
2. Who would use this? What would change if everyone adopted it?
3. Check literature: How many recent papers work on this problem?
4. Is this a real problem or an artificial one created for this paper?

**Indicators of Importance (require evidence, not claims):**
- Addresses a fundamental question in ML **with many recent papers on it**
- High potential impact on applications **with clear use cases**
- Opens new research directions **that others will pursue**
- Resolves long-standing open problems **acknowledged in the literature**
- Provides tools/methods others will build upon **and actually use**
- Connects disparate areas of research (bridge papers)

**Questions to Ask:**
- Will researchers cite and build on this work, or ignore it?
- Does it change how we think about a problem, or just add noise?
- What is the scope of impact (narrow vs. broad)?
- Is this timely given current research trends, or outdated/niche?
- **What evidence suggests this problem matters (citations, applications, etc.)?**

**Scoring Guide (require concrete evidence):**
- **High**: Significant impact expected, important problem **with clear evidence of community interest**
- **Medium**: Useful contribution, moderate impact, **some researchers will care**
- **Low**: Limited significance, very narrow scope, **or artificial problem**

## 3. Claims Support / Evidence Quality

**Core Question:** Are the paper's claims supported by the evidence **and grounded in what the literature shows**?

**For Theoretical Claims:**
- Are proofs correct and complete?
- Are assumptions clearly stated and reasonable?
- Are the theoretical contributions non-trivial?
- Do the theorems actually support the paper's narrative?
- **How do theoretical results compare to bounds/guarantees in related work?**

**For Empirical Claims:**
- Do experiments actually test the stated hypotheses?
- Are the statistical analyses appropriate?
- Are confidence intervals or significance tests provided?
- Is there risk of cherry-picking results?
- **Do claimed improvements match what similar papers show is possible?**
- **Are baselines implemented the same way as in their original papers?**

**Verification Checklist:**
- [ ] Checked key proofs (at least skim all, verify critical ones)
- [ ] Verified experimental methodology **matches standards in adjacent work**
- [ ] Checked if conclusions follow from results
- [ ] Looked for overclaiming or unsupported statements
- [ ] **Compared methodology to how similar papers approach the problem**
- [ ] **Verified that claimed advantages are actually demonstrated, not assumed**

## 4. Experimental Soundness

**Core Question:** Are the experiments well-designed and executed **following best practices from the literature**?

**Key Aspects:**

**Baselines (Critical—check against literature):**
- Are baselines recent (2023+) and state-of-the-art?
- **What baselines do adjacent papers use? Are those included here?**
- Are baselines implemented fairly (same compute, tuning)?
- **Are baseline numbers taken from original papers or re-implemented (which can be unfair)?**
- Are there missing obvious baselines that adjacent work compares against?

**Datasets:**
- Are datasets appropriate for the claims?
- **Are these the standard benchmarks used in adjacent work?**
- Is there train/val/test contamination risk?
- Are datasets described sufficiently for reproduction?

**Evaluation Metrics:**
- Are metrics appropriate for the task?
- **Are these the same metrics adjacent papers report?**
- Are multiple metrics reported?
- Is there risk of metric gaming?

**Ablations:**
- Are key components ablated?
- Do ablations support the claimed contributions?
- **Do ablations follow the same rigor as in related work?**

**Hyperparameters:**
- Is tuning procedure described?
- Were baselines given equal tuning budget?
- **Is tuning approach consistent with how adjacent work does it?**

**Reproducibility:**
- Is code provided or promised?
- Are all details sufficient for reproduction?
- Are compute requirements stated?

**Critical check**: Pull up 2-3 highly related papers. Does this paper's experimental setup match the rigor and fairness of those papers?

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

**Core Question:** Does the paper properly situate itself in the literature **and cite the right papers**?

**Critical evaluation process:**
1. From your literature search, list 5-10 most relevant papers
2. Check: Which are cited? Which are missing?
3. For cited papers: Are they characterized accurately?
4. For missing papers: Why weren't they cited? This is a red flag.

**What to Check:**
- **Are the most relevant papers from your literature search cited?**
- **Does the methodology build on or diverge from standard approaches in cited work?**
- Is the relationship to prior work clearly explained?
- Are differences and advantages clearly articulated **with evidence**?
- Is the paper honest about limitations relative to prior work?
- **Do the authors cite papers that use similar methodologies?**
- **Are methodological choices justified relative to how adjacent work does it?**

**Red Flags:**
- **Missing citations to papers that directly solve the same problem**
- **Missing citations to papers with similar methodologies**
- Mischaracterization of prior work to make current work look better
- Unfair comparisons (e.g., baselines from 2020 when 2024 work exists)
- Claims of being "first" when similar work exists
- **Methodology that differs from standard approaches without justification**
- **Ignoring negative results from prior work that contradict current claims**

**Concurrent Work Policy:**
Papers made public within 4 months of submission deadline should be treated as concurrent—cannot expect authors to compare against them.

**Evaluation mindset**: If your literature search found it, the authors should have found it too. Missing highly relevant work is a major flaw.
