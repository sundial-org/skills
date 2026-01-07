## Vision-Language Model Datasets Reference

This document covers patterns for creating datasets for vision-language models (VLMs) in Tinker Cookbook.

## When to Use Vision Patterns

Use vision-specific patterns when:
- Training vision-language models (Qwen3-VL, etc.)
- Working with image-text pairs
- Building classifiers or captioning models
- Fine-tuning on multi-modal data
- Implementing visual instruction following

## Vision Model Support

Tinker supports vision-language models:
- **Qwen3-VL-235B** (MoE, most capable)
- **Qwen3-VL-30B** (MoE, cost-effective)
- **Qwen3-VL-8B** (Efficient for experimentation)

## Core Components

### Image Processing

```python
from tinker_cookbook.model_info import get_image_processor
import tinker

# Get image processor for model
image_processor = get_image_processor("Qwen/Qwen2-VL-7B-Instruct")

# Image processor handles:
# - Resizing to model's expected dimensions
# - Normalization
# - Format conversion (PIL -> tensors)
# - Preprocessing for specific model architecture
```

**Key Points**:
- Use `get_image_processor()` to get model-specific processor
- Processor is configured for each model architecture
- Handles all preprocessing automatically

### Vision Renderers

```python
from tinker_cookbook.renderers import get_renderer
import tinker

tokenizer = tinker.get_tokenizer("Qwen/Qwen2-VL-7B-Instruct")

# Get vision-language renderer
renderer = get_renderer(
    name="qwen3vl",  # Vision-specific renderer
    tokenizer=tokenizer,
    max_length=2048,
)
```

**Vision Renderer Names**:
- `"qwen3vl"`: For Qwen3-VL models
- Other VLM renderers as added to Cookbook

### ImageChunk in ModelInput

Vision inputs use `ImageChunk` within `ModelInput`:

```python
from tinker.types import ModelInput, ImageChunk

# Option 1: Image as bytes
with open("image.jpg", "rb") as f:
    image_bytes = f.read()

image_chunk = ImageChunk(image_bytes)

# Option 2: Image asset pointer (for remote images)
from tinker.types import ImageAssetPointerChunk

image_chunk = ImageAssetPointerChunk(asset_id="image-123")

# Create ModelInput with image
model_input = ModelInput([image_chunk, text_chunk])
```

**ImageChunk Types**:
- `ImageChunk(bytes)`: Direct image data
- `ImageAssetPointerChunk(asset_id)`: Reference to uploaded asset

## Custom Vision Dataset Pattern

### Dataset Structure

For vision tasks, implement custom `SupervisedDataset`:

```python
from tinker_cookbook.supervised.types import SupervisedDataset
from tinker.types import Datum, ModelInput, TensorData, ImageChunk
from tinker_cookbook.renderers import get_renderer, TrainOnWhat
from tinker_cookbook.model_info import get_image_processor
import tinker
import chz
import numpy as np
from PIL import Image

@chz.chz
class VisionDatasetConfig:
    model_name: str
    renderer_name: str
    data_dir: str  # Directory with images
    labels_file: str  # File with labels
    max_length: int = 2048
    batch_size: int = 8

class VisionDataset(SupervisedDataset):
    def __init__(self, config: VisionDatasetConfig):
        self.config = config

        # Setup tokenizer
        self.tokenizer = tinker.get_tokenizer(config.model_name)

        # Setup renderer (use vision renderer!)
        self.renderer = get_renderer(
            name=config.renderer_name,  # e.g., "qwen3vl"
            tokenizer=self.tokenizer,
            max_length=config.max_length,
        )

        # Setup image processor
        self.image_processor = get_image_processor(config.model_name)

        # Load dataset
        self.data = self._load_data()

    def _load_data(self):
        """Load image paths and labels"""
        # Your data loading logic
        # Return list of (image_path, label) tuples
        pass

    def __len__(self):
        return len(self.data) // self.config.batch_size

    def __iter__(self):
        for image_path, label in self.data:
            # Load and preprocess image
            image = self._load_image(image_path)

            # Create messages with image
            messages = self._create_messages(image, label)

            # Build supervised example
            example = self.renderer.build_supervised_example(
                messages=messages,
                train_on_what=TrainOnWhat.LAST_ASSISTANT_MESSAGE,
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

    def _load_image(self, image_path):
        """Load image and convert to bytes"""
        image = Image.open(image_path)

        # Apply image processor if needed
        # (Some processors expect PIL, others handle it internally)
        processed_image = self.image_processor.preprocess(image)

        # Convert to bytes for ImageChunk
        import io
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return buffer.getvalue()

    def _create_messages(self, image_bytes, label):
        """Create multi-modal message with image"""
        # For vision-language models, messages can contain images
        # Format depends on renderer expectations

        # Example format:
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image_bytes},
                    {"type": "text", "text": "What is in this image?"},
                ]
            },
            {
                "role": "assistant",
                "content": label,
            }
        ]
        return messages
```

**Key Points**:
- Use `get_image_processor()` for model-specific preprocessing
- Load images as bytes for `ImageChunk`
- Vision renderers handle multi-modal message formatting
- Typically train on `LAST_ASSISTANT_MESSAGE` for classification/captioning

