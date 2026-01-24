# Validation

How to prove your bit flip works.

## Match Evaluation to Claim Type

### X > Y (Comparison)
"Our approach outperforms the baseline"
- Same task, different methods
- Fair baseline (not a strawman)
- Metrics that matter for the problem

### ∃ X (Existence)
"It's possible to do X"
- Demonstrations on genuinely challenging examples
- Evidence the output meets the bar
- Comparison to what was possible before

### Bounding
"Approach works under conditions C"
- Systematic exploration of conditions
- Evidence at boundaries
- Honest reporting of where it fails

## Key Constructs

**Dependent Variable**: What you measure (must relate to your claim)

**Independent Variable**: What you manipulate (your method vs. baseline)

**Task**: What's being done (concrete, replicable, representative)

**Threats to Validity**: What could invalidate results
- Argue why threat doesn't apply
- Test across multiple conditions
- Control what you can't eliminate

## Best Practices

- **Copy nearest neighbor**: Adopt evaluation approach from similar prior work
- **Precision enables evaluation**: Vague claims can't be tested
- **Report failures**: Where doesn't your approach work?
