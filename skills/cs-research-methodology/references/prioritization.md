# Prioritization

How to decide what to investigate first.

## The Core Idea

Multiple uncertainties exist. Identify the MOST IMPORTANT unknown and resolve it before moving to the next.

## The Algorithm

1. **List uncertainties**: What's unknown? What could invalidate the approach?
2. **Rank by importance**: Which would kill the idea if wrong?
3. **Pick ONE**: Focus entirely on that question
4. **Resolve**: Answer it with evidence
5. **Re-prioritize**: What's the next most important unknown?

## The Prioritization Grid

```
            IMPORTANT
                ↑
     Known +    │    Unknown +
     Important  │    Important
     (leverage) │    (TARGET)
                │
   ←────────────┼────────────→
     Known      │      Unknown
                │
     Known +    │    Unknown +
     Unimportant│    Unimportant
     (ignore)   │    (defer)
                ↓
            UNIMPORTANT
```

**Target: Unknown + Important**

## Types of Questions

| Type | Question |
|------|----------|
| Feasibility | Will this work at all? |
| Scale | Will this work at realistic size? |
| Theory | Does a fundamental limit exist? |
| Design | What form should this take? |

## Core vs. Periphery

**Core**: What must be true to answer the question
**Periphery**: Can be assumed, simplified, or deferred

Focus investigation on core uncertainties. Don't get distracted by peripheral questions until core ones are resolved.
