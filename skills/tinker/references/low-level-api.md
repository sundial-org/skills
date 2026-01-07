## Tinker Low-Level API Reference

This document covers manual training control using Tinker's low-level ServiceClient and TrainingClient APIs.

## When to Use Low-Level API

Use the low-level API when you need:
- Custom training loop logic
- Fine-grained control over each training step
- Custom gradient accumulation strategies
- Research experiments with non-standard training
- Online learning or RL with custom logic
- Direct access to tokenization and data conversion

**Note**: For standard supervised fine-tuning, prefer the high-level Cookbook patterns.

## Core Setup

### ServiceClient and TrainingClient

```python
import tinker
from tinker import types

# Create service client
service_client = tinker.ServiceClient()

# Create LoRA training client
training_client = service_client.create_lora_training_client(
    base_model="meta-llama/Llama-3.1-8B",
    rank=32,  # LoRA rank
    train_attn=True,  # Train attention layers (default)
    train_mlp=True,  # Train MLP layers (default)
    train_unembed=False,  # Train output embedding (optional)
    seed=42,  # Random seed for reproducibility
)

# Get tokenizer for data preparation
tokenizer = training_client.get_tokenizer()
```

**ServiceClient Methods**:
- `create_lora_training_client()`: Create LoRA training client
- `create_sampling_client()`: Create inference client from checkpoint
- `get_server_capabilities()`: Query available models

**TrainingClient Configuration**:
- `base_model`: Model identifier (e.g., "meta-llama/Llama-3.1-8B")
- `rank`: LoRA rank (typical: 16-64)
- `train_attn`: Enable LoRA for attention layers
- `train_mlp`: Enable LoRA for MLP layers
- `train_unembed`: Enable LoRA for output embedding
- `seed`: Random seed for LoRA initialization

## Data Preparation

### Creating Datum Objects

`Datum` is the core training data structure:

```python
from tinker.types import Datum, ModelInput, TensorData
import numpy as np

# Example: Tokenize prompt and completion
prompt_text = "Question: What is 2+2?\nAnswer: "
completion_text = "4"

prompt_tokens = tokenizer.encode(prompt_text)
completion_tokens = tokenizer.encode(completion_text)

# Combine tokens
all_tokens = prompt_tokens + completion_tokens

# Create weights (0 for prompt, 1 for completion)
weights = [0.0] * len(prompt_tokens) + [1.0] * len(completion_tokens)

# Create ModelInput
model_input = types.ModelInput.from_ints(all_tokens)

# Create target tokens (shifted by 1 for next-token prediction)
target_tokens = np.array(all_tokens[1:], dtype=np.int64)

# Create weights (shifted by 1)
weights_array = np.array(weights[1:], dtype=np.float32)

# Create Datum
datum = types.Datum(
    model_input=model_input,
    loss_fn_inputs={
        "target_tokens": types.TensorData.from_numpy(target_tokens),
        "weights": types.TensorData.from_numpy(weights_array),
    }
)
```

**Key Points**:
- `ModelInput.from_ints()` creates model input from token list
- Target tokens are **shifted by 1** (model predicts next token)
- Weights are **shifted by 1** to match targets
- Use 0.0 weights for prompt, 1.0 for completion
- `TensorData.from_numpy()` converts numpy arrays

### Batch Preparation

```python
# Prepare batch of Datum objects
batch = []
for example in data_examples:
    prompt_tokens = tokenizer.encode(example["prompt"])
    completion_tokens = tokenizer.encode(example["completion"])

    all_tokens = prompt_tokens + completion_tokens
    weights = [0.0] * len(prompt_tokens) + [1.0] * len(completion_tokens)

    datum = types.Datum(
        model_input=types.ModelInput.from_ints(all_tokens),
        loss_fn_inputs={
            "target_tokens": types.TensorData.from_numpy(
                np.array(all_tokens[1:], dtype=np.int64)
            ),
            "weights": types.TensorData.from_numpy(
                np.array(weights[1:], dtype=np.float32)
            ),
        }
    )
    batch.append(datum)
```

## Training Loop

### Basic Training Pattern

```python
from tinker.types import AdamParams

# Training hyperparameters
adam_params = AdamParams(
    learning_rate=1e-4,
    beta1=0.9,
    beta2=0.95,
    eps=1e-8,
)

# Training loop
for step in range(num_steps):
    # Get batch data
    batch = prepare_batch(data[step * batch_size:(step + 1) * batch_size])

    # Forward and backward pass
    fwdbwd_future = training_client.forward_backward(
        data=batch,
        loss_fn="cross_entropy",
    )

    # Optimizer step
    optim_future = training_client.optim_step(adam_params)

    # Wait for results
    fwdbwd_result = fwdbwd_future.result()
    optim_result = optim_future.result()

    # Log metrics
    print(f"Step {step}, Loss: {fwdbwd_result.loss}")

    # Save checkpoint periodically
    if (step + 1) % save_every == 0:
        training_client.save_state(name=f"checkpoint-{step}")
```

