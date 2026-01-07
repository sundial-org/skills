## Tinker Cookbook Patterns Reference

This document covers all high-level Tinker Cookbook patterns for supervised fine-tuning.

## Configuration Patterns

### Pattern 1: @chz.chz Decorator (Class-Based)

Use for straightforward CLI configuration:

```python
import chz
import asyncio
from tinker_cookbook.supervised import train

@chz.chz
class CLIConfig:
    model_name: str = "meta-llama/Llama-3.1-8B"
    file_path: str = "data.jsonl"
    max_length: int = 2048

async def train_async(cli_config: CLIConfig):
    # Build training config
    config = train.Config(
        model_name=cli_config.model_name,
        log_path="/tmp/training",
        dataset_builder=build_dataset(cli_config),
        # ... other parameters
    )
    await train.main(config)

def main():
    cli_config = chz.nested_entrypoint(CLIConfig)
    asyncio.run(train_async(cli_config))

if __name__ == "__main__":
    main()
```

**Key Points**:
- Decorate config class with `@chz.chz`
- Use `chz.nested_entrypoint(ConfigClass)` to parse CLI args
- Supports automatic `--help` generation
- Field types determine CLI argument parsing

### Pattern 2: Blueprint (Function-Based)

Use for template-based configuration with overrides:

```python
import chz
import sys
import asyncio
from tinker_cookbook.supervised import train
from tinker_cookbook.supervised.types import ChatDatasetBuilderCommonConfig
from tinker_cookbook.model_info import get_recommended_renderer_name

def build_config_blueprint() -> chz.Blueprint[train.Config]:
    model_name = "meta-llama/Llama-3.1-8B"
    renderer_name = get_recommended_renderer_name(model_name)

    # Create common config for dataset builders
    common_config = ChatDatasetBuilderCommonConfig(
        model_name_for_tokenizer=model_name,
        renderer_name=renderer_name,
        max_length=2048,
        batch_size=128,
        train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
    )

    # Create dataset builder
    dataset_builder = MyDatasetBuilder(common_config=common_config)

    # Build and configure Blueprint
    return chz.Blueprint(train.Config).apply({
        "log_path": "/tmp/training",
        "model_name": model_name,
        "dataset_builder": dataset_builder,
        "learning_rate": 2e-4,
        "lr_schedule": "cosine",
        "num_epochs": 3,
        "lora_rank": 32,
        "save_every": 100,
        "eval_every": 50,
    })

def main(config: train.Config):
    asyncio.run(train.main(config))

if __name__ == "__main__":
    blueprint = build_config_blueprint()
    blueprint.make_from_argv(sys.argv[1:])  # Parse CLI overrides
    main(blueprint.make())  # Instantiate and run
```

**Key Points**:
- `chz.Blueprint[ConfigClass]` creates configurable template
- `.apply(dict)` sets default parameter values
- `.make_from_argv(sys.argv[1:])` parses CLI overrides like `--learning_rate 1e-4`
- `.make()` instantiates the final config object
- Allows function-scoped setup logic before config creation
- CLI args override `.apply()` defaults

**When to use Blueprint**:
- Need setup logic before config (compute derived values, validate inputs)
- Want both defaults in code and CLI override capability
- Building reusable config templates
- Prefer functional over class-based structure

## Dataset Builder Patterns

### Pattern 3: HuggingFace Dataset Builder

Standard pattern for HF datasets:

