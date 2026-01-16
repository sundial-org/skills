# Sundial CLI

`sundial-hub` is a CLI to easily add skills to your AI coding agents. 

Add skills from 3 sources with `sun add`:
- A Github repo url that contains skills (ex: [github.com/anthropics/skills](https://github.com/anthropics/skills))
- From a local folder (ex: `.claude/skills/my-custom-skill`)
- From the Sundial [registry](https://sundialscientific.com)

Supported agents:
- Claude Code (`.claude/`)
- Codex (`.codex/`)
- Gemini (`.gemini/`)


## Installation
```bash
npm install -g sundial-hub
```

## Usage

Add skills:
```bash
sun add skill-creator             # Add `skill-creator` skill from [registry](https://sundialscientific.com)
sun add skill-creator --global    # Add skill globally to ~/.claude (or other agents). 
sun add github.com/user/skill     # Add from GitHub. You can add from a root or subdirectory Github url
sun add ./my-skill                # Add from local path
```

If a local project is detected, then the skill will be added to the local project. Else, it will add it globally. You can force global installation with the `--global` flag! 

Other commands:
```bash
sun config                        # Configure your default agent(s)
sun installed                     # See installed skills. `sun show` works to
sun remove tinker                 # Remove a skill
sun list                          # Browse available skills ([registry](https://sundialscientific.com))
```


## Flags

```bash
sun add tinker --global           # Install globally (~/.claude/)
sun add tinker --claude --codex   # Install to specific agents
```

## Links

- [Agent Skills Specification](https://agentskills.io/specification): Open source standard for agent skills
- [Issues](https://github.com/sundial-org/skills/issues)
