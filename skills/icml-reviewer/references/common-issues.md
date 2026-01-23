# Common Issues in ML Papers

A checklist of common problems to look for when reviewing.

## Experimental Issues

### Baseline Problems
- **Outdated baselines**: Comparing only against methods from 3+ years ago
- **Unfair implementation**: Better tuning/compute for proposed method than baselines
- **Missing obvious baselines**: Not comparing against standard approaches in the area
- **Cherry-picked baselines**: Selecting weak baselines to look better

### Dataset Problems
- **Train/test leakage**: Information from test set influencing training
- **Preprocessing leakage**: Normalization or feature extraction using test data statistics
- **Insufficient validation**: No held-out test set, only validation accuracy reported
- **Non-standard splits**: Custom splits that may favor the method
- **Missing dataset details**: Can't reproduce data preprocessing

### Statistical Issues
- **No variance reporting**: Single run results without standard deviations
- **Significance testing**: No statistical tests for claimed improvements
- **P-hacking risk**: Many comparisons without correction
- **Small effect sizes**: Statistically significant but practically meaningless improvements
- **Inappropriate metrics**: Metrics that don't align with the actual goal

### Ablation Problems
- **Missing ablations**: Key components not individually evaluated
- **Confounded ablations**: Multiple changes between ablation conditions
- **Incomplete ablations**: Some components never removed

## Theoretical Issues

### Proof Problems
- **Missing cases**: Proofs that don't cover all cases
- **Unstated assumptions**: Implicit assumptions not listed
- **Circular reasoning**: Conclusions assumed in premises
- **Gaps in logic**: Steps that don't follow
- **Wrong constants**: Mathematical errors in bounds

### Assumption Problems
- **Unrealistic assumptions**: Assumptions that never hold in practice
- **Unstated assumptions**: Assumptions hidden in notation or definitions
- **Assumption violations**: Experiments don't satisfy theoretical assumptions
- **Over-strong assumptions**: Unnecessarily restrictive conditions

## Writing Issues

### Clarity Problems
- **Undefined notation**: Symbols used before definition
- **Inconsistent terminology**: Same concept called different names
- **Jargon overload**: Domain terms not explained for ML audience
- **Missing method details**: Can't implement from description alone

### Organization Problems
- **Buried contributions**: Main contributions unclear until late in paper
- **Poor motivation**: Why should reader care not established early
- **Disorganized related work**: Random list instead of structured comparison
- **Results before methods**: Confusing ordering

### Overclaiming
- **Superlatives**: "Revolutionary", "solves", "completely addresses"
- **Unsupported generalization**: "Works for all X" when tested on 2 instances
- **First claims**: "First to" when prior work exists
- **Strawman comparisons**: Misrepresenting prior work to look better

## Reproducibility Issues

### Missing Information
- **Hyperparameters**: Key settings not reported
- **Architecture details**: Model configurations incomplete
- **Training details**: Learning rate schedules, optimizers, etc.
- **Hardware/software**: No mention of compute used
- **Random seeds**: Not reported, can't reproduce variance

### Code/Data Problems
- **No code release**: No promise or timeline for code
- **Incomplete code**: Code missing key components
- **No data access**: Proprietary data with no path to access
- **Preprocessing not documented**: Can't recreate input pipeline

## Ethics Issues

### Potential Harms
- **Dual use**: Technology easily weaponized
- **Bias amplification**: Method may encode/amplify harmful biases
- **Privacy risks**: Method could enable surveillance or de-anonymization
- **Environmental cost**: Excessive compute without justification

### Research Integrity
- **Plagiarism**: Text or ideas taken without attribution
- **Data fabrication**: Results that seem too good or inconsistent
- **Undisclosed conflicts**: Industry funding or relationships not mentioned

## Novelty Issues

### Limited Contribution
- **Incremental**: Small modification of existing method
- **Engineering tricks**: Performance from implementation not ideas
- **Hyperparameter tuning**: Gains from better tuning, not method
- **Dataset advantage**: New dataset enables gains, not new method

### Prior Work Problems
- **Missing citations**: Highly relevant work not cited
- **Incorrect attribution**: Ideas credited to wrong source
- **Concurrent work ignored**: Recent parallel work not acknowledged
- **Mischaracterization**: Prior work described inaccurately

---

## Severity Classification

**Critical (affects accept/reject):**
- Incorrect proofs for main theorems
- Fundamental experimental flaws
- Missing essential baselines
- Overclaiming main contributions

**Major (requires revision):**
- Missing important ablations
- Incomplete statistical analysis
- Unclear key method details
- Missing relevant citations

**Minor (suggestions):**
- Typos and grammar
- Figure clarity improvements
- Additional experiments (nice to have)
- Writing organization
