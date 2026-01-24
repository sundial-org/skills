# Finding the Bit

How to identify the assumption worth challenging.

## Process

### 1. List Existing Approaches
Identify 3-5 existing solutions to the problem.

### 2. Find the Common Thread
Ask: "What do ALL these approaches share?"
- Same input representation
- Same problem decomposition
- Same optimization target
- Same constraints accepted

The assumption is what they all take for granted.

### 3. Question It
For each shared element:
- "Why does everyone do it this way?"
- "What if this wasn't necessary?"
- "When does this break down?"

### 4. Find Evidence of Limitation
- Cases where current approaches fail
- Performance ceilings nobody breaks
- Workarounds people use

## Checking Your Work

Good bit flips are:
- **Specific**: "Use X instead of Y" not "use a better approach"
- **Non-obvious**: The assumption must actually be believed
- **Testable**: Can design an experiment comparing old vs. new
- **Singular**: One assumption per investigation

## Examples

**Search Engines**
- Bit: Rank by keyword matching
- Limitation: Misses semantic relevance
- Flip: Rank by meaning similarity
- Proof: Finds relevant docs without exact keywords

**Image Classification**
- Bit: Need large labeled datasets
- Limitation: Expensive, limited domains
- Flip: Learn from image-text pairs from web
- Proof: Broader coverage, no manual labeling
