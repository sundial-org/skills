# Color Design

## Scale Types

### Categorical
- Distinct hues, similar luminance
- Maximum ~6-8 colors
- Maximize color name distance

### Sequential (Quantitative)
- Single hue, varying lightness
- Higher values = darker (typically)
- Example: light blue -> dark blue

### Diverging
- Two hues meeting at neutral midpoint
- Saturated endpoints, grey/white center
- Example: red <- white -> blue
- 3-9 steps recommended

## Color Vision Deficiency
| Type | Affected | Prevalence |
|------|----------|------------|
| Protanopia | Red (L cones) | ~1% males |
| Deuteranopia | Green (M cones) | ~1% males |
| Tritanopia | Blue (S cones) | Rare |

**~8% of males have red-green deficiency**

### Design for Accessibility
- Use redundant encoding (color + shape)
- Avoid red-green only distinctions
- Test with colorblindness simulators
- Ensure B&W printing works

## Perceptual Issues

### Appearance Effects
| Effect | Issue |
|--------|-------|
| Simultaneous contrast | Same color looks different on different backgrounds |
| Bezold effect | Adjacent colors alter appearance |

### HSL vs LAB
- HSL lightness: poor uniformity (yellow looks brighter than blue at same L)
- LAB L*: perceptually uniform brightness

## Rainbow Colormaps
| Pros | Cons |
|------|------|
| High nameability | Hues not naturally ordered |
| Good for distribution tasks | Perceptual banding |
| | Colorblind unfriendly |
| | Low-luminance blues hide detail |

**Use sequential/diverging instead for quantitative data.**

## Classing Methods
1. **Quantiles** - recommended default
2. **Equal interval** - arithmetic progression
3. **Jenks natural breaks** - minimize within-class variance
4. **Standard deviations** - statistical meaning

## Basic Color Terms
11 universal: White, Grey, Black, Red, Yellow, Green, Blue, Pink, Orange, Brown, Purple

Maximize name distance between palette entries.

## Tools
- **ColorBrewer**: colorbrewer2.org
- **Color naming**: vis.stanford.edu/color-names
