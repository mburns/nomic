# Nomic Game

[![CI](https://github.com/mburns/nomic/actions/workflows/ci.yml/badge.svg)](https://github.com/mburns/nomic/actions/workflows/ci.yml)
[![Tests](https://github.com/mburns/nomic/actions/workflows/test.yaml/badge.svg)](https://github.com/mburns/nomic/actions/workflows/test.yaml)
[![Lint](https://github.com/mburns/nomic/actions/workflows/lint.yaml/badge.svg)](https://github.com/mburns/nomic/actions/workflows/lint.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A GitHub-powered Nomic game engine implemented in TypeScript/Node.js.

## Features

- Automated vote processing and score updating based on GitHub issues and comments
- Auto-merging of pull requests when voting conditions are met
- Rule management via Markdown files
- Automated rules summary and scoreboard
- CI/CD with GitHub Actions
- Modern TypeScript codebase with full test coverage

## Getting Started

1. **Clone the repository**
   ```sh
   git clone https://github.com/mburns/nomic.git
   cd nomic
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Run tests**
   ```sh
   npm test
   ```
4. **Lint and format code**
   ```sh
   npm run lint
   npm run format
   ```

## Project Structure

- `src/` - Main TypeScript source code
- `src/services/` - Core service classes
- `src/types/` - Type definitions
- `src/test/` - Jest test files
- `rules/` - Game rules in Markdown
- `SCOREBOARD.md` - Current player scores
- `RULES_SUMMARY.md` - Auto-generated summary of rules

## Contributing

We welcome contributions from the community! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to get started, code style, and submitting pull requests.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Community & Support

- Open an issue for bugs, questions, or feature requests
- Join the discussion in pull requests and issues

---

Thank you for helping make Nomic better!