**Key APIs**:
- `forward_backward(data, loss_fn)`: Compute gradients from batch
- `optim_step(adam_params)`: Update model weights
- Both return futures that must be awaited with `.result()`

### Loss Functions

Built-in loss functions (pass as string to `forward_backward`):

**Supervised Learning**:
- `"cross_entropy"`: Standard next-token prediction loss

**Reinforcement Learning**:
- `"importance_sampling"`: Policy gradient with importance weighting
- `"ppo"`: Proximal Policy Optimization
- `"cispo"`: Clipped Importance Sampling Policy Optimization
- `"dro"`: Direct Reward Optimization

### Optimizer Parameters

`AdamParams` fields:
- `learning_rate`: Learning rate (typical: 1e-4 to 1e-5 for LoRA)
- `beta1`: First moment decay (default: 0.9)
- `beta2`: Second moment decay (default: 0.95)
- `eps`: Numerical stability constant (default: 1e-8)

## Advanced Patterns

### Async Execution

For better throughput, submit next operation before waiting:

```python
# Submit forward_backward and optim_step together
fwdbwd_future = training_client.forward_backward(batch, "cross_entropy")
optim_future = training_client.optim_step(adam_params)

# Do other work here...

# Wait for results when needed
fwdbwd_result = fwdbwd_future.result()
optim_result = optim_future.result()
```

**Benefits**:
- Overlaps computation and communication
- Maximizes GPU utilization
- Reduces "clock cycle" waste (Tinker schedules in ~10s cycles)

### Async API Methods

All methods have async variants:

```python
# Async versions
fwdbwd_future = training_client.forward_backward_async(batch, "cross_entropy")
optim_future = training_client.optim_step_async(adam_params)

# Use in async context
await fwdbwd_future
await optim_future
```

## State Management

### Saving and Loading

```python
# Save full training state (optimizer + weights)
training_client.save_state(name="checkpoint-1000")

# Load state to resume training
training_client.load_state(path="checkpoint-1000")

# Save weights for inference only (faster, smaller)
sampling_client = training_client.save_weights_and_get_sampling_client(
    name="my-model-final"
)
```

**save_state vs save_weights**:
- `save_state()`: Full checkpoint with optimizer state (for resuming training)
- `save_weights_and_get_sampling_client()`: Weights only (for inference)

### Checkpointing Strategy

```python
# Periodic checkpointing
for step in range(num_steps):
    # Training iteration
    fwdbwd_future = training_client.forward_backward(batch, "cross_entropy")
    optim_future = training_client.optim_step(adam_params)

    fwdbwd_result = fwdbwd_future.result()
    optim_result = optim_future.result()

    # Save every N steps
    if (step + 1) % save_every == 0:
        training_client.save_state(name=f"checkpoint-{step+1}")

    # Early stopping logic
    if should_stop(fwdbwd_result.loss):
        break

# Final checkpoint
training_client.save_state(name="final")
```

## Sampling and Evaluation

### Creating Sampling Client

```python
# From training client
sampling_client = training_client.save_weights_and_get_sampling_client(
    name="my-model"
)

# Or from service client with existing checkpoint
sampling_client = service_client.create_sampling_client(
    model_path="checkpoint-name"
)
```

### Generating Samples

```python
from tinker.types import SamplingParams

# Prepare prompt
prompt_text = "Question: What is 2+2?\nAnswer:"
prompt_tokens = tokenizer.encode(prompt_text)
prompt_input = types.ModelInput.from_ints(prompt_tokens)

# Configure sampling
sampling_params = SamplingParams(
    max_tokens=100,
    temperature=0.7,
    top_p=0.9,
    top_k=50,
    stop=["<|endoftext|>"],  # Stop sequences
    seed=42,  # For reproducibility
)

# Sample
result = sampling_client.sample(
    prompt=prompt_input,
    sampling_params=sampling_params,
    num_samples=1,
)

# Decode output
output_tokens = result.sequences[0].tokens
output_text = tokenizer.decode(output_tokens)
print(output_text)
```

**SamplingParams**:
- `max_tokens`: Maximum tokens to generate
- `temperature`: Sampling temperature (0 = greedy, higher = more random)
- `top_p`: Nucleus sampling threshold
- `top_k`: Top-k sampling threshold
- `stop`: Stop sequences (strings or token IDs)
- `seed`: Random seed for reproducibility

## Complete Example: Manual Training Loop

