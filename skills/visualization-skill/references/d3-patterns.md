# D3.js Patterns

## Setup
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script>/* D3 code */</script>
</body>
</html>
```

## Core Pattern: Data Join
```javascript
svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => xScale(d.x))
  .attr("cy", d => yScale(d.y))
  .attr("r", 5);
```

## Full Join with Enter/Update/Exit
```javascript
selection.selectAll("li")
  .data(listData)
  .join(
    enter => enter.append("li"),   // new data: create
    update => update,               // existing: update
    exit => exit.remove()           // removed: delete
  )
  .text(d => d.value);
```

## Scales

### Linear (Quantitative)
```javascript
const xScale = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.value)])
  .range([0, width]);
```

### Band (Categorical)
```javascript
const yScale = d3.scaleBand()
  .domain(data.map(d => d.category))
  .range([0, height])
  .padding(0.1);
```

### Color
```javascript
// Sequential
const colorScale = d3.scaleSequential(d3.interpolateBlues)
  .domain([0, maxValue]);

// Categorical
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
```

## Axes
```javascript
const xAxis = d3.axisBottom(xScale);
svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(xAxis);
```

## Transitions
```javascript
// Animate property changes
selection.transition()
  .duration(500)
  .delay(100)
  .ease(d3.easeCubicInOut)
  .attr("cx", d => xScale(d.newX));

// Exit with fade
bars.exit()
  .transition()
  .style("opacity", 0)
  .remove();
```

## Margins Convention
```javascript
const margin = {top: 20, right: 30, bottom: 40, left: 50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("body").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
```

## Common Patterns

### Scatterplot
```javascript
svg.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", d => xScale(d.x))
  .attr("cy", d => yScale(d.y))
  .attr("r", 5)
  .attr("fill", d => colorScale(d.category));
```

### Bar Chart
```javascript
svg.selectAll("rect")
  .data(data)
  .join("rect")
  .attr("x", d => xScale(d.category))
  .attr("y", d => yScale(d.value))
  .attr("width", xScale.bandwidth())
  .attr("height", d => height - yScale(d.value));
```

### Line Chart
```javascript
const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.value));

svg.append("path")
  .datum(data)
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", "steelblue");
```

## Events
```javascript
selection
  .on("mouseover", (event, d) => { /* highlight */ })
  .on("mouseout", (event, d) => { /* reset */ })
  .on("click", (event, d) => { /* action */ });
```
