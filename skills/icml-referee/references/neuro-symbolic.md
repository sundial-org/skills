# Neuro-Symbolic Paper Review Criteria

Special considerations when reviewing papers combining neural networks with symbolic reasoning.

## Symbolic Formulation Quality

- Is the translation from natural language to symbolic form accurate?
- Are grammar/syntax rules clearly defined?
- How are formulation errors handled?
- Is the symbolic representation expressive enough for the task?
- Are edge cases and ambiguities addressed?

## Solver Selection

- Are chosen solvers appropriate for the tasks?
- Are there better alternatives? (e.g., Prover9, Z3, Pyke, SAT solvers)
- Is solver selection justified?
- Are solver limitations acknowledged?
- Is the computational complexity discussed?

## Integration Approach

- How do neural and symbolic components interact?
- Is the integration principled or ad-hoc?
- Are failure modes analyzed?
- How are errors propagated between components?
- Is there a feedback mechanism (e.g., self-refinement)?

## Faithfulness and Verification

- Does symbolic reasoning actually guarantee faithfulness?
- How are reasoning traces presented?
- Can reasoning be verified independently?
- Are intermediate steps inspectable?
- What guarantees does the system provide?

## Evaluation Standards

**Benchmark selection:**
- Are standard logical reasoning benchmarks used? (e.g., FOLIO, ProofWriter, PrOntoQA, LogicalDeduction, AR-LSAT)
- Is benchmark selection justified?
- Are multiple types of reasoning tested?

**Comparison fairness:**
- Same prompts across methods?
- Same LLM backbone?
- Fair hyperparameter tuning?
- Proper ablation studies?

**Metrics:**
- Appropriate accuracy measures?
- Error analysis by category?
- Statistical significance reported?

## Practical Considerations

- What are computational costs (time, memory, API calls)?
- How does the approach scale with problem complexity?
- Is the system reproducible?
- Are implementation details sufficient?
- Is code available or promised?

## Reference Paper Baselines

**Logic-LM (Pan et al., EMNLP 2023):**
- Integrates LLMs with symbolic solvers (Pyke, Prover9, Z3)
- Three-stage pipeline: formulation → symbolic reasoning → interpretation
- Includes self-refinement module for error correction
- Evaluated on 5 datasets: PrOntoQA, ProofWriter, FOLIO, LogicalDeduction, AR-LSAT
- Key innovation: solver-agnostic framework

**When comparing, assess:**
- Does the new approach address Logic-LM limitations?
- Are improvements on the same benchmarks?
- Is the comparison fair (same LLM, same prompts)?
- What is the novelty beyond prior work?
