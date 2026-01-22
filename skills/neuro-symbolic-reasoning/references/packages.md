# Packages

## Install

```bash
pip install z3-solver nltk anthropic
```

**Prover9** (for FOL):
```bash
# macOS
brew install prover9

# Linux
sudo apt-get install prover9

# Configure NLTK
python -c "import os; os.environ['PROVER9']='/usr/local/bin'"
```

## z3-solver

```python
from z3 import *

# Integer constraints
x, y = Ints('x y')
s = Solver()
s.add(x + y == 10, x > y)
if s.check() == sat:
    print(s.model())  # [y = 4, x = 6]

# Enum sorts (for AR-LSAT style)
Color, (red, green, blue) = EnumSort('Color', ['red', 'green', 'blue'])
c = Const('c', Color)
s.add(c != red)
```

## nltk (Prover9 wrapper)

```python
import os
os.environ['PROVER9'] = '/usr/local/bin'

from nltk import Prover9Command
from nltk.sem import Expression

read = Expression.fromstring
premises = [read('all x.(P(x) -> Q(x))'), read('P(a)')]
goal = read('Q(a)')

prover = Prover9Command(goal, premises, timeout=10)
print(prover.prove())  # True
```

## anthropic (LLM calls)

```python
from anthropic import Anthropic

client = Anthropic()
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[{"role": "user", "content": prompt}]
)
program = response.content[0].text
```

## Optional

| Package | Purpose |
|---------|---------|
| `sympy` | Symbolic math, formula simplification |
| `pyke3` | Rule-based inference engine |
| `networkx` | Graph reasoning |
