# Inkling

Thinking Machines' open-weights model (released July 2026): MoE transformer, 975B total / 41B active params, natively multimodal (text + image + audio) with continuously tunable thinking effort. A smaller Inkling-Small (276B/12B active) preview exists but is not yet on Tinker.

**Tinker model IDs:** `thinkingmachines/Inkling` (64K context), `thinkingmachines/Inkling:peft:262144` (256K).

## Installation

```bash
pip install "tinker-cookbook[inkling]"   # includes tml-renderers (needs PyTorch 2.10+, Python 3.11+)
```

## Renderer (tml-renderers)

`tml-renderers` converts chat messages, tool calls, images, and audio into the tokens/media Inkling expects. Get it through the usual cookbook flow:

```python
from tinker_cookbook import model_info
from tinker_cookbook.renderers import get_renderer
from tinker_cookbook.tokenizer_utils import get_tokenizer

model_name = "thinkingmachines/Inkling"
renderer = get_renderer(model_info.get_recommended_renderer_name(model_name), get_tokenizer(model_name))
```

Accepts OpenAI-style dicts or native `tml_renderers.chat` typed objects:

```python
prompt = renderer.build_generation_prompt([{"role": "user", "content": "What is 2 + 2?"}])
response = sampling_client.sample(
    prompt=prompt,
    sampling_params=tinker.SamplingParams(max_tokens=128, stop=renderer.get_stop_sequences()),
    num_samples=1,
).result()
message, termination = renderer.parse_response(response.sequences[0].tokens)
```

`get_stop_sequences()` returns token IDs. `build_supervised_example` returns `(ModelInput, torch.Tensor)` weights.

Constraints: Inkling generates complete assistant messages (no continuation); rendering operates on whole conversations; selective per-turn training requires OpenAI-compatible dicts.

## Thinking Effort

Float in `[0.0, 1.0)`; higher = more reasoning. Presets: none 0.0, minimal 0.01, low 0.3, medium 0.6, high 0.9 (default), xhigh 0.99. Effort and `max_tokens` are independent — raise the budget at high effort to avoid truncation.

```python
prompt = renderer.build_generation_prompt(messages, effort=0.9)
# Use the SAME effort when building training data:
model_input, weights = renderer.build_supervised_example(messages_with_assistant, effort=0.9)
```

## Images

PNG/JPEG; local files, base64 data URIs, or PIL images (no remote URLs — download first).

```python
image_part = {"type": "image_url", "image_url": {"url": "data:image/png;base64,..."}}
messages = [{"role": "user", "content": [{"type": "text", "text": "Describe this."}, image_part]}]
```

Native form — pointers must each be wrapped in their own `chat.Message` (no mixed-content native messages):

```python
user = chat.Author(chat.AuthorKind.User)
messages = chat.MessageList([
    chat.Message(content=chat.Text("Describe this."), author=user),
    chat.Message(content=chat.ImagePointer(location="photo.png", format=chat.ImageFormat.Png, width=512, height=384), author=user),
])
```

## Audio

WAV/MP3/FLAC; local files or base64 `input_audio` parts (mono 16 kHz WAV recommended). Renderer encodes to dMel spectrogram features client-side. MP3/FLAC require explicit `num_frames` and `sample_rate`.

```python
audio_part = {"type": "input_audio", "input_audio": {"data": audio_base64, "format": "wav"}}
```

Native form: `chat.AudioPointer(location="speech.wav", format=chat.AudioFormat.Wav, num_frames=48_000, sample_rate=16_000)`, wrapped in a `chat.Message` like images above. `num_frames` must match the actual file.

Example scripts: `tinker_cookbook.scripts.inkling.sample_audio`, `sample_vision.py`, `sample_reasoning.py`; audio SFT/RL/eval recipes in `tinker_cookbook/recipes/audio`.

## Tool Calling

```python
from tinker_cookbook.renderers import ToolSpec

tool = ToolSpec(name="get_weather", description="Get weather for a city.",
                parameters={"type": "object", "properties": {"city": {"type": "string"}}})
messages = renderer.create_conversation_prefix_with_tools([tool])
messages.append({"role": "user", "content": "What is the weather in Tokyo?"})
```

Parsed tool calls come back from `parse_response()`; append results as `{"role": "tool", "tool_call_id": ..., "name": ..., "content": ...}`.

Docs: https://tinker-docs.thinkingmachines.ai/cookbook/inkling/tml-renderers/
