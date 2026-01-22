# Symbolic Solvers Guide

## Solver Selection

| Logic Type | Solver | Install | Output |
|------------|--------|---------|--------|
| First-Order Logic | Prover9 (via NLTK) | `pip install nltk` | True/False/Unknown |
| Constraints/SAT | Z3 | `pip install z3-solver` | sat/unsat/unknown |
| Rule-based | Pyke | `pip install pyke3` | Bindings/No proof |

## Prover9 (via NLTK)

NLTK wraps Prover9 for FOL theorem proving. Tri-state logic: prove goal (True), prove negation (False), or neither (Unknown).

```python
import os
from nltk import Prover9Command
from nltk.sem import Expression

os.environ['PROVER9'] = '/path/to/prover9/bin'

def prove_fol(premises: list[str], conclusion: str, timeout=10):
    read = Expression.fromstring
    assumptions = [read(p) for p in premises]
    goal = read(conclusion)

    try:
        prover = Prover9Command(goal, assumptions, timeout=timeout)
        if prover.prove():
            return 'True'

        neg_goal = read(f'-({conclusion})')
        neg_prover = Prover9Command(neg_goal, assumptions, timeout=timeout)
        if neg_prover.prove():
            return 'False'

        return 'Unknown'
    except Exception as e:
        return None, str(e)
```

**NLTK FOL Syntax:**
- Universal: `all x.` / Existential: `exists x.`
- Implication: `->` / Biconditional: `<->`
- Negation: `-` / Conjunction: `&` / Disjunction: `|`

## Z3 (SMT Solver)

For constraint satisfaction and satisfiability checking.

```python
from z3 import *

s = Solver()
s.add(constraints)

if s.check() == sat:
    model = s.model()
elif s.check() == unsat:
    # No solution
```

**Multiple choice:** Check each option's satisfiability against base constraints.

## Pyke (Rule Engine)

For propositional/rule-based reasoning with backward chaining.

```python
from pyke import knowledge_engine

engine = knowledge_engine.engine(__file__)

def query(goal: str) -> list[dict]:
    engine.reset()
    engine.activate('rules')

    results = []
    with engine.prove_goal(goal) as gen:
        for vars, _ in gen:
            results.append(dict(vars))
    return results
```

## Error Categories

| Error Type | Refinement Hint |
|------------|-----------------|
| Syntax | Check operator syntax |
| Undeclared | Add predicate/function declaration |
| Type mismatch | Fix variable types |
| Timeout | Simplify or add axioms |
| Unsat | Check for contradictions |

Pass error category + message to LLM for self-refinement.
