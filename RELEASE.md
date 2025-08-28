# Release Guide

This project uses [release-it](https://github.com/release-it/release-it) for automated releases with conventional changelog generation and GitHub releases.

## Release Workflow

### Automatic Releases (Recommended)

1. **Commit your changes** following [Conventional Commits](https://www.conventionalcommits.org/) format:

   ```bash
   git commit -m "feat: add new feature"
   git commit -m "fix: resolve bug issue"
   git commit -m "docs: update documentation"
   ```

2. **Push to main branch**:

   ```bash
   git push origin main
   ```

3. **GitHub Actions will automatically**:
   - Run tests and build
   - Determine the next version based on commit messages
   - Generate changelog
   - Create Git tag
   - Create GitHub release
   - Publish to npm

### Manual Releases

For manual releases, use the following commands:

#### Dry Run (Preview)

```bash
pnpm release:dry
```

#### Interactive Release

```bash
pnpm release
```

#### CI Release (Non-interactive)

```bash
pnpm release:ci
```

## Configuration

### Release-it Configuration (`.release-it.json`)

- **Git**: Automatic commit, tagging, and push
- **npm**: Publishes to npm with public access
- **GitHub**: Creates releases with auto-generated notes
- **Changelog**: Uses conventional changelog format
- **Hooks**: Runs tests and build before release

### Required Environment Variables

For automated GitHub releases, set these secrets in your repository:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions
- `NPM_TOKEN`: Your npm authentication token (for publishing)

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

### Examples

```bash
feat: add support for custom configuration
fix: resolve memory leak in cache module
docs: update API documentation
chore: upgrade dependencies
```

## Version Bumping

Version bumps are determined automatically based on commit messages:

- **Patch** (0.0.x): `fix:`, `docs:`, `style:`, `refactor:`, `perf:`, `test:`, `chore:`
- **Minor** (0.x.0): `feat:`
- **Major** (x.0.0): Any commit with `BREAKING CHANGE:` in footer or `!` after type

## Troubleshooting

### Clean Working Directory

Ensure your working directory is clean before releasing:

```bash
git status
git add .
git commit -m "chore: prepare for release"
```

### GitHub Token Issues

If GitHub release creation fails, ensure:

1. `GITHUB_TOKEN` environment variable is set
2. Token has appropriate permissions for repository

### npm Publishing Issues

If npm publishing fails:

1. Verify `NPM_TOKEN` is set correctly
2. Ensure you're logged in: `npm whoami`
3. Check package name availability

## Manual GitHub Release Creation

If automated GitHub release fails, create manually:

1. Go to [GitHub Releases](https://github.com/ChasLui/nest-js-nacos/releases)
2. Click "Create a new release"
3. Use the tag created by release-it
4. Copy changelog content from `CHANGELOG.md`