```python
import tinker
from tinker import types
import numpy as np
import chz

@chz.chz
class Config:
    model_name: str = "meta-llama/Llama-3.1-8B"
    data_file: str = "train.jsonl"
    log_path: str = "/tmp/training"
    num_steps: int = 1000
    batch_size: int = 8
    learning_rate: float = 1e-4
    lora_rank: int = 32
    save_every: int = 100

def load_data(file_path):
    """Load training data from JSONL file"""
    import json
    data = []
    with open(file_path) as f:
        for line in f:
            data.append(json.loads(line))
    return data

def prepare_batch(data_items, tokenizer):
    """Convert data items to Datum objects"""
    batch = []
    for item in data_items:
        prompt_tokens = tokenizer.encode(item["prompt"])
        completion_tokens = tokenizer.encode(item["completion"])

        all_tokens = prompt_tokens + completion_tokens
        weights = [0.0] * len(prompt_tokens) + [1.0] * len(completion_tokens)

        datum = types.Datum(
            model_input=types.ModelInput.from_ints(all_tokens),
            loss_fn_inputs={
                "target_tokens": types.TensorData.from_numpy(
                    np.array(all_tokens[1:], dtype=np.int64)
                ),
                "weights": types.TensorData.from_numpy(
                    np.array(weights[1:], dtype=np.float32)
                ),
            }
        )
        batch.append(datum)
    return batch

def train(config: Config):
    # Setup clients
    service_client = tinker.ServiceClient()
    training_client = service_client.create_lora_training_client(
        base_model=config.model_name,
        rank=config.lora_rank,
    )
    tokenizer = training_client.get_tokenizer()

    # Load data
    data = load_data(config.data_file)

    # Optimizer parameters
    adam_params = types.AdamParams(
        learning_rate=config.learning_rate,
        beta1=0.9,
        beta2=0.95,
        eps=1e-8,
    )

    # Training loop
    for step in range(config.num_steps):
        # Get batch
        start_idx = (step * config.batch_size) % len(data)
        end_idx = start_idx + config.batch_size
        batch_data = data[start_idx:end_idx]

        # Prepare batch
        batch = prepare_batch(batch_data, tokenizer)

        # Training step
        fwdbwd_future = training_client.forward_backward(
            data=batch,
            loss_fn="cross_entropy",
        )
        optim_future = training_client.optim_step(adam_params)

        # Get results
        fwdbwd_result = fwdbwd_future.result()
        optim_result = optim_future.result()

        # Log
        print(f"Step {step}, Loss: {fwdbwd_result.loss}")

        # Save checkpoint
        if (step + 1) % config.save_every == 0:
            training_client.save_state(name=f"checkpoint-{step+1}")

    # Final checkpoint and sampling client
    sampling_client = training_client.save_weights_and_get_sampling_client(
        name="final-model"
    )
    print("Training complete!")

    return sampling_client

def main():
    config = chz.nested_entrypoint(Config)
    train(config)

if __name__ == "__main__":
    main()
```

## Integration with Cookbook

You can use Cookbook utilities with low-level training:

### Using Renderers

```python
from tinker_cookbook.renderers import get_renderer, TrainOnWhat
import tinker

# Setup renderer
tokenizer = tinker.get_tokenizer("meta-llama/Llama-3.1-8B")
renderer = get_renderer(
    name="chatml",
    tokenizer=tokenizer,
    max_length=2048,
)

# Use renderer for data preparation
messages = [
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4"},
]

# Build supervised example
example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)

# Create Datum from rendered example
datum = types.Datum(
    model_input=types.ModelInput([example.chunk]),
    loss_fn_inputs={
        "target_tokens": types.TensorData.from_numpy(
            np.array(example.target_tokens, dtype=np.int64)
        ),
        "weights": types.TensorData.from_numpy(
            np.array(example.weights, dtype=np.float32)
        ),
    },
)
```

### Using conversation_to_datum

```python
from tinker_cookbook.supervised.data import conversation_to_datum

# Simpler: use conversation_to_datum utility
messages = [
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4"},
]

datum = conversation_to_datum(
    messages=messages,
    renderer=renderer,
    max_length=2048,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)
```

## Key Differences: Low-Level vs Cookbook

| Aspect | Low-Level API | Cookbook |
|--------|---------------|----------|
| Setup | Manual ServiceClient, TrainingClient | Automatic from config |
| Data prep | Manual Datum creation | Dataset builders |
| Training loop | Manual forward_backward + optim_step | Automatic in train.main() |
| Checkpointing | Manual save_state calls | Automatic based on config |
| Evaluation | Manual sampling client | Automatic eval loops |
| CLI config | Manual chz or argparse | chz.nested_entrypoint |
| Async execution | Manual future handling | Handled by train.main() |

**When to combine**:
- Use Cookbook's dataset builders and renderers
- But implement custom training loop for research
- Get best of both: structured data + flexible training

## Best Practices

1. **Always shift targets and weights by 1**: Model predicts next token
2. **Use futures efficiently**: Submit operations before waiting
3. **Save state regularly**: Enables resuming training
4. **Validate data before training**: Check file paths, formats
5. **Use renderers for chat data**: Avoid manual format string construction
6. **Log metrics frequently**: Monitor training progress
7. **Handle errors gracefully**: Wrap training in try/except
8. **Use appropriate learning rates**: 1e-4 to 1e-5 for LoRA
9. **Checkpoint at end**: Always save final model
10. **Test with small data first**: Verify pipeline before full run
