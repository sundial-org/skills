## Renderer System Reference

This document covers the Tinker Cookbook renderer system for converting between messages and token sequences.

## Overview

Renderers handle bidirectional conversion:
- **Messages → Tokens**: For training (supervised examples) and inference (generation prompts)
- **Tokens → Messages**: For parsing model outputs back to structured format

Different models use different chat formats (ChatML, Llama, Qwen, etc.), and renderers abstract these differences.

## Getting a Renderer

### Automatic Selection

```python
from tinker_cookbook.model_info import get_recommended_renderer_name
from tinker_cookbook.renderers import get_renderer
import tinker

model_name = "meta-llama/Llama-3.1-8B"

# Get recommended renderer for model
renderer_name = get_recommended_renderer_name(model_name)

# Create renderer
tokenizer = tinker.get_tokenizer(model_name)
renderer = get_renderer(
    name=renderer_name,
    tokenizer=tokenizer,
    max_length=2048,
)
```

**Renderer Names**:
- `"chatml"`: ChatML format (used by many models)
- `"llama3"`: Llama 3 chat format
- `"qwen3"`: Qwen 3 chat format
- `"qwen3vl"`: Qwen 3 VL (vision-language) format
- Additional renderers for other model families

### Manual Selection

```python
# If you know the specific format you want
renderer = get_renderer(
    name="chatml",  # Explicit format
    tokenizer=tokenizer,
    max_length=2048,
)
```

## Core Methods

### build_supervised_example

Converts messages to training data with loss weights:

```python
from tinker_cookbook.renderers import TrainOnWhat

messages = [
    {"role": "user", "content": "What is 2+2?"},
    {"role": "assistant", "content": "4"},
]

example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)

# Returns object with:
# - example.chunk: EncodedTextChunk with tokens
# - example.target_tokens: List[int] (next-token targets)
# - example.weights: List[float] (loss weights)
```

**Fields**:
- `chunk`: Token sequence as `EncodedTextChunk`
- `target_tokens`: Target tokens for next-token prediction
- `weights`: Loss weights (0.0 = ignore, 1.0 = train)

**How weights work**:
- User messages: weights = 0.0 (don't train on prompts)
- Assistant messages: weights = 1.0 (train on completions)
- System messages: typically 0.0
- Special tokens: handled automatically

### build_generation_prompt

Converts messages to inference prompt:

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is 2+2?"},
]

# For inference - no assistant response yet
prompt_chunk = renderer.build_generation_prompt(messages)

# Returns EncodedTextChunk ready for sampling
# Includes proper format markers, ready for model to continue
```

**Difference from build_supervised_example**:
- No target tokens or weights
- Ends at point where model should generate
- Includes format-specific continuation markers

### get_stop_sequences

Returns stop tokens/strings for generation:

```python
stop_sequences = renderer.get_stop_sequences()

# Use in SamplingParams
from tinker.types import SamplingParams

sampling_params = SamplingParams(
    max_tokens=100,
    stop=stop_sequences,
    # ... other params
)
```

**Purpose**:
- Prevents model from generating past turn boundary
- Format-specific (e.g., `<|im_end|>` for ChatML)
- Essential for multi-turn generation

### parse_response

Converts generated tokens back to message:

```python
# After sampling
output_tokens = result.sequences[0].tokens

# Parse back to message
message = renderer.parse_response(output_tokens)

# Returns dict: {"role": "assistant", "content": "..."}
```

## TrainOnWhat Enum

Controls which parts of conversation to train on:

```python
from tinker_cookbook.renderers import TrainOnWhat

# Train on all assistant messages
TrainOnWhat.ALL_ASSISTANT_MESSAGES

# Train only on last assistant message
TrainOnWhat.LAST_ASSISTANT_MESSAGE
```

### ALL_ASSISTANT_MESSAGES

Trains on every assistant turn in the conversation:

```python
messages = [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"},  # Train on this
    {"role": "user", "content": "How are you?"},
    {"role": "assistant", "content": "I'm doing well, thanks!"},  # And this
]

example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)
# Weights will be 1.0 for both assistant messages
```

**Use when**:
- Training general chat models
- Want model to learn intermediate reasoning
- Multi-turn dialogue is important
- All responses are equally valuable

### LAST_ASSISTANT_MESSAGE

Trains only on the final assistant response:

```python
messages = [
    {"role": "user", "content": "What's 2+2?"},
    {"role": "assistant", "content": "Let me think..."},  # Weight = 0.0
    {"role": "user", "content": "Yes, please calculate"},
    {"role": "assistant", "content": "The answer is 4."},  # Weight = 1.0
]

