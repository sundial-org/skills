# Research Stages

This document defines the 5 stages (0-4) of the scientific method used by the AI Co-Scientist skill. Each stage must complete before advancing, and stages can loop back when discoveries require revision.

## Stage Overview

| Stage | Name | Goal | Loop Conditions |
|-------|------|------|-----------------|
| 0 | Literature & Prior Work | Search for existing solutions | Entry point |
| 1 | Hypothesis Formulation | Define falsifiable hypothesis | Need more background |
| 2 | Experimental Design | Identify variables, baselines | Hypothesis ill-formed |
| 3 | Systematic Experimentation | Tree-based exploration | Confounding variables, hypothesis revision |
| 4 | Validation & Synthesis | Validate and synthesize | Flaws worth investigating |

---

## Stage 0: Literature & Prior Work Review

### Goal
Search for existing solutions, known results, and relevant methods to inform the research direction.

### Activities
1. **Web search** for prior work on the topic
2. **Identify** what has been tried before
3. **Document gaps** in existing solutions
4. **Compile candidate methods** to explore

### User Checkpoint Questions
- What is the research topic/domain?
- Any specific prior work to review?
- What gaps are you hoping to find?
- Are there known approaches we should consider?

### Outputs
- Summary of prior work (key papers, methods, results)
- Identified gaps and open questions
- Candidate methods to try in experimentation

### Loop Conditions
- **Cannot loop back** - this is the entry point

### Completion Criteria
- Sufficient understanding of existing work
- Clear gaps identified
- At least 2-3 candidate methods compiled

---

## Stage 1: Hypothesis Formulation

### Goal
Define a clear, falsifiable hypothesis based on findings from Stage 0.

### Activities
1. **Formulate hypothesis** in precise, testable terms
2. **Define success criteria** - what would confirm the hypothesis?
3. **Define failure criteria** - what would refute the hypothesis?
4. **Quick feasibility check** - is data available? Is the method implementable?

### User Checkpoint Questions
- What is your hypothesis? (Must be falsifiable)
- What result would confirm it?
- What result would refute it?
- Is this feasible given available data/compute?

### Outputs
- Written hypothesis statement
- Success/failure criteria with specific thresholds
- Feasibility assessment

### Loop Conditions
- **Loop to Stage 0** if more background research is needed

### Completion Criteria
- Hypothesis is clearly stated
- Success/failure criteria are measurable
- Feasibility confirmed

### Example Hypothesis
```
"Increasing data augmentation probability beyond 50% will improve adversarial
robustness by at least 10% while maintaining clean accuracy within 2% of baseline."

Success criteria: adversarial_acc >= baseline + 10%, clean_acc >= baseline - 2%
Failure criteria: adversarial_acc < baseline + 10% OR clean_acc < baseline - 2%
```

---

## Stage 2: Experimental Design

### Goal
Identify all variables and establish baseline measurements before experimentation.

### Activities
1. **Define independent variables** - what we manipulate
2. **Define dependent variables** - what we measure
3. **Define control variables** - what we hold constant
4. **Establish baselines** - initial measurements
5. **Set resource budget** - max iterations, compute time

### User Checkpoint Questions
- What are the independent variables (what we manipulate)?
- What are the dependent variables (what we measure)?
- What are the control variables (what we hold constant)?
- What is the resource budget? (max iterations, time limit)
- What is an acceptable baseline to compare against?

### Outputs
- Variable definitions table
- Baseline measurements
- Resource budget (max_iterations, max_time)
- Evaluation methodology

### Loop Conditions
- **Loop to Stage 1** if baseline reveals hypothesis is ill-formed or untestable

### Completion Criteria
- All variable types identified and documented
- Baseline established with reproducible results
- Resource budget agreed upon

