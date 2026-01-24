# Tree Operations Reference

Complete CLI documentation for the `tree.py` script used to manage AI Co-Scientist projects.

## Project Management

### Initialize a New Project
```bash
python scripts/tree.py init <project_path>
```
Creates:
- `.co-scientist/` directory
- `project.json` - project metadata
- `stage_history.json` - stage progression tracking
- `trees/` - directory for stage tree files
- `viz/` - directory for visualization output

### Load an Existing Project
```bash
python scripts/tree.py load <project_path>
```
Loads project state and displays current stage/iteration.

### Get Current Status
```bash
python scripts/tree.py get-status <project_path>
```
Shows:
- Current stage number
- Current iteration
- Number of nodes in current tree
- Hypothesis (if set)

---

## Stage Management

### Start a New Stage
```bash
python scripts/tree.py start-stage <project_path> <stage_num>
```
- Creates new tree file: `stage_{N}_iter_{M}.json`
- Adds entry to stage_history.json
- Sets current_stage and current_iteration

Example:
```bash
python scripts/tree.py start-stage ./my-project 0
# Output: Started Stage 0, Iteration 1
```

### Complete Current Stage
```bash
python scripts/tree.py complete-stage <project_path> <outcome>
```
Outcomes:
- `success` - stage completed successfully
- `exhausted` - resource budget exhausted

Example:
```bash
python scripts/tree.py complete-stage ./my-project success
# Output: Completed Stage 0 with outcome: success
```

### Loop Back to Earlier Stage
```bash
python scripts/tree.py loop-back <project_path> <target_stage> "<reason>"
```
- Marks current stage as `loop_back`
- Records the loop reason
- Starts new iteration of target stage

Example:
```bash
python scripts/tree.py loop-back ./my-project 1 "Confounding variable discovered"
# Output:
# Completed Stage 3 with outcome: loop_back
# Looping back to Stage 1: Confounding variable discovered
# Started Stage 1, Iteration 2
```

### Get Stage History
```bash
python scripts/tree.py get-history <project_path>
```
Returns JSON array of all stage transitions including loops.

---

## Node Operations

### Add a Node
```bash
python scripts/tree.py add-node <project_path> [--parent/-p <parent_id>] "<plan>" <code_file>
```
- If no parent specified, creates a root node
- Code is read from the specified file
- Returns the new node as JSON

Example:
```bash
# Create root node
echo "print('baseline')" > baseline.py
python scripts/tree.py add-node ./my-project "Establish baseline measurement" baseline.py

# Create child node
echo "print('experiment 1')" > exp1.py
python scripts/tree.py add-node ./my-project -p node-abc123 "Test with n=500" exp1.py
```

### Execute a Node's Code
```bash
python scripts/tree.py execute <project_path> <node_id> [--timeout <seconds>]
```
- Runs the node's code
- Captures stdout/stderr
- Updates node's `term_out` field
- Default timeout: 300 seconds

Example:
```bash
python scripts/tree.py execute ./my-project node-abc123 --timeout 600
```

### Update a Node
```bash
python scripts/tree.py update <project_path> <node_id> [options]
```
Options:
- `--status success|buggy` - set node status
- `--metrics '<json>'` - set metrics object
- `--analysis "<text>"` - set analysis text
- `--plots "path1,path2"` - set plot paths

Example:
```bash
python scripts/tree.py update ./my-project node-abc123 \
  --status success \
  --metrics '{"value": 0.85, "name": "accuracy", "maximize": true}' \
  --analysis "Accuracy improved to 85% with n=500 samples"
```

### Mark a Node as Buggy
```bash
python scripts/tree.py mark-buggy <project_path> <node_id> "<error>"
```

Example:
```bash
python scripts/tree.py mark-buggy ./my-project node-xyz789 "Out of memory error"
```

### Commit a Node
```bash
python scripts/tree.py commit <project_path> <node_id> [--message/-m "<message>"]
```
- Stages all changes
- Creates git commit with node context
- Updates node's `commit_hash` field

Example:
```bash
python scripts/tree.py commit ./my-project node-abc123 -m "Experiment: n=500 samples"
```

---

## Query Operations

### Get Best Nodes
```bash
python scripts/tree.py get-best <project_path> [--top/-k <count>]
```
Returns top nodes in current stage sorted by metric value.

