# Chart Design

## Chart Selection

### Single Variable
| Data | Chart |
|------|-------|
| Distribution | Histogram, density plot |
| Categories | Bar chart (horizontal if many) |
| Part-to-whole | Bar chart (not pie) |

### Two Variables
| X | Y | Chart |
|---|---|-------|
| Categorical | Quantitative | Bar chart, dot plot |
| Quantitative | Quantitative | Scatterplot |
| Time | Quantitative | Line chart |
| Categorical | Categorical | Heatmap |

### Multiple Variables
| Scenario | Chart |
|----------|-------|
| 3+ quantitative | Scatterplot + size/color |
| Multiple time series | Small multiples, layered lines |
| Hierarchical | Treemap, node-link tree |
| Network | Force-directed, matrix |

## Scales and Axes

### Include Zero?
| Task | Zero Baseline |
|------|---------------|
| Compare proportions (Q-Ratio) | Yes, always |
| Compare relative position (Q-Interval) | No, zoom to data |
| Bar charts | Always (length = value) |

### Log Scale
Use when:
- Multiple orders of magnitude
- Focus on multiplicative/percent change
- Exponential growth patterns

**Constraint**: Positive, non-zero values only

### Axis Tick Selection
- Multiples of 10, 5, 2 (simplicity)
- Ticks near data range ends (coverage)
- Not too many/few (density)
- Horizontal text (legibility)

## Aspect Ratio

### Banking to 45deg
Optimize aspect ratio so average line segment slopes ~45deg.
- Line segments most discriminable at 45deg
- Bank to fitted trend lines, not raw data

## Sorting

### Strategies
| Order | Effect |
|-------|--------|
| Alphabetical | Easy lookup, no insight |
| By value (main-effects) | Reveals patterns |

### Small Multiples
- Panel variables: what's in each panel
- Condition variables: what varies across panels

## Anti-Patterns
- 3D effects on 2D data
- Decorative elements that don't encode data
- Unnecessary gridlines
- Pie charts for comparison (use bar)

## Summary
1. Use **expressive** encodings (show truth)
2. Use **effective** encodings (position > area > color)
3. Avoid over-encoding
4. Emphasize features relevant to task
