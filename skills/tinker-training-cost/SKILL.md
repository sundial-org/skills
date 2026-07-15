---
name: tinker-training-cost
description: Calculate training costs for Tinker fine-tuning jobs. Use when estimating costs for Tinker LLM training, counting tokens in datasets, or comparing Tinker model training prices. Tokenizes datasets using the correct model tokenizer and provides accurate cost estimates.
---

# Tinker Training Cost Calculator

Calculate training costs for Tinker fine-tuning jobs by tokenizing your dataset with the correct model tokenizer and applying current pricing.

## Quick Start

Use the bundled script to calculate training costs:

```bash
# List available models and pricing
python scripts/calculate_cost.py --list-models

# Calculate cost for a JSONL dataset (model matches on unambiguous fragment)
python scripts/calculate_cost.py training_data.jsonl --model Qwen3-8B --epochs 3

# Output as JSON
python scripts/calculate_cost.py training_data.jsonl --model Inkling --json
```

The script:
1. Loads the correct tokenizer for the selected model (via `tinker-cookbook` if installed, else `transformers`)
2. Counts tokens in your JSONL file (supports chat, text, and instruction formats)
3. Calculates the estimated training cost

## Cost Formula

```
Training Cost = (total_tokens × epochs × train_price_per_million) / 1_000_000
```

---

## Tinker Pricing

> **Prices effective July 17, 2026** (prefill/sample rose ~50%, train ~10% on that date)
> Source: https://tinker-docs.thinkingmachines.ai/tinker/models/

All prices in **USD per million tokens**. Prefill = input context (inference), Sample = output tokens (inference), Train = training tokens. Cached prefill tokens get an **80% discount**. `:peft:<context>` = extended-context variant.

| Model | Prefill | Sample | Train |
|-------|---------|--------|-------|
| thinkingmachines/Inkling* | $1.87 | $4.68 | $5.61 |
| thinkingmachines/Inkling:peft:262144* | $3.74 | $9.36 | $11.23 |
| nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16* | $2.49 | $6.225 | $5.478 |
| nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16:peft:262144* | $3.32 | $8.30 | $9.96 |
| nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16* | $0.57 | $1.44 | $1.276 |
| nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16:peft:262144* | $0.76 | $1.92 | $2.32 |
| nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16* | $0.195 | $0.495 | $0.44 |
| moonshotai/Kimi-K2.6 | $2.205 | $5.49 | $4.84 |
| moonshotai/Kimi-K2.6:peft:131072 | $5.15 | $12.81 | $15.40 |
| Qwen/Qwen3.6-35B-A3B | $0.54 | $1.335 | $1.177 |
| Qwen/Qwen3.6-27B | $1.86 | $5.595 | $4.103 |
| Qwen/Qwen3.5-397B-A17B | $3.00 | $7.50 | $6.60 |
| Qwen/Qwen3.5-397B-A17B:peft:262144 | $4.00 | $10.00 | $12.00 |
| Qwen/Qwen3.5-35B-A3B-Base | $0.54 | $1.335 | $1.177 |
| Qwen/Qwen3.5-9B (+ -Base) | $0.66 | $1.995 | $1.463 |
| Qwen/Qwen3.5-4B | $0.33 | $1.005 | $0.737 |
| Qwen/Qwen3-8B | $0.195 | $0.60 | $0.44 |
| openai/gpt-oss-120b | $0.33 | $0.84 | $0.737 |
| openai/gpt-oss-120b:peft:131072 | $0.78 | $1.94 | $2.33 |
| openai/gpt-oss-20b | $0.18 | $0.45 | $0.396 |
| deepseek-ai/DeepSeek-V3.1 | $1.695 | $4.215 | $3.718 |

\* Inkling and Nemotron prices reflect a limited-time 50% discount.

Checkpoint storage: $0.10 per GB per month.

---

## Tokenization

Every model's tokenizer resolves from its Tinker model ID (verified for all models above):

```python
from tinker_cookbook.tokenizer_utils import get_tokenizer  # preferred
tokenizer = get_tokenizer("Qwen/Qwen3-8B")

# Or with plain transformers (same IDs, minus any :peft: suffix)
from transformers import AutoTokenizer
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen3-8B", trust_remote_code=True)

token_count = len(tokenizer.encode("Your training text here"))
```

### Supported JSONL Formats

**Chat format** (recommended):
```json
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

**Text format**:
```json
{"text": "Your training text here"}
```

**Instruction format** (Alpaca-style):
```json
{"instruction": "...", "input": "...", "output": "..."}
```

---

## Quick Cost Examples

### Example 1: Qwen3-8B on 1M tokens, 3 epochs
```
Training tokens: 1,000,000 × 3 = 3,000,000
Cost: 3.0M × $0.44/M = $1.32
```

### Example 2: Qwen3.6-35B-A3B on 5M tokens, 2 epochs
```
Training tokens: 5,000,000 × 2 = 10,000,000
Cost: 10.0M × $1.177/M = $11.77
```

### Example 3: Inkling on 2M tokens, 4 epochs
```
Training tokens: 2,000,000 × 4 = 8,000,000
Cost: 8.0M × $5.61/M = $44.88
```

---

## Important Notes

1. **LoRA Fine-Tuning**: Tinker uses Low-Rank Adaptation (LoRA), not full fine-tuning
2. **Token Counting**: Always use the model's native tokenizer - different tokenizers produce different counts for the same text
3. **RL costs more than the train rate alone**: rollouts are billed at sample/prefill rates on top of training tokens
4. **Multimodal inputs** (Inkling images/audio) add tokens beyond text tokenization
