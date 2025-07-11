# Contributing to Nomic

Thank you for your interest in contributing to the Nomic project!

## Getting Started

1. **Fork the repository** and clone it locally.
2. **Install dependencies**:
   ```sh
   npm install
   ```
3. **Run tests**:
   ```sh
   npm test
   ```
4. **Lint and format code**:
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

## Submitting Changes

- Create a new branch for your feature or bugfix.
- Write clear, descriptive commit messages.
- Add or update tests as appropriate.
- Run `npm test` and ensure all tests pass.
- Run `npm run lint` and `npm run format` to ensure code style consistency.
- Open a pull request with a clear description of your changes.

## Code Style

- This project uses [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) for code formatting and linting.
- Run `npm run lint` to check for lint errors.
- Run `npm run format` to automatically format your code.

## Reporting Issues

If you find a bug or have a feature request, please open an issue and provide as much detail as possible.

## Community

We welcome all contributions and ideas! Please be respectful and follow the [Code of Conduct](CODE_OF_CONDUCT.md) (if present).

---

Thank you for helping make Nomic better! 