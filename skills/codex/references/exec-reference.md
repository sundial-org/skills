# codex exec Reference

Complete flag reference for non-interactive mode.

## Synopsis

```bash
codex exec [FLAGS] "PROMPT"
codex exec [FLAGS] -                    # Read prompt from stdin
codex exec review [--uncommitted|--base|--commit]  # Code review
codex exec resume [--last|SESSION_ID] "PROMPT"     # Resume session
```

## Subcommands

### codex exec (default)

Run a task non-interactively.

### codex exec review

Built-in code review:

| Flag | Description |
|------|-------------|
| `--uncommitted` | Review uncommitted changes (staged + unstaged) |
| `--base <branch>` | Review changes against a base branch |
| `--commit <sha>` | Review a specific commit |

```bash
codex exec review --uncommitted
codex exec review --base main
codex exec review --commit abc123
```

### codex exec resume

Continue a previous session. **Inherits sandbox settings from original session.**

```bash
codex exec resume --last "follow-up prompt"
codex exec resume <SESSION_ID> "follow-up prompt"
```

**Note**: Cannot pass `--full-auto` or other sandbox flags to resume.

## Flags

### Prompt & Input

| Flag | Description |
|------|-------------|
| `PROMPT` | Task instruction (required unless using `-` for stdin) |
| `-` | Read prompt from stdin instead of argument |
| `-i, --image <path>` | Attach image(s). Comma-separated or repeat flag |

### Sandbox & Permissions

No approval prompts in non-interactive mode. Set permissions upfront:

| Flag | Description |
|------|-------------|
| (default) | Read-only. Reads anywhere, writes/commands blocked. |
| `--full-auto` | Pre-approves workspace writes and commands. |
| `--yolo` | No sandbox, no approvals. Full system access. Dangerous. |
| `--add-dir <path>` | Grant write access to additional directories |

Note: `~/.codex/config.toml` trust levels can override defaults.

### Output Control

| Flag | Description |
|------|-------------|
| `-o, --output-last-message <path>` | Write final message to file |
| `--json` | Output JSONL event stream to stdout |
| `--output-schema <path>` | JSON Schema for structured output |
| `--color <mode>` | `auto`, `always`, `never` |

### Model & Environment

| Flag | Description |
|------|-------------|
| `-m, --model <name>` | Override model (default: `gpt-5.2-codex`) |
| `-C, --cd <path>` | Set working directory |
| `-p, --profile <name>` | Load config profile from `~/.codex/config.toml` |
| `--skip-git-repo-check` | Allow running outside git repository |
| `--search` | Enable web search tool |
| `-c, --config <key=value>` | Override config values (repeatable) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CODEX_API_KEY` | API key (only for `codex exec`) |
| `CODEX_HOME` | Override config directory (default: `~/.codex`) |

## Output Streams

- **stderr**: Progress updates, status messages
- **stdout**: Final result only

```bash
# Capture only result (suppress progress)
codex exec "task" 2>/dev/null > result.txt

# See progress while capturing
codex exec "task" 2>&1 | tee output.txt
```

## JSON Output Events

With `--json`, stdout becomes JSONL:

```jsonl
{"type":"thread.started","thread_id":"uuid"}
{"type":"turn.started"}
{"type":"item.started","item":{"id":"item_1","type":"command_execution","command":"ls"}}
{"type":"item.completed","item":{"id":"item_2","type":"agent_message","text":"Found 3 files."}}
{"type":"turn.completed","usage":{"input_tokens":1000,"output_tokens":50}}
```

Event types: `thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.started`, `item.completed`, `error`

Item types: `agent_message`, `reasoning`, `command_execution`, `file_change`, `mcp_tool_call`, `web_search`, `plan_update`

Filter with jq:
```bash
codex exec --json "task" 2>/dev/null | jq -c 'select(.type == "item.completed")'
```

## Structured Output

Use `--output-schema` for JSON output.

**Important**: OpenAI requires `additionalProperties: false` on ALL object types in the schema.

```bash
codex exec --output-schema schema.json -o result.json "extract info"
```

Schema example (note `additionalProperties: false` at every object level):
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" }
        },
        "required": ["id"],
        "additionalProperties": false
      }
    }
  },
  "required": ["name", "items"],
  "additionalProperties": false
}
```

## Examples

```bash
# Read-only analysis
codex exec "explain the architecture"

# Fix with auto-approval
codex exec --full-auto "fix lint errors in src/"

# Code review
codex exec review --base main

# Pipe prompt from file
cat task.md | codex exec -

# Multiple images
codex exec -i design.png -i spec.png "implement this UI"

# Custom working directory
codex exec -C /path/to/project "run tests"

# Specific model
codex exec -m gpt-5.2-codex "complex task"

# Machine-readable output (suppress progress)
codex exec --json "list endpoints" 2>/dev/null | jq '.item.text'

# Structured extraction
codex exec --output-schema schema.json -o data.json "extract API info"

# Resume previous session
codex exec resume --last "continue with tests"
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `unexpected argument '--full-auto'` | Using --full-auto with resume | Remove flag; resume inherits settings |
| `'additionalProperties' is required` | Schema missing field | Add `additionalProperties: false` to all objects |
| `model 'X' not supported` | Model unavailable | Use default `gpt-5.2-codex` |
| Writes blocked | Read-only sandbox | Use `--full-auto` for write tasks |
