# Available Models & LoRA

## Model Selection Guide

- **Use MoE models** - More cost effective than dense
- **Base models** - Only for research or full post-training
- **Hybrid/Reasoning models** - Long chain-of-thought for quality
- **Inkling** - Thinking Machines' own multimodal model with tunable thinking effort

## Model Lineup

| Model | Type | Architecture | Context |
|-------|------|--------------|---------|
| **thinkingmachines/Inkling** | Hybrid + Audio + Vision | MoE Large | 64K (256K†) |
| nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16 | Hybrid | MoE Large | 64K (256K†) |
| nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16 | Hybrid | MoE Large | 64K (256K†) |
| nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16 | Hybrid | MoE Medium | 64K |
| moonshotai/Kimi-K2.6 | Hybrid + Vision | MoE Large | 32K (128K†) |
| moonshotai/Kimi-K2.5 | Hybrid + Vision | MoE Large | 32K (128K†) |
| **Qwen/Qwen3.6-35B-A3B** | Hybrid + Vision | MoE Medium | 64K |
| Qwen/Qwen3.6-27B | Hybrid + Vision | Dense Medium | 64K |
| Qwen/Qwen3.5-397B-A17B | Hybrid + Vision | MoE Large | 64K (256K†) |
| Qwen/Qwen3.5-35B-A3B-Base | Base | MoE Medium | 64K |
| Qwen/Qwen3.5-9B | Hybrid + Vision | Dense Small | 64K |
| Qwen/Qwen3.5-9B-Base | Base | Dense Small | 64K |
| Qwen/Qwen3.5-4B | Hybrid + Vision | Dense Compact | 64K |
| Qwen/Qwen3-8B | Hybrid | Dense Small | 32K |
| openai/gpt-oss-120b | Reasoning | MoE Medium | 32K (128K†) |
| openai/gpt-oss-20b | Reasoning | MoE Small | 32K |
| deepseek-ai/DeepSeek-V3.1 | Hybrid | MoE Large | 32K |

† Long-context variant via a `:peft:<context>` suffix, e.g. `thinkingmachines/Inkling:peft:262144`, `moonshotai/Kimi-K2.6:peft:131072`.

**Sizes:** Compact (1-4B), Small (8-9B), Medium (27-35B), Large (100B+)

**Types:**
- **Base**: Pretrained, for post-training research
- **Hybrid**: Thinking + non-thinking modes
- **Reasoning**: Always uses chain-of-thought
- **Vision / Audio**: Accepts image / audio inputs (Inkling: text + image + audio, see [Inkling](inkling.md))

**Retired (June 12, 2026):** all meta-llama models, Qwen3-235B/32B/30B-A3B/VL/4B variants (Qwen3-8B remains), Qwen3.5-35B-A3B, Qwen3.5-27B, DeepSeek-V3.1-Base, Kimi-K2-Thinking.

## LoRA Primer

LoRA (Low-Rank Adaptation) fine-tunes small parameter subset instead of all weights.

### When LoRA Works Well

- SL on small-medium instruction datasets: **Same as full fine-tuning**
- RL: **Equivalent to full fine-tuning even with small ranks**
- Large datasets: May underperform (increase rank)

### LoRA Learning Rate

**Critical:** LoRA needs a ~10x higher LR than full fine-tuning!

```python
from tinker_cookbook.hyperparam_utils import get_lora_lr_over_full_finetune_lr

model_name = "Qwen/Qwen3-8B"
factor = get_lora_lr_over_full_finetune_lr(model_name)
# Returns 10.0 for all models (empirically validated)
```

### Recommended Learning Rate

```python
from tinker_cookbook.hyperparam_utils import get_lr

recommended_lr = get_lr("Qwen/Qwen3-8B")
```

### LoRA Rank

Default rank: 32

```python
from tinker_cookbook.hyperparam_utils import get_lora_param_count

# Check parameter count
param_count = get_lora_param_count("Qwen/Qwen3-8B", lora_rank=32)
```

**Rule of thumb:** LoRA params ≥ completion tokens for good SL results.

For RL: Small ranks work fine.

**Optimal LR does NOT depend on rank** - same LR works across ranks.

### LoRA Configuration

```python
training_client = service_client.create_lora_training_client(
    base_model="Qwen/Qwen3-8B",
    rank=32,
    train_attn=True,   # Attention layers (default)
    train_mlp=True,    # MLP layers (default)
    train_unembed=False,  # Output embedding (optional)
    seed=42,  # For reproducibility
)
```

**Best practice:** Train all layers (attention + MLP), not just attention.

### Mathematical Definition

Original weight: W (n×n)
LoRA: W' = W + BA

- B: n×r matrix
- A: r×n matrix
- r: rank (default 32)

Think of LoRA as efficient random projection of parameter space.

## Model Selection Tips

1. **For cost efficiency:** Use MoE models (Qwen3.6-35B-A3B, Nemotron-3-Nano)
2. **For experimentation:** Start with 8-9B models (Qwen3.5-9B, Qwen3-8B)
3. **For vision tasks:** Qwen3.6-35B-A3B (cost-effective) or Inkling
4. **For audio (+ vision) tasks:** Inkling — the only audio-capable model
5. **For reasoning:** Hybrid or Reasoning models with CoT

## Creating Training Client

```python
# Get available models
service_client = tinker.ServiceClient()
for model in service_client.get_server_capabilities().supported_models:
    print(model.model_name)

# Create training client
training_client = service_client.create_lora_training_client(
    base_model="Qwen/Qwen3.6-35B-A3B",
    rank=32,
)
```