### Image Loading Patterns

#### From File System

```python
from PIL import Image
import io

def load_image_bytes(image_path):
    """Load image from disk as bytes"""
    image = Image.open(image_path)

    # Convert to RGB if needed
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Resize if needed (optional, processor handles this)
    # image = image.resize((224, 224))

    # Convert to bytes
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()
```

#### From URL

```python
import requests
from PIL import Image
import io

def load_image_from_url(url):
    """Load image from URL as bytes"""
    response = requests.get(url)
    response.raise_for_status()

    image = Image.open(io.BytesIO(response.content))

    # Convert to RGB
    if image.mode != "RGB":
        image = image.convert("RGB")

    # Convert to bytes
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()
```

#### From Numpy Array

```python
from PIL import Image
import numpy as np
import io

def numpy_to_image_bytes(array):
    """Convert numpy array to image bytes"""
    # Ensure uint8 range
    if array.dtype != np.uint8:
        array = (array * 255).astype(np.uint8)

    image = Image.fromarray(array)

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()
```

## Multi-Modal Message Formats

### Vision Classification

```python
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image_bytes},
            {"type": "text", "text": "Classify this image."},
        ]
    },
    {
        "role": "assistant",
        "content": class_label,  # e.g., "cat"
    }
]
```

### Image Captioning

```python
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image_bytes},
            {"type": "text", "text": "Describe this image in detail."},
        ]
    },
    {
        "role": "assistant",
        "content": caption,  # e.g., "A brown cat sitting on a couch"
    }
]
```

### Visual Question Answering

```python
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image_bytes},
            {"type": "text", "text": question},  # e.g., "How many cats are in the image?"
        ]
    },
    {
        "role": "assistant",
        "content": answer,  # e.g., "Two cats"
    }
]
```

### Multi-Turn with Images

```python
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image1_bytes},
            {"type": "text", "text": "What's in this image?"},
        ]
    },
    {
        "role": "assistant",
        "content": "A dog playing in a park."
    },
    {
        "role": "user",
        "content": [
            {"type": "image", "image": image2_bytes},
            {"type": "text", "text": "What about this one?"},
        ]
    },
    {
        "role": "assistant",
        "content": "A cat sleeping on a bed."
    }
]
```

## Complete Example: Image Classifier

```python
import chz
import asyncio
import os
import json
from PIL import Image
import io
import numpy as np

from tinker_cookbook.supervised import train
from tinker_cookbook.supervised.types import SupervisedDataset
from tinker.types import Datum, ModelInput, TensorData
from tinker_cookbook.renderers import get_renderer, TrainOnWhat
from tinker_cookbook.model_info import get_image_processor, get_recommended_renderer_name
import tinker

@chz.chz
class ClassifierDatasetConfig:
    model_name: str = "Qwen/Qwen2-VL-7B-Instruct"
    data_dir: str = "./images"
    labels_file: str = "./labels.json"
    max_length: int = 2048
    batch_size: int = 8

class ClassifierDataset(SupervisedDataset):
    def __init__(self, config: ClassifierDatasetConfig):
        self.config = config

        # Setup tokenizer and renderer
        self.tokenizer = tinker.get_tokenizer(config.model_name)
        renderer_name = get_recommended_renderer_name(config.model_name)
        self.renderer = get_renderer(
            name=renderer_name,
            tokenizer=self.tokenizer,
            max_length=config.max_length,
        )

        # Setup image processor
        self.image_processor = get_image_processor(config.model_name)

        # Load data
        with open(config.labels_file) as f:
            self.labels_data = json.load(f)  # {"image1.jpg": "cat", ...}

        self.image_files = list(self.labels_data.keys())

    def __len__(self):
        return len(self.image_files) // self.config.batch_size

    def __iter__(self):
        for image_file in self.image_files:
            # Load image
            image_path = os.path.join(self.config.data_dir, image_file)
            image_bytes = self._load_image(image_path)

            # Get label
            label = self.labels_data[image_file]

            # Create messages
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image_bytes},
                        {"type": "text", "text": "Classify this image."},
                    ]
                },
                {
                    "role": "assistant",
                    "content": label,
                }
            ]

            # Build supervised example
            example = self.renderer.build_supervised_example(
                messages=messages,
                train_on_what=TrainOnWhat.LAST_ASSISTANT_MESSAGE,
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

    def _load_image(self, image_path):
        """Load and convert image to bytes"""
        image = Image.open(image_path)

        if image.mode != "RGB":
            image = image.convert("RGB")

        buffer = io.BytesIO()
        image.save(buffer, format="JPEG")
        return buffer.getvalue()

@chz.chz
class CLIConfig:
    model_name: str = "Qwen/Qwen2-VL-7B-Instruct"
    data_dir: str = "./images"
    labels_file: str = "./labels.json"
    log_path: str = "/tmp/vision-training"

async def train_async(cli_config: CLIConfig):
    # Create dataset config
    dataset_config = ClassifierDatasetConfig(
        model_name=cli_config.model_name,
        data_dir=cli_config.data_dir,
        labels_file=cli_config.labels_file,
    )

    # Create dataset
    dataset = ClassifierDataset(config=dataset_config)

    # Split into train/test (simplified - should do proper split)
    # For this example, using same dataset for both
    train_dataset = dataset
    test_dataset = dataset

    # Create training config
    config = train.Config(
        model_name=cli_config.model_name,
        log_path=cli_config.log_path,
        dataset_builder=lambda: (train_dataset, test_dataset),
        learning_rate=1e-4,
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

## Dataset Builder Wrapper Pattern

For better integration with Cookbook's training system:

```python
from tinker_cookbook.supervised.types import ChatDatasetBuilder, ChatDatasetBuilderCommonConfig