### Example Variable Table
```
Independent Variables (manipulate):
  - augmentation_probability: [0%, 25%, 50%, 75%]
  - augmentation_type: ["geometric", "color", "mixed"]

Dependent Variables (measure):
  - adversarial_accuracy (%)
  - clean_accuracy (%)
  - training_time (minutes)

Control Variables (hold constant):
  - model_architecture: ResNet-18
  - training_epochs: 100
  - random_seed: 42
  - dataset: CIFAR-10
```

---

## Stage 3: Systematic Experimentation

### Goal
Tree-based exploration of the hypothesis space within resource budget.

### Activities
1. **Start with baseline** as root node
2. **Branch systematically** - vary one independent variable at a time
3. **Track metrics** at each node
4. **Make explore/exploit decisions** - try new combinations vs. refine promising paths
5. **Apply early stopping** if results are conclusive

### User Checkpoint Questions
- Which variable combinations should we prioritize?
- Preference for explore vs. exploit balance?
- Any early stopping criteria beyond resource budget?
- Should we continue with current promising path?

### Experimentation Loop
```
1. Plan next experiment (best-first from current nodes)
2. Write experiment code
3. Add node to tree
4. Execute and capture output
5. Analyze results (success/buggy, metrics)
6. Commit to git
7. Update visualization
8. Repeat until budget exhausted or conclusive
```

### Outputs
- Experiment tree with results at each node
- Best-performing configurations identified
- Analysis of variable effects

### Loop Conditions
- **Loop to Stage 2** if confounding variable discovered
- **Loop to Stage 1** if results suggest hypothesis needs fundamental revision

### Completion Criteria
- Resource budget exhausted OR
- Results conclusively confirm/refute hypothesis OR
- Sufficient exploration to draw conclusions

### Best-First Search Strategy
Prioritize expanding nodes with:
1. Highest metric value (if maximizing)
2. Most unexplored variable combinations
3. Nodes on promising paths

---

## Stage 4: Validation & Synthesis

### Goal
Validate findings and synthesize conclusions from the experimentation.

### Activities
1. **Replication** - run best configuration with different seeds
2. **Ablation studies** - remove/modify components to understand contributions
3. **Edge case testing** - test boundary conditions
4. **Robustness checks** - test under different conditions
5. **Synthesize conclusions** - what did we learn?

### User Checkpoint Questions
- Which findings need validation?
- What components should we ablate?
- What edge cases should we test?
- Are the conclusions supported by evidence?

### Outputs
- Validated results with confidence intervals
- Ablation analysis showing component contributions
- Robustness assessment
- Final conclusions with evidence

### Loop Conditions
- **Loop to Stage 3** if validation reveals flaw worth investigating further

### Completion Criteria
- Key findings replicated across multiple seeds
- Ablation studies completed
- Conclusions are well-supported by evidence

### Validation Checklist
- [ ] Best result replicated 3+ times with different seeds
- [ ] Confidence intervals computed
- [ ] Each key component ablated
- [ ] Edge cases tested
- [ ] Conclusions written and reviewed

---

## Stage Transitions

### Moving Forward
```python
# Complete current stage with success
python scripts/tree.py complete-stage <project_path> success

# Start next stage
python scripts/tree.py start-stage <project_path> <next_stage>
```

### Looping Back
```python
# Loop back with reason
python scripts/tree.py loop-back <project_path> <target_stage> "Reason for loop"
```

### Visualizing Progress
```python
# Regenerate visualization showing stage history
python scripts/visualize.py <project_path>
```

---

## Domain-Agnostic Application

These stages follow the general scientific method and apply to any computational/data-driven science:

| Domain | Stage 3 Example |
|--------|----------------|
| **ML** | Test different model architectures, hyperparameters |
| **Biology** | Test gene knockouts, drug concentrations |
| **Physics** | Simulate different initial conditions, parameters |
| **Economics** | Test different policy variables, market conditions |
| **Chemistry** | Test different reaction conditions, catalysts |

The key is identifying the independent, dependent, and control variables for your domain.
