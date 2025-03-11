# Nomic Voting System (Lua Implementation)

This repository contains a Lua implementation of a voting system for Nomic games. It tracks votes on proposals and updates player scores based on the outcomes.

## Features

- Tracks votes from GitHub issue comments
- Updates player scores based on proposal outcomes
- Stores data in YAML files for persistence
- Includes comprehensive test suite

## Components

The system consists of two main scripts:

1. **trackVotes.lua**: Processes votes from GitHub issue comments and updates the votes.yaml file.
2. **updateScores.lua**: Updates player scores based on the outcomes of proposals and updates the scores.yaml file.

## Requirements

- Lua 5.4+
- LuaRocks (for managing dependencies)
- Required Lua libraries:
  - lua-cjson (for JSON parsing)
  - lyaml (for YAML parsing)
  - busted (for testing)
  - luassert (for test assertions)

## Installation

```bash
# Install Lua and LuaRocks
# On Ubuntu/Debian:
sudo apt-get install lua5.4 luarocks

# On macOS with Homebrew:
brew install lua luarocks

# Install dependencies
luarocks install lua-cjson
luarocks install lyaml
luarocks install busted
luarocks install luassert
```

## Usage

### Track Votes

```bash
lua src/trackVotes.lua
```

This script reads comments from a GitHub issue and tracks votes. It expects the following environment variables:

- `GITHUB_EVENT_PATH`: Path to the GitHub event JSON file
- `GITHUB_REPOSITORY`: The repository in the format "owner/repo"
- `GITHUB_TOKEN`: A GitHub token with appropriate permissions

### Update Scores

```bash
lua src/updateScores.lua
```

This script updates player scores based on the outcomes of proposals. It reads from votes.yaml and scores.yaml, and updates these files with the new state.

## Testing

Tests are written using the Busted framework. To run the tests:

```bash
make test
# or
busted test
```

## Development Tools

This project includes several development tools to ensure code quality and maintainability:

### Dependency Management

Dependencies are managed using LuaRocks. The project includes a rockspec file that defines all dependencies.

```bash
# Install all dependencies
make install
# or
luarocks make
```

### Linting

Luacheck is used for static code analysis to catch potential errors and enforce coding standards.

```bash
make lint
# or
luacheck src test
```

### Formatting

StyLua is used to ensure consistent code formatting.

```bash
# Format code
make format
# or
stylua src test

# Check formatting without modifying files
make format-check
# or
stylua --check src test
```

### Code Coverage

LuaCov is used to generate code coverage reports.

```bash
make coverage
# or
busted --coverage test
luacov
```

### Development Setup

To set up a development environment with all necessary tools:

```bash
make dev-setup
```

### Running All Checks

To run all checks (linting, formatting, and tests) at once:

```bash
make check
```

### Pre-commit Hooks

This project uses pre-commit hooks to ensure code quality before commits. To set up pre-commit:

```bash
# Install pre-commit
pip install pre-commit

# Install the git hooks
pre-commit install
```

Once installed, the hooks will run automatically on each commit.

### Docker Support

This project includes Docker support for development and testing. You can use Docker to run the project without installing Lua and its dependencies locally.

```bash
# Build and run all checks
docker-compose up app

# Run tests only
docker-compose up test

# Run linting only
docker-compose up lint

# Run formatting only
docker-compose up format

# Generate coverage report
docker-compose up coverage
```

## GitHub Actions Integration

This repository includes GitHub Actions workflows for automated testing, linting, and formatting checks. The workflow runs on every push to the main branch and on pull requests.

## License

[MIT License](LICENSE)
