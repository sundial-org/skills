---
name: tinker
description: Comprehensive guide for Tinker Cookbook supervised fine-tuning covering all patterns including high-level Cookbook abstractions, low-level API usage, streaming datasets, file-based data, Blueprint configuration, and vision-language models.
---

# Tinker Cookbook - Complete Training Patterns

## Overview

Tinker Cookbook provides two levels of abstraction for fine-tuning language models:

1. **High-Level Cookbook API**: Declarative configuration with `chz`, structured dataset builders, automatic training loops
2. **Low-Level Tinker API**: Manual control over training steps, direct ServiceClient usage, custom training loops

Choose based on your needs:
- **Use Cookbook** for standard SFT workflows with built-in datasets and patterns
- **Use Low-Level API** for custom training logic, research experiments, or fine-grained control

## Quick Navigation

### For Standard SFT Workflows
See **[Cookbook Patterns](references/cookbook-patterns.md)** for:
- Blueprint and @chz.chz configuration
- HuggingFace dataset integration
- File-based dataset loading
- Streaming datasets for large data
- Custom dataset implementations
- Complete workflow examples

### For Manual Training Control
See **[Low-Level API](references/low-level-api.md)** for:
- ServiceClient and TrainingClient setup
- Manual forward_backward and optim_step
- Direct Datum creation and tokenization
- State management and checkpointing
- Custom training loop patterns

### For Vision-Language Models
See **[Vision Datasets](references/vision-datasets.md)** for:
- Custom datasets with image processing
- ImageChunk and multi-modal inputs
- Vision-specific renderers (Qwen3VL)
- Image preprocessing patterns
- VLM-specific configurations

### For Advanced Customization
See **[Renderers](references/renderers.md)** for:
- Renderer system overview
- Chat format conversion
- TrainOnWhat enum usage
- Building prompts vs supervised examples
- Model-specific renderer selection

## Core Installation

```bash
pip install tinker tinker-cookbook
export TINKER_API_KEY=your_api_key_here
```

## Key Concepts

### Configuration with Chisel (chz)

Tinker Cookbook uses `chz` (Chisel) for declarative configuration:

```python
import chz

@chz.chz
class Config:
    model_name: str = "meta-llama/Llama-3.1-8B"
    learning_rate: float = 1e-4
```

Two patterns:
- **@chz.chz decorator**: Class-based config with `chz.nested_entrypoint()`
- **Blueprint pattern**: Function-based config with `.apply()`, `.make_from_argv()`, `.make()`

### Dataset Builders

Cookbook uses builder pattern for dataset preparation:
- `ChatDatasetBuilder`: Base class for chat-based datasets
- Returns `(train_dataset, test_dataset)` tuple
- Access common config and renderer from base class

### Training Execution

All training runs asynchronously:

```python
from tinker_cookbook.supervised import train
import asyncio

asyncio.run(train.main(config))
```

## Common Module Imports

```python
# Configuration
import chz
import asyncio
import sys

# Training
from tinker_cookbook.supervised import train
from tinker_cookbook.supervised.types import (
    ChatDatasetBuilder,
    ChatDatasetBuilderCommonConfig,
    SupervisedDataset,
)

# Dataset utilities
from tinker_cookbook.supervised.data import (
    SupervisedDatasetFromHFDataset,
    StreamingSupervisedDatasetFromHFDataset,
    FromConversationFileBuilder,
    conversation_to_datum,
)

# Renderers and model info
from tinker_cookbook.renderers import TrainOnWhat
from tinker_cookbook.model_info import get_recommended_renderer_name

# Low-level API (for manual loops)
import tinker
from tinker import types
```

## Workflow Selection Guide

### Use Cookbook Patterns When:
- Training with standard datasets (HF, JSONL files)
- Want automatic training loop and checkpointing
- Need chat message formatting and rendering
- Prefer declarative configuration
- Building production training pipelines

### Use Low-Level API When:
- Need custom training loop logic
- Implementing research experiments
- Want fine-grained control over each step
- Building custom RL or online learning systems
- Need to inspect/modify gradients or optimizer state

### Combine Both When:
- Use Cookbook's dataset builders + renderers
- But implement custom training loop
- Best of both: structured data + flexible training

## Best Practices

### Configuration
- Always use `@chz.chz` for config classes or Blueprint for functions
- Validate file paths and dataset availability before training
- Use meaningful `log_path` for checkpoint organization

### Dataset Preparation
- Use `FromConversationFileBuilder` for file-based data
- Use streaming wrappers for datasets > 1M examples
- Implement custom `SupervisedDataset` for complex preprocessing
- Set appropriate `TrainOnWhat` for your use case

### Model Selection
- Get renderer with `get_recommended_renderer_name(model_name)`
- Use MoE models (Qwen3-VL, etc.) for cost efficiency
- Start with smaller models (8B) for iteration

### Training
- Set `max_length` based on your data distribution
- Use appropriate `batch_size` for your hardware
- Monitor with `eval_every` and `save_every` settings
- Run async with `asyncio.run()`

## Reference Documentation

- **[Cookbook Patterns](references/cookbook-patterns.md)**: Complete high-level API patterns
- **[Low-Level API](references/low-level-api.md)**: Manual training control patterns
- **[Vision Datasets](references/vision-datasets.md)**: Vision-language model patterns
- **[Renderers](references/renderers.md)**: Renderer system reference

## External Resources

- Documentation: https://tinker-docs.thinkingmachines.ai/
- Cookbook Repo: https://github.com/thinking-machines-lab/tinker-cookbook
- Console: https://tinker-console.thinkingmachines.ai
