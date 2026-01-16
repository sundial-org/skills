# Development

## Running Locally

### Option 1: Run compiled JS directly

```bash
npm run build
node dist/index.js add tinker
```

### Option 2: Run TypeScript directly (no build needed)

```bash
npm run dev -- add tinker
npm run dev -- list
npm run dev -- show meow
```

### Option 3: Link globally

Replace the global `sun` command with your local version:

```bash
npm link
sun add tinker  # now uses local code
```

To undo:

```bash
npm unlink -g @sundial-ai/cli
```

## Running Tests

```bash
npm test           # run all tests once
npm run test:watch # run tests in watch mode
```

## Dev Commands

These commands are not documented in the README but are useful for debugging.
They search the entire file system starting from ~ using `find`.

```bash
sun show all-agent-folders         # Find all <agent>/ folders
sun show all-agent-skills-folders  # Find all <agent>/skills folders with their skills
sun show all-skill-folders         # Find all skill folders with valid SKILL.md (contains name/description in frontmatter)
```

## Using the Published Package

```bash
npm install -g @sundial-ai/cli
sun add tinker
```

## Publish

`npm publish --access public`