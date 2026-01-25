---
name: cs448b-visualization
description: "Data visualization design based on Stanford CS448B. Use for: (1) choosing chart types, (2) selecting visual encodings, (3) critiquing visualizations, (4) building D3.js visualizations, (5) designing interactions/animations, (6) choosing colors, (7) visualizing networks, (8) visualizing text. Covers Bertin, Mackinlay, Cleveland & McGill."
---

# CS448B Visualization

## When to Use Each Reference

| Reference | Use When |
|-----------|----------|
| [encoding-perception.md](references/encoding-perception.md) | Choosing how to map data to visual properties, or evaluating if encodings are effective |
| [chart-design.md](references/chart-design.md) | Deciding which chart type fits the data, or configuring axes/scales |
| [d3-patterns.md](references/d3-patterns.md) | Writing D3.js code for bindings, scales, axes, transitions |
| [interaction-animation.md](references/interaction-animation.md) | Adding brushing, filtering, tooltips, or animated transitions |
| [color.md](references/color.md) | Selecting color palettes or ensuring accessibility |
| [networks-text.md](references/networks-text.md) | Visualizing graphs, hierarchies, or text/document data |

## Critique Checklist

When reviewing any visualization:

1. **Expressiveness** - Does it show all the data? Only the data? No misleading elements?
2. **Effectiveness** - Is the most important data on the most accurate encoding (position > length > area > color)?
3. **Zero baseline** - Do bar charts start at zero?
4. **Accessibility** - Works for colorblind viewers (~8% of males)?
5. **Data-ink ratio** - Can any non-data elements be removed?
6. **Aspect ratio** - Are line charts banked so slopes are ~45°?

## Encoding Decision Order

When mapping data fields to visual channels:

1. Most important quantitative → Position (x or y)
2. Second quantitative → Position (other axis) or Length
3. Categories (≤7) → Color hue
4. Categories (>7) → Position or small multiples
5. Magnitude/importance → Size (but expect ~30% underestimation)

## Chart Selection Logic

- **One variable, distribution** → Histogram
- **One variable, categories** → Bar chart
- **Two variables, both quantitative** → Scatterplot
- **Two variables, time + quantitative** → Line chart
- **Two variables, both categorical** → Heatmap
- **Hierarchy** → Treemap or node-link tree
- **Network (sparse)** → Force-directed layout
- **Network (dense)** → Matrix diagram

## Animation Decision

- **Presentation context** → Use animation (faster, engaging)
- **Analysis context** → Use small multiples (more accurate)
- **State transitions** → Animate to maintain object constancy
- **Duration**: 200-300ms quick feedback, 500-700ms standard, 1000ms+ complex
