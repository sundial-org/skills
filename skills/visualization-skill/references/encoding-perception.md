# Visual Encoding & Perception

## Data Types
| Type | Operations | Example |
|------|------------|---------|
| **Nominal (N)** | =, != | Categories, labels |
| **Ordinal (O)** | =, !=, <, > | Rankings, grades |
| **Quantitative (Q)** | All arithmetic | Counts, measurements |

## Bertin's Visual Variables
| Variable | N | O | Q | Notes |
|----------|---|---|---|-------|
| Position | + | + | + | Most effective for all types |
| Size | + | + | + | Good for magnitude |
| Value (lightness) | + | + | ~ | Perceived as ordered |
| Texture | + | ~ | - | Categorical only |
| Hue | + | - | - | ~7 categories max |
| Orientation | + | - | - | Limited use |
| Shape | + | - | - | Categories only |

## Mackinlay's Effectiveness Ranking
**Quantitative**: Position > Length > Angle > Slope > Area > Volume > Saturation > Hue
**Ordinal**: Position > Density > Saturation > Hue > Texture
**Nominal**: Position > Hue > Texture > Connection > Containment

## Cleveland & McGill's Accuracy Ranking
1. Position (common scale) - most accurate
2. Position (non-aligned)
3. Length
4. Angle/Slope
5. Area
6. Volume
7. Color saturation/density - least accurate

## Stevens' Power Law
`S = I^p` where exponent p determines perception accuracy:
| Sensation | Exponent | Effect |
|-----------|----------|--------|
| Length | ~1.0 | Accurate |
| Area | ~0.7 | Underestimate |
| Volume | ~0.6 | Underestimate more |

**Flannery correction for circles**: `r = r0 * (v/v0)^0.5716`

## Pre-Attentive Features (Pop-Out)
Detected in <200ms regardless of distractors:
- Color (hue)
- Orientation
- Size/Length
- Shape
- Motion
- Curvature

**NOT pre-attentive**: Feature conjunctions (red AND circle)

## Gestalt Principles
| Principle | Effect |
|-----------|--------|
| Proximity | Close elements grouped |
| Similarity | Similar elements grouped |
| Connectedness | Connected = grouped (strongest) |
| Continuity | Prefer smooth contours |
| Closure | Complete incomplete shapes |
| Common Fate | Moving together = grouped |

## Design Criteria
**Expressiveness**: Show all facts, only facts (no lies, no omissions)
**Effectiveness**: Use encodings people decode better

## Integral vs Separable Dimensions
| Type | Behavior |
|------|----------|
| Integral | Interfere with each other (x-y position) |
| Separable | Processed independently (color + shape) |

**Redundant encoding** (same data to multiple channels): Helps reading
**Orthogonal encoding** (different data to multiple channels): May cause interference
