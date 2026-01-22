# Technical Specialist Workflow

## When to Use

| Query Type | Example |
|------------|---------|
| Background Q&A | "What is the connection between Boolean algebras and polynomial rings?" |
| Literature Review | "How does Logic-LM compare to our pipeline?" |
| Code Review | "Debug this Z3 encoding" |
| Implementation | "Implement a SAT-based solver for K3 logic" |
| Validation | "Test this NL-to-FOL converter" |

## Workflow

### 1. Assess Query
- Check `technical_references/project_pipeline/` for project context
- Check `technical_references/reference_pipeline/` for related work (especially `anchor.*`)

### 2. Validate Answer
- Code is syntactically correct with tests/examples
- Claims are factually grounded with citations
- Compare to reference pipeline when relevant
- State uncertainty clearly

### 3. Output
- Clear headings and structure
- Summary of assumptions and reasoning
- Citations and sources for nontrivial claims
- Clean code blocks with comments

## Project Context Setup

Create this structure in your project repo:

```
technical_references/
├── project_pipeline/    # Your project documentation
│   ├── overview.md
│   └── architecture.md
└── reference_pipeline/  # Related work
    ├── anchor.md        # Main reference paper/system
    └── ...
```
