# Interaction & Animation

## Interaction Principles

### Direct Manipulation (Shneiderman)
1. Visual representation of objects/actions
2. Rapid, incremental, reversible actions
3. Selection by pointing (not typing)
4. Immediate, continuous feedback

### Norman's Gulfs
- **Execution**: Gap between intention and allowed actions
- **Evaluation**: Effort to interpret system state

Visualization reduces the evaluation gulf.

## Selection Methods

### Point Selection
- Hover/click
- Bubble cursor (Voronoi regions)

### Region Selection
- Rubber-band/lasso
- Brushes (area cursors)

## Interaction Techniques

| Technique | Purpose |
|-----------|---------|
| Brushing & Linking | Select subset, highlight in other views |
| Dynamic Queries | Filter via sliders/controls |
| Panning/Zooming | Navigate large datasets |
| Details on Demand | Tooltips, drill-down |
| Focus+Context | Detail while preserving overview |

### Linking Types
- **By tuple**: Same data point across views
- **By query**: Range or field values

---

## Animation Principles

### When to Animate
- State transitions
- Maintain object constancy
- Draw attention to changes
- Explain processes (presentation)

### When NOT to Animate
- Analysis tasks (small multiples better)
- Complex multi-path comparisons

## Timing Guidelines
| Duration | Use |
|----------|-----|
| 200-300ms | Quick feedback |
| 500-700ms | Standard transitions |
| 1000ms+ | Complex multi-step |

## Congruence Principle
Animation should match mental model:
- Zoom: scaling
- Filter: fade out
- Sort: position movement

## Staging Complex Transitions
1. Exit old elements
2. Transform positions
3. Enter new elements

## D3 Transitions
```javascript
selection.transition()
  .duration(500)
  .delay(100)
  .ease(d3.easeCubicInOut)
  .attr("x", d => newX);
```

## Easing Functions
| Type | Effect |
|------|--------|
| Linear | Constant speed |
| Ease-in-out | Natural, slow start/end |
| Bounce/elastic | Playful |

Reference: easings.net

## Animation vs Small Multiples
| Aspect | Animation | Small Multiples |
|--------|-----------|-----------------|
| Accuracy | Lower | 10% higher |
| Presentation | 60% faster | Slower |
| Analysis | 82% slower | Faster |
| Preference | Higher | Lower |

**Users prefer animation even when less accurate.**

## Design Guidelines
- Avoid axis re-scaling during animation
- Group similar transitions
- Minimize occlusion
- Simple transitions beat complex staging
