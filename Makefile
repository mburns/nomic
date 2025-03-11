.PHONY: all install test lint format coverage clean

all: install test

# Install dependencies
install:
	luarocks make

# Run tests
test:
	busted test

# Run linter
lint:
	luacheck src test

# Format code
format:
	stylua src test

# Check formatting
format-check:
	stylua --check src test

# Generate coverage report
coverage:
	busted --coverage test
	luacov

# Clean generated files
clean:
	rm -f luacov.stats.out luacov.report.out
	rm -rf lua_modules .luarocks

# Install development dependencies
dev-setup:
	luarocks install busted
	luarocks install luacov
	luarocks install luacheck
	luarocks install stylua
	luarocks install luafilesystem
	luarocks install lua-cjson
	luarocks install lyaml
	luarocks install luassert

# Run all checks (lint, format check, tests)
check: lint format-check test 