```python
from tinker_cookbook.supervised.types import ChatDatasetBuilder, ChatDatasetBuilderCommonConfig
from tinker_cookbook.supervised.data import SupervisedDatasetFromHFDataset, conversation_to_datum
from tinker_cookbook.renderers import TrainOnWhat
import datasets
import chz

@chz.chz
class MyDatasetBuilder(ChatDatasetBuilder):
    common_config: ChatDatasetBuilderCommonConfig

    # Optional: custom parameters
    subset_name: str = "default"
    max_train_samples: int = 10000

    def __call__(self):
        # Load HuggingFace dataset
        hf_dataset = datasets.load_dataset(
            "HuggingFaceH4/no_robots",
            split="train"
        )

        # Split into train/test
        split = hf_dataset.train_test_split(test_size=0.1, seed=42)

        # Define mapping function
        def map_fn(row):
            # Convert row to conversation format
            messages = [
                {"role": "user", "content": row["prompt"]},
                {"role": "assistant", "content": row["completion"]},
            ]
            # Use conversation_to_datum for tokenization
            return conversation_to_datum(
                messages=messages,
                renderer=self.renderer,
                max_length=self.common_config.max_length,
                train_on_what=self.common_config.train_on_what,
            )

        # Wrap datasets
        train_dataset = SupervisedDatasetFromHFDataset(
            hf_dataset=split["train"],
            batch_size=self.common_config.batch_size,
            map_fn=map_fn,
        )

        test_dataset = SupervisedDatasetFromHFDataset(
            hf_dataset=split["test"],
            batch_size=self.common_config.batch_size,
            map_fn=map_fn,
        )

        return train_dataset, test_dataset
```

**Key APIs**:
- Inherit from `ChatDatasetBuilder`
- Access `self.renderer` (created from `common_config`)
- Access `self.common_config` for shared settings
- `conversation_to_datum()` converts messages to training data
- `SupervisedDatasetFromHFDataset` wraps HF dataset
- Return `(train_dataset, test_dataset)` tuple

**conversation_to_datum Parameters**:
- `messages`: List of dicts with "role" and "content"
- `renderer`: From `self.renderer`
- `max_length`: Maximum sequence length
- `train_on_what`: `TrainOnWhat` enum value

### Pattern 4: File-Based Dataset Loading

Use `FromConversationFileBuilder` for JSONL conversation files:

```python
from tinker_cookbook.supervised.data import FromConversationFileBuilder
from tinker_cookbook.supervised.types import ChatDatasetBuilderCommonConfig
import os
import chz

@chz.chz
class CLIConfig:
    model_name: str
    file_path: str
    max_length: int = 2048
    batch_size: int = 128

def build_dataset(cli_config: CLIConfig):
    # Validate file exists
    if not os.path.exists(cli_config.file_path):
        raise FileNotFoundError(f"Data file not found: {cli_config.file_path}")

    # Create common config
    common_config = ChatDatasetBuilderCommonConfig(
        model_name_for_tokenizer=cli_config.model_name,
        renderer_name=get_recommended_renderer_name(cli_config.model_name),
        max_length=cli_config.max_length,
        batch_size=cli_config.batch_size,
        train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
    )

    # Use file-based builder
    return FromConversationFileBuilder(
        common_config=common_config,
        file_path=cli_config.file_path,
    )
```

**JSONL File Format**:
```json
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

**Key Points**:
- `FromConversationFileBuilder` handles JSONL parsing automatically
- Expects `messages` field with OpenAI-style format
- Always validate file exists before training
- Provide clear error messages for missing files
- Use for local data files not on HF hub

### Pattern 5: Streaming Datasets

For large datasets that don't fit in memory:

```python
from tinker_cookbook.supervised.types import ChatDatasetBuilder
from tinker_cookbook.supervised.data import StreamingSupervisedDatasetFromHFDataset, conversation_to_datum
import datasets
import chz

