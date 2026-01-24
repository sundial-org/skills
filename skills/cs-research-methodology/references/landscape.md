# Landscape Mapping

How to understand prior work and find your unique position.

## The Search Process

### 1. Find Nearest Neighbor
The single paper closest to your idea:
- Most similar goal AND method
- Extract: What's its assumption (bit)? Its limitations?

### 2. Expand
**Backward**: What does it cite?
**Forward**: What cites it?
**Lateral**: Related approaches in the space

### 3. Filter
Prioritize top venues and high citations relative to age.

## Design Space Mapping

Create a 2D map:
- Axes = key dimensions where approaches differ
- Each paper = a point
- Empty regions = potential opportunities

Example axes:
- Supervised ↔ Unsupervised
- Single-task ↔ Multi-task
- Domain-specific ↔ General

Your contribution should occupy a distinct position.

## Reading Strategy

For each paper, extract:
1. Its assumption (bit)
2. Key evidence
3. Position in design space

Goal: Map the landscape, not master every paper.

## Stopping Criteria

Stop when new papers mostly confirm what you already know. Learning per paper diminishes after ~10-15 papers.

## Output

Group papers by shared assumption:
```
[Papers A, B, C] assume X.
[Papers D, E] assume Y.
Our work differs by assuming Z.
```