example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.LAST_ASSISTANT_MESSAGE,
)
# Only final assistant message has weight = 1.0
```

**Use when**:
- Classification tasks (only final answer matters)
- Reward modeling (only final response scored)
- Chain-of-thought where intermediate steps shouldn't be trained
- Preference learning

## Message Format

Standard message format across renderers:

```python
message = {
    "role": "user" | "assistant" | "system",
    "content": "text content",
}
```

### Text-Only Messages

```python
messages = [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "What is Python?"},
    {"role": "assistant", "content": "Python is a programming language."},
]
```

### Multi-Modal Messages (Vision)

For vision-language models:

```python
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image_bytes},
            {"type": "text", "text": "What's in this image?"},
        ]
    },
    {
        "role": "assistant",
        "content": "I see a cat.",
    }
]
```

**Content can be**:
- String: Simple text message
- List of dicts: Multi-modal content (text + images)

## Renderer Configuration

### max_length

Controls maximum sequence length:

```python
renderer = get_renderer(
    name="chatml",
    tokenizer=tokenizer,
    max_length=2048,  # Maximum tokens in sequence
)
```

**Effects**:
- Truncates long conversations
- Ensures sequences fit model context
- Typically: 2048 for training, 4096+ for inference

**Truncation strategy**:
- Preserves final messages
- Removes oldest messages if exceeds max_length
- Ensures last assistant message always included

## Using Renderers with Datasets

### With conversation_to_datum

High-level utility that uses renderer internally:

```python
from tinker_cookbook.supervised.data import conversation_to_datum

messages = [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi!"},
]

datum = conversation_to_datum(
    messages=messages,
    renderer=renderer,  # Renderer created earlier
    max_length=2048,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)

# Returns Datum ready for training
```

**Handles**:
- Calls `renderer.build_supervised_example()`
- Creates `ModelInput` from chunk
- Wraps target_tokens and weights as `TensorData`
- Returns complete `Datum` object

### With Custom Datasets

Manual renderer usage in custom dataset:

```python
from tinker_cookbook.supervised.types import SupervisedDataset
from tinker.types import Datum, ModelInput, TensorData
import numpy as np

class MyDataset(SupervisedDataset):
    def __iter__(self):
        for item in self.data:
            messages = self._create_messages(item)

            # Use renderer to build example
            example = self.renderer.build_supervised_example(
                messages=messages,
                train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
            )

            # Create Datum from rendered example
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
```

## Format-Specific Details

### ChatML Format

Used by many models:

```
<|im_start|>system
You are a helpful assistant.<|im_end|>
<|im_start|>user
What is 2+2?<|im_end|>
<|im_start|>assistant
4<|im_end|>
```

### Llama 3 Format

```
<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful assistant.<|eot_id|><|start_header_id|>user<|end_header_id|>

What is 2+2?<|eot_id|><|start_header_id|>assistant<|end_header_id|>

4<|eot_id|>
```

### Qwen 3 Format

Similar to ChatML with model-specific tokens.

**Important**: Don't construct format strings manually - use renderers to ensure correct formatting!

## Advanced Usage

### Accessing Renderer in Dataset Builder

If inheriting from `ChatDatasetBuilder`:

```python
@chz.chz
class MyDatasetBuilder(ChatDatasetBuilder):
    common_config: ChatDatasetBuilderCommonConfig

    def __call__(self):
        # Renderer automatically created from common_config
        # Access via self.renderer

        def map_fn(row):
            messages = [...]

            # Use self.renderer
            return conversation_to_datum(
                messages=messages,
                renderer=self.renderer,
                max_length=self.common_config.max_length,
                train_on_what=self.common_config.train_on_what,
            )

        # ... rest of builder
```

**Automatic setup**:
- Renderer created from `common_config.renderer_name`
- Tokenizer from `common_config.model_name_for_tokenizer`
- Max length from `common_config.max_length`
- Available as `self.renderer`

### Creating Renderer Manually

For low-level API usage:

```python
from tinker_cookbook.renderers import get_renderer
import tinker