@chz.chz
class StreamingDatasetBuilder(ChatDatasetBuilder):
    common_config: ChatDatasetBuilderCommonConfig
    max_prompts: int = 100000
    buffer_size: int = 10000

    def __call__(self):
        # Load dataset with streaming=True
        ds = datasets.load_dataset(
            "open-thoughts/OpenThoughts3-1.2M",
            split="train",
            streaming=True  # Important: enables streaming
        )

        def map_fn(row):
            # Convert to conversation format
            messages = [
                {"role": "user", "content": row["question"]},
                {"role": "assistant", "content": row["response"]},
            ]
            return conversation_to_datum(
                messages=messages,
                renderer=self.renderer,
                max_length=self.common_config.max_length,
                train_on_what=self.common_config.train_on_what,
            )

        # Use streaming wrapper (note: different from regular wrapper!)
        train_dataset = StreamingSupervisedDatasetFromHFDataset(
            hf_dataset=ds,
            batch_size=self.common_config.batch_size,
            length=self.max_prompts,  # Required: max samples to train on
            map_fn=map_fn,
            buffer_size=self.buffer_size,  # Optional: shuffle buffer size
        )

        # For test, can use smaller sample
        test_ds = ds.take(1000)
        test_dataset = StreamingSupervisedDatasetFromHFDataset(
            hf_dataset=test_ds,
            batch_size=self.common_config.batch_size,
            length=1000,
            map_fn=map_fn,
            buffer_size=1000,
        )

        return train_dataset, test_dataset
```

**Key Differences from Regular Wrapper**:
- Load with `datasets.load_dataset(..., streaming=True)`
- Returns `IterableDataset` instead of `Dataset`
- Must use `StreamingSupervisedDatasetFromHFDataset` (not regular wrapper)
- **Must specify `length` parameter**: Max samples to process
- `buffer_size`: Size of shuffle buffer (optional but recommended)
- Use `.take()` to sample smaller test set from stream

**When to Use Streaming**:
- Dataset > 1M examples
- Dataset doesn't fit in RAM
- Want to start training immediately without full download
- Working with very large multi-modal datasets

### Pattern 6: Custom Dataset Implementation

For complex preprocessing or non-standard data formats:

```python
from tinker_cookbook.supervised.types import SupervisedDataset
from tinker.types import Datum, ModelInput, TensorData
from tinker_cookbook.renderers import get_renderer
from tinker import tinker
import chz
import numpy as np

@chz.chz
class CustomDatasetConfig:
    model_name: str
    renderer_name: str
    data_path: str
    max_length: int = 2048
    batch_size: int = 128

class CustomDataset(SupervisedDataset):
    def __init__(self, config: CustomDatasetConfig):
        self.config = config

        # Setup tokenizer and renderer
        self.tokenizer = tinker.get_tokenizer(config.model_name)
        self.renderer = get_renderer(
            name=config.renderer_name,
            tokenizer=self.tokenizer,
            max_length=config.max_length,
        )

        # Load and preprocess your data
        self.data = self._load_data()

    def _load_data(self):
        # Your custom data loading logic
        # Return list or iterator of data items
        pass

    def __len__(self):
        # Return number of batches or samples
        return len(self.data) // self.config.batch_size

    def __iter__(self):
        # Yield Datum objects
        for item in self.data:
            # Your custom preprocessing
            messages = self._preprocess_item(item)

            # Use renderer to build supervised example
            example = self.renderer.build_supervised_example(
                messages=messages,
                train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
            )

            # Create Datum
            yield Datum(
                model_input=ModelInput([example.chunk]),
                loss_fn_inputs={
                    "target_tokens": TensorData.from_numpy(
                        np.array(example.target_tokens, dtype=np.int64)
                    ),
                    "weights": TensorData.from_numpy(
                        np.array(example.weights, dtype=np.float32)
                    ),
                },
            )

    def _preprocess_item(self, item):
        # Your custom preprocessing logic
        # Return list of message dicts
        pass
