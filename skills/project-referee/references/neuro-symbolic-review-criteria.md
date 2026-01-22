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
- Integrates LLMs with symbolic solvers (Pyke, Prover9, Z3, python-constraint)
- Three-stage pipeline: Problem Formulator → Symbolic Reasoner → Result Interpreter
- Includes self-refinement module using solver error messages
- Evaluated on 5 datasets: PrOntoQA, ProofWriter, FOLIO, LogicalDeduction, AR-LSAT
- Results: 39.2% improvement over standard prompting, 18.4% over Chain-of-Thought
- Key innovation: solver-agnostic framework

**Known limitations:**
- Low execution rates on complex datasets (AR-LSAT: 32.6% with GPT-4)
- Self-refinement only fixes syntax errors, not semantic errors
- Limited analysis of failure modes

**LINC (Olausson et al., 2024):**
- Two-stage architecture: Semantic Parser → Theorem Prover with majority voting
- Uses Prover9 (FOL only)
- Models tested: StarCoder+ (15.5B), GPT-3.5, GPT-4
- Evaluated on FOLIO and ProofWriter (balanced subset)
- Results: 98.3% on ProofWriter with GPT-4, competitive on FOLIO

**LINC Error Categories:**
- **L1**: FOL fails to capture implicit information
- **L2**: Information loss due to representation choices
- **L3**: Syntax errors in generated FOL
- **C1-C3**: CoT failure modes (inconsistent conclusions, logical fallacies, complex reasoning paths)

**Key insight**: LINC and CoT have complementary failure modes - combining approaches may help.

**Known limitations:**
- Only uses FOL (no other formalisms)
- No self-refinement mechanism
- Performance drops on naturalistic FOLIO vs. synthetic ProofWriter

**When comparing new work, assess:**
- Does the approach address Logic-LM or LINC limitations?
- Are improvements on the same benchmarks?
- Is the comparison fair (same LLM, same prompts)?
- What is the novelty beyond prior work?
- Does it handle semantic errors (not just syntax)?
- Does it work across multiple formalisms?
