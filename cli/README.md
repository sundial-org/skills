# Sundial CLI

`sundial-hub` is a simple way to manage skills for your AI coding agents. 

Add skills in 3 ways:
- From a Github repo url that contains skills
- From a local folder
- From the Sundial [registry](https://sundialscientific.com)

Supported agents:
- Claude Code
- Codex
- Gemini

```bash
npm install -g sundial-hub

```bash
sun add tinker                    # Add from [registry](https://sundialscientific.com)
sun add github.com/user/skill     # Add from GitHub. You can add from a root or subdirectory Github url
sun add ./my-skill                # Add from local path

sun list                          # Browse available skills ([registry](https://sundialscientific.com))
sun installed                     # See installed skills
sun remove tinker                 # Remove a skill
```


## Flags

```bash
sun add tinker --global           # Install globally (~/.claude/)
sun add tinker --claude --codex   # Install to specific agents
```

## Links

- [Agent Skills Specification](https://agentskills.io/specification): Open source standard for agent skills
- [Issues](https://github.com/sundial-org/skills/issues)