```

**Key Points**:
- Inherit from `SupervisedDataset` (not `ChatDatasetBuilder`)
- Implement `__len__()` returning total batches or samples
- Implement `__iter__()` yielding `Datum` objects
- Create config dataclass with `@chz.chz` for parameters
- Setup tokenizer with `tinker.get_tokenizer()`
- Setup renderer with `get_renderer()`
- Use `renderer.build_supervised_example()` for tokenization
- Create `Datum` with `ModelInput` and `loss_fn_inputs`

**When to Use Custom Dataset**:
- Complex preprocessing not covered by builders
- Non-standard data formats
- Need fine-grained control over batching
- Special tokenization requirements
- Multi-modal data (see vision-datasets.md)

## Training Configuration

### train.Config Fields

Required:
- `model_name`: Base model identifier (e.g., "meta-llama/Llama-3.1-8B")
- `log_path`: Directory for logs and checkpoints
- `dataset_builder`: Instance of dataset builder

Common hyperparameters:
- `learning_rate`: Learning rate (default: 2e-4 for LoRA)
- `lr_schedule`: "cosine", "linear", or "constant"
- `num_epochs`: Number of training epochs
- `lora_rank`: LoRA rank (default: 32)
- `save_every`: Save checkpoint every N steps
- `eval_every`: Run evaluation every N steps
- `batch_size`: Global batch size (optional, can use builder's batch_size)
- `gradient_accumulation_steps`: Accumulate gradients over N steps

### ChatDatasetBuilderCommonConfig Fields

- `model_name_for_tokenizer`: Model name for loading tokenizer
- `renderer_name`: Chat format (get with `get_recommended_renderer_name()`)
- `max_length`: Maximum sequence length in tokens
- `batch_size`: Batch size for dataset
- `train_on_what`: `TrainOnWhat` enum value

### TrainOnWhat Enum

From `tinker_cookbook.renderers`:

- `TrainOnWhat.ALL_ASSISTANT_MESSAGES`: Train on all assistant turns (default)
- `TrainOnWhat.LAST_ASSISTANT_MESSAGE`: Train only on final assistant response

**When to use LAST_ASSISTANT_MESSAGE**:
- Multi-turn conversations where only final answer matters
- Chain-of-thought where intermediate reasoning shouldn't be trained
- Preference learning where only final response is scored

## Async Execution

All training must run asynchronously:

### With @chz.chz:

```python
async def train_async(cli_config: CLIConfig):
    # Build config
    config = build_train_config(cli_config)
    # Run training
    await train.main(config)

def main():
    cli_config = chz.nested_entrypoint(CLIConfig)
    asyncio.run(train_async(cli_config))
```

### With Blueprint:

```python
def main(config: train.Config):
    asyncio.run(train.main(config))

if __name__ == "__main__":
    blueprint = build_config_blueprint()
    blueprint.make_from_argv(sys.argv[1:])
    main(blueprint.make())
```

## Complete Example Workflows

### Example 1: HuggingFace Dataset with @chz.chz

```python
import chz
import asyncio
from tinker_cookbook.supervised import train
from tinker_cookbook.supervised.types import ChatDatasetBuilder, ChatDatasetBuilderCommonConfig
from tinker_cookbook.supervised.data import SupervisedDatasetFromHFDataset, conversation_to_datum
from tinker_cookbook.renderers import TrainOnWhat
from tinker_cookbook.model_info import get_recommended_renderer_name
import datasets

@chz.chz
class MyDatasetBuilder(ChatDatasetBuilder):
    common_config: ChatDatasetBuilderCommonConfig

    def __call__(self):
        hf_dataset = datasets.load_dataset("HuggingFaceH4/no_robots", split="train")
        split = hf_dataset.train_test_split(test_size=0.1)

        def map_fn(row):
            messages = [
                {"role": "user", "content": row["prompt"]},
                {"role": "assistant", "content": row["completion"]},
            ]
            return conversation_to_datum(
                messages=messages,
                renderer=self.renderer,
                max_length=self.common_config.max_length,
                train_on_what=self.common_config.train_on_what,
            )

        train_ds = SupervisedDatasetFromHFDataset(
            hf_dataset=split["train"],
            batch_size=self.common_config.batch_size,
            map_fn=map_fn,
        )
        test_ds = SupervisedDatasetFromHFDataset(
            hf_dataset=split["test"],
            batch_size=self.common_config.batch_size,
            map_fn=map_fn,
        )
        return train_ds, test_ds

