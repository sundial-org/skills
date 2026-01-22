---
name: neuro-symbolic-reasoning
description: Neuro-symbolic AI combining LLMs with symbolic solvers. Use when implementing NL-to-logic translation, integrating Z3/Prover9/Pyke solvers, building self-refinement loops, or solving logical reasoning tasks.
---

# Neuro-Symbolic Reasoning

## Pipeline

```
NL Problem → LLM Formulator → Logic Program → Symbolic Solver → Answer
                    ↑                              |
                    └──── Self-Refinement ←────────┘
```

## Solver Selection

| Logic Type | Solver | Output |
|------------|--------|--------|
| First-order logic | Prover9 | True/False/Unknown |
| Constraints/SAT | Z3 | sat/unsat/unknown |
| Rule-based | Pyke | Bindings/No proof |

See [references/solvers.md](references/solvers.md) for integration code.

## Logic Program Format

Programs use `:::` annotations to explain each line.

See [references/logic-llm.md](references/logic-llm.md) for format details and the Logic-LLM repo for actual prompt templates.

## Self-Refinement

When solver returns an error, retry with the original program + error message. Max 3 rounds, then fall back to LLM chain-of-thought or random guess.

## Quality Checks

1. Solver parses program without syntax errors
2. Predicates/functions declared before use
3. Answer mapping handles all outcomes
4. Refinement loop has max iterations

## References

- [references/solvers.md](references/solvers.md) - Prover9, Z3, Pyke integration
- [references/packages.md](references/packages.md) - Installation and API usage
- [references/logic-llm.md](references/logic-llm.md) - Logic-LM paper patterns
- [references/technical-workflow.md](references/technical-workflow.md) - Technical specialist workflow
