#!/usr/bin/env python3
"""Estimate Tinker fine-tuning cost: tokenize a JSONL dataset and apply per-model train pricing."""
import argparse
import json
import sys

# USD per million tokens (prefill, sample, train), effective July 17, 2026.
# Source: https://tinker-docs.thinkingmachines.ai/tinker/models/
PRICING = {
    "thinkingmachines/Inkling": (1.87, 4.68, 5.61),
    "thinkingmachines/Inkling:peft:262144": (3.74, 9.36, 11.23),
    "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16": (2.49, 6.225, 5.478),
    "nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B-BF16:peft:262144": (3.32, 8.30, 9.96),
    "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16": (0.57, 1.44, 1.276),
    "nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-BF16:peft:262144": (0.76, 1.92, 2.32),
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16": (0.195, 0.495, 0.44),
    "moonshotai/Kimi-K2.6": (2.205, 5.49, 4.84),
    "moonshotai/Kimi-K2.6:peft:131072": (5.15, 12.81, 15.40),
    "Qwen/Qwen3.6-35B-A3B": (0.54, 1.335, 1.177),
    "Qwen/Qwen3.6-27B": (1.86, 5.595, 4.103),
    "Qwen/Qwen3.5-397B-A17B": (3.00, 7.50, 6.60),
    "Qwen/Qwen3.5-397B-A17B:peft:262144": (4.00, 10.00, 12.00),
    "Qwen/Qwen3.5-35B-A3B-Base": (0.54, 1.335, 1.177),
    "Qwen/Qwen3.5-9B": (0.66, 1.995, 1.463),
    "Qwen/Qwen3.5-9B-Base": (0.66, 1.995, 1.463),
    "Qwen/Qwen3.5-4B": (0.33, 1.005, 0.737),
    "Qwen/Qwen3-8B": (0.195, 0.60, 0.44),
    "openai/gpt-oss-120b": (0.33, 0.84, 0.737),
    "openai/gpt-oss-120b:peft:131072": (0.78, 1.94, 2.33),
    "openai/gpt-oss-20b": (0.18, 0.45, 0.396),
    "deepseek-ai/DeepSeek-V3.1": (1.695, 4.215, 3.718),
}


def resolve_model(name):
    if name in PRICING:
        return name
    exact = [m for m in PRICING if m.lower().endswith("/" + name.lower())]
    matches = exact or [m for m in PRICING if name.lower() in m.lower()]
    if len(matches) == 1:
        return matches[0]
    if not matches:
        sys.exit(f"Unknown model {name!r}. Use --list-models to see supported models.")
    sys.exit(f"Ambiguous model {name!r}, matches: {matches}")


def load_tokenizer(model_id):
    base_id = model_id.split(":peft:")[0]
    try:
        from tinker_cookbook.tokenizer_utils import get_tokenizer
        return get_tokenizer(base_id)
    except ImportError:
        from transformers import AutoTokenizer
        return AutoTokenizer.from_pretrained(base_id, trust_remote_code=True)


def row_to_text(row):
    if "messages" in row:
        return "\n".join(m.get("content", "") if isinstance(m.get("content"), str) else json.dumps(m.get("content")) for m in row["messages"])
    if "text" in row:
        return row["text"]
    if "instruction" in row:
        return "\n".join(filter(None, [row.get("instruction"), row.get("input"), row.get("output")]))
    sys.exit(f"Unrecognized row format (expected messages/text/instruction keys): {list(row)[:5]}")


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("dataset", nargs="?", help="JSONL training file")
    p.add_argument("--model", help="Tinker model ID (or unambiguous fragment, e.g. Qwen3-8B)")
    p.add_argument("--epochs", type=int, default=3)
    p.add_argument("--json", action="store_true", dest="as_json")
    p.add_argument("--list-models", action="store_true")
    args = p.parse_args()

    if args.list_models:
        print(f"{'Model':<58} {'Prefill':>8} {'Sample':>8} {'Train':>8}  ($/M tokens)")
        for m, (pf, sa, tr) in PRICING.items():
            print(f"{m:<58} {pf:>8.3f} {sa:>8.3f} {tr:>8.3f}")
        return
    if not args.dataset or not args.model:
        p.error("dataset and --model are required (or use --list-models)")

    model = resolve_model(args.model)
    tokenizer = load_tokenizer(model)
    total_tokens = num_rows = 0
    with open(args.dataset) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            total_tokens += len(tokenizer.encode(row_to_text(json.loads(line))))
            num_rows += 1

    train_price = PRICING[model][2]
    training_tokens = total_tokens * args.epochs
    cost = training_tokens * train_price / 1_000_000
    result = {"model": model, "rows": num_rows, "dataset_tokens": total_tokens,
              "epochs": args.epochs, "training_tokens": training_tokens,
              "train_price_per_million": train_price, "estimated_cost_usd": round(cost, 4)}
    if args.as_json:
        print(json.dumps(result, indent=2))
    else:
        print(f"Model:            {model}")
        print(f"Rows:             {num_rows:,}")
        print(f"Dataset tokens:   {total_tokens:,}")
        print(f"Training tokens:  {training_tokens:,} ({args.epochs} epochs)")
        print(f"Train price:      ${train_price}/M tokens")
        print(f"Estimated cost:   ${cost:,.2f}")


if __name__ == "__main__":
    main()