# Get tokenizer
tokenizer = tinker.get_tokenizer("meta-llama/Llama-3.1-8B")

# Create renderer
renderer = get_renderer(
    name="llama3",
    tokenizer=tokenizer,
    max_length=2048,
)

# Use in custom training loop
messages = [...]
example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)

# Convert to Datum manually (see low-level-api.md)
```

## Renderer Selection Guidelines

### By Model Family

| Model | Renderer |
|-------|----------|
| Llama 3.x | llama3 |
| Qwen 3 (text) | qwen3 |
| Qwen 3 VL | qwen3vl |
| GPT-style | chatml |
| DeepSeek | varies (check docs) |

### Use get_recommended_renderer_name()

Always prefer automatic selection:

```python
from tinker_cookbook.model_info import get_recommended_renderer_name

# Automatically picks correct renderer
renderer_name = get_recommended_renderer_name(model_name)
```

**Benefits**:
- Handles all model variations
- Updated as new models added
- Ensures correct format for model

## Common Patterns

### Pattern: System Prompt Injection

```python
system_message = {"role": "system", "content": "You are an expert programmer."}

messages = [system_message] + conversation_messages

example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.ALL_ASSISTANT_MESSAGES,
)
```

### Pattern: Few-Shot Examples

```python
few_shot_examples = [
    {"role": "user", "content": "What's 1+1?"},
    {"role": "assistant", "content": "2"},
    {"role": "user", "content": "What's 2+2?"},
    {"role": "assistant", "content": "4"},
]

actual_conversation = [
    {"role": "user", "content": "What's 3+3?"},
    {"role": "assistant", "content": "6"},
]

messages = few_shot_examples + actual_conversation

# Only train on actual conversation, not examples
example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.LAST_ASSISTANT_MESSAGE,
)
```

### Pattern: Multi-Turn with History

```python
conversation_history = load_previous_turns()  # Previous messages

new_turn = [
    {"role": "user", "content": "What about X?"},
    {"role": "assistant", "content": "Here's info about X"},
]

messages = conversation_history + new_turn

example = renderer.build_supervised_example(
    messages=messages,
    train_on_what=TrainOnWhat.LAST_ASSISTANT_MESSAGE,  # Only train on new response
)
```

## Best Practices

1. **Use automatic renderer selection**: Call `get_recommended_renderer_name()`
2. **Don't construct formats manually**: Let renderer handle special tokens
3. **Match renderer to model**: Wrong renderer = wrong format = bad training
4. **Use TrainOnWhat appropriately**: ALL for chat, LAST for tasks
5. **Respect max_length**: Ensure conversations fit model context
6. **Include system prompts**: When model supports them
7. **Use stop sequences**: In SamplingParams for proper generation
8. **Parse responses**: Use `parse_response()` for structured output
9. **Test with small data**: Verify format before full training
10. **Check tokenization**: Ensure tokens look reasonable

## Common Imports

```python
# Renderer utilities
from tinker_cookbook.renderers import get_renderer, TrainOnWhat
from tinker_cookbook.model_info import get_recommended_renderer_name

# For manual usage
from tinker_cookbook.supervised.data import conversation_to_datum

# Low-level types
from tinker.types import Datum, ModelInput, TensorData

# Tokenizer
import tinker
```

## Troubleshooting

### Issue: Wrong Format Generated

**Symptom**: Model generates incorrectly formatted outputs

**Solution**: Ensure renderer matches model:
```python
renderer_name = get_recommended_renderer_name(model_name)  # Don't hardcode!
```

### Issue: Training Loss Not Decreasing

**Symptom**: Loss stays high despite training

**Check**:
1. TrainOnWhat is appropriate for task
2. Weights are correct (should be 0.0 for prompts, 1.0 for completions)
3. Messages format is correct
4. Max length isn't truncating important parts

### Issue: Generation Doesn't Stop

**Symptom**: Model keeps generating past response

**Solution**: Use renderer's stop sequences:
```python
stop_sequences = renderer.get_stop_sequences()
sampling_params = SamplingParams(stop=stop_sequences, ...)
```

### Issue: Truncation Problems

**Symptom**: Important parts of conversation cut off

**Solution**: Increase max_length or remove less important history:
```python
renderer = get_renderer(
    name=renderer_name,
    tokenizer=tokenizer,
    max_length=4096,  # Increase from 2048
)
```
