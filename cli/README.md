# Sundial CLI

Manage skills for your AI coding agents.

```bash
npm install -g @sundial-ai/cli
```

```bash
sun add tinker                    # Add from [registry](https://sundialscientific.com)
sun add github.com/user/skill     # Add from GitHub
sun add ./my-skill                # Add from local path

sun list                          # Browse available skills ([registry](https://sundialscientific.com))
sun installed                     # See installed skills
sun remove tinker                 # Remove a skill
```

Works with Claude Code, Codex, and Gemini.

## Flags

```bash
sun add tinker --global           # Install globally (~/.claude/)
sun add tinker --claude --codex   # Install to specific agents
```

## Links

- [Agent Skills Specification](https://agentskills.io/specification)
- [Issues](https://github.com/sundial-org/skills/issues)