@chz.chz
class CLIConfig:
    model_name: str = "meta-llama/Llama-3.1-8B"
    log_path: str = "/tmp/training"
    max_length: int = 2048
    batch_size: int = 128

async def train_async(cli_config: CLIConfig):
    renderer_name = get_recommended_renderer_name(cli_config.model_name)
    common_config = ChatDatasetBuilderCommonConfig(
        model_name_for_tokenizer=cli_config.model_name,
        renderer_name=renderer_name,
        max_length=cli_config.max_length,
        batch_size=cli_config.batch_size,
        train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
    )

    dataset_builder = MyDatasetBuilder(common_config=common_config)

    config = train.Config(
        model_name=cli_config.model_name,
        log_path=cli_config.log_path,
        dataset_builder=dataset_builder,
        learning_rate=2e-4,
        num_epochs=3,
        lora_rank=32,
    )

    await train.main(config)

def main():
    cli_config = chz.nested_entrypoint(CLIConfig)
    asyncio.run(train_async(cli_config))

if __name__ == "__main__":
    main()
```

### Example 2: File-Based with Blueprint

```python
import chz
import sys
import asyncio
import os
from tinker_cookbook.supervised import train
from tinker_cookbook.supervised.data import FromConversationFileBuilder
from tinker_cookbook.supervised.types import ChatDatasetBuilderCommonConfig
from tinker_cookbook.renderers import TrainOnWhat
from tinker_cookbook.model_info import get_recommended_renderer_name

def build_config_blueprint() -> chz.Blueprint[train.Config]:
    model_name = "meta-llama/Llama-3.1-8B"
    file_path = "conversations.jsonl"

    # Validate file
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    renderer_name = get_recommended_renderer_name(model_name)
    common_config = ChatDatasetBuilderCommonConfig(
        model_name_for_tokenizer=model_name,
        renderer_name=renderer_name,
        max_length=2048,
        batch_size=128,
        train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
    )

    dataset_builder = FromConversationFileBuilder(
        common_config=common_config,
        file_path=file_path,
    )

    return chz.Blueprint(train.Config).apply({
        "log_path": "/tmp/training",
        "model_name": model_name,
        "dataset_builder": dataset_builder,
        "learning_rate": 2e-4,
        "num_epochs": 3,
        "lora_rank": 32,
    })

def main(config: train.Config):
    asyncio.run(train.main(config))

if __name__ == "__main__":
    blueprint = build_config_blueprint()
    blueprint.make_from_argv(sys.argv[1:])
    main(blueprint.make())
```

## Key Imports Reference

```python
# Configuration
import chz
import asyncio
import sys
import os

# HF datasets
import datasets

# Core training
from tinker_cookbook.supervised import train

# Dataset builders and types
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

# Renderers
from tinker_cookbook.renderers import TrainOnWhat, get_renderer

# Model utilities
from tinker_cookbook.model_info import get_recommended_renderer_name

# Low-level types (for custom datasets)
from tinker.types import Datum, ModelInput, TensorData
import tinker
```

## Best Practices Summary

1. **Always use chz**: Decorate configs and builders with `@chz.chz`
2. **Choose right pattern**: Blueprint for setup logic, @chz.chz for simple configs
3. **Validate inputs**: Check file existence, dataset availability
4. **Use builders**: Inherit from `ChatDatasetBuilder` for chat data
5. **Common config**: Create `ChatDatasetBuilderCommonConfig` for shared settings
6. **Right wrapper**: Regular for in-memory, streaming for large datasets
7. **File validation**: Always check file paths before training
8. **Async execution**: Run with `asyncio.run(train.main(config))`
9. **Renderer selection**: Use `get_recommended_renderer_name()` for model
10. **TrainOnWhat**: Choose based on your training objective
