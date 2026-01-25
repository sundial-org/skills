# Networks & Text Visualization

## Network Layout Methods

| Method | Best For | Characteristics |
|--------|----------|-----------------|
| Force-directed | Cluster discovery | Organic, simulation-based |
| Sugiyama | Hierarchies | Layered, minimizes crossings |
| Matrix | Dense networks | No occlusion, ordering-dependent |
| Arc diagram | Structure comparison | Linear layout, circular arcs |

### Force-Directed
```
Nodes = charged particles: F = q1*q2/d^2
Edges = springs: F = k*(L-d)
Air resistance: F = -b*v
```
Barnes-Hut optimization: O(N log N) via quadtree

### Sugiyama (Hierarchical)
1. Remove cycles
2. Assign layers
3. Minimize crossings
4. Route edges

## Tree Visualizations
| Type | Description |
|------|-------------|
| Indentation | Linear list, depth encoding |
| Node-link | Explicit hierarchy, space-inefficient |
| Treemap | Space-filling, enclosure |
| Sunburst | Radial treemap |

## Centrality Measures

| Measure | Formula | Captures |
|---------|---------|----------|
| Degree | Count of edges | Local connectivity, hubs |
| Betweenness | Paths through node | Bridges, brokers |
| Closeness | 1/avg distance | Global accessibility |

### Interpretation
- **High degree**: "Where the action is"
- **High betweenness**: Controls information flow
- **High closeness**: Efficient access to all

### Standardization
- Degree: `C'_D = d/(N-1)`
- Closeness: `C'_C = (N-1)/sum(distances)`
- Betweenness: `C'_B = C_B/[(N-1)(N-2)/2]`

## Community Detection
- **Density**: `e/e_max`
- **Components**: Reachable subgraphs
- **Betweenness clustering**: Remove highest-betweenness edges iteratively

## Small World Networks
Few random links in structured graph -> short paths + high clustering
- `C >> C_random`
- `l ~ ln(N)`

---

## Text Visualization

### TF-IDF
```
tf.idf = log(1 + tf) * log(N/df)
```
Balances frequency against distinctiveness.

### Processing Pipeline
1. Tokenization (segment into terms)
2. Stop word removal (a, the, of...)
3. Stemming (visualize -> visual)

### Visualization Types
| Method | Shows |
|--------|-------|
| Word Cloud | Term frequency (limited utility) |
| Word Tree | Continuations/context |
| TileBars | Query term distribution |
| Phrase Nets | Word relationships ("X and Y") |
| Concordance | Word occurrences with context |

### Word Cloud Weaknesses
- Size encodes frequency (not position)
- Long words appear bigger
- Unstable layout
- Ignores structure
- Often considered harmful for analysis

### Document Comparison
- TileBars: Width = length, darkness = match count
- Literature fingerprints: Heatmaps of text features

### Conversation Visualization
Dimensions: Who, What, When
- Who x Who = Social network
- What x When = Topic evolution