@chz.chz
class VisionDatasetBuilder(ChatDatasetBuilder):
    common_config: ChatDatasetBuilderCommonConfig
    data_dir: str
    labels_file: str

    def __call__(self):
        # Create config for dataset
        dataset_config = ClassifierDatasetConfig(
            model_name=self.common_config.model_name_for_tokenizer,
            data_dir=self.data_dir,
            labels_file=self.labels_file,
            max_length=self.common_config.max_length,
            batch_size=self.common_config.batch_size,
        )

        # Create dataset
        full_dataset = ClassifierDataset(config=dataset_config)

        # Split into train/test
        # (Implement proper splitting logic here)
        train_dataset = full_dataset
        test_dataset = full_dataset

        return train_dataset, test_dataset
```

## Vision-Specific Considerations

### Image Preprocessing

- **Resizing**: Image processor handles model-specific sizes
- **Normalization**: Automatic based on model training
- **Format**: Convert all images to RGB for consistency
- **Compression**: JPEG format works well for most cases

### TrainOnWhat for Vision

- Use `LAST_ASSISTANT_MESSAGE` for:
  - Classification (single label output)
  - Captioning (single description)
  - VQA (single answer)
- Use `ALL_ASSISTANT_MESSAGES` for:
  - Multi-turn visual dialogue
  - Step-by-step visual reasoning
  - Detailed visual explanations

### Batch Size Considerations

- Vision models have larger memory footprint
- Start with smaller batch sizes (4-8) for VLMs
- Increase gradually based on available memory
- MoE models (Qwen3-VL-235B) more memory-efficient

### Model Selection

- **Qwen3-VL-235B**: Best quality, MoE efficiency
- **Qwen3-VL-30B**: Good balance of quality and cost
- **Qwen3-VL-8B**: Fast iteration and experimentation

## Common Patterns

### Pattern: Multi-File Structure

For complex vision datasets, separate data loading:

**data.py**:
```python
# Dataset class definition
class VisionDataset(SupervisedDataset):
    ...
```

**train.py**:
```python
# Training configuration and execution
from data import VisionDataset

@chz.chz
class TrainingConfig:
    ...

def main():
    dataset = VisionDataset(...)
    config = train.Config(...)
    asyncio.run(train.main(config))
```

### Pattern: Image Augmentation

```python
from PIL import Image, ImageEnhance
import random

def augment_image(image):
    """Apply random augmentations"""
    # Random rotation
    if random.random() > 0.5:
        angle = random.uniform(-10, 10)
        image = image.rotate(angle)

    # Random brightness
    if random.random() > 0.5:
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(random.uniform(0.8, 1.2))

    # Random contrast
    if random.random() > 0.5:
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(random.uniform(0.8, 1.2))

    return image
```

### Pattern: HuggingFace Vision Datasets

```python
from datasets import load_dataset
from io import BytesIO

# Load HF vision dataset
dataset = load_dataset("cifar10", split="train")

def process_hf_image(example):
    """Convert HF image to bytes"""
    # HF image is PIL Image
    image = example["img"]

    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()

# Use in dataset builder
for item in dataset:
    image_bytes = process_hf_image(item)
    label = item["label"]
    # Create messages and datum...
```

## Best Practices

1. **Use vision renderers**: Get with `get_recommended_renderer_name(vlm_model)`
2. **Process images correctly**: Use `get_image_processor()` for model
3. **Convert to RGB**: Ensure consistent format across dataset
4. **Handle errors**: Wrap image loading in try/except
5. **Validate data**: Check image files exist before training
6. **Start small**: Test with subset before full dataset
7. **Use appropriate TrainOnWhat**: LAST_ASSISTANT_MESSAGE for classification
8. **Monitor memory**: VLMs use more memory than text-only models
9. **Save regularly**: Vision training can be expensive
10. **Use MoE models**: Qwen3-VL models offer good efficiency

## Common Imports

```python
# Vision-specific
from PIL import Image
import io
from tinker_cookbook.model_info import get_image_processor

# Core types
from tinker.types import Datum, ModelInput, TensorData, ImageChunk

# Dataset and training
from tinker_cookbook.supervised.types import SupervisedDataset
from tinker_cookbook.supervised import train
from tinker_cookbook.renderers import get_renderer, TrainOnWhat

# Configuration
import chz
import asyncio

# Utilities
import numpy as np
import json
import os
```
