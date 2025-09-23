# Contributing to Vetra.to

## Commit Message Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature (triggers a minor version bump)
- **fix**: A bug fix (triggers a patch version bump)
- **perf**: A performance improvement (triggers a patch version bump)
- **refactor**: Code refactoring (triggers a patch version bump)
- **docs**: Documentation changes (no version bump)
- **style**: Code style changes (no version bump)
- **test**: Adding or updating tests (no version bump)
- **chore**: Maintenance tasks (no version bump)
- **ci**: CI/CD changes (no version bump)
- **build**: Build system changes (no version bump)

### Breaking Changes

To trigger a major version bump, add `BREAKING CHANGE:` in the footer or use `!` after the type:

```
feat!: remove deprecated API
```

or

```
feat: add new API

BREAKING CHANGE: The old API has been removed
```

### Examples

```bash
# New feature
git commit -m "feat: add user authentication"

# Bug fix
git commit -m "fix: resolve login redirect issue"

# Breaking change
git commit -m "feat!: remove legacy API endpoints"

# With scope
git commit -m "feat(auth): add OAuth2 support"

# With body and footer
git commit -m "feat: add dark mode support

Add dark mode toggle in the header with system preference detection.
Includes theme persistence in localStorage.

Closes #123"
```

### Semantic Release

This project uses semantic-release to automatically:
- Determine the next version number based on commit messages
- Generate changelog entries
- Create GitHub releases
- Update package.json version
- Build and publish Docker images

The release process runs automatically on pushes to the `main` branch.
