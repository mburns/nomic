# Contributing to Nomic Voting System

Thank you for considering contributing to the Nomic Voting System! This document provides guidelines and instructions for contributing to the project.

## Development Environment Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/mburns/nomic.git
   cd nomic
   ```

2. **Set up development environment**:
   
   Using Make:
   ```bash
   make dev-setup
   ```
   
   Or manually:
   ```bash
   luarocks install busted
   luarocks install luacov
   luarocks install luacheck
   luarocks install stylua
   luarocks install luafilesystem
   luarocks install lua-cjson
   luarocks install lyaml
   luarocks install luassert
   ```

3. **Set up pre-commit hooks**:
   ```bash
   pip install pre-commit
   pre-commit install
   ```

## Development Workflow

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Write code that follows the project's style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Run checks locally**:
   ```bash
   make check
   ```

4. **Commit your changes**:
   ```bash
   git commit -m "Add your meaningful commit message here"
   ```

5. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a pull request** on GitHub

## Code Style Guidelines

- Follow the Lua style guide as enforced by StyLua
- Use 4 spaces for indentation
- Keep line length under 100 characters
- Use meaningful variable and function names
- Add comments for complex logic

## Testing

- Write tests for all new functionality
- Ensure all tests pass before submitting a pull request
- Aim for high code coverage

## Documentation

- Update the README.md file with any new features or changes
- Document all public functions and modules
- Keep documentation up-to-date with code changes

## Pull Request Process

1. Ensure all checks pass in your local environment
2. Update documentation as needed
3. Create a pull request with a clear description of the changes
4. Address any feedback from code reviews
5. Once approved, your changes will be merged

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License. 