Example:
```bash
python scripts/tree.py get-best ./my-project -k 5
# Output:
# node-004: {'value': 0.88, 'name': 'accuracy', 'maximize': True} - Increase to n=1000
# node-002: {'value': 0.85, 'name': 'accuracy', 'maximize': True} - Increase to n=500
# node-001: {'value': 0.783, 'name': 'accuracy', 'maximize': True} - Test with n=100 samples
```

### Get Next Candidates
```bash
python scripts/tree.py get-candidates <project_path>
```
Returns non-buggy leaf nodes sorted by metric (best-first for expansion).

Example:
```bash
python scripts/tree.py get-candidates ./my-project
# Output:
# node-004: {'value': 0.88, ...} - Increase to n=1000
```

### Export All Trees
```bash
python scripts/tree.py export-trees <project_path>
```
Exports complete project state as JSON including:
- Project metadata
- Hypothesis and variables
- Stage history
- All tree files

---

## Project Configuration

### Set Hypothesis
```bash
python scripts/tree.py set-hypothesis <project_path> "<hypothesis>"
```

Example:
```bash
python scripts/tree.py set-hypothesis ./my-project \
  "Increasing sample size improves prediction accuracy"
```

### Set Variables
```bash
python scripts/tree.py set-variables <project_path> \
  --independent/-i <var1> <var2> ... \
  --dependent/-d <var1> <var2> ... \
  --control/-c <var1> <var2> ...
```

Example:
```bash
python scripts/tree.py set-variables ./my-project \
  -i sample_size learning_rate \
  -d accuracy loss \
  -c random_seed model_architecture
```

### Set Resource Budget
```bash
python scripts/tree.py set-budget <project_path> \
  --max-iterations <count> \
  --max-time <duration>
```

Example:
```bash
python scripts/tree.py set-budget ./my-project \
  --max-iterations 50 \
  --max-time "4h"
```

---

## File Structure

After initialization:
```
project/
├── .co-scientist/
│   ├── project.json           # Project config, hypothesis, variables
│   ├── stage_history.json     # Stage transitions and loops
│   ├── trees/
│   │   ├── stage_0_iter_1.json
│   │   ├── stage_1_iter_1.json
│   │   └── ...
│   └── viz/
│       └── index.html         # Interactive visualization
└── ... (your project files)
```

---

## Node Data Structure

```json
{
  "id": "node-abc12345",
  "parent_id": "node-parent123",
  "children": ["node-child1", "node-child2"],
  "step": 3,
  "stage": 3,
  "plan": "Test with n=500 samples",
  "code": "# Python code here\nprint(result)",
  "term_out": "result: 0.85",
  "analysis": "Accuracy improved to 85%",
  "metric": {
    "value": 0.85,
    "name": "accuracy",
    "maximize": true
  },
  "is_buggy": false,
  "plots": ["plots/accuracy.png"],
  "commit_hash": "abc1234"
}
```

---

## Stage Tree Data Structure

```json
{
  "stage": 3,
  "iteration": 1,
  "nodes": { ... },
  "root_ids": ["node-001"],
  "created_at": "2024-01-15T12:00:00",
  "completed_at": "2024-01-15T18:00:00",
  "outcome": "success"
}
```

---

## Common Workflows

### Start a New Research Project
```bash
# Initialize
python scripts/tree.py init ./my-research

# Set up configuration
python scripts/tree.py set-hypothesis ./my-research "My hypothesis..."
python scripts/tree.py set-variables ./my-research -i var1 var2 -d metric1 -c seed
python scripts/tree.py set-budget ./my-research --max-iterations 20 --max-time "2h"

# Start Stage 0
python scripts/tree.py start-stage ./my-research 0
```

### Run an Experiment
```bash
# Write experiment code
cat > exp.py << 'EOF'
import random
result = random.random()
print(f"result: {result}")
EOF

# Add node
python scripts/tree.py add-node ./my-research -p node-parent "Test hypothesis" exp.py

# Execute
python scripts/tree.py execute ./my-research node-newid

# Update with results
python scripts/tree.py update ./my-research node-newid \
  --status success \
  --metrics '{"value": 0.85, "name": "result", "maximize": true}'

# Commit
python scripts/tree.py commit ./my-research node-newid

# Update visualization
python scripts/visualize.py ./my-research
```

### Progress Through Stages
```bash
# Complete stage 0, start stage 1
python scripts/tree.py complete-stage ./my-research success
python scripts/tree.py start-stage ./my-research 1

# ... work in stage 1 ...

# Loop back if needed
python scripts/tree.py loop-back ./my-research 0 "Need more background"
